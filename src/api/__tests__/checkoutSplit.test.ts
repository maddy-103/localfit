import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/api/client';
import { setupFlow, teardownFlow } from '@/test/flowFixtures';

beforeEach(async () => {
  await setupFlow();
});

afterEach(() => {
  teardownFlow();
});

describe('checkout split (resolved ambiguity 9)', () => {
  it('links both shop orders to one checkout and one shared payment authorisation', async () => {
    await api.addToBag({ productId: 'prod-kurta-set', variantId: 'var-kurta-m', qty: 1, tryAtDoor: true });
    await api.addToBag({ productId: 'prod-georgette-saree', variantId: 'var-saree-free', qty: 1, tryAtDoor: false });

    const result = await api.placeCheckout({ paymentMethod: 'upi', termsAccepted: true });

    expect(result.orders).toHaveLength(2);
    expect(new Set(result.orders.map((order) => order.checkoutId))).toEqual(new Set([result.checkoutId]));
    expect(new Set(result.orders.map((order) => order.shopId))).toEqual(
      new Set(['shop-kiran', 'shop-meera']),
    );
    expect(new Set(result.orders.map((order) => order.payment.method))).toEqual(new Set(['upi']));
    expect(result.orders.every((order) => order.payment.mode === 'charge')).toBe(true);
    expect(
      result.orders.every((order) => order.payment.reference.startsWith(
        result.orders[0]!.payment.reference.split(':')[0]!,
      )),
    ).toBe(true);

    const checkout = await api.getCheckout();
    expect(checkout.groups).toHaveLength(0);
    expect((await api.getBag()).lines).toHaveLength(0);
  });

  it('gives each shop its own ETA and settlement record', async () => {
    await api.addToBag({ productId: 'prod-kurta-set', variantId: 'var-kurta-m', qty: 1, tryAtDoor: true });
    await api.addToBag({ productId: 'prod-georgette-saree', variantId: 'var-saree-free', qty: 1, tryAtDoor: false });

    const result = await api.placeCheckout({ paymentMethod: 'card', termsAccepted: true });
    const [tryOrder, standardOrder] = [
      result.orders.find((order) => order.kind === 'try_at_door'),
      result.orders.find((order) => order.kind === 'standard'),
    ];

    expect(tryOrder?.etaMin).toEqual([45, 60]);
    expect(standardOrder?.etaMin).not.toEqual(tryOrder?.etaMin);
    expect(tryOrder?.lines[0]?.decision).toBe('pending');
    expect(standardOrder?.lines[0]?.decision).toBeNull();
    expect(tryOrder?.payment.mode).toBe('hold');
    expect(standardOrder?.payment.mode).toBe('hold');
  });
});
