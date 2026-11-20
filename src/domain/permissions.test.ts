import { describe, expect, it } from 'vitest';
import type { AdminRole } from '@/api/types';
import {
  ADMIN_ACTION_PERMISSIONS,
  ADMIN_PERMISSIONS,
  ADMIN_PERMISSIONS_LIST,
  ADMIN_ROUTE_PERMISSIONS,
  assertAdminAction,
  can,
  canPerformAction,
  canOpenAdminRoute,
  normalizeAdminRole,
  type AdminAction,
  type AdminPermission,
} from './permissions';

const ROLES = Object.keys(ADMIN_PERMISSIONS) as AdminRole[];

/** Explicit expectation from SPEC section 4 and ADM-09 — not the matrix itself. */
const EXPECTED: Record<AdminRole, readonly AdminPermission[]> = {
  support_agent: ['read:dashboard', 'read:orders', 'read:buyers', 'support:sessions'],
  verifier: [
    'read:dashboard',
    'read:shops',
    'verify:shops',
    'flag:products',
    'read:riders',
    'verify:riders',
    'manage:riders',
  ],
  finance: [
    'read:dashboard',
    'read:refunds',
    'issue:refunds',
    'read:payouts',
    'run:payouts',
    'read:disputes',
    'read:audit',
  ],
  dispute_lead: [
    'read:dashboard',
    'read:orders',
    'manage:orders',
    'read:disputes',
    'resolve:disputes',
    'evidence:view',
    'read:refunds',
    'issue:refunds',
    'read:payouts',
    'run:payouts',
  ],
  super_admin: ['*'],
};

/** Explicit allowed roles for every mutating action (ADM-04/NFR-12). */
const ACTION_ROLES: Record<AdminAction, readonly AdminRole[]> = {
  'shop.approve': ['verifier', 'super_admin'],
  'shop.reject': ['verifier', 'super_admin'],
  'shop.suspend': ['verifier', 'super_admin'],
  'product.flag': ['verifier', 'super_admin'],
  'order.reassign': ['dispute_lead', 'super_admin'],
  'order.cancel': ['dispute_lead', 'super_admin'],
  'order.override': ['dispute_lead', 'super_admin'],
  'dispute.decide': ['dispute_lead', 'super_admin'],
  'dispute.escalate': ['dispute_lead', 'super_admin'],
  'refund.approve': ['finance', 'dispute_lead', 'super_admin'],
  'refund.reject': ['finance', 'dispute_lead', 'super_admin'],
  'payout.run': ['finance', 'dispute_lead', 'super_admin'],
  'payout.hold': ['finance', 'dispute_lead', 'super_admin'],
  'payout.reconcile': ['finance', 'dispute_lead', 'super_admin'],
  'rider.verify': ['verifier', 'super_admin'],
  'rider.penalize': ['verifier', 'super_admin'],
  'rider.zone': ['verifier', 'super_admin'],
  'risk.limit': ['super_admin'],
  'risk.block': ['super_admin'],
  'config.update': ['super_admin'],
  'staff.create': ['super_admin'],
  'staff.revoke': ['super_admin'],
};

/** Explicit screen access. Note support agent has no config, staff or payouts. */
const ROUTE_ROLES: Record<string, readonly AdminRole[]> = {
  '/admin': ROLES,
  '/admin/shops': ['verifier', 'super_admin'],
  '/admin/orders': ['support_agent', 'dispute_lead', 'super_admin'],
  '/admin/orders/:id': ['support_agent', 'dispute_lead', 'super_admin'],
  '/admin/disputes': ['finance', 'dispute_lead', 'super_admin'],
  '/admin/refunds': ['finance', 'dispute_lead', 'super_admin'],
  '/admin/payouts': ['finance', 'dispute_lead', 'super_admin'],
  '/admin/riders': ['verifier', 'super_admin'],
  '/admin/risk': ['super_admin'],
  '/admin/campaigns': ROLES,
  '/admin/config': ['super_admin'],
  '/admin/staff': ['super_admin'],
  '/admin/audit': ['finance', 'super_admin'],
};

describe('admin permissions (SPEC 4, ADM-09, NFR-12)', () => {
  it.each(ROLES)('%s has exactly its specified permissions', (role) => {
    for (const permission of ADMIN_PERMISSIONS_LIST) {
      const expected = role === 'super_admin' || EXPECTED[role].includes(permission);
      expect(can(role, permission), `${role} / ${permission}`).toBe(expected);
    }
  });

  it.each(ROLES)('%s can perform exactly its specified actions', (role) => {
    for (const action of Object.keys(ADMIN_ACTION_PERMISSIONS) as AdminAction[]) {
      const expected = ACTION_ROLES[action].includes(role);
      expect(canPerformAction(role, action), `${role} / ${action}`).toBe(expected);
      if (expected) {
        expect(() => assertAdminAction(role, action)).not.toThrow();
      } else {
        expect(() => assertAdminAction(role, action)).toThrow();
      }
    }
  });

  it.each(Object.keys(ADMIN_ROUTE_PERMISSIONS))('%s is open to exactly the specified roles', (route) => {
    for (const role of ROLES) {
      const expected = ROUTE_ROLES[route]!.includes(role);
      expect(canOpenAdminRoute(role, route), `${role} / ${route}`).toBe(expected);
    }
  });

  it('gives super admin a wildcard and denies unknown roles', () => {
    expect(ADMIN_PERMISSIONS.super_admin).toEqual(['*']);
    expect(can('super_admin', 'anything:at:all')).toBe(true);
    expect(can(undefined, 'read:orders')).toBe(false);
    expect(normalizeAdminRole('owner')).toBeNull();
    expect(normalizeAdminRole('finance')).toBe('finance');
  });

  it('keeps money actions away from support and verification roles', () => {
    for (const role of ['support_agent', 'verifier'] as AdminRole[]) {
      expect(canPerformAction(role, 'refund.approve')).toBe(false);
      expect(canPerformAction(role, 'payout.run')).toBe(false);
      expect(can(role, 'config:manage')).toBe(false);
      expect(can(role, 'staff:manage')).toBe(false);
    }
  });

  it('keeps dispute evidence away from finance (NFR-10)', () => {
    expect(can('finance', 'evidence:view')).toBe(false);
    expect(can('finance', 'read:disputes')).toBe(true);
    expect(can('finance', 'resolve:disputes')).toBe(false);
    expect(can('dispute_lead', 'evidence:view')).toBe(true);
  });
});
