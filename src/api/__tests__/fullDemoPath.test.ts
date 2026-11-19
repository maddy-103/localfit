import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/api/client';
import { devRunToDelivered } from '@/api/dev';
import { orderAt, setupFlow, teardownFlow } from '@/test/flowFixtures';

const BUYER = { id: 'buyer-ananya', role: 'buyer' as const };

beforeEach(async () => {
  await setupFlow();
});

afterEach(() => {
  teardownFlow();
});

describe('full demo path', () => {
  it('walks a try-at-door order from placement to a requested return', async () => {
    const arrived = await orderAt('ARRIVED');
    expect(arrived.state).toBe('ARRIVED');

    const wrong = await api.submitOtp(arrived.id, '0000', BUYER);
    expect(wrong.ok).toBe(false);
    expect(wrong.attempts).toBe(1);
    expect(wrong.supportRequired).toBe(false);

    const verified = await api.submitOtp(arrived.id, arrived.otp ?? '4821', BUYER);
    expect(verified.ok).toBe(true);
    expect(verified.order.state).toBe('TRIAL_ACTIVE');
    expect(verified.order.trialStartedAt).toBeTruthy();
    expect(verified.order.trialEndsAt).toBeTruthy();

    const line = verified.order.lines[0];
    expect(line).toBeDefined();
    const decided = await api.setTrialDecision(verified.order.id, line!.id, 'keep', BUYER);
    expect(decided.lines[0]?.decision).toBe('keep');
    expect(decided.events.some((event) => event.action === 'decision_keep')).toBe(true);

    const locked = await api.lockTrial(decided.id, BUYER, 'buyer');
    expect(locked.state).toBe('DECISIONS_LOCKED');
    expect(locked.lockedAt).toBeTruthy();
    expect(locked.payment.capturedPaise).toBeGreaterThan(0);
    expect(locked.payment.refundPaise).toBe(0);
    expect(locked.events.some((event) => event.to === 'DECISIONS_LOCKED')).toBe(true);

    const delivered = devRunToDelivered(locked.id);
    expect(delivered.state).toBe('DELIVERED');

    const returned = await api.requestReturn(
      delivered.id,
      {
        reason: 'Fit was not right',
        note: 'Kurta was tight across the shoulders.',
        photoIds: ['mock-return-photo-1'],
        pickupSlot: 'Tomorrow, 10:00-12:00',
      },
      BUYER,
    );

    expect(returned.state).toBe('RETURN_REQUESTED');
    expect(returned.returnRequest).toMatchObject({
      reason: 'Fit was not right',
      photoIds: ['mock-return-photo-1'],
      pickupSlot: 'Tomorrow, 10:00-12:00',
    });
    expect(returned.events.some((event) => event.to === 'RETURN_REQUESTED')).toBe(true);

    const visited = new Set(returned.events.flatMap((event) => [event.from, event.to]));
    for (const state of [
      'PLACED',
      'SHOP_ACCEPTED',
      'PACKED',
      'RIDER_ASSIGNED',
      'PICKED_UP',
      'IN_TRANSIT',
      'ARRIVED',
      'OTP_VERIFIED',
      'TRIAL_ACTIVE',
      'DECISIONS_LOCKED',
      'DELIVERED',
      'RETURN_REQUESTED',
    ] as const) {
      expect(visited.has(state), `missing ${state}`).toBe(true);
    }
  });
});
