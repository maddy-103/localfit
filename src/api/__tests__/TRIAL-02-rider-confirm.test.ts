import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/api/client';
import { orderAt, setupFlow, teardownFlow } from '@/test/flowFixtures';

const RIDER = { id: 'rider-arjun', role: 'rider' as const };
const PHOTO = 'photo-handover-mock';

beforeEach(async () => {
  await setupFlow();
});

afterEach(() => {
  teardownFlow();
});

describe('TRIAL-02 rider confirmation without a buyer response', () => {
  it('locks the unmarked items as returns and writes an auditable event', async () => {
    const active = await orderAt('TRIAL_ACTIVE');

    await expect(api.confirmRiderDecisions(active.id, RIDER)).rejects.toThrow(/photo/i);
    await api.recordHandoverPhoto(active.id, PHOTO, RIDER);
    const locked = await api.confirmRiderDecisions(
      active.id,
      RIDER,
      'Buyer did not respond; decisions confirmed by phone',
    );

    expect(locked.state).toBe('DECISIONS_LOCKED');
    expect(locked.handoverPhotoId).toBe(PHOTO);
    expect(locked.riderConfirmedAt).toBeTruthy();
    expect(locked.lines.every((line) => line.decision === 'return')).toBe(true);
    expect(
      locked.events.some(
        (event) =>
          event.action === 'rider_confirmed' &&
          event.actor.role === 'rider' &&
          event.note?.includes('by phone'),
      ),
    ).toBe(true);
    expect(locked.events.some((event) => event.action === 'decision_return')).toBe(true);
    expect(locked.payment.refundPaise).toBeGreaterThan(0);

    // Repeating the action is harmless and never writes a second confirmation.
    const again = await api.confirmRiderDecisions(active.id, RIDER);
    expect(again.state).toBe('DECISIONS_LOCKED');
    expect(again.events.filter((event) => event.action === 'rider_confirmed')).toHaveLength(1);
  });
});
