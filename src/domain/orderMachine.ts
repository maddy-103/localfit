/**
 * Order state machine — SPEC section 10 plus the resolved ambiguities.
 *
 * AMBIGUITY 2: SPEC 8.2 shows RETURN_IN_PROGRESS but section 10 has no row for
 * it. Items collected at the door are RETURN_PICKED; normaliseOrderState maps
 * the old label onto RETURN_PICKED so no second state exists.
 *
 * AMBIGUITY 7: section 10 has no OTP_VERIFIED row. ARRIVED -> OTP_VERIFIED,
 * then OTP_VERIFIED -> TRIAL_ACTIVE (try-at-door) or -> DELIVERED (standard).
 * verifyOtp() writes both events when the buyer's code is entered.
 *
 * AMBIGUITY 8: REASSIGNED -> RIDER_ASSIGNED, FAILED_DELIVERY -> RETURN_PICKED,
 * REFUNDED -> SETTLED and RESOLVED -> SETTLED are included. SHOP_DECLINED,
 * CANCELLED, CANCELLED_BY_SHOP and RETURN_REJECTED are terminal. The buyer may
 * cancel until SHOP_ACCEPTED, the shop until PACKED, and only an admin after
 * PICKED_UP.
 */

export const ORDER_STATES = [
  'PLACED',
  'SHOP_ACCEPTED',
  'PACKED',
  'RIDER_ASSIGNED',
  'REASSIGNED',
  'PICKED_UP',
  'IN_TRANSIT',
  'ARRIVED',
  'OTP_VERIFIED',
  'FAILED_DELIVERY',
  'TRIAL_ACTIVE',
  'DECISIONS_LOCKED',
  'DELIVERED',
  'RETURN_REQUESTED',
  'RETURN_PICKED',
  'RETURN_RECEIVED',
  'RETURN_REJECTED',
  'DISPUTED',
  'RESOLVED',
  'REFUNDED',
  'SETTLED',
  'SHOP_DECLINED',
  'CANCELLED',
  'CANCELLED_BY_SHOP',
] as const;

export type OrderState = (typeof ORDER_STATES)[number];
export type OrderKind = 'standard' | 'try_at_door';
export type ActorRole = 'buyer' | 'shop' | 'rider' | 'admin' | 'system';
export type LegacyOrderState = OrderState | 'RETURN_IN_PROGRESS';

export interface OrderActor {
  id: string;
  role: ActorRole;
}

export interface GpsPoint {
  lat: number;
  lng: number;
}

export type OrderEventAction =
  | 'transition'
  | 'decision_keep'
  | 'decision_return'
  | 'swap_requested'
  | 'swap_confirmed'
  | 'otp_failed'
  | 'support_opened'
  | 'hold_released'
  | 'refund_initiated';

export interface OrderEvent {
  id: string;
  orderId: string;
  from: OrderState;
  to: OrderState;
  actor: OrderActor;
  timestamp: string;
  /** Missing means a normal state transition. */
  action?: OrderEventAction;
  /** Decision details, reason, or the swapped size. */
  note?: string;
  lineId?: string;
  amountPaise?: number;
  gps?: GpsPoint;
  photoIds?: string[];
}

export interface Order {
  id: string;
  kind: OrderKind;
  state: OrderState;
  events: OrderEvent[];
}

export interface TransitionContext {
  actor: OrderActor;
  /** ISO 8601, normally from the app clock. */
  at: string;
  eventId: string;
  gps?: GpsPoint;
  photoIds?: string[];
  /** Set only when the buyer's handover OTP was entered. */
  otpVerified?: boolean;
}

export class InvalidTransitionError extends Error {
  constructor(
    public readonly from: OrderState,
    public readonly to: OrderState,
    reason?: string,
  ) {
    super(reason ?? `Invalid order transition: ${from} -> ${to}`);
    this.name = 'InvalidTransitionError';
  }
}

/** Old label from SPEC 8.2; intentionally not a separate state. */
export function normaliseOrderState(state: LegacyOrderState): OrderState {
  return state === 'RETURN_IN_PROGRESS' ? 'RETURN_PICKED' : state;
}

