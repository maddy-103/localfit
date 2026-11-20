import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/api/client';
import { setupFlow, teardownFlow } from '@/test/flowFixtures';

beforeEach(async () => {
  await setupFlow();
});

afterEach(() => {
  teardownFlow();
});

describe('SPEC 13 stock conflict acceptance', () => {
  it('puts a counter sale against a committed unit in the admin queue and notifies buyers', async () => {
    await api.addToBag({
      productId: 'prod-kurta-set',
      variantId: 'var-kurta-m',
      qty: 1,
      tryAtDoor: false,
    });
    const placed = await api.placeCheckout({ paymentMethod: 'upi', termsAccepted: true });
    const orderId = placed.orders[0]!.id;

    const conflictListener = vi.fn();
    const unsubscribe = api.subscribe('conflicts', conflictListener);
    const before = (await api.getProduct('prod-kurta-set'))?.variants.find(
      (variant) => variant.id === 'var-kurta-m',
    );

    const result = await api.sellInShop('prod-kurta-set', 'var-kurta-m', 1);

    expect(result.conflict).toMatchObject({
      orderId,
      productId: 'prod-kurta-set',
      variantId: 'var-kurta-m',
      resolved: false,
    });
    expect(result.conflict?.note).toContain('LocalFit support will handle the buyer');
    expect((await api.listConflicts()).map((item) => item.id)).toContain(result.conflict!.id);
    expect(conflictListener).toHaveBeenCalledTimes(1);

    const after = (await api.getProduct('prod-kurta-set'))?.variants.find(
      (variant) => variant.id === 'var-kurta-m',
    );
    expect(after?.quantity).toBe(before?.quantity);
    unsubscribe();
  });
});
