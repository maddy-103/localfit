/** Shop, order, rider and risk queues (mock). */
import { nowIso } from '@/lib/clock';
import {
  allowedRoles,
  nextStates,
  transition,
  type Order as DomainOrder,
  type OrderState,
} from '@/domain/orderMachine';
import { commitOrder, getState, setState, uid } from './mockStore';
import { runAdminAction } from './mockAdminCore';
import { riders } from './seed';
import type {
  AdminActionInput,
  AdminActor,
  Order,
  RiderReview,
  RiskEntry,
  ShopReview,
} from './types';

export function adminListShopReviews(): ShopReview[] {
  return getState().shopReviews.map((entry) => ({ ...entry }));
}

export function adminReviewShop(
  shopId: string,
  outcome: 'approve' | 'reject' | 'suspend',
  input: AdminActionInput,
): ShopReview {
  return runAdminAction(
    outcome === 'approve' ? 'shop.approve' : outcome === 'reject' ? 'shop.reject' : 'shop.suspend',
    input,
    () => ({ shopId, status: getState().shopReviews.find((s) => s.shopId === shopId)?.status ?? 'missing' }),
    () => {
      const state = getState();
      const review = state.shopReviews.find((entry) => entry.shopId === shopId);
      if (!review) throw new Error('Shop review not found.');
      const status = outcome === 'approve' ? 'approved' : outcome === 'reject' ? 'rejected' : 'suspended';
      const next: ShopReview = { ...review, status, updatedAt: nowIso() };
      setState({ ...state, shopReviews: state.shopReviews.map((s) => (s.shopId === shopId ? next : s)) });
      return { result: { ...next }, after: { shopId, status } };
    },
  );
}

export function adminFlagProduct(
  shopId: string,
  productId: string,
  flag: string,
  input: AdminActionInput,
): ShopReview {
  return runAdminAction(
    'product.flag',
    input,
    () => ({ shopId, flags: getState().shopReviews.find((s) => s.shopId === shopId)?.authenticityFlags ?? [] }),
    () => {
      const state = getState();
      const review = state.shopReviews.find((entry) => entry.shopId === shopId);
      if (!review) throw new Error('Shop review not found.');
      const authenticityFlags = [...new Set([...review.authenticityFlags, `${productId}: ${flag}`])];
      const next = { ...review, authenticityFlags, updatedAt: nowIso() };
      setState({ ...state, shopReviews: state.shopReviews.map((s) => (s.shopId === shopId ? next : s)) });
      return { result: { ...next }, after: { shopId, productId, flag } };
    },
  );
}

function moveOrder(
  order: Order,
  to: OrderState,
  reason: string,
  actor: AdminActor,
  patch: Partial<Order> = {},
): Order {
  const result = transition(order as unknown as DomainOrder, to, {
    actor: { id: actor.id, role: 'admin' },
    at: nowIso(),
    eventId: uid('evt'),
    note: reason,
  });
  const next: Order = {
    ...order,
    state: result.order.state,
    events: result.order.events,
    ...patch,
  };
  return commitOrder(next);
}

export function adminReassignRider(
  orderId: string,
  riderId: string,
  input: AdminActionInput,
): Order {
  return runAdminAction(
    'order.reassign',
    input,
    () => ({ orderId, riderId: getState().orders.find((o) => o.id === orderId)?.rider?.id ?? '' }),
    () => {
      const order = getState().orders.find((entry) => entry.id === orderId);
      if (!order) throw new Error('Order not found.');
      if (!nextStates(order.state).includes('REASSIGNED')) {
        throw new Error('This order cannot be reassigned in its current state.');
      }
      const rider = riders.find((entry) => entry.id === riderId) ?? riders[0];
      const next = moveOrder(order, 'REASSIGNED', input.reason, input.actor, {
        rider: { id: riderId, name: rider?.name ?? riderId, phone: rider?.phone ?? '' },
      });
      return { result: next, after: { orderId, riderId } };
    },
  );
}

export function adminCancelOrder(orderId: string, input: AdminActionInput): Order {
  return runAdminAction(
    'order.cancel',
    input,
    () => ({ orderId, state: getState().orders.find((o) => o.id === orderId)?.state ?? 'missing' }),
    () => {
      const order = getState().orders.find((entry) => entry.id === orderId);
      if (!order) throw new Error('Order not found.');
      const options = nextStates(order.state);
      const target = options.includes('CANCELLED')
        ? 'CANCELLED'
        : options.includes('CANCELLED_BY_SHOP')
          ? 'CANCELLED_BY_SHOP'
          : null;
      if (!target) throw new Error('This order cannot be cancelled in its current state.');
      return { result: moveOrder(order, target, input.reason, input.actor), after: { orderId, state: target } };
    },
  );
}

