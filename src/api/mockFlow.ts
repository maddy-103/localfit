import { nowIso } from '@/lib/clock';
import { transition, type OrderActor, type OrderEvent } from '@/domain/orderMachine';
import { canUseCod, deliveryFeePaise, mockPaymentAdapter } from '@/domain/payments';
import { trialEndsAt } from '@/domain/trial';
import { acceptDeadline } from '@/domain/sla';
import { insideServiceArea } from '@/domain/locationPolicy';
import { addresses, buyers, products, shops } from './seed';
import {
  availableStock,
  bagLineOf,
  commitOrder,
  decorateOrder,
  emptyBag,
  getState,
  notify,
  orderLinesTotal,
  pruneExpiredBag,
  setState,
  uid,
} from './mockStore';
import type {
  Order,
  OrderLine,
  OrderPayment,
  OtpResult,
  PlaceCheckoutInput,
  PlaceCheckoutResult,
} from './types';

/** Fixed mock codes so the demo panel and tests always know them. */
export const MOCK_OTP = '4821';
export const MOCK_PICKUP_OTP = '1357';

export function makeEvent(patch: {
  order: Order;
  from?: Order['state'];
  to?: Order['state'];
  action?: OrderEvent['action'];
  actor: OrderActor;
  note?: string;
  lineId?: string;
  amountPaise?: number;
  photoIds?: string[];
}): OrderEvent {
  return {
    id: uid('evt'),
    orderId: patch.order.id,
    from: patch.from ?? patch.order.state,
    to: patch.to ?? patch.order.state,
    actor: { ...patch.actor },
    timestamp: nowIso(),
    ...(patch.action ? { action: patch.action } : {}),
    ...(patch.note ? { note: patch.note } : {}),
    ...(patch.lineId ? { lineId: patch.lineId } : {}),
    ...(patch.amountPaise !== undefined ? { amountPaise: patch.amountPaise } : {}),
    ...(patch.photoIds?.length ? { photoIds: [...patch.photoIds] } : {}),
  };
}

/**
 * One order per shop (resolved ambiguity 9). Payment is taken once at
 * checkout through the adapter: cards hold, UPI and wallets charge.
 */
export async function checkoutFromBag(input: PlaceCheckoutInput): Promise<PlaceCheckoutResult> {
  const state = getState();
  const bag = pruneExpiredBag(state.bag);
  if (bag.lines.length === 0) throw new Error('Your bag is empty.');

  const buyer = buyers[0];
  if (!buyer) throw new Error('No buyer is seeded.');

  const address =
    addresses.find((entry) => entry.id === input.addressId && entry.buyerId === buyer.id) ??
    addresses.find((entry) => entry.buyerId === buyer.id);
  if (!address) throw new Error('Add a delivery address before paying.');

  const byShop = new Map<string, typeof bag.lines>();
  for (const line of bag.lines) {
    const product = products.find((entry) => entry.id === line.productId);
    if (!product) throw new Error('A bag item is no longer listed.');
    const lines = byShop.get(product.shopId) ?? [];
    lines.push(line);
    byShop.set(product.shopId, lines);
  }

  const checkoutId = uid('checkout');
  const createdAt = nowIso();
  const created: Order[] = [];

  const previews = [...byShop.entries()].map(([shopId, lines]) => {
    const shop = shops.find((entry) => entry.id === shopId);
    if (!shop) throw new Error('A shop in your bag is no longer available.');
    if (!insideServiceArea(address, shop)) {
      throw new Error(`${shop.name} does not deliver to ${address.area} yet.`);
    }
    const kind: Order['kind'] = lines.some((line) => line.tryAtDoor) ? 'try_at_door' : 'standard';
    const orderLines: OrderLine[] = lines.map((line) =>
      bagLineOf(line, kind === 'try_at_door' ? 'pending' : null),
    );
    const itemsPaise = orderLinesTotal(orderLines);
    const feePaise = deliveryFeePaise(itemsPaise);
    return { shopId, shop, kind, orderLines, itemsPaise, feePaise, totalPaise: itemsPaise + feePaise };
  });

  // One payment covers the checkout; each shop order records its share of it.
  const checkoutAuthorization = await mockPaymentAdapter.authorize({
    method: input.paymentMethod,
    amountPaise: previews.reduce((sum, preview) => sum + preview.totalPaise, 0),
    isTryAtDoor: previews.some((preview) => preview.kind === 'try_at_door'),
  });

  for (const preview of previews) {
    const { shopId, shop, kind, orderLines, itemsPaise, feePaise, totalPaise } = preview;

    const codAllowed = canUseCod({
      isTryAtDoor: kind === 'try_at_door',
      completedPrepaidOrders: buyer.completedPrepaidOrders,
      completedOrders: buyer.completedOrders,
      amountPaise: totalPaise,
    });
    if (input.paymentMethod === 'cod' && !codAllowed) {
      throw new Error(
        kind === 'try_at_door'
          ? 'Try-at-door orders must be prepaid.'
          : 'Cash on delivery is not available for this order yet.',
      );
    }

    const payment: OrderPayment = {
      ...checkoutAuthorization,
      authorizedPaise: checkoutAuthorization.mode === 'none' ? 0 : totalPaise,
      capturedPaise: checkoutAuthorization.mode === 'charge' ? totalPaise : 0,
      reference: `${checkoutAuthorization.reference}:${shopId}`,
      refundPaise: 0,
    };

    const id = uid('order');
    const order: Order = {
      id,
      checkoutId,
      buyerId: buyer.id,
      shopId,
      kind,
      state: 'PLACED',
      lines: orderLines,
      itemsPaise,
      deliveryFeePaise: feePaise,
      totalPaise,
      etaMin: shop.etaMin,
      paymentMethod: input.paymentMethod,
      payment,
      createdAt,
      events: [],
      otp: MOCK_OTP,
      otpAttempts: 0,
      acceptsUntil: acceptDeadline(createdAt, Date.parse(createdAt)).endsAt,
      pickupOtp: MOCK_PICKUP_OTP,
      swapRequests: [],
    };

    order.events.push({
      id: uid('evt'),
      orderId: id,
      from: 'PLACED',
      to: 'PLACED',
      actor: { id: buyer.id, role: 'buyer' },
      timestamp: createdAt,
      action: 'transition',
      note: 'Order placed',
    });

    created.push(order);
  }

  setState({ ...state, bag: emptyBag(), orders: [...created, ...state.orders] });
  notify('bag', getState().bag);
  notify('orders', getState().orders.map((order) => decorateOrder(order)));

  const orders = created.map((order) => decorateOrder(order));
  return {
    checkoutId,
    orders,
    orderIds: orders.map((order) => order.id),
  };
}

