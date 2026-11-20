/** Shop timeout, dashboard, return inspection and settlement reports. */
import { now, nowIso } from '@/lib/clock';
import type { OrderActor } from '@/domain/orderMachine';
import { RETURN_DISPUTE_REASONS } from '@/domain/shop';
import {
  buildSettlementReport,
  type LedgerEntry,
  type SettlementReport,
} from '@/domain/settlements';
import type {
  Order,
  ReturnInspectionInput,
  ShopSummary,
} from './types';
import { commitOrder, decorateShopOrder, getState, notify, setState } from './mockStore';
import { ADMIN, move, SYSTEM, shopOrders, shopProducts } from './mockShopOps';

const RETURN_STATES = [
  'RETURN_REQUESTED', 'RETURN_PICKED', 'RETURN_RECEIVED', 'DISPUTED',
] as const;

const DEAD_STATES = [
  'SHOP_DECLINED', 'CANCELLED', 'CANCELLED_BY_SHOP', 'RETURN_REJECTED',
] as const;

function internalOrder(orderId: string): Order {
  const order = getState().orders.find((entry) => entry.id === orderId);
  if (!order) throw new Error('Order not found.');
  return order;
}

/** SHOP-06: a PLACED order whose five-minute window ended is released. */
export function releaseExpiredOrders(atMs = now()): Order[] {
  const state = getState();
  const expired = state.orders.filter(
    (order) =>
      order.state === 'PLACED' &&
      order.acceptsUntil !== undefined &&
      atMs >= Date.parse(order.acceptsUntil),
  );
  let orders = state.orders;
  for (const order of expired) {
    const cancelled = move(order, 'CANCELLED', SYSTEM, { note: 'Shop acceptance window expired' });
    orders = orders.map((entry) => (entry.id === cancelled.id ? cancelled : entry));
  }
  if (expired.length) {
    setState({ ...state, orders });
    notify('orders', orders.map(decorateShopOrder));
  }
  return expired.map((order) => decorateShopOrder(orders.find((entry) => entry.id === order.id)!));
}

export function shopSummary(shopId?: string): ShopSummary {
  const orders = shopOrders(shopId);
  const products = shopProducts(shopId);
  const today = new Date(now()).toDateString();
  const paid = orders.filter(
    (order) =>
      new Date(order.createdAt).toDateString() === today &&
      !(DEAD_STATES as readonly string[]).includes(order.state),
  );
  const salesPaise = paid.reduce((sum, order) => sum + order.itemsPaise, 0);
  const returnsPaise = paid
    .filter((order) => (RETURN_STATES as readonly string[]).includes(order.state))
    .reduce((sum, order) => sum + order.itemsPaise, 0);
  return {
    awaiting: orders.filter((order) => order.state === 'PLACED').length,
    lowStock: products.reduce(
      (count, product) =>
        count + product.variants.filter((variant) => variant.quantity <= 2).length,
      0,
    ),
    conflicts: getState().conflicts.filter((entry) => !entry.resolved).length,
    salesPaise,
    earningsPaise: Math.max(0, salesPaise - returnsPaise),
    returns: orders.filter((order) => (RETURN_STATES as readonly string[]).includes(order.state)).length,
  };
}

export function returnOrders(shopId?: string): Order[] {
  return shopOrders(shopId).filter((order) =>
    (RETURN_STATES as readonly string[]).includes(order.state),
  );
}

/**
 * SHOP-09: inspections use the machine for every step. The mock collects the
 * rider pickup first so a shop can act on a buyer request without a rider
 * console in this phase.
 */
export function inspectReturn(
  orderId: string,
  input: ReturnInspectionInput,
  actor: OrderActor,
): Order {
  const order = internalOrder(orderId);
  if (!(RETURN_STATES as readonly string[]).includes(order.state)) {
    throw new Error('This order has no return to inspect.');
  }
  if (input.photoIds.length < order.lines.length) {
    throw new Error('Add a photo for every returned item.');
  }
  if (
    input.decision === 'dispute' &&
    !(RETURN_DISPUTE_REASONS as readonly string[]).includes(input.reason ?? '')
  ) {
    throw new Error('Choose a reason from the list.');
  }

  let current = order;
  if (current.state === 'RETURN_REQUESTED') {
    const picked = move(current, 'RETURN_PICKED', {
      id: order.rider?.id ?? SYSTEM.id,
      role: 'rider',
    }, { photoIds: input.photoIds });
    current = { ...current, state: picked.state, events: picked.events };
  }
  if (current.state === 'RETURN_PICKED') {
    const received = move(current, 'RETURN_RECEIVED', actor, { photoIds: input.photoIds });
    current = { ...current, state: received.state, events: received.events };
  }
  if (current.state === 'RETURN_RECEIVED') {
    current = input.decision === 'dispute'
      ? move(current, 'DISPUTED', actor, {
          note: input.reason,
          photoIds: input.photoIds,
        })
      : move(current, 'REFUNDED', ADMIN, {
          note: 'Return accepted; refund initiated',
          photoIds: input.photoIds,
        });
  }
  return commitOrder(current);
}

/** SHOP-08: one weekly ledger. Commission defaults to zero until configured. */
export function settlementReport(shopId?: string): SettlementReport {
  const to = nowIso();
  const from = new Date(now() - 7 * 86_400_000).toISOString();
  const entries: LedgerEntry[] = getState().orders
    .filter((order) => !order.shopId || !shopId || order.shopId === shopId)
    .filter((order) => Date.parse(order.createdAt) >= Date.parse(from))
    .filter((order) => !(DEAD_STATES as readonly string[]).includes(order.state))
    .map((order) => {
      const returnedPaise = order.lines
        .filter((line) => line.decision === 'return')
        .reduce((sum, line) => sum + line.pricePaise * line.qty, 0);
      const grossPaise = order.lines.reduce(
        (sum, line) => sum + line.pricePaise * line.qty, 0,
      );
      return {
        orderId: order.id,
        shopId: order.shopId,
        createdAt: order.createdAt,
        grossPaise,
        returnedPaise,
        heldPaise: order.state === 'DISPUTED' ? returnedPaise : 0,
        settled: order.state === 'SETTLED',
      };
    });
  return buildSettlementReport(entries, { shopId: shopId ?? entries[0]?.shopId ?? '', from, to });
}
