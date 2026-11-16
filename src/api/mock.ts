import { del, get, set } from 'idb-keyval';
import { now } from '@/lib/clock';
import { canUseCod } from '@/domain/payments';
import type {
  Api,
  Bag,
  BagLine,
  Order,
  PlaceCheckoutInput,
  PlaceCheckoutResult,
  Product,
} from './types';
import { addresses, admins, buyers, products, riders, shops } from './seed';

const STORAGE_KEY = 'lf:mock-state-v1';
const FAILURE_KEY = 'lf:mock-fail';
const CHANNEL = 'localfit-mock';
const HOLD_MS = 10 * 60 * 1000;

interface MockState {
  bag: Bag;
  orders: Order[];
}

const emptyBag = (): Bag => ({ lines: [], reservedUntil: null });

let state: MockState = { bag: emptyBag(), orders: [] };
let loaded = false;
let loading: Promise<void> | null = null;
let latencyMs = 180;

type Listener = (data: unknown) => void;
const listeners = new Map<string, Set<Listener>>();

const channel =
  typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null;

channel?.addEventListener('message', (event: MessageEvent) => {
  const payload = event.data as { topic?: string; data?: unknown } | null;
  if (!payload?.topic) return;
  for (const listener of listeners.get(payload.topic) ?? []) {
    listener(payload.data);
  }
});

function notify(topic: string, data: unknown): void {
  for (const listener of listeners.get(topic) ?? []) listener(data);
  channel?.postMessage({ topic, data });
}

function persist(): void {
  try {
    void set(STORAGE_KEY, state).catch(() => {
      // IndexedDB can be unavailable (private mode, tests); the mock still
      // works for the current tab.
    });
  } catch {
    // Accessing IndexedDB can throw synchronously when it is not present.
  }
}

async function ensureLoaded(): Promise<void> {
  if (loaded) return;
  if (!loading) {
    loading = (async () => {
      try {
        const saved = await get<MockState>(STORAGE_KEY);
        if (saved?.bag && Array.isArray(saved.orders)) {
          state = { bag: saved.bag, orders: saved.orders };
        }
      } catch {
        // Fall back to the seeded state.
      }
      loaded = true;
    })();
  }
  await loading;
}

function delay(): Promise<void> {
  if (latencyMs <= 0) return Promise.resolve();
  return new Promise((resolve) => window.setTimeout(resolve, latencyMs));
}

async function respond<T>(work: () => T | Promise<T>): Promise<T> {
  await ensureLoaded();
  await delay();
  if (mockFailuresEnabled()) {
    throw new Error('Mock request failed on purpose. Turn off mock failures in the demo panel.');
  }
  return work();
}

function uid(prefix: string): string {
  const value =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return `${prefix}-${value}`;
}

function variantFor(productId: string, variantId: string) {
  const product = products.find((entry) => entry.id === productId);
  const variant = product?.variants.find((entry) => entry.id === variantId);
  return { product, variant };
}

function available(productId: string, variantId: string): number {
  const { variant } = variantFor(productId, variantId);
  if (!variant) return 0;
  return Math.max(0, variant.quantity - variant.reservedQuantity);
}

function pruneExpiredBag(bag: Bag): Bag {
  const at = now();
  const lines = bag.lines.filter((line) => Date.parse(line.heldUntil) > at);
  if (lines.length === bag.lines.length) return bag;
  return {
    lines,
    reservedUntil: lines.length ? lines[0]?.heldUntil ?? null : null,
  };
}

function setBag(bag: Bag): Bag {
  state = { ...state, bag };
  persist();
  notify('bag', bag);
  return bag;
}

function orderTotal(lines: Order['lines']): number {
  return lines.reduce((sum, line) => sum + line.pricePaise * line.qty, 0);
}