const TRANSITIONS: Record<OrderState, readonly OrderState[]> = {
  PLACED: ['SHOP_ACCEPTED', 'SHOP_DECLINED', 'CANCELLED'],
  SHOP_ACCEPTED: ['PACKED', 'CANCELLED_BY_SHOP'],
  PACKED: ['RIDER_ASSIGNED', 'CANCELLED_BY_SHOP'],
  RIDER_ASSIGNED: ['PICKED_UP', 'REASSIGNED'],
  REASSIGNED: ['RIDER_ASSIGNED'],
  PICKED_UP: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['ARRIVED', 'CANCELLED'],
  ARRIVED: ['OTP_VERIFIED', 'FAILED_DELIVERY', 'CANCELLED'],
  OTP_VERIFIED: ['TRIAL_ACTIVE', 'DELIVERED'],
  FAILED_DELIVERY: ['RETURN_PICKED'],
  TRIAL_ACTIVE: ['DECISIONS_LOCKED'],
  DECISIONS_LOCKED: ['DELIVERED', 'RETURN_PICKED'],
  DELIVERED: ['RETURN_REQUESTED', 'SETTLED'],
  RETURN_REQUESTED: ['RETURN_PICKED', 'RETURN_REJECTED'],
  RETURN_PICKED: ['RETURN_RECEIVED'],
  RETURN_RECEIVED: ['REFUNDED', 'DISPUTED'],
  RETURN_REJECTED: [],
  DISPUTED: ['RESOLVED'],
  RESOLVED: ['SETTLED'],
  REFUNDED: ['SETTLED'],
  SETTLED: [],
  SHOP_DECLINED: [],
  CANCELLED: [],
  CANCELLED_BY_SHOP: [],
};

type TransitionKey = `${OrderState}->${OrderState}`;

const ACTOR_RULES: Partial<Record<TransitionKey, readonly ActorRole[]>> = {
  'PLACED->SHOP_ACCEPTED': ['shop'],
  'PLACED->SHOP_DECLINED': ['shop'],
  'PLACED->CANCELLED': ['buyer', 'admin'],
  'SHOP_ACCEPTED->PACKED': ['shop'],
  'SHOP_ACCEPTED->CANCELLED_BY_SHOP': ['shop', 'admin'],
  'PACKED->RIDER_ASSIGNED': ['system', 'admin'],
  'PACKED->CANCELLED_BY_SHOP': ['shop', 'admin'],
  'RIDER_ASSIGNED->PICKED_UP': ['rider'],
  'RIDER_ASSIGNED->REASSIGNED': ['system', 'admin'],
  'REASSIGNED->RIDER_ASSIGNED': ['system', 'admin'],
  'PICKED_UP->IN_TRANSIT': ['rider'],
  'PICKED_UP->CANCELLED': ['admin'],
  'IN_TRANSIT->ARRIVED': ['system', 'rider'],
  'IN_TRANSIT->CANCELLED': ['admin'],
  'ARRIVED->OTP_VERIFIED': ['rider'],
  'ARRIVED->FAILED_DELIVERY': ['rider'],
  'ARRIVED->CANCELLED': ['admin'],
  'FAILED_DELIVERY->RETURN_PICKED': ['rider', 'system'],
  'OTP_VERIFIED->TRIAL_ACTIVE': ['rider', 'system'],
  'OTP_VERIFIED->DELIVERED': ['rider', 'system'],
  'TRIAL_ACTIVE->DECISIONS_LOCKED': ['buyer', 'rider', 'system'],
  'DECISIONS_LOCKED->DELIVERED': ['rider', 'system'],
  'DECISIONS_LOCKED->RETURN_PICKED': ['rider'],
  'DELIVERED->RETURN_REQUESTED': ['buyer', 'system'],
  'DELIVERED->SETTLED': ['admin'],
  'RETURN_REQUESTED->RETURN_PICKED': ['rider'],
  'RETURN_REQUESTED->RETURN_REJECTED': ['admin'],
  'RETURN_PICKED->RETURN_RECEIVED': ['shop'],
  'RETURN_RECEIVED->REFUNDED': ['admin'],
  'RETURN_RECEIVED->DISPUTED': ['shop', 'buyer'],
  'DISPUTED->RESOLVED': ['admin'],
  'RESOLVED->SETTLED': ['admin'],
  'REFUNDED->SETTLED': ['admin'],
};

