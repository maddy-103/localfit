import type { Api, Product } from './types';
import { now } from '@/lib/clock';
import {
  availableStock,
  decorateOrder,
  getState,
  pruneExpiredBag,
  resetStore,
  respond,
  setBagState,
  subscribeInternal,
} from './mockStore';
import { checkoutFromBag, submitOtpFlow } from './mockFlow';
import { lockTrialFlow, requestReturnFlow, requestSwapFlow, setDecisionFlow } from './mockTrial';
import { admins, addresses, buyers, products, riders, shops } from './seed';

const HOLD_MS = 10 * 60 * 1000;

function uid(prefix: string): string {
  const value =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return `${prefix}-${value}`;
}

function assertBagQuantity(productId: string, variantId: string, qty: number): void {
  const stock = availableStock(productId, variantId);
  if (qty > stock) {
    throw new Error(`Only ${stock} left in that size and colour.`);
  }
}

/**
 * The mock API. All screens call this through `api` in client.ts, never
 * directly. State, persistence and realtime live in mockStore.ts; the order
 * flow lives in mockFlow.ts and mockTrial.ts.
 */
export const mockApi: Api = {
  async listProducts(params) {
    return respond(() => {
      let result = products;
      if (params?.occasion && params.occasion !== 'all') {
        result = result.filter((product) => product.occasions.includes(params.occasion!));
      }
      if (params?.shopId) {
        result = result.filter((product) => product.shopId === params.shopId);
      }
      if (params?.q) {
        const query = params.q.trim().toLowerCase();
        const shopNames = new Map(shops.map((shop) => [shop.id, shop.name.toLowerCase()]));
        result = result.filter(
          (product) =>
            product.title.toLowerCase().includes(query) ||
            product.category.toLowerCase().includes(query) ||
            (shopNames.get(product.shopId) ?? '').includes(query),
        );
      }
      return result.map((product) => ({ ...product }));
    });
  },

  async getProduct(id) {
    return respond(() => {
      const found = products.find((product) => product.id === id);
      return found ? { ...found } : null;
    });
  },

  async listShops() {
    return respond(() => shops.map((shop) => ({ ...shop })));
  },

  async getShop(id) {
    return respond(() => {
      const found = shops.find((shop) => shop.id === id);
      return found ? { ...found } : null;
    });
  },

  async listBuyers() {
    return respond(() => buyers.map((buyer) => ({ ...buyer })));
  },

  async listRiders() {
    return respond(() => riders.map((rider) => ({ ...rider })));
  },

  async listAdmins() {
    return respond(() =>
      admins.map((admin) => ({ ...admin, permissions: [...admin.permissions] })),
    );
  },

  async listAddresses(buyerId) {
    return respond(() =>
      addresses
        .filter((address) => (buyerId ? address.buyerId === buyerId : true))
        .map((address) => ({ ...address })),
    );
  },

  async getBag() {
    return respond(() => {
      const bag = getState().bag;
      const pruned = pruneExpiredBag(bag);
      if (pruned !== bag) return setBagState(pruned);
      return bag;
    });
  },

  async addToBag(input) {
    return respond(() => {
      const stock = availableStock(input.productId, input.variantId);
      if (stock <= 0) throw new Error('That size and colour just went out of stock.');
      if (!products.some((product) => product.id === input.productId)) {
        throw new Error('Unknown product.');
      }

      const bag = pruneExpiredBag(getState().bag);
      const existing = bag.lines.find(
        (line) =>
          line.productId === input.productId &&
          line.variantId === input.variantId &&
          line.tryAtDoor === input.tryAtDoor,
      );

      if (existing) {
        const qty = Math.min(stock, existing.qty + input.qty);
        assertBagQuantity(input.productId, input.variantId, qty);
        existing.qty = qty;
      } else {
        assertBagQuantity(input.productId, input.variantId, input.qty);
        bag.lines.push({
          ...input,
          id: uid('line'),
          heldUntil: new Date(now() + HOLD_MS).toISOString(),
        });
      }

      bag.reservedUntil = bag.lines[0]?.heldUntil ?? null;
      return setBagState(bag);
    });
  },

  async updateBagLine(id, patch) {
    return respond(() => {
      const bag = pruneExpiredBag(getState().bag);
      const line = bag.lines.find((entry) => entry.id === id);
      if (!line) throw new Error('That bag line no longer exists.');
      if (typeof patch.qty === 'number') {
        if (patch.qty < 1) throw new Error('Quantity must be at least one.');
        assertBagQuantity(line.productId, line.variantId, patch.qty);
        line.qty = patch.qty;
      }
      if (typeof patch.tryAtDoor === 'boolean') line.tryAtDoor = patch.tryAtDoor;
      return setBagState(bag);
    });
  },

  async removeBagLine(id) {
    return respond(() => {
      const bag = pruneExpiredBag(getState().bag);
      const lines = bag.lines.filter((line) => line.id !== id);
      return setBagState({ lines, reservedUntil: lines[0]?.heldUntil ?? null });
    });
  },

  placeCheckout(input) {
    return respond(() => checkoutFromBag(input));
  },

  async listOrders() {
    return respond(() => getState().orders.map((order) => decorateOrder(order)));
  },

  async getOrder(id) {
    return respond(() => {
      const found = getState().orders.find((order) => order.id === id);
      return found ? decorateOrder(found) : null;
    });
  },

  submitOtp(orderId, otp, actor) {
    return respond(() => submitOtpFlow(orderId, otp, actor));
  },

  setTrialDecision(orderId, lineId, decision, actor) {
    return respond(() => setDecisionFlow(orderId, lineId, decision, actor));
  },

  requestSizeSwap(orderId, input, actor) {
    return respond(() => requestSwapFlow(orderId, input, actor));
  },

  lockTrial(orderId, actor, reason) {
    return respond(() => lockTrialFlow(orderId, actor, reason));
  },

  requestReturn(orderId, input, actor) {
    return respond(() => requestReturnFlow(orderId, input, actor));
  },

  subscribe(topic, callback) {
    return subscribeInternal(topic, callback);
  },
};

/* Bottom of the file keeps the API object above readable. */
export { configureMock, mockFailuresEnabled, setMockFailures } from './mockStore';
export { addresses };

/** Clear persisted mock state and return to the seed. Used by tests and dev. */
export function resetMockData(): void {
  resetStore();
}

/** Synchronous view for tests that need to inspect the seed without a call. */
export function seededProduct(id: string): Product | undefined {
  return products.find((product) => product.id === id);
}
