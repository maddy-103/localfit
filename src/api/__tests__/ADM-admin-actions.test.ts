import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/api/client';
import { configureMock, resetMockData } from '@/api/mock';
import { devAdvanceOrder, devCreateTryAtDoorOrder } from '@/api/dev';
import { ADMIN_2FA_CODE } from '@/domain/admin';
import { ADMIN_ACTION_PERMISSIONS } from '@/domain/permissions';
import type { AdminActionInput, AdminActor } from '@/api/types';
import { createFakeClock, resetClock, setClock } from '@/lib/clock';

const SUPER: AdminActor = { id: 'admin-owner', name: 'Owner', adminRole: 'super_admin' };
const LEAD: AdminActor = { id: 'test-lead', name: 'Test Lead', adminRole: 'dispute_lead' };
const INPUT: AdminActionInput = { actor: SUPER, reason: 'Admin console coverage' };

beforeEach(() => {
  configureMock({ latencyMs: 0 });
  resetMockData();
  setClock(createFakeClock('2026-11-16T09:00:00.000Z'));
});

afterEach(() => resetClock());

describe('AUTH-06 admin SSO and two-factor sign-in', () => {
  it('offers only the one active bootstrap account and checks the code', async () => {
    const accounts = await api.adminSsoAccounts();
    expect(accounts).toEqual([
      expect.objectContaining({
        id: 'admin-owner',
        name: 'Owner',
        status: 'active',
        adminRole: 'super_admin',
      }),
    ]);

    await expect(api.adminSignIn({ accountId: 'admin-owner', code: '000000' })).rejects.toThrow();
    const signed = await api.adminSignIn({
      accountId: 'admin-owner',
      code: ADMIN_2FA_CODE,
    });
    expect(signed.adminRole).toBe('super_admin');
  });

  it('never creates another super admin and never revokes the primary admin', async () => {
    await expect(
      api.adminCreateStaff({
        ...INPUT,
        name: 'Another Super',
        phone: '+91 90000 00001',
        adminRole: 'super_admin',
      }),
    ).rejects.toThrow(/cannot be created/i);

    await expect(api.adminRevokeStaff('admin-owner', INPUT)).rejects.toThrow(/cannot be revoked/i);
    expect((await api.adminSsoAccounts()).map((account) => account.id)).toEqual(['admin-owner']);
  });
});

describe('ADM-04 required reasons', () => {
  it('blocks reassign, cancel and refund actions without a reason', async () => {
    const order = await devCreateTryAtDoorOrder();
    const blank = { actor: LEAD, reason: '   ' };

    await expect(api.adminReassignRider(order.id, 'rider-arjun', blank)).rejects.toThrow(
      /reason is required/i,
    );
    await expect(api.adminCancelOrder(order.id, blank)).rejects.toThrow(/reason is required/i);
    await expect(api.adminResolveRefund('refund-1', 'approve', blank)).rejects.toThrow(
      /reason is required/i,
    );

    const audit = await api.adminListAudit();
    expect(audit).toHaveLength(0);
  });
});

describe('ADM-09 audit coverage', () => {
  it('writes an audit entry for every admin action', async () => {
    // The SLA monitor escalates open cases before any human decision is made.
    setClock(createFakeClock('2026-11-17T10:00:00.000Z'));
    await api.adminListDisputes();
    setClock(createFakeClock('2026-11-16T09:00:00.000Z'));

    const reviews = await api.adminListShopReviews();
    const shopId = reviews[0]!.shopId;
    const products = await api.listProducts();
    const productId = products[0]!.id;

    await api.adminReviewShop(shopId, 'approve', INPUT);
    await api.adminReviewShop(shopId, 'reject', INPUT);
    await api.adminReviewShop(shopId, 'suspend', INPUT);
    await api.adminFlagProduct(shopId, productId, 'audit-check', INPUT);

    const reassignable = await devCreateTryAtDoorOrder();
    let moved = reassignable;
    for (let step = 0; step < 3; step += 1) moved = devAdvanceOrder(moved.id);
    await api.adminReassignRider(moved.id, 'rider-imran', INPUT);

    const cancellable = await devCreateTryAtDoorOrder();
    await api.adminCancelOrder(cancellable.id, INPUT);
    const overridable = await devCreateTryAtDoorOrder();
    await api.adminOverrideOrder(overridable.id, 'CANCELLED', INPUT);

    await api.adminDecideDispute('dispute-1', 'buyer_favoured', INPUT);
    await api.adminDecideDispute('dispute-2', 'buyer_favoured', INPUT);
    await api.adminResolveRefund('refund-1', 'approve', INPUT);
    const refunds = await api.adminListRefunds();
    const secondRefund = refunds.find((refund) => refund.id !== 'refund-1');
    await api.adminResolveRefund(secondRefund!.id, 'reject', INPUT);

    const payouts = await api.adminListPayouts();
    const payoutId = payouts[0]!.id;
    await api.adminRunSettlement(INPUT);
    await api.adminHoldPayout(payoutId, INPUT);
    await api.adminReconcilePayout(payoutId, INPUT);

    const riders = await api.adminListRiderReviews();
    const riderId = riders[0]!.riderId;
    await api.adminReviewRider(riderId, 'verify', INPUT);
    await api.adminReviewRider(riderId, 'penalize', INPUT);
    await api.adminReviewRider(riderId, 'suspend', INPUT);
    await api.adminSetRiderZone(riderId, 'Whitefield', true, INPUT);

    const risk = await api.adminListRisk();
    const riskId = risk[0]!.id;
    await api.adminSetRiskLimit(riskId, 200_000, INPUT);
    await api.adminBlockRisk(riskId, true, INPUT);

    await api.adminUpdateConfig({ serviceRadiusKm: 7 }, INPUT);
    const created = await api.adminCreateStaff({
      ...INPUT,
      name: 'Audit Finance',
      phone: '+91 90000 00002',
      adminRole: 'finance',
    });
    await api.adminRevokeStaff(created.id, INPUT);

    const audit = await api.adminListAudit();
    const actions = new Set(audit.map((entry) => entry.action));
    for (const action of Object.keys(ADMIN_ACTION_PERMISSIONS)) {
      expect(actions.has(action), `missing audit entry for ${action}`).toBe(true);
    }
    expect(audit.every((entry) => entry.reason.trim().length > 0 && entry.actor.id)).toBe(true);
  });
});
