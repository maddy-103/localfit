import { describe, expect, it } from 'vitest';
import {
  InvalidTransitionError,
  ORDER_STATES,
  allowedRoles,
  canTransition,
  normaliseOrderState,
  nextStates,
  transition,
  verifyOtp,
  type ActorRole,
  type Order,
  type OrderKind,
  type OrderState,
  type TransitionContext,
} from './orderMachine';

/**
 * Expected table, written out independently of the implementation so the
 * test can catch a missing or extra edge in orderMachine.
 */
const EXPECTED: Record<OrderState, readonly OrderState[]> = {
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

const AT = '2026-11-16T10:15:00.000Z';

function makeOrder(state: OrderState, kind: OrderKind = 'standard'): Order {
  return { id: 'order-test', kind, state, events: [] };
}

function contextFor(
  from: OrderState,
  to: OrderState,
  actorRole: ActorRole,
): TransitionContext {
  return {
    actor: { id: 'actor-1', role: actorRole },
    at: AT,
    eventId: `event-${from}-${to}`,
    ...(to === 'PICKED_UP' ? { photoIds: ['pickup-photo'] } : {}),
    ...(to === 'OTP_VERIFIED' ? { otpVerified: true } : {}),
    ...(to === 'DELIVERED' ? { photoIds: ['handover-photo'] } : {}),
  };
}

function kindFor(to: OrderState): OrderKind {
  return to === 'TRIAL_ACTIVE' ? 'try_at_door' : 'standard';
}

const allowedKeys = new Set(
  Object.entries(EXPECTED).flatMap(([from, targets]) =>
    targets.map((to) => `${from}->${to}`),
  ),
);

describe('orderMachine table', () => {
  it('exposes exactly the SPEC states', () => {
    expect([...ORDER_STATES]).toEqual(Object.keys(EXPECTED));
  });

  for (const from of ORDER_STATES) {
    for (const to of EXPECTED[from]) {
      it(`allows ${from} -> ${to}`, () => {
        const kind = kindFor(to);
        const roles = allowedRoles(from, to);
        expect(roles.length, `${from} -> ${to} needs an actor rule`).toBeGreaterThan(0);

        for (const role of roles) {
          expect(canTransition(from, to, kind)).toBe(true);
          const result = transition(makeOrder(from, kind), to, contextFor(from, to, role));

          expect(result.order.state).toBe(to);
          expect(result.order.events).toHaveLength(1);
          expect(result.event).toMatchObject({
            id: `event-${from}-${to}`,
            orderId: 'order-test',
            from,
            to,
            actor: { id: 'actor-1', role },
            timestamp: AT,
          });
        }
      });
    }
  }

  for (const from of ORDER_STATES) {
    for (const to of ORDER_STATES) {
      const key = `${from}->${to}`;
      if (allowedKeys.has(key)) continue;
      if (from === 'OTP_VERIFIED' && to === 'TRIAL_ACTIVE') continue;

      it(`forbids ${from} -> ${to}`, () => {
        expect(canTransition(from, to, 'standard')).toBe(false);
        expect(() =>
          transition(makeOrder(from), to, contextFor(from, to, 'admin')),
        ).toThrow(InvalidTransitionError);
      });
    }
  }

  it('gates OTP_VERIFIED by order kind', () => {
    expect(canTransition('OTP_VERIFIED', 'TRIAL_ACTIVE', 'try_at_door')).toBe(true);
    expect(canTransition('OTP_VERIFIED', 'TRIAL_ACTIVE', 'standard')).toBe(false);
    expect(canTransition('OTP_VERIFIED', 'DELIVERED', 'standard')).toBe(true);
    expect(canTransition('OTP_VERIFIED', 'DELIVERED', 'try_at_door')).toBe(false);
  });

  it('keeps terminal states terminal', () => {
    for (const state of [
      'SHOP_DECLINED',
      'CANCELLED',
      'CANCELLED_BY_SHOP',
      'RETURN_REJECTED',
      'SETTLED',
    ] as const) {
      expect(nextStates(state)).toHaveLength(0);
    }
  });

  it('maps RETURN_IN_PROGRESS onto RETURN_PICKED', () => {
    expect(normaliseOrderState('RETURN_IN_PROGRESS')).toBe('RETURN_PICKED');
    expect(normaliseOrderState('TRIAL_ACTIVE')).toBe('TRIAL_ACTIVE');
  });
});

describe('orderMachine guards', () => {
  it('rejects a role that is not allowed for the edge', () => {
    expect(() =>
      transition(makeOrder('PLACED'), 'SHOP_ACCEPTED', contextFor('PLACED', 'SHOP_ACCEPTED', 'buyer')),
    ).toThrow(/cannot move an order/i);
  });

  it('requires an identified actor', () => {
    expect(() =>
      transition(makeOrder('PLACED'), 'SHOP_ACCEPTED', {
        actor: { id: '', role: 'shop' },
        at: AT,
        eventId: 'event-1',
      }),
    ).toThrow(/identified actor/i);
  });

  it('requires an event id', () => {
    expect(() =>
      transition(makeOrder('PLACED'), 'SHOP_ACCEPTED', {
        actor: { id: 'shop-1', role: 'shop' },
        at: AT,
        eventId: '',
      }),
    ).toThrow(/event id/i);
  });

  it('requires an ISO timestamp', () => {
    expect(() =>
      transition(makeOrder('PLACED'), 'SHOP_ACCEPTED', {
        actor: { id: 'shop-1', role: 'shop' },
        at: 'not-a-date',
        eventId: 'event-1',
      }),
    ).toThrow(/ISO 8601/i);
  });

  it('requires a pickup photo before PICKED_UP', () => {
    const context = contextFor('RIDER_ASSIGNED', 'PICKED_UP', 'rider');
    expect(() =>
      transition(makeOrder('RIDER_ASSIGNED'), 'PICKED_UP', {
        ...context,
        photoIds: undefined,
      }),
    ).toThrow(/scan photo/i);
  });

  it('requires the buyer OTP before OTP_VERIFIED', () => {
    const context = contextFor('ARRIVED', 'OTP_VERIFIED', 'rider');
    expect(() =>
      transition(makeOrder('ARRIVED'), 'OTP_VERIFIED', {
        ...context,
        otpVerified: false,
      }),
    ).toThrow(/OTP must be verified/i);
  });

  it('requires a handover photo when the rider delivers', () => {
    expect(() =>
      transition(makeOrder('OTP_VERIFIED'), 'DELIVERED', {
        actor: { id: 'rider-1', role: 'rider' },
        at: AT,
        eventId: 'event-1',
        photoIds: [],
      }),
    ).toThrow(/handover photo/i);
  });

  it('does not mutate the input order', () => {
    const order = makeOrder('PLACED');
    transition(order, 'SHOP_ACCEPTED', contextFor('PLACED', 'SHOP_ACCEPTED', 'shop'));
    expect(order.state).toBe('PLACED');
    expect(order.events).toHaveLength(0);
  });
});

describe('verifyOtp', () => {
  it('writes OTP_VERIFIED and TRIAL_ACTIVE for a try-at-door order', () => {
    const result = verifyOtp(
      makeOrder('ARRIVED', 'try_at_door'),
      contextFor('ARRIVED', 'OTP_VERIFIED', 'rider'),
      'event-trial',
    );

    expect(result.order.state).toBe('TRIAL_ACTIVE');
    expect(result.events.map((event) => [event.from, event.to])).toEqual([
      ['ARRIVED', 'OTP_VERIFIED'],
      ['OTP_VERIFIED', 'TRIAL_ACTIVE'],
    ]);
    expect(result.events[1]?.id).toBe('event-trial');
  });

  it('writes OTP_VERIFIED and DELIVERED for a standard order', () => {
    const result = verifyOtp(
      makeOrder('ARRIVED', 'standard'),
      {
        ...contextFor('ARRIVED', 'OTP_VERIFIED', 'rider'),
        photoIds: ['handover-photo'],
      },
      'event-delivered',
    );

    expect(result.order.state).toBe('DELIVERED');
    expect(result.events.map((event) => event.to)).toEqual(['OTP_VERIFIED', 'DELIVERED']);
  });
});
