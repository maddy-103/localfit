import { nowIso } from '@/lib/clock';
import { transition, type OrderActor, type OrderEvent } from '@/domain/orderMachine';
import { settleAtLock } from '@/domain/payments';
import { lockDecisions, type TrialDecision } from '@/domain/trial';
import { commitOrder, decorateOrder, getState, uid, variantFor } from './mockStore';
import { makeEvent, requireTrialOrder } from './mockFlow';
import type { Order, OrderPayment, ReturnRequestInput, SizeSwapInput } from './types';

const LOCKED_STATES = [
  'DECISIONS_LOCKED',
  'DELIVERED',
  'RETURN_REQUESTED',
  'RETURN_PICKED',
  'RETURN_RECEIVED',
  'REFUNDED',
  'SETTLED',
];

/** TRIAL-03: every decision writes its own timestamped event. */
export function setDecisionFlow(
  orderId: string,
  lineId: string,
  decision: TrialDecision,
  actor: OrderActor,
): Order {
  const order = requireTrialOrder(orderId);
  const line = order.lines.find((entry) => entry.id === lineId);
  if (!line) throw new Error('That item is not in this order.');
  if (decision === 'pending') throw new Error('Choose Keep or Return for this item.');

  const events: OrderEvent[] = [
    ...order.events,
    makeEvent({
      order,
      action: decision === 'keep' ? 'decision_keep' : 'decision_return',
      actor,
      lineId,
      note: decision === 'keep' ? 'Kept at the door' : 'Returned at the door',
      amountPaise: line.pricePaise * line.qty,
    }),
  ];

  return commitOrder({
    ...order,
    lines: order.lines.map((entry) => (entry.id === lineId ? { ...entry, decision } : entry)),
    events,
  });
}

/**
 * Creates a request record only. Decisions stay exactly as they were until
 * the buyer confirms, which is what the confirm test checks.
 */
export function requestSwapFlow(
  orderId: string,
  input: SizeSwapInput,
  actor: OrderActor,
): Order {
  const order = requireTrialOrder(orderId);
  const line = order.lines.find((entry) => entry.id === input.lineId);
  if (!line) throw new Error('That item is not in this order.');

  const { variant: from } = variantFor(line.productId, line.variantId);
  const { variant: to } = variantFor(line.productId, input.variantId);
  if (!to) throw new Error('That size is not offered for this item.');
  if (to.id === line.variantId) throw new Error('That is already the size in your bag.');
  if (to.quantity - to.reservedQuantity <= 0) throw new Error('That size just went out of stock.');

  const request = {
    id: uid('swap'),
    orderId,
    lineId: line.id,
    fromVariantId: line.variantId,
    toVariantId: to.id,
    status: 'requested' as const,
    createdAt: nowIso(),
  };

  const event = makeEvent({
    order,
    action: 'swap_requested',
    actor,
    lineId: line.id,
    note: `${from?.size ?? 'size'} to ${to.size}`,
  });

  return commitOrder({
    ...order,
    swapRequests: [...order.swapRequests, request],
    events: [...order.events, event],
  });
}

/**
 * Buyer confirmation or timer expiry. Pending lines become Return, only kept
 * items are captured, and the refund/hold release is recorded (SPEC 13).
 * Safe to call twice: the second call returns the locked order unchanged.
 */
export function lockTrialFlow(
  orderId: string,
  actor: OrderActor,
  reason: 'buyer' | 'timer' = 'buyer',
): Order {
  const order = getState().orders.find((entry) => entry.id === orderId);
  if (!order) throw new Error('Order not found.');
  if (LOCKED_STATES.includes(order.state)) return decorateOrder(order);
  if (order.state !== 'TRIAL_ACTIVE') {
    throw new Error('The try-at-door window is not open for this order.');
  }

  const at = nowIso();
  const events: OrderEvent[] = [...order.events];
  const pending = order.lines.filter((line) => line.decision === 'pending');

  for (const line of pending) {
    events.push(
      makeEvent({
        order,
        action: 'decision_return',
        actor,
        lineId: line.id,
        note:
          reason === 'timer'
            ? 'Timer ended: unmarked item returned'
            : 'Unmarked item returned by default',
        amountPaise: line.pricePaise * line.qty,
      }),
    );
  }

  const lockedLines = lockDecisions(order.lines);
  const keptPaise = lockedLines
    .filter((line) => line.decision === 'keep')
    .reduce((sum, line) => sum + line.pricePaise * line.qty, 0);
  const returnedPaise = lockedLines
    .filter((line) => line.decision !== 'keep')
    .reduce((sum, line) => sum + line.pricePaise * line.qty, 0);

  const settlement = settleAtLock({
    authorization: order.payment,
    keptPaise,
    returnedPaise,
  });
  const payment: OrderPayment = {
    ...order.payment,
    capturedPaise: settlement.capturedPaise,
    refundPaise: settlement.refundPaise,
    status: settlement.status,
  };

  const lockActor: OrderActor =
    reason === 'timer' ? { id: 'system', role: 'system' } : actor;
  const locked = transition(order as unknown as import('@/domain/orderMachine').Order, 'DECISIONS_LOCKED', {
    actor: lockActor,
    at,
    eventId: uid('evt'),
  });
  events.push(...locked.order.events.slice(order.events.length));

  if (settlement.effect !== 'none' && settlement.refundPaise > 0) {
    events.push(
      makeEvent({
        order: { ...order, state: 'DECISIONS_LOCKED' },
        action: settlement.effect,
        actor: { id: 'system', role: 'system' },
        amountPaise: settlement.refundPaise,
        note:
          settlement.effect === 'hold_released'
            ? 'Card hold released for returned items'
            : 'Refund initiated for returned items',
      }),
    );
  }

  const swapRequests = order.swapRequests.map((swap) => {
    if (swap.status === 'confirmed') return swap;
    events.push(
      makeEvent({
        order: { ...order, state: 'DECISIONS_LOCKED' },
        action: 'swap_confirmed',
        actor: { id: 'system', role: 'system' },
        lineId: swap.lineId,
        note: 'Size swap confirmed with the shop',
      }),
    );
    return { ...swap, status: 'confirmed' as const };
  });

  return commitOrder({
    ...order,
    state: 'DECISIONS_LOCKED',
    lines: lockedLines,
    events,
    lockedAt: at,
    payment,
    swapRequests,
  });
}

export function requestReturnFlow(
  orderId: string,
  input: ReturnRequestInput,
  actor: OrderActor,
): Order {
  const order = getState().orders.find((entry) => entry.id === orderId);
  if (!order) throw new Error('Order not found.');
  if (order.returnRequest) return decorateOrder(order);
  if (order.state !== 'DELIVERED') {
    throw new Error('A return can only be requested after delivery.');
  }
  if (!input.reason) throw new Error('Choose a reason for the return.');
  if (!input.pickupSlot) throw new Error('Choose a doorstep pickup window.');

  const at = nowIso();
  const moved = transition(order as unknown as import('@/domain/orderMachine').Order, 'RETURN_REQUESTED', {
    actor,
    at,
    eventId: uid('evt'),
  });

  return commitOrder({
    ...order,
    state: moved.order.state,
    events: moved.order.events,
    returnRequest: {
      id: uid('return'),
      orderId,
      reason: input.reason,
      ...(input.note ? { note: input.note } : {}),
      photoIds: [...input.photoIds],
      pickupSlot: input.pickupSlot,
      createdAt: at,
    },
  });
}
