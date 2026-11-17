import { del, get, set } from 'idb-keyval';
import { now, nowIso } from '@/lib/clock';
import type { Bag, BagLine, Order, OrderLine, OrderRider, Product, Variant } from './types';
import { addresses, products, riders } from './seed';

export const HOLD_MS = 10 * 60 * 1000;
const STORAGE_KEY = 'lf:mock-state-v1';
const FAILURE_KEY = 'lf:mock-fail';
const CHANNEL = 'localfit-mock';

export interface MockState {
  bag: Bag;
  orders: Order[];
}

export const emptyBag = (): Bag => ({ lines: [], reservedUntil: null });

let state: MockState = { bag: emptyBag(), orders: [] };
let loaded = false;
let loading: Promise<void> | null = null;
let latencyMs = 180;
let failureOverride: boolean | null = null;

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

export function notify(topic: string, data: unknown): void {
  for (const listener of listeners.get(topic) ?? []) listener(data);
  channel?.postMessage({ topic, data });
}

export function subscribeInternal(topic: string, callback: Listener): () => void {
  const set_ = listeners.get(topic) ?? new Set<Listener>();
  set_.add(callback);
  listeners.set(topic, set_);
  return () => {
    set_.delete(callback);
    if (set_.size === 0) listeners.delete(topic);
  };
}

