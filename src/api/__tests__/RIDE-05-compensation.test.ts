import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/api/client';
import { MOCK_PICKUP_OTP } from '@/api/mockFlow';
import { orderAt, setupFlow, teardownFlow } from '@/test/flowFixtures';
import type { FakeClock } from '@/lib/clock';

const RIDER = { id: 'rider-arjun', role: 'rider' as const };
const GPS = { lat: 12.9784, lng: 77.6408 };
const PICKUP = { pickupOtp: MOCK_PICKUP_OTP, scanCode: 'var-kurta-m', photoId: 'photo-pickup-mock' };

let clock: FakeClock;

beforeEach(async () => {
  clock = await setupFlow();
});

afterEach(() => {
  teardownFlow();
});

describe('RIDE-05 waiting compensation', () => {
  it('is threshold-gated and carries the timer evidence', async () => {
    const assigned = await orderAt('RIDER_ASSIGNED');
    await api.collectPickup(assigned.id, PICKUP, RIDER);
    await api.markArrived(assigned.id, RIDER, GPS);
    const config = await api.getRiderConfig();
    const session = await api.getWaitingSession(assigned.id);
    expect(session).toMatchObject({ claimed: false, gps: GPS });
    expect(config.waitingCompensationMs).toBeGreaterThan(0);

    await expect(api.claimCompensation(assigned.id, RIDER)).rejects.toThrow(/threshold/);
    clock.advance(config.waitingCompensationMs - 1000);
    await expect(api.claimCompensation(assigned.id, RIDER)).rejects.toThrow(/threshold/);

    clock.advance(1000);
    const claim = await api.claimCompensation(assigned.id, RIDER);

    expect(claim.status).toBe('pending');
    expect(claim.amountPaise).toBe(config.compensationPaise);
    expect(claim.evidence).toMatchObject({
      orderId: assigned.id,
      startedAt: session?.startedAt,
      thresholdMs: config.waitingCompensationMs,
      elapsedMs: config.waitingCompensationMs,
      due: true,
      gps: GPS,
      otpAttempts: 0,
    });
    expect(Date.parse(claim.evidence.checkedAt)).toBe(clock.now());
    expect((await api.getWaitingSession(assigned.id))?.claimed).toBe(true);

    const repeated = await api.claimCompensation(assigned.id, RIDER);
    expect(repeated.id).toBe(claim.id);
  });
});
