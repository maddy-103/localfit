/** Inventory, order handover, returns and payout flows for the mock API. */
import { now, nowIso } from '@/lib/clock';
import {
  transition,
  type Order as DomainOrder,
  type OrderActor,
  type OrderState,
} from '@/domain/orderMachine';
import { counterSale } from '@/domain/stock';
import { DECLINE_REASONS } from '@/domain/shop';
import type {
  ConflictRecord,
  CounterSaleResultApi,
  Order,
  PickupInput,
  Product,
} from './types';
import { admins, riders } from './seed';
import {
  allProducts,
  committedQty,
  commitOrder,
  decorateShopOrder,
  getState,
  heldQty,
  notify,
  onHandQty,
  setState,
  uid,
} from './mockStore';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const shopIdOf = (): string =>
  getState().registration?.shopId ?? getState().settings.shopId;
export const SYSTEM: OrderActor = { id: 'system', role: 'system' };
const RIDER: OrderActor = { id: riders[0]?.id ?? 'rider', role: 'rider' };
export const ADMIN: OrderActor = { id: admins[0]?.id ?? 'admin', role: 'admin' };
const OPEN_STATES: OrderState[] = [
  'PLACED', 'SHOP_ACCEPTED', 'PACKED', 'RIDER_ASSIGNED', 'REASSIGNED', 'PICKED_UP',
  'IN_TRANSIT', 'ARRIVED', 'OTP_VERIFIED', 'TRIAL_ACTIVE', 'DECISIONS_LOCKED', 'DELIVERED',
  'RETURN_REQUESTED', 'RETURN_PICKED', 'RETURN_RECEIVED', 'DISPUTED',
];

export function move(
  order: Order,
  to: OrderState,
  actor: OrderActor,
  extra: { note?: string; photoIds?: string[] } = {},
): Order {
  const result = transition(order as unknown as DomainOrder, to, {
    actor,
    at: nowIso(),
    eventId: uid('evt'),
    ...extra,
  });
  return { ...order, state: result.order.state, events: result.order.events };
}

function shopProduct(product: Product): Product {
  return {
    ...clone(product),
    variants: product.variants.map((variant) => ({
      ...variant,
      quantity: onHandQty(variant),
      reservedQuantity: committedQty(product.id, variant.id) + heldQty(product.id, variant.id),
      pricePaise: getState().overrides[variant.id]?.pricePaise ?? variant.pricePaise,
      visible: getState().overrides[variant.id]?.visible !== false,
    })),
    stockLeft: product.variants.reduce((sum, variant) => sum + onHandQty(variant), 0),
  };
}

export function shopProducts(shopId = shopIdOf()): Product[] {
  return allProducts().filter((product) => product.shopId === shopId).map(shopProduct);
}

function publishInventory(shopId: string): void {
  notify('inventory', shopProducts(shopId));
}

export function updateVariant(
  productId: string,
  variantId: string,
  patch: { quantity?: number; pricePaise?: number; visible?: boolean },
): Product {
  const state = getState();
  const product = allProducts().find((entry) => entry.id === productId);
  const variant = product?.variants.find((entry) => entry.id === variantId);
  if (!product || !variant) throw new Error('That item is not in your inventory.');
  const previous = state.overrides[variantId] ?? {};
  const override = {
    ...previous,
    ...(patch.quantity === undefined ? {} : { quantity: Math.max(0, Math.floor(patch.quantity)) }),
    ...(patch.pricePaise === undefined ? {} : { pricePaise: Math.max(1, Math.floor(patch.pricePaise)) }),
    ...(patch.visible === undefined ? {} : { visible: patch.visible }),
  };
  setState({ ...state, overrides: { ...state.overrides, [variantId]: override } });
  publishInventory(product.shopId);
  return shopProduct(product);
}

export function sellInShop(
  productId: string,
  variantId: string,
  qty = 1,
): CounterSaleResultApi {
  const state = getState();
  const product = allProducts().find((entry) => entry.id === productId);
  const variant = product?.variants.find((entry) => entry.id === variantId);
  if (!product || !variant) throw new Error('That item is not in your inventory.');
  if (qty < 1) throw new Error('Quantity must be at least one.');

  const result = counterSale({
    quantity: onHandQty(variant),
    committedQty: committedQty(product.id, variant.id),
    heldQty: heldQty(product.id, variant.id),
    qty,
  });

  if (result.outcome === 'conflict') {
    const order = state.orders.find(
      (entry) =>
        OPEN_STATES.includes(entry.state) &&
        entry.lines.some((line) => line.productId === productId && line.variantId === variantId),
    );
    const conflict: ConflictRecord = {
      id: uid('conflict'),
      shopId: product.shopId,
      productId,
      variantId,
      note:
        'Counter sale could not be applied: this unit is committed to an online order. LocalFit support will handle the buyer.',
      ...(order ? { orderId: order.id } : {}),
      createdAt: nowIso(),
      resolved: false,
    };
    setState({ ...state, conflicts: [conflict, ...state.conflicts] });
    notify('conflicts', getState().conflicts);
    return { product: shopProduct(product), conflict, releasedBagLines: [] };
  }

  const released = state.bag.lines.filter(
    (line) => line.productId === productId && line.variantId === variantId,
  );
  const bag = { ...state.bag, lines: state.bag.lines.filter((line) => !released.includes(line)) };
  setState({
    ...state,
    bag,
    overrides: {
      ...state.overrides,
      [variantId]: { ...state.overrides[variantId], quantity: result.quantity },
    },
  });
  notify('bag', bag);
  publishInventory(product.shopId);
  return { product: shopProduct(product), conflict: null, releasedBagLines: released.map((line) => line.id) };
}

