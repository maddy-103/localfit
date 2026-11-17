/**
 * Dev-only order helpers for the DemoPanel. Nothing here is part of `Api`;
 * the panel is lazy-loaded behind `import.meta.env.DEV` in RootLayout, so
 * this module never reaches a production bundle.
 */

import { nowIso } from '@/lib/clock';
import {
  transition,
  type OrderActor,
  type Order as DomainOrder,
  type OrderState,
} from '@/domain/orderMachine';
import {
  commitOrder,
  decorateOrder,
  getState,
  uid,
} from './mockStore';
import { MOCK_OTP, submitOtpFlow } from './mockFlow';
import { lockTrialFlow } from './mockTrial';
import { mockApi, resetMockData } from './mock';
import { riders } from './seed';
import type { Order } from './types';

const SHOP: OrderActor = { id: 'shop-kiran', role: 'shop' };
const RIDER: OrderActor = { id: 'rider-arjun', role: 'rider' };
const SYSTEM: OrderActor = { id: 'system', role: 'system' };
const BUYER: OrderActor = { id: 'buyer-ananya', role: 'buyer' };

function move(
  order: Order,
  to: OrderState,
  actor: OrderActor,
  extra?: { photoIds?: string[] },
): Order {
  const result = transition(order as unknown as DomainOrder, to, {
    actor,
    at: nowIso(),
    eventId: uid('evt'),
    ...(extra?.photoIds ? { photoIds: extra.photoIds } : {}),
  });
  return { ...order, state: result.order.state, events: result.order.events };
}

function internalOrder(orderId: string): Order {
  const found = getState().orders.find((order) => order.id === orderId);
  if (!found) throw new Error('Demo order not found. Create one first.');
  return found;
}

/** Adds one eligible kurta and places a prepaid try-at-door order. */
export async function devCreateTryAtDoorOrder(): Promise<Order> {
  await mockApi.addToBag({
    productId: 'prod-kurta-set',
    variantId: 'var-kurta-m',
    qty: 1,
    tryAtDoor: true,
  });
  const result = await mockApi.placeCheckout({ paymentMethod: 'upi' });
  const order = result.orders.find((entry) => entry.kind === 'try_at_door') ?? result.orders[0];
  if (!order) throw new Error('Checkout created no order.');
  return order;
}

/** Moves the demo order one step along the try-at-door lifecycle. */
export function devAdvanceOrder(orderId: string): Order {
  const order = internalOrder(orderId);

  switch (order.state) {
    case 'PLACED':
      return commitOrder(move(order, 'SHOP_ACCEPTED', SHOP));
    case 'SHOP_ACCEPTED':
      return commitOrder(move(order, 'PACKED', SHOP));
    case 'PACKED': {
      const rider = riders[0];
      const withRider = rider
        ? { ...order, rider: { id: rider.id, name: rider.name, phone: rider.phone } }
        : order;
      return commitOrder(move(withRider, 'RIDER_ASSIGNED', SYSTEM));
    }
    case 'RIDER_ASSIGNED':
      return commitOrder(move(order, 'PICKED_UP', RIDER, { photoIds: ['demo-photo-pickup'] }));
    case 'PICKED_UP':
      return commitOrder(move(order, 'IN_TRANSIT', RIDER));
    case 'IN_TRANSIT':
      return commitOrder(move(order, 'ARRIVED', SYSTEM));
    case 'ARRIVED':
      return submitOtpFlow(orderId, order.otp ?? MOCK_OTP, RIDER).order;
    case 'TRIAL_ACTIVE':
      return lockTrialFlow(orderId, BUYER, 'buyer');
    case 'DECISIONS_LOCKED':
      return commitOrder(
        move(order, 'DELIVERED', RIDER, { photoIds: ['demo-photo-handover'] }),
      );
    default:
      return decorateOrder(order);
  }
}

/** Runs the whole lifecycle until the order is delivered. */
export function devRunToDelivered(orderId: string): Order {
  const stopStates: OrderState[] = ['DELIVERED', 'SETTLED', 'RETURN_REQUESTED'];
  let current = internalOrder(orderId);

  for (let step = 0; step < 12; step += 1) {
    if (stopStates.includes(current.state)) break;
    current = internalOrder(orderId);
    devAdvanceOrder(orderId);
    current = internalOrder(orderId);
  }

  return decorateOrder(internalOrder(orderId));
}

/** Feeds a deliberately wrong code so the support path can be demonstrated. */
export function devWrongOtp(orderId: string): Order {
  return submitOtpFlow(orderId, '0000', RIDER).order;
}

export function devVerifyOtp(orderId: string): Order {
  const order = internalOrder(orderId);
  return submitOtpFlow(orderId, order.otp ?? MOCK_OTP, RIDER).order;
}

export function devLockDecisions(orderId: string): Order {
  return lockTrialFlow(orderId, BUYER, 'timer');
}

export function devResetOrders(): void {
  resetMockData();
}

export { decorateOrder };
