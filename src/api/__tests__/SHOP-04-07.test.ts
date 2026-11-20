import type { OrderActor } from '@/domain/orderMachine';
import type { FakeClock } from '@/lib/clock';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/api/client';
import { MOCK_PICKUP_OTP } from '@/api/mockFlow';
import { orderAt, setupFlow, teardownFlow } from '@/test/flowFixtures';

const SHOP: OrderActor = { id: 'shop-kiran', role: 'shop' };
let clock: FakeClock;

beforeEach(async () => {
  clock = await setupFlow();
});

afterEach(() => {
  teardownFlow();
});

describe('SHOP-04 counter sales and stock conflicts', () => {
  it('records a conflict on a committed unit and never oversells', async () => {
    await api.addToBag({
      productId: 'prod-kurta-set',
      variantId: 'var-kurta-m',
      qty: 1,
      tryAtDoor: false,
    });
    const placed = await api.placeCheckout({ paymentMethod: 'upi', termsAccepted: true });
    const orderId = placed.orders[0]?.id;
    const before = (await api.getProduct('prod-kurta-set'))?.variants.find(
      (variant) => variant.id === 'var-kurta-m',
    );
    expect(before?.quantity).toBe(2);

    const result = await api.sellInShop('prod-kurta-set', 'var-kurta-m', 1);
    expect(result.conflict).not.toBeNull();
    expect(result.conflict?.orderId).toBe(orderId);

    const after = (await api.getProduct('prod-kurta-set'))?.variants.find(
      (variant) => variant.id === 'var-kurta-m',
    );
    expect(after?.quantity).toBe(before?.quantity);
    expect(after?.quantity).toBeGreaterThanOrEqual(0);
    expect(await api.listConflicts()).toHaveLength(1);

    const again = await api.sellInShop('prod-kurta-set', 'var-kurta-m', 1);
    expect(again.conflict).not.toBeNull();
    expect((await api.listConflicts())).toHaveLength(2);
  });

  it('releases a bag hold and clamps stock at zero for an uncommitted sale', async () => {
    await api.addToBag({
      productId: 'prod-georgette-saree',
      variantId: 'var-saree-free',
      qty: 1,
      tryAtDoor: false,
    });
    expect((await api.getBag()).lines).toHaveLength(1);

    const result = await api.sellInShop('prod-georgette-saree', 'var-saree-free', 99);
    expect(result.conflict).toBeNull();
    expect(result.releasedBagLines).toHaveLength(1);
    expect((await api.getBag()).lines).toHaveLength(0);
    expect((await api.getProduct('prod-georgette-saree'))?.stockLeft).toBe(0);
  });
});

describe('SHOP-06 acceptance timeout', () => {
  it('releases an unaccepted order after five minutes using the injected clock', async () => {
    await api.addToBag({
      productId: 'prod-kurta-set',
      variantId: 'var-kurta-m',
      qty: 1,
      tryAtDoor: true,
    });
    const placed = await api.placeCheckout({ paymentMethod: 'upi', termsAccepted: true });
    const order = placed.orders[0]!;
    expect(order.state).toBe('PLACED');
    expect(order.acceptsUntil).toBeDefined();

    clock.advance(5 * 60_000 + 1000);

    await expect(api.acceptOrder(order.id, SHOP)).rejects.toThrow(/acceptance window has closed/);
    const released = await api.releaseExpiredOrders();
    expect(released.map((entry) => entry.id)).toContain(order.id);

    const updated = await api.getOrder(order.id);
    expect(updated?.state).toBe('CANCELLED');
    expect(updated?.events.at(-1)?.note).toContain('acceptance window expired');
    expect(updated?.events.at(-1)?.actor.role).toBe('system');
  });
});

describe('SHOP-07 handover guards', () => {
  it('requires the rider code, a scanned item and a photo before pickup', async () => {
    const order = await orderAt('RIDER_ASSIGNED');
    const line = order.lines[0]!;

    await expect(
      api.handoverOrder(
        order.id,
        { pickupOtp: '0000', scanCode: line.variantId, photoId: 'photo-1' },
        SHOP,
      ),
    ).rejects.toThrow(/code did not match/);

    await expect(
      api.handoverOrder(
        order.id,
        { pickupOtp: MOCK_PICKUP_OTP, scanCode: 'not-in-order', photoId: 'photo-1' },
        SHOP,
      ),
    ).rejects.toThrow(/Scan an item/);

    await expect(
      api.handoverOrder(
        order.id,
        { pickupOtp: MOCK_PICKUP_OTP, scanCode: line.variantId, photoId: '' },
        SHOP,
      ),
    ).rejects.toThrow(/pickup photo/);

    const updated = await api.handoverOrder(
      order.id,
      { pickupOtp: MOCK_PICKUP_OTP, scanCode: line.variantId, photoId: 'photo-1' },
      SHOP,
    );
    expect(updated.state).toBe('IN_TRANSIT');
    expect(updated.events.find((event) => event.to === 'PICKED_UP')?.photoIds).toContain('photo-1');
  });
});
