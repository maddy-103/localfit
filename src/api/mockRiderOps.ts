/** Rider task flow: pickup, drop, waiting claims, returns and earnings. */
import { now, nowIso } from '@/lib/clock';
import { transition, type GpsPoint, type OrderActor } from '@/domain/orderMachine';
import {
  buildWaitingEvidence,
  riderEarnings,
  sortRiderTasks,
  tasksForOrder,
  type RiderEarnings,
  type RiderPlace,
  type RiderTask,
} from '@/domain/rider';
import { MOCK_PICKUP_OTP, makeEvent } from './mockFlow';
import { lockTrialFlow } from './mockTrial';
import { commitOrder, decorateOrder, getState, notify, setState, uid } from './mockStore';
import { addresses, buyers, shops } from './seed';
import type {
  CompensationClaim,
  Order,
  PickupInput,
  RiderTaskDetail,
  WaitingSession,
} from './types';

function internalOrder(orderId: string): Order {
  const order = getState().orders.find((entry) => entry.id === orderId);
  if (!order) throw new Error('Order not found.');
  return order;
}

function shopPlace(shopId: string): RiderPlace {
  const shop = shops.find((entry) => entry.id === shopId);
  return {
    name: shop?.name ?? 'Shop',
    line: shop?.area ?? '',
    area: shop?.city ?? '',
    lat: shop?.lat ?? 12.9784,
    lng: shop?.lng ?? 77.6408,
    phone: shop?.phone,
  };
}

function buyerPlace(order: Order): RiderPlace {
  const address = addresses.find((entry) => entry.buyerId === order.buyerId);
  const buyer = buyers.find((entry) => entry.id === order.buyerId);
  return {
    name: buyer?.name ?? 'Buyer',
    line: address?.line1 ?? '',
    area: address?.area ?? '',
    lat: address?.lat ?? 12.9719,
    lng: address?.lng ?? 77.6412,
    phone: buyer?.phone,
  };
}

function move(
  order: Order,
  to: Order['state'],
  actor: OrderActor,
  extra?: { gps?: GpsPoint; photoIds?: string[]; note?: string },
): Order {
  const result = transition(order as unknown as import('@/domain/orderMachine').Order, to, {
    actor,
    at: nowIso(),
    eventId: uid('evt'),
    ...(extra?.gps ? { gps: extra.gps } : {}),
    ...(extra?.photoIds?.length ? { photoIds: extra.photoIds } : {}),
    ...(extra?.note ? { note: extra.note } : {}),
  });
  return { ...order, state: result.order.state, events: result.order.events };
}

export function riderTasks(): RiderTask[] {
  const state = getState();
  const riderId = state.riderRegistration.riderId;
  const queueIds = new Set(
    state.riderQueue.filter((action) => action.status === 'pending').map((action) => action.orderId),
  );
  const tasks = state.orders
    .filter((order) => order.rider?.id === riderId)
    .flatMap((order) => {
      const publicOrder = decorateOrder(order, true);
      return tasksForOrder(publicOrder, shopPlace(order.shopId), buyerPlace(order));
    });
  return sortRiderTasks(tasks).map((task) => ({
    ...task,
    ...(queueIds.has(task.orderId) ? { pendingSync: true } : {}),
  }));
}

export function riderTask(id: string): RiderTaskDetail | null {
  const task = riderTasks().find((entry) => entry.id === id);
  if (!task) return null;
  const order = internalOrder(task.orderId);
  return { task, order: decorateOrder(order, true) };
}

/** RIDE-02: code, scan and photo are all checked before the order moves. */
export function collectPickup(orderId: string, input: PickupInput, actor: OrderActor): Order {
  const order = internalOrder(orderId);
  if (order.state !== 'RIDER_ASSIGNED') throw new Error('This order is not waiting for pickup.');
  if (!input.photoId?.trim()) throw new Error('A pickup photo is required.');
  if (!input.scanCode?.trim()) throw new Error('Scan at least one item.');
  if (input.pickupOtp.trim() !== (order.pickupOtp ?? MOCK_PICKUP_OTP)) {
    throw new Error('That shop pickup code did not match.');
  }
  const picked = move(order, 'PICKED_UP', actor, {
    photoIds: [input.photoId],
    note: `Scanned ${input.scanCode.trim()}`,
  });
  return commitOrder(move(picked, 'IN_TRANSIT', actor));
}

/** RIDE-05: arrival starts the wait timer even if the buyer is unresponsive. */
export function markArrived(orderId: string, actor: OrderActor, gps?: GpsPoint): Order {
  const order = internalOrder(orderId);
  if (order.state === 'ARRIVED') return decorateOrder(order, true);
  if (order.state !== 'IN_TRANSIT') throw new Error('You are not on the way to this drop.');
  const at = nowIso();
  const session: WaitingSession = {
    orderId,
    riderId: actor.id,
    startedAt: at,
    arrivedAt: at,
    otpAttempts: order.otpAttempts,
    claimed: false,
    ...(gps ? { gps: { ...gps } } : {}),
  };
  setState({
    ...getState(),
    waitingSessions: [
      ...getState().waitingSessions.filter((entry) => entry.orderId !== orderId),
      session,
    ],
  });
  notify('rider-waiting', { ...session });
  return commitOrder(move(order, 'ARRIVED', actor, { gps }));
}

export function waitingSession(orderId: string): WaitingSession | null {
  const session = getState().waitingSessions.find((entry) => entry.orderId === orderId);
  if (!session) return null;
  const order = internalOrder(orderId);
  return { ...session, gps: session.gps ? { ...session.gps } : undefined, otpAttempts: order.otpAttempts };
}