export function nextStates(from: OrderState): readonly OrderState[] {
  return TRANSITIONS[from];
}

/**
 * Structural feasibility only. Does not check the actor or evidence; use
 * transition() for the full guard.
 */
export function canTransition(
  from: OrderState,
  to: OrderState,
  kind: OrderKind = 'standard',
): boolean {
  if (from === 'OTP_VERIFIED' && to === 'TRIAL_ACTIVE') return kind === 'try_at_door';
  if (from === 'OTP_VERIFIED' && to === 'DELIVERED') return kind === 'standard';
  return TRANSITIONS[from].includes(to);
}

export function allowedRoles(from: OrderState, to: OrderState): readonly ActorRole[] {
  return ACTOR_RULES[`${from}->${to}` as TransitionKey] ?? [];
}

function assertIsoTimestamp(at: string): void {
  if (!at || Number.isNaN(Date.parse(at))) {
    throw new Error(`Transition timestamp must be an ISO 8601 string, received: ${at}`);
  }
}

function checkGuards(order: Order, to: OrderState, ctx: TransitionContext): void {
  const from = order.state;

  if (!canTransition(from, to, order.kind)) {
    throw new InvalidTransitionError(from, to);
  }

  if (!ctx.actor?.id || !ctx.actor.role) {
    throw new InvalidTransitionError(from, to, 'Every transition needs an identified actor');
  }

  const roles = allowedRoles(from, to);
  if (!roles.includes(ctx.actor.role)) {
    throw new InvalidTransitionError(
      from,
      to,
      `Role ${ctx.actor.role} cannot move an order ${from} -> ${to}`,
    );
  }

  assertIsoTimestamp(ctx.at);

  if (!ctx.eventId) {
    throw new InvalidTransitionError(from, to, 'Every transition writes an event id');
  }

  // RIDER_ASSIGNED -> PICKED_UP needs the pickup scan photo (RIDE-02, SHOP-07).
  if (to === 'PICKED_UP' && !ctx.photoIds?.length) {
    throw new InvalidTransitionError(from, to, 'Pickup requires a scan photo');
  }

  // ARRIVED -> OTP_VERIFIED only after the buyer's handover code is verified.
  if (to === 'OTP_VERIFIED' && ctx.otpVerified !== true) {
    throw new InvalidTransitionError(from, to, 'Buyer OTP must be verified first');
  }

  // Rider closes a delivery with a handover photo (RIDE-03).
  if (to === 'DELIVERED' && ctx.actor.role === 'rider' && !ctx.photoIds?.length) {
    throw new InvalidTransitionError(from, to, 'Delivery requires a handover photo');
  }
}

/**
 * The only function that changes an order's state. Returns a new order and
 * the event that was written; never mutates the input.
 */
export function transition(
  order: Order,
  to: OrderState,
  ctx: TransitionContext,
): { order: Order; event: OrderEvent } {
  checkGuards(order, to, ctx);

  const event: OrderEvent = {
    id: ctx.eventId,
    orderId: order.id,
    from: order.state,
    to,
    actor: { id: ctx.actor.id, role: ctx.actor.role },
    timestamp: ctx.at,
    ...(ctx.gps ? { gps: ctx.gps } : {}),
    ...(ctx.photoIds?.length ? { photoIds: [...ctx.photoIds] } : {}),
  };

  return {
    order: { ...order, state: to, events: [...order.events, event] },
    event,
  };
}

/**
 * Entering the buyer's OTP writes both events from ambiguity 7 in one call.
 */
export function verifyOtp(
  order: Order,
  ctx: TransitionContext,
  secondEventId: string,
): { order: Order; events: [OrderEvent, OrderEvent] } {
  const verified = transition(order, 'OTP_VERIFIED', { ...ctx, otpVerified: true });
  const nextState: OrderState = order.kind === 'try_at_door' ? 'TRIAL_ACTIVE' : 'DELIVERED';
  const closed = transition(verified.order, nextState, {
    ...ctx,
    eventId: secondEventId,
    otpVerified: true,
  });
  return { order: closed.order, events: [verified.event, closed.event] };
}
