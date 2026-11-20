import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/api/client';
import { orderAt, setupFlow, teardownFlow } from '@/test/flowFixtures';

const RIDER = { id: 'rider-arjun', role: 'rider' as const };

beforeEach(async () => {
  await setupFlow();
});

afterEach(() => {
  teardownFlow();
});

describe('RIDE-03 wrong handover code at the door', () => {
  it('logs three tries from the rider and opens support on the third', async () => {
    const arrived = await orderAt('ARRIVED');

    const first = await api.submitOtp(arrived.id, '0000', RIDER);
    const second = await api.submitOtp(arrived.id, '0000', RIDER);
    const third = await api.submitOtp(arrived.id, '0000', RIDER);

    expect([first.attempts, second.attempts, third.attempts]).toEqual([1, 2, 3]);
    expect([first.supportRequired, second.supportRequired, third.supportRequired]).toEqual([
      false,
      false,
      true,
    ]);
    expect(third.order.state).toBe('ARRIVED');

    const failures = third.order.events.filter((event) => event.action === 'otp_failed');
    const support = third.order.events.filter((event) => event.action === 'support_opened');
    expect(failures).toHaveLength(3);
    expect(support).toHaveLength(1);
    expect(new Set(failures.map((event) => event.id)).size).toBe(3);
    expect(failures.every((event) => event.actor.role === 'rider')).toBe(true);
    expect(support[0]?.actor.role).toBe('rider');
  });
});
