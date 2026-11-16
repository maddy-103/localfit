import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { configureMock, resetMockData, mockApi } from './mock';
import { createFakeClock, resetClock, setClock } from '@/lib/clock';

const HOLD_MS = 10 * 60 * 1000;

const kurtaM = { productId: 'prod-kurta-set', variantId: 'var-kurta-m', qty: 1 };
const saree = { productId: 'prod-georgette-saree', variantId: 'var-saree-free', qty: 1 };
const anarkaliS = { productId: 'prod-anarkali', variantId: 'var-anarkali-s', qty: 1 };

beforeEach(async () => {
  await resetMockData();
  configureMock({ latencyMs: 0 });
  setClock(createFakeClock('2026-11-16T10:00:00.000Z'));
});

afterEach(() => {
  resetClock();
});

describe('mock checkout', () => {
  it('splits a bag with two shops into one order per shop', async () => {
    await mockApi.addToBag({ ...kurtaM, tryAtDoor: false });
    await mockApi.addToBag({ ...saree, tryAtDoor: false });

    const result = await mockApi.placeCheckout({ paymentMethod: 'upi' });

    expect(result.orders).toHaveLength(2);
    expect(new Set(result.orders.map((order) => order.shopId))).toEqual(
      new Set(['shop-kiran', 'shop-meera']),
    );
    expect(new Set(result.orders.map((order) => order.checkoutId))).toEqual(
      new Set([result.checkoutId]),
    );
    expect(result.orders.every((order) => order.state === 'PLACED')).toBe(true);

    const bag = await mockApi.getBag();
    expect(bag.lines).toHaveLength(0);
    expect(bag.reservedUntil).toBeNull();
  });

  it('keeps two lines from the same shop in a single order', async () => {
    await mockApi.addToBag({ ...kurtaM, tryAtDoor: false });
    await mockApi.addToBag({ productId: 'prod-kurta-set', variantId: 'var-kurta-l', qty: 1, tryAtDoor: false });

    const result = await mockApi.placeCheckout({ paymentMethod: 'upi' });

    expect(result.orders).toHaveLength(1);
    expect(result.orders[0]?.lines).toHaveLength(2);
  });

  it('marks only the shop with a try-at-door line as try_at_door', async () => {
    await mockApi.addToBag({ ...kurtaM, tryAtDoor: true });
    await mockApi.addToBag({ ...saree, tryAtDoor: false });

    const result = await mockApi.placeCheckout({ paymentMethod: 'upi' });
    const byShop = new Map(result.orders.map((order) => [order.shopId, order]));

    expect(byShop.get('shop-kiran')?.kind).toBe('try_at_door');
    expect(byShop.get('shop-meera')?.kind).toBe('standard');
  });

  it('rejects cash on delivery for a try-at-door order and keeps the bag', async () => {
    await mockApi.addToBag({ ...anarkaliS, tryAtDoor: true });

    await expect(mockApi.placeCheckout({ paymentMethod: 'cod' })).rejects.toThrow(
      /prepaid/i,
    );

    const bag = await mockApi.getBag();
    expect(bag.lines).toHaveLength(1);
  });

  it('allows cash on delivery for an eligible buyer on a standard order', async () => {
    await mockApi.addToBag({ ...kurtaM, tryAtDoor: false });

    const result = await mockApi.placeCheckout({ paymentMethod: 'cod' });

    expect(result.orders[0]?.paymentMethod).toBe('cod');
  });

  it('rejects checkout from an empty bag', async () => {
    await expect(mockApi.placeCheckout({ paymentMethod: 'upi' })).rejects.toThrow(
      /empty/i,
    );
  });
});

describe('bag holds', () => {
  it('holds a line for ten minutes and then makes it unavailable', async () => {
    const clock = createFakeClock('2026-11-16T10:00:00.000Z');
    setClock(clock);

    const bag = await mockApi.addToBag({ ...kurtaM, tryAtDoor: false });
    expect(bag.lines).toHaveLength(1);
    expect(bag.reservedUntil).toBe(new Date(clock.now() + HOLD_MS).toISOString());

    clock.advance(HOLD_MS - 1);
    expect((await mockApi.getBag()).lines).toHaveLength(1);

    clock.advance(1);
    const expired = await mockApi.getBag();
    expect(expired.lines).toHaveLength(0);
    expect(expired.reservedUntil).toBeNull();
  });

  it('removes a line when the buyer removes it', async () => {
    const bag = await mockApi.addToBag({ ...kurtaM, tryAtDoor: false });
    const lineId = bag.lines[0]?.id;
    expect(lineId).toBeTruthy();

    const after = await mockApi.removeBagLine(lineId!);
    expect(after.lines).toHaveLength(0);
  });

  it('refuses more units than the variant has in stock', async () => {
    await expect(
      mockApi.addToBag({
        productId: 'prod-kurta-set',
        variantId: 'var-kurta-l',
        qty: 2,
        tryAtDoor: false,
      }),
    ).rejects.toThrow(/only 1 left/i);
  });
});
