import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/api/client';
import { TRIAL_WINDOW_MS } from '@/domain/trial';
import type { FakeClock } from '@/lib/clock';
import { orderAt, setupFlow, teardownFlow } from '@/test/flowFixtures';

const BUYER = { id: 'buyer-ananya', role: 'buyer' as const };
let clock: FakeClock;

beforeEach(async () => {
  clock = await setupFlow();
});

afterEach(() => {
  teardownFlow();
});

describe('TRIAL-02 stored 15-minute window', () => {
  it('starts from the stored timestamp and defaults unmarked items to Return', async () => {
    const active = await orderAt('TRIAL_ACTIVE');
    expect(active.trialStartedAt).toBeTruthy();
    expect(active.trialEndsAt).toBeTruthy();
    expect(Date.parse(active.trialEndsAt!) - Date.parse(active.trialStartedAt!)).toBe(
      TRIAL_WINDOW_MS,
    );

    const reopened = await api.getOrder(active.id);
    expect(reopened?.trialEndsAt).toBe(active.trialEndsAt);

    clock.advance(TRIAL_WINDOW_MS);
    const locked = await api.lockTrial(active.id, BUYER, 'timer');

    expect(locked.state).toBe('DECISIONS_LOCKED');
    expect(locked.lines.every((line) => line.decision === 'return')).toBe(true);
    expect(locked.lockedAt).toBe(new Date(clock.now()).toISOString());
    expect(
      locked.events.some(
        (event) => event.action === 'decision_return' && event.note?.includes('Timer ended'),
      ),
    ).toBe(true);
  });
});