export function adminOverrideOrder(
  orderId: string,
  to: OrderState,
  input: AdminActionInput,
): Order {
  return runAdminAction(
    'order.override',
    input,
    () => ({ orderId, state: getState().orders.find((o) => o.id === orderId)?.state ?? 'missing' }),
    () => {
      const order = getState().orders.find((entry) => entry.id === orderId);
      if (!order) throw new Error('Order not found.');
      if (!allowedRoles(order.state, to).includes('admin')) {
        throw new Error('An admin cannot make that state change.');
      }
      return { result: moveOrder(order, to, input.reason, input.actor), after: { orderId, state: to } };
    },
  );
}

export function adminListRiderReviews(): RiderReview[] {
  return getState().riderReviews.map((entry) => ({ ...entry }));
}

export function adminReviewRider(
  riderId: string,
  outcome: 'verify' | 'penalize' | 'suspend',
  input: AdminActionInput,
): RiderReview {
  return runAdminAction(
    outcome === 'verify' ? 'rider.verify' : 'rider.penalize',
    input,
    () => ({ riderId, status: getState().riderReviews.find((r) => r.riderId === riderId)?.status ?? 'missing' }),
    () => {
      const state = getState();
      const review = state.riderReviews.find((entry) => entry.riderId === riderId);
      if (!review) throw new Error('Rider review not found.');
      const next: RiderReview = {
        ...review,
        verified: outcome === 'verify' ? true : review.verified,
        penalties: outcome === 'penalize' ? review.penalties + 1 : review.penalties,
        status: outcome === 'suspend' ? 'suspended' : outcome === 'verify' ? 'approved' : review.status,
      };
      setState({ ...state, riderReviews: state.riderReviews.map((r) => (r.riderId === riderId ? next : r)) });
      return { result: { ...next }, after: { riderId, status: next.status, penalties: next.penalties } };
    },
  );
}

export function adminSetRiderZone(
  riderId: string,
  zone: string,
  available: boolean,
  input: AdminActionInput,
): RiderReview {
  return runAdminAction(
    'rider.zone',
    input,
    () => ({ riderId, zone, available: getState().riderReviews.find((r) => r.riderId === riderId)?.available ?? false }),
    () => {
      const state = getState();
      const review = state.riderReviews.find((entry) => entry.riderId === riderId);
      if (!review) throw new Error('Rider review not found.');
      const next = { ...review, zone, available };
      setState({ ...state, riderReviews: state.riderReviews.map((r) => (r.riderId === riderId ? next : r)) });
      return { result: { ...next }, after: { riderId, zone, available } };
    },
  );
}

export function adminListRisk(): RiskEntry[] {
  return getState().riskEntries.map((entry) => ({ ...entry }));
}

export function adminSetRiskLimit(
  id: string,
  codLimitPaise: number,
  input: AdminActionInput,
): RiskEntry {
  return runAdminAction(
    'risk.limit',
    input,
    () => ({ id, limit: getState().riskEntries.find((r) => r.id === id)?.codLimitPaise ?? 0 }),
    () => {
      const state = getState();
      const entry = state.riskEntries.find((r) => r.id === id);
      if (!entry) throw new Error('Risk entry not found.');
      const next = { ...entry, codLimitPaise };
      setState({ ...state, riskEntries: state.riskEntries.map((r) => (r.id === id ? next : r)) });
      return { result: { ...next }, after: { id, codLimitPaise } };
    },
  );
}

export function adminBlockRisk(id: string, blocked: boolean, input: AdminActionInput): RiskEntry {
  return runAdminAction(
    'risk.block',
    input,
    () => ({ id, blocked: getState().riskEntries.find((r) => r.id === id)?.blocked ?? false }),
    () => {
      const state = getState();
      const entry = state.riskEntries.find((r) => r.id === id);
      if (!entry) throw new Error('Risk entry not found.');
      const next = { ...entry, blocked };
      setState({ ...state, riskEntries: state.riskEntries.map((r) => (r.id === id ? next : r)) });
      return { result: { ...next }, after: { id, blocked } };
    },
  );
}
