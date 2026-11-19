import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/api/client';
import { devAdvanceOrder } from '@/api/dev';
import type { Order } from '@/api/types';
import type { FakeClock } from '@/lib/clock';
import { setupFlow, teardownFlow } from '@/test/flowFixtures';

const BUYER = { id: 'buyer-ananya', role: 'buyer' as const };
let clock: FakeClock;

async function twoLineOrder(): Promise<Order> {
  await api.addToBag({ productId: 'prod-kurta-set', variantId: 'var-kurta-m', qty: 1, tryAtDoor: true });
  await api.addToBag({ productId: 'prod-kurta-set', variantId: 'var-kurta-l', qty: 1, tryAtDoor: true });
  const placed = await api.placeCheckout({ paymentMethod: 'upi' });
  let order = placed.orders[0]!;
  for (let step = 0; step < 20 && order.state !== 'TRIAL_ACTIVE'; step += 1) {
    order = devAdvanceOrder(order.id);
  }
  return order;
}

beforeEach(async () => {
  clock = await setupFlow();
});

afterEach(() => {
  teardownFlow();
});

describe('TRIAL-03 timestamped decision events', () => {
  it('writes a separate event for every keep and return, without locking early', async () => {
    const active = await twoLineOrder();
    const [first, second] = active.lines;
    expect(first && second).toBeTruthy();

    const kept = await api.setTrialDecision(active.id, first!.id, 'keep', BUYER);
    clock.advance(1000);
    const returned = await api.setTrialDecision(active.id, second!.id, 'return', BUYER);

    const keepEvent = returned.events.find((event) => event.action === 'decision_keep');
    const returnEvent = returned.events.find((event) => event.action === 'decision_return');
    expect(keepEvent?.lineId).toBe(first!.id);
    expect(returnEvent?.lineId).toBe(second!.id);
    expect(keepEvent?.id).not.toBe(returnEvent?.id);
    expect(keepEvent?.timestamp).not.toBe(returnEvent?.timestamp);
    expect(Number.isNaN(Date.parse(keepEvent!.timestamp))).toBe(false);
    expect(returnEvent?.actor).toEqual(BUYER);
    expect(returned.state).toBe('TRIAL_ACTIVE');

    expect(kept.lines.find((line) => line.id === first!.id)?.decision).toBe('keep');
    const locked = await api.lockTrial(active.id, BUYER, 'buyer');
    expect(locked.state).toBe('DECISIONS_LOCKED');
    expect(locked.lines.map((line) => line.decision)).toEqual(['keep', 'return']);
  });
});