function assertBagQuantity(line: BagLine, qty: number): void {
  const stock = available(line.productId, line.variantId);
  if (qty > stock) {
    throw new Error(`Only ${stock} left in that size and colour.`);
  }
}

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
    return respond(() => admins.map((admin) => ({ ...admin, permissions: [...admin.permissions] })));
  },

  async getBag() {
    return respond(() => {
      const pruned = pruneExpiredBag(state.bag);
      if (pruned !== state.bag) return setBag(pruned);
      return state.bag;
    });
  },

  async addToBag(input) {
    return respond(() => {
      const stock = available(input.productId, input.variantId);
      if (stock <= 0) throw new Error('That size and colour just went out of stock.');
      const { product } = variantFor(input.productId, input.variantId);
      if (!product) throw new Error('Unknown product.');

      const bag = pruneExpiredBag(state.bag);
      const existing = bag.lines.find(
        (line) =>
          line.productId === input.productId &&
          line.variantId === input.variantId &&
          line.tryAtDoor === input.tryAtDoor,
      );

      if (existing) {
        const qty = Math.min(stock, existing.qty + input.qty);
        assertBagQuantity(existing, qty);
        existing.qty = qty;
      } else {
        assertBagQuantity(
          { ...input, id: 'new', heldUntil: new Date(now() + HOLD_MS).toISOString() },
          input.qty,
        );
        bag.lines.push({
          ...input,
          id: uid('line'),
          heldUntil: new Date(now() + HOLD_MS).toISOString(),
        });
      }

      bag.reservedUntil = bag.lines[0]?.heldUntil ?? null;
      return setBag(bag);
    });
  },

  async updateBagLine(id, patch) {
    return respond(() => {
      const bag = pruneExpiredBag(state.bag);
      const line = bag.lines.find((entry) => entry.id === id);
      if (!line) throw new Error('That bag line no longer exists.');
      if (typeof patch.qty === 'number') {
        if (patch.qty < 1) throw new Error('Quantity must be at least one.');
        assertBagQuantity(line, patch.qty);
        line.qty = patch.qty;
      }
      if (typeof patch.tryAtDoor === 'boolean') line.tryAtDoor = patch.tryAtDoor;
      return setBag(bag);
    });
  },

  async removeBagLine(id) {
    return respond(() => {
      const bag = pruneExpiredBag(state.bag);
      const lines = bag.lines.filter((line) => line.id !== id);
      return setBag({
        lines,
        reservedUntil: lines[0]?.heldUntil ?? null,
      });
    });
  },

  async placeCheckout(input: PlaceCheckoutInput): Promise<PlaceCheckoutResult> {
    return respond(() => {
      const bag = pruneExpiredBag(state.bag);
      if (bag.lines.length === 0) throw new Error('Your bag is empty.');

      const buyer = buyers[0];
      if (!buyer) throw new Error('No buyer is seeded.');

      const byShop = new Map<string, BagLine[]>();
      for (const line of bag.lines) {
        const product = products.find((entry) => entry.id === line.productId);
        if (!product) throw new Error('A bag item is no longer listed.');
        const lines = byShop.get(product.shopId) ?? [];
        lines.push(line);
        byShop.set(product.shopId, lines);
      }

      const checkoutId = uid('checkout');
      const createdAt = new Date(now()).toISOString();
      const created: Order[] = [];

      for (const [shopId, lines] of byShop) {
        const shop = shops.find((entry) => entry.id === shopId);
        if (!shop) throw new Error('A shop in your bag is no longer available.');
        const kind: Order['kind'] = lines.some((line) => line.tryAtDoor)
          ? 'try_at_door'
          : 'standard';
        const total = orderTotal(
          lines.map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            qty: line.qty,
            pricePaise: variantFor(line.productId, line.variantId).variant?.pricePaise ?? 0,
            decision: null,
          })),
        );

        const codAllowed = canUseCod({
          isTryAtDoor: kind === 'try_at_door',
          completedPrepaidOrders: buyer.completedPrepaidOrders,
          completedOrders: buyer.completedOrders,
          amountPaise: total,
        });
        if (input.paymentMethod === 'cod' && !codAllowed) {
          throw new Error(
            kind === 'try_at_door'
              ? 'Try-at-door orders must be prepaid.'
              : 'Cash on delivery is not available for this order yet.',
          );
        }

        created.push({
          id: uid('order'),
          checkoutId,
          buyerId: buyer.id,
          shopId,
          kind,
          state: 'PLACED',
          lines: lines.map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            qty: line.qty,
            pricePaise: variantFor(line.productId, line.variantId).variant?.pricePaise ?? 0,
            decision: null,
          })),
          totalPaise: total,
          etaMin: shop.etaMin,
          paymentMethod: input.paymentMethod,
          createdAt,
          events: [],
        });
      }

      state = {
        bag: emptyBag(),
        orders: [...created, ...state.orders],
      };
      persist();
      notify('bag', state.bag);
      notify('orders', state.orders);
      return { checkoutId, orders: created };
    });
  },

  async listOrders() {
    return respond(() => [...state.orders]);
  },

  async getOrder(id) {
    return respond(() => state.orders.find((order) => order.id === id) ?? null);
  },

  subscribe(topic, callback) {
    const set_ = listeners.get(topic) ?? new Set<Listener>();
    set_.add(callback);
    listeners.set(topic, set_);
    return () => {
      set_.delete(callback);
      if (set_.size === 0) listeners.delete(topic);
    };
  },
};

/** Dev controls, used by the demo panel and tests. */
export function setMockFailures(enabled: boolean): void {
  try {
    window.localStorage.setItem(FAILURE_KEY, enabled ? '1' : '0');
  } catch {
    // The in-memory flag below is enough when storage is unavailable.
  }
  failureOverride = enabled;
}

let failureOverride: boolean | null = null;

export function mockFailuresEnabled(): boolean {
  if (failureOverride !== null) return failureOverride;
  try {
    return window.localStorage.getItem(FAILURE_KEY) === '1';
  } catch {
    return false;
  }
}

export function configureMock(options: { latencyMs?: number }): void {
  if (typeof options.latencyMs === 'number') latencyMs = options.latencyMs;
}

/** Clear persisted mock state and return to the seed. Used by tests and dev. */
export async function resetMockData(): Promise<void> {
  state = { bag: emptyBag(), orders: [] };
  loaded = true;
  try {
    await del(STORAGE_KEY);
  } catch {
    // Nothing persisted.
  }
  notify('bag', state.bag);
  notify('orders', state.orders);
}

/** Synchronous view for tests that need to inspect the seed without a call. */
export function seededProduct(id: string): Product | undefined {
  return products.find((product) => product.id === id);
}

export { addresses };