export function persist(): void {
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

export async function respond<T>(work: () => T | Promise<T>): Promise<T> {
  await ensureLoaded();
  await delay();
  if (mockFailuresEnabled()) {
    throw new Error('Mock request failed on purpose. Turn off mock failures in the demo panel.');
  }
  return work();
}

export function getState(): MockState {
  return state;
}

export function setState(next: MockState): void {
  state = next;
  persist();
}

export function updateOrder(next: Order): void {
  state = {
    ...state,
    orders: state.orders.map((order) => (order.id === next.id ? next : order)),
  };
  persist();
}

/** Saves an order, then publishes the decorated public shape on both topics. */
export function commitOrder(next: Order): Order {
  updateOrder(next);
  const publicOrder = decorateOrder(next);
  notify('orders', state.orders.map((order) => decorateOrder(order)));
  notify(`order:${next.id}`, publicOrder);
  return publicOrder;
}

export function uid(prefix: string): string {
  const value =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return `${prefix}-${value}`;
}

export function resetStore(): void {
  state = { bag: emptyBag(), orders: [] };
  loaded = true;
  try {
    void del(STORAGE_KEY).catch(() => {
      // Nothing persisted.
    });
  } catch {
    // IndexedDB is unavailable (tests, private mode); the state is in memory.
  }
  notify('bag', state.bag);
  notify('orders', state.orders);
}

export function setMockFailures(enabled: boolean): void {
  try {
    window.localStorage.setItem(FAILURE_KEY, enabled ? '1' : '0');
  } catch {
    // The in-memory flag below is enough when storage is unavailable.
  }
  failureOverride = enabled;
}

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

/* ------------------------------------------------------------------ */
/* Bag and stock helpers shared by the API and the flow module         */
/* ------------------------------------------------------------------ */

export function variantFor(
  productId: string,
  variantId: string,
): { product: Product | undefined; variant: Variant | undefined } {
  const product = products.find((entry) => entry.id === productId);
  const variant = product?.variants.find((entry) => entry.id === variantId);
  return { product, variant };
}

export function availableStock(productId: string, variantId: string): number {
  const { variant } = variantFor(productId, variantId);
  if (!variant) return 0;
  return Math.max(0, variant.quantity - variant.reservedQuantity);
}

export function pruneExpiredBag(bag: Bag): Bag {
  const at = now();
  const lines = bag.lines.filter((line) => Date.parse(line.heldUntil) > at);
  if (lines.length === bag.lines.length) return bag;
  return {
    lines,
    reservedUntil: lines.length ? lines[0]?.heldUntil ?? null : null,
  };
}

export function setBagState(bag: Bag): Bag {
  state = { ...state, bag };
  persist();
  notify('bag', bag);
  return bag;
}

export function orderLinesTotal(lines: OrderLine[]): number {
  return lines.reduce((sum, line) => sum + line.pricePaise * line.qty, 0);
}

export function bagLineOf(line: BagLine, decision: OrderLine['decision']): OrderLine {
  const { variant } = variantFor(line.productId, line.variantId);
  return {
    id: uid('oline'),
    productId: line.productId,
    variantId: line.variantId,
    qty: line.qty,
    pricePaise: variant?.pricePaise ?? 0,
    decision,
  };
}

/* ------------------------------------------------------------------ */
/* Tracking decoration                                                 */
/* ------------------------------------------------------------------ */

const PICKUP = { lat: 12.9784, lng: 77.6408 };
const DROP = addresses[0]
  ? { lat: addresses[0].lat, lng: addresses[0].lng }
  : { lat: 12.9719, lng: 77.6412 };

function riderFor(order: Order): OrderRider | undefined {
  if (!order.rider) return undefined;
  const seed = riders.find((rider) => rider.id === order.rider?.id);
  return seed
    ? { id: seed.id, name: seed.name, phone: seed.phone }
    : order.rider;
}

/**
 * 0 at pickup, 1 at the door. Derived from the PICKED_UP event and the shop's
 * ETA, so the marker keeps moving while the page polls (mock GPS).
 */
export function riderProgressFor(order: Order, atMs: number): number | undefined {
  if (!order.rider) return undefined;
  const homeStates = [
    'ARRIVED',
    'OTP_VERIFIED',
    'TRIAL_ACTIVE',
    'DECISIONS_LOCKED',
    'DELIVERED',
    'FAILED_DELIVERY',
  ];
  if (homeStates.includes(order.state)) return 1;
  if (order.state === 'RIDER_ASSIGNED' || order.state === 'PICKED_UP') return 0;
  if (order.state !== 'IN_TRANSIT') return undefined;

  const pickup = order.events.find((event) => event.to === 'PICKED_UP')?.timestamp;
  const startedAt = pickup ? Date.parse(pickup) : Date.parse(order.createdAt);
  const avgEtaMs = ((order.etaMin[0] + order.etaMin[1]) / 2) * 60_000;
  return Math.min(1, Math.max(0, (atMs - startedAt) / avgEtaMs));
}

export function etaEndsAtFor(order: Order, atMs: number): string {
  if (
    order.state === 'ARRIVED' ||
    order.state === 'OTP_VERIFIED' ||
    order.state === 'TRIAL_ACTIVE' ||
    order.state === 'DECISIONS_LOCKED' ||
    order.state === 'DELIVERED'
  ) {
    return new Date(atMs).toISOString();
  }
  const pickup = order.events.find((event) => event.to === 'PICKED_UP')?.timestamp;
  if (order.state === 'IN_TRANSIT' && pickup) {
    const avgEtaMs = ((order.etaMin[0] + order.etaMin[1]) / 2) * 60_000;
    return new Date(Date.parse(pickup) + avgEtaMs).toISOString();
  }
  return new Date(Date.parse(order.createdAt) + order.etaMin[1] * 60_000).toISOString();
}

/** Public order shape: hides the OTP until the rider has arrived. */
export function decorateOrder(order: Order): Order {
  const at = now();
  const rest: Order = { ...order };
  delete rest.otp;
  const progress = riderProgressFor(order, at);
  const rider = riderFor(order);

  const location =
    progress === undefined
      ? undefined
      : {
          lat: PICKUP.lat + (DROP.lat - PICKUP.lat) * progress,
          lng: PICKUP.lng + (DROP.lng - PICKUP.lng) * progress,
          updatedAt: nowIso(),
        };

  return {
    ...rest,
    lines: order.lines.map((line) => ({ ...line })),
    events: order.events.map((event) => ({
      ...event,
      actor: { ...event.actor },
      ...(event.gps ? { gps: { ...event.gps } } : {}),
      ...(event.photoIds ? { photoIds: [...event.photoIds] } : {}),
    })),
    swapRequests: order.swapRequests.map((swap) => ({ ...swap })),
    payment: { ...order.payment },
    ...(rider ? { rider } : {}),
    ...(location ? { riderLocation: location } : {}),
    ...(progress !== undefined ? { riderProgress: progress } : {}),
    etaEndsAt: etaEndsAtFor(order, at),
    ...(order.state === 'ARRIVED' && order.otp ? { handoverOtp: order.otp } : {}),
  };
}