/** Buyer's 4-digit handover code (BUY-09). Three wrong tries open support. */
export function submitOtpFlow(orderId: string, otp: string, actor: OrderActor): OtpResult {
  const order = getState().orders.find((entry) => entry.id === orderId);
  if (!order) throw new Error('Order not found.');

  if (order.state === 'ARRIVED' && order.otp && otp.trim() !== order.otp) {
    const attempts = order.otpAttempts + 1;
    const events = [
      ...order.events,
      makeEvent({ order, action: 'otp_failed', actor, note: 'Wrong handover code' }),
    ];
    if (attempts >= 3) {
      events.push(
        makeEvent({ order, action: 'support_opened', actor, note: 'Three wrong codes' }),
      );
    }
    const next = commitOrder({ ...order, otpAttempts: attempts, events });
    return { ok: false, attempts, supportRequired: attempts >= 3, order: next };
  }

  if (order.state !== 'ARRIVED') {
    if (['OTP_VERIFIED', 'TRIAL_ACTIVE', 'DECISIONS_LOCKED', 'DELIVERED'].includes(order.state)) {
      return { ok: true, attempts: order.otpAttempts, supportRequired: false, order: decorateOrder(order) };
    }
    throw new Error('The rider has not arrived yet.');
  }

  const at = nowIso();
  const base = order as unknown as import('@/domain/orderMachine').Order;
  const verified = transition(base, 'OTP_VERIFIED', {
    actor,
    at,
    eventId: uid('evt'),
    otpVerified: true,
  });
  const nextState = order.kind === 'try_at_door' ? 'TRIAL_ACTIVE' : 'DELIVERED';
  const closed = transition(verified.order, nextState, {
    actor,
    at,
    eventId: uid('evt'),
    ...(nextState === 'DELIVERED' ? { photoIds: ['mock-photo-handover'] } : {}),
  });

  const trial = order.kind === 'try_at_door' ? { trialStartedAt: at, trialEndsAt: trialEndsAt(at) } : {};
  const next = commitOrder({
    ...order,
    state: closed.order.state,
    events: closed.order.events,
    ...trial,
  });

  return { ok: true, attempts: order.otpAttempts, supportRequired: false, order: next };
}

export function trialWindowStart(): string {
  return nowIso();
}

/** Guards trial actions to a live window. */
export function requireTrialOrder(orderId: string): Order {
  const order = getState().orders.find((entry) => entry.id === orderId);
  if (!order) throw new Error('Order not found.');
  if (order.state !== 'TRIAL_ACTIVE') {
    throw new Error('The try-at-door window is not open for this order.');
  }
  return order;
}

export function availableForSwap(productId: string, variantId: string): boolean {
  return availableStock(productId, variantId) > 0;
}