export function listConflicts(): ConflictRecord[] {
  return clone(getState().conflicts).filter((entry) => entry.shopId === shopIdOf());
}

/* --------------------------- Shop orders ----------------------------- */

export function shopOrders(shopId = shopIdOf()): Order[] {
  return getState().orders
    .filter((order) => order.shopId === shopId)
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(decorateShopOrder);
}

function internalOrder(orderId: string): Order {
  const order = getState().orders.find((entry) => entry.id === orderId);
  if (!order) throw new Error('Order not found.');
  return order;
}

export function acceptOrder(orderId: string, actor: OrderActor): Order {
  const order = internalOrder(orderId);
  if (order.state !== 'PLACED') throw new Error('This order is no longer waiting for acceptance.');
  if (order.acceptsUntil && now() > Date.parse(order.acceptsUntil)) {
    throw new Error('The acceptance window has closed. LocalFit support will handle this order.');
  }
  return commitOrder(move(order, 'SHOP_ACCEPTED', actor));
}

export function declineOrder(orderId: string, reason: string, actor: OrderActor): Order {
  if (!(DECLINE_REASONS as readonly string[]).includes(reason)) {
    throw new Error('Choose a reason from the list.');
  }
  const order = internalOrder(orderId);
  if (order.state !== 'PLACED') throw new Error('This order can no longer be declined.');
  return commitOrder(move(order, 'SHOP_DECLINED', actor, { note: reason }));
}

export function packOrder(orderId: string, actor: OrderActor): Order {
  const order = internalOrder(orderId);
  if (order.state !== 'SHOP_ACCEPTED') throw new Error('Accept the order before packing it.');
  return commitOrder(move(order, 'PACKED', actor));
}

/** PACKED -> RIDER_ASSIGNED: the rider is assigned so a code can be shown. */
export function readyOrder(orderId: string, actor: OrderActor): Order {
  const order = internalOrder(orderId);
  if (order.state !== 'PACKED') throw new Error('Pack the order before marking it ready.');
  const rider = riders[0];
  const assigned = order.rider ?? (rider
    ? { id: rider.id, name: rider.name, phone: rider.phone }
    : undefined);
  return commitOrder(move({ ...order, ...(assigned ? { rider: assigned } : {}) }, 'RIDER_ASSIGNED', actor));
}

export function handoverOrder(orderId: string, input: PickupInput, actor: OrderActor): Order {
  const order = internalOrder(orderId);
  if (order.state !== 'RIDER_ASSIGNED') throw new Error('This order is not waiting for pickup.');
  if (!input.pickupOtp.trim() || input.pickupOtp.trim() !== order.pickupOtp) {
    throw new Error('That rider code did not match.');
  }
  const codes = order.lines.map((line) => line.variantId.toLowerCase());
  if (!input.scanCode.trim() || !codes.includes(input.scanCode.trim().toLowerCase())) {
    throw new Error('Scan an item from this order or enter its code.');
  }
  if (!input.photoId.trim()) throw new Error('Add a pickup photo before handing over.');

  const picked = move(order, 'PICKED_UP', actor, {
    note: `Rider code checked; scanned ${input.scanCode.trim()}`,
    photoIds: [input.photoId],
  });
  const riderActor: OrderActor = { id: order.rider?.id ?? RIDER.id, role: 'rider' };
  const transit = move(picked, 'IN_TRANSIT', riderActor, { photoIds: [input.photoId] });
  return commitOrder(transit);
}

export function markInTransit(orderId: string, actor: OrderActor): Order {
  const order = internalOrder(orderId);
  if (order.state !== 'PICKED_UP') throw new Error('The order has not been picked up.');
  const photoIds = order.events.find((event) => event.to === 'PICKED_UP')?.photoIds ?? [];
  return commitOrder(move(order, 'IN_TRANSIT', actor, { photoIds }));
}

