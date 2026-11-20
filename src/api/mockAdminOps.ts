/** Disputes, refunds and payouts (mock). */
import { escalatedDisputeIds, redactDispute } from '@/domain/admin';
import { can } from '@/domain/permissions';
import { nowIso } from '@/lib/clock';
import { getState, notify, setState, uid } from './mockStore';
import { runAdminAction } from './mockAdminCore';
import type {
  AdminActionInput,
  AdminActor,
  DisputeCase,
  DisputeDecision,
  PayoutCase,
  RefundCase,
} from './types';

const SYSTEM: AdminActor = { id: 'system', name: 'SLA monitor', adminRole: 'super_admin' };

/** SPEC section 13: an unanswered case is escalated to a senior admin after 24 h. */
export function adminListDisputes(): DisputeCase[] {
  const state = getState();
  const dueIds = escalatedDisputeIds(state.disputes, Date.parse(nowIso()));
  if (dueIds.length === 0) return state.disputes.map((entry) => ({ ...entry }));

  let disputes = state.disputes;
  for (const id of dueIds) {
    disputes = runAdminAction(
      'dispute.escalate',
      { actor: SYSTEM, reason: '24 hour dispute SLA breached' },
      () => ({ disputeId: id, status: 'open' }),
      () => {
        const next = disputes.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                status: 'escalated' as const,
                escalatedAt: nowIso(),
                escalatedTo: 'Senior admin',
              }
            : entry,
        );
        return { result: next, after: { disputeId: id, status: 'escalated' } };
      },
    );
  }
  // runAdminAction only persists the audit log; commit the escalated cases too,
  // otherwise every later list call re-escalates the same open cases.
  setState({ ...getState(), disputes });
  notify('admin-disputes', disputes);
  return disputes.map((entry) => ({ ...entry }));
}

export function adminGetDispute(id: string, actor: AdminActor): DisputeCase | null {
  if (!can(actor.adminRole, 'read:disputes')) throw new Error('Your role cannot view disputes.');
  const dispute = getState().disputes.find((entry) => entry.id === id);
  if (!dispute) return null;
  // NFR-10: photos, GPS, OTP log and event history are evidence-only.
  return can(actor.adminRole, 'evidence:view') ? { ...dispute } : redactDispute(dispute);
}

export function adminDecideDispute(
  id: string,
  decision: DisputeDecision,
  input: AdminActionInput,
): DisputeCase {
  return runAdminAction(
    'dispute.decide',
    input,
    () => {
      const dispute = getState().disputes.find((entry) => entry.id === id);
      return { disputeId: id, status: dispute?.status ?? 'missing' };
    },
    () => {
      const state = getState();
      const dispute = state.disputes.find((entry) => entry.id === id);
      if (!dispute) throw new Error('Dispute not found.');
      if (dispute.status === 'decided') throw new Error('This dispute is already decided.');

      const decided: DisputeCase = {
        ...dispute,
        status: 'decided',
        decision,
        decisionReason: input.reason.trim(),
        decidedAt: nowIso(),
      };
      const refunds = [...state.refunds];
      let refundId: string | undefined;
      if (decision !== 'shop_favoured') {
        const refund: RefundCase = {
          id: uid('refund'),
          orderId: dispute.orderId,
          buyerName: dispute.buyerId,
          amountPaise: decision === 'split' ? Math.round(dispute.valuePaise / 2) : dispute.valuePaise,
          reason: input.reason.trim(),
          status: 'approved',
          createdAt: nowIso(),
        };
        refundId = refund.id;
        refunds.push(refund);
      }
      const payouts = state.payouts.map((payout) =>
        payout.shopId === dispute.shopId && decision === 'shop_favoured'
          ? { ...payout, note: input.reason.trim() }
          : payout,
      );
      setState({ ...state, disputes: state.disputes.map((d) => (d.id === id ? decided : d)), refunds, payouts });
      return {
        result: { ...decided },
        after: { disputeId: id, decision, refundId, reason: input.reason.trim() },
      };
    },
  );
}

export function adminListRefunds(): RefundCase[] {
  return getState().refunds.map((entry) => ({ ...entry }));
}

export function adminResolveRefund(
  id: string,
  outcome: 'approve' | 'reject',
  input: AdminActionInput,
): RefundCase {
  const action = outcome === 'approve' ? 'refund.approve' : 'refund.reject';
  return runAdminAction(
    action,
    input,
    () => ({ refundId: id, status: getState().refunds.find((r) => r.id === id)?.status ?? 'missing' }),
    () => {
      const state = getState();
      const refund = state.refunds.find((entry) => entry.id === id);
      if (!refund) throw new Error('Refund not found.');
      const resolved: RefundCase = {
        ...refund,
        status: outcome === 'approve' ? 'approved' : 'rejected',
        decidedAt: nowIso(),
        decisionReason: input.reason.trim(),
      };
      setState({ ...state, refunds: state.refunds.map((entry) => (entry.id === id ? resolved : entry)) });
      return { result: { ...resolved }, after: { refundId: id, status: resolved.status } };
    },
  );
}

export function adminListPayouts(): PayoutCase[] {
  return getState().payouts.map((entry) => ({ ...entry }));
}

export function adminRunSettlement(input: AdminActionInput): PayoutCase[] {
  return runAdminAction(
    'payout.run',
    input,
    () => ({ payoutCount: getState().payouts.length }),
    () => {
      const state = getState();
      const payouts: PayoutCase[] = state.payouts.map((entry) =>
        entry.status === 'held' ? entry : { ...entry, status: 'ready' as const },
      );
      setState({ ...state, payouts });
      return {
        result: payouts.map((entry) => ({ ...entry })),
        after: { payoutCount: payouts.length, period: payouts[0]?.period ?? '' },
      };
    },
  );
}

export function adminHoldPayout(id: string, input: AdminActionInput): PayoutCase {
  return runAdminAction(
    'payout.hold',
    input,
    () => ({ payoutId: id, status: getState().payouts.find((p) => p.id === id)?.status ?? 'missing' }),
    () => {
      const state = getState();
      const payout = state.payouts.find((entry) => entry.id === id);
      if (!payout) throw new Error('Payout not found.');
      const held: PayoutCase = { ...payout, status: 'held', note: input.reason.trim() };
      setState({ ...state, payouts: state.payouts.map((entry) => (entry.id === id ? held : entry)) });
      return { result: { ...held }, after: { payoutId: id, status: 'held' } };
    },
  );
}

export function adminReconcilePayout(id: string, input: AdminActionInput): PayoutCase {
  return runAdminAction(
    'payout.reconcile',
    input,
    () => ({ payoutId: id, status: getState().payouts.find((p) => p.id === id)?.status ?? 'missing' }),
    () => {
      const state = getState();
      const payout = state.payouts.find((entry) => entry.id === id);
      if (!payout) throw new Error('Payout not found.');
      const paid: PayoutCase = { ...payout, status: 'paid', note: input.reason.trim() };
      setState({ ...state, payouts: state.payouts.map((entry) => (entry.id === id ? paid : entry)) });
      return { result: { ...paid }, after: { payoutId: id, status: 'paid' } };
    },
  );
}