/** SPEC 13: claim only after the threshold, with the timer read at claim time. */
export function claimCompensation(orderId: string, actor: OrderActor): CompensationClaim {
  const state = getState();
  const session = waitingSession(orderId);
  if (!session) throw new Error('Arrive at the door before claiming waiting time.');
  const existing = state.compensationClaims.find((claim) => claim.orderId === orderId);
  if (existing) return { ...existing, evidence: { ...existing.evidence } };
  const evidence = buildWaitingEvidence(session, now(), state.riderConfig.waitingCompensationMs);
  if (!evidence.due) throw new Error('The waiting timer has not reached the claim threshold yet.');

  const claim: CompensationClaim = {
    id: uid('claim'),
    orderId,
    riderId: actor.id,
    amountPaise: state.riderConfig.compensationPaise,
    createdAt: evidence.checkedAt,
    status: 'pending',
    evidence,
  };
  setState({
    ...getState(),
    compensationClaims: [claim, ...state.compensationClaims],
    waitingSessions: state.waitingSessions.map((entry) =>
      entry.orderId === orderId ? { ...entry, claimed: true } : entry,
    ),
  });
  notify('rider-claims', claim);
  return claim;
}

/** RIDE-03: the photo is a separate, auditable event. */
export function recordHandoverPhoto(
  orderId: string,
  photoId: string,
  actor: OrderActor,
): Order {
  const order = internalOrder(orderId);
  if (!['OTP_VERIFIED', 'TRIAL_ACTIVE', 'DECISIONS_LOCKED', 'DELIVERED'].includes(order.state)) {
    throw new Error('Verify the buyer code before taking a handover photo.');
  }
  if (!photoId.trim()) throw new Error('A handover photo is required.');
  const event = makeEvent({
    order,
    action: 'handover_photo',
    actor,
    note: 'Handover photo',
    photoIds: [photoId],
  });
  return commitOrder({ ...order, handoverPhotoId: photoId, events: [...order.events, event] });
}

/** TRIAL-02: the rider can lock decisions when the buyer does not respond. */
export function confirmRiderDecisions(
  orderId: string,
  actor: OrderActor,
  note?: string,
): Order {
  const order = internalOrder(orderId);
  if (!order.handoverPhotoId) throw new Error('Take the handover photo first.');
  if (order.state === 'DECISIONS_LOCKED') return decorateOrder(order, true);
  if (order.state !== 'TRIAL_ACTIVE') throw new Error('The try window is not open for this order.');
  const locked = lockTrialFlow(orderId, actor, 'buyer');
  const confirmed = makeEvent({
    order: locked,
    action: 'rider_confirmed',
    actor,
    note: note ?? 'Decisions confirmed with the buyer',
  });
  return commitOrder({
    ...locked,
    riderConfirmedAt: confirmed.timestamp,
    events: [...locked.events, confirmed],
  });
}

/** RIDE-09: scanned items travel back with the rider and are logged. */
export function scanReturnedItems(
  orderId: string,
  scanCodes: string[],
  actor: OrderActor,
): Order {
  const order = internalOrder(orderId);
  if (!['DECISIONS_LOCKED', 'RETURN_REQUESTED', 'RETURN_PICKED'].includes(order.state)) {
    throw new Error('Returned items can only be scanned after decisions are locked.');
  }
  const codes = scanCodes.map((code) => code.trim()).filter(Boolean);
  if (codes.length === 0) throw new Error('Scan at least one returned item.');
  const event = makeEvent({
    order,
    action: 'return_scanned',
    actor,
    note: codes.join(', '),
  });
  return commitOrder({
    ...order,
    returnedScanCodes: [...(order.returnedScanCodes ?? []), ...codes],
    events: [...order.events, event],
  });
}

export function closeTrip(orderId: string, actor: OrderActor, photoId?: string): Order {
  const order = internalOrder(orderId);
  // A later return request may have no rider handover photo on the order; the
  // return scan itself is the evidence in that case.
  const photo = photoId ?? order.handoverPhotoId ?? 'photo-return-mock';
  if (order.state === 'DECISIONS_LOCKED') {
    const returning = order.lines.some((line) => line.decision !== 'keep');
    const to = returning ? 'RETURN_PICKED' : 'DELIVERED';
    return commitOrder(move(order, to, actor, { photoIds: [photo], note: 'Trip closed' }));
  }
  if (order.state === 'RETURN_REQUESTED') {
    return commitOrder(move(order, 'RETURN_PICKED', actor, { photoIds: [photo] }));
  }
  return decorateOrder(order, true);
}

export function handOverReturnAtShop(orderId: string, actor: OrderActor): Order {
  const order = internalOrder(orderId);
  if (order.state !== 'RETURN_PICKED') throw new Error('No returned items to hand over.');
  if (!order.returnedScanCodes?.length) throw new Error('Scan the returned items first.');
  return commitOrder(
    move(order, 'RETURN_RECEIVED', actor, {
      note: order.returnedScanCodes.join(', '),
      photoIds: order.handoverPhotoId ? [order.handoverPhotoId] : undefined,
    }),
  );
}

export function riderEarningsView(): RiderEarnings {
  const state = getState();
  const riderId = state.riderRegistration.riderId;
  const orders = state.orders.filter((order) => order.rider?.id === riderId);
  return riderEarnings(orders, state.compensationClaims, state.riderConfig, now());
}
