import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/api/client';
import { orderAt, setupFlow, teardownFlow } from '@/test/flowFixtures';

const BUYER = { id: 'buyer-ananya', role: 'buyer' as const };

beforeEach(async () => {
  await setupFlow();
});

afterEach(() => {
  teardownFlow();
});

describe('SPEC 13 wrong handover code', () => {
  it('logs each wrong code and opens the support path on the third attempt', async () => {
    const arrived = await orderAt('ARRIVED');

    const first = await api.submitOtp(arrived.id, '0000', BUYER);
    const second = await api.submitOtp(arrived.id, '0000', BUYER);
    const third = await api.submitOtp(arrived.id, '0000', BUYER);

    expect([first.attempts, second.attempts, third.attempts]).toEqual([1, 2, 3]);
    expect(first.supportRequired).toBe(false);
    expect(second.supportRequired).toBe(false);
    expect(third.supportRequired).toBe(true);
    expect(third.order.state).toBe('ARRIVED');

    const failures = third.order.events.filter((event) => event.action === 'otp_failed');
    const support = third.order.events.filter((event) => event.action === 'support_opened');
    expect(failures).toHaveLength(3);
    expect(support).toHaveLength(1);
    expect(new Set(failures.map((event) => event.id)).size).toBe(3);
    expect(failures.every((event) => event.actor.role === 'buyer')).toBe(true);
  });

  it('accepts the correct code after wrong attempts and starts the trial', async () => {
    const arrived = await orderAt('ARRIVED');
    await api.submitOtp(arrived.id, '0000', BUYER);
    await api.submitOtp(arrived.id, '0000', BUYER);

    const result = await api.submitOtp(arrived.id, arrived.otp ?? '4821', BUYER);

    expect(result.ok).toBe(true);
    expect(result.order.state).toBe('TRIAL_ACTIVE');
    expect(result.order.trialStartedAt).toBeTruthy();
    expect(result.order.events.some((event) => event.to === 'OTP_VERIFIED')).toBe(true);
    expect(result.order.events.some((event) => event.to === 'TRIAL_ACTIVE')).toBe(true);
  });
});
