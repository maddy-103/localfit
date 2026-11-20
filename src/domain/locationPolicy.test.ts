import { describe, expect, it } from 'vitest';
import {
  PING_INTERVAL_MS,
  pingDecision,
  tripPhaseForOrderState,
} from './locationPolicy';

describe('RIDE-08 location batching by trip state', () => {
  const start = Date.parse('2026-11-16T10:00:00.000Z');

  it('idle sends no pings at any time', () => {
    expect(PING_INTERVAL_MS.idle).toBeNull();
    expect(pingDecision('idle', null, start).shouldPing).toBe(false);
    expect(pingDecision('idle', start, start + 60 * 60_000)).toEqual({
      phase: 'idle',
      intervalMs: null,
      shouldPing: false,
      nextInMs: null,
    });
  });

  it('assigned sends one ping every 60 seconds, never sooner', () => {
    const first = pingDecision('assigned', null, start);
    expect(first.shouldPing).toBe(true);
    expect(first.intervalMs).toBe(60_000);

    expect(pingDecision('assigned', start, start + 59_000).shouldPing).toBe(false);
    expect(pingDecision('assigned', start, start + 59_000).nextInMs).toBe(1_000);
    const due = pingDecision('assigned', start, start + 60_000);
    expect(due.shouldPing).toBe(true);
    // Once the 60 s ping is sent, the next one is not due until 120 s.
    expect(pingDecision('assigned', start + 60_000, start + 119_000).shouldPing).toBe(false);
    expect(pingDecision('assigned', start + 60_000, start + 120_000).shouldPing).toBe(true);
  });

  it('in transit sends one ping every 15 seconds', () => {
    expect(PING_INTERVAL_MS.in_transit).toBe(15_000);
    expect(pingDecision('in_transit', null, start).shouldPing).toBe(true);
    expect(pingDecision('in_transit', start, start + 14_999).shouldPing).toBe(false);
    expect(pingDecision('in_transit', start, start + 15_000).shouldPing).toBe(true);
    expect(pingDecision('in_transit', start, start + 30_000).shouldPing).toBe(true);
  });

  it('maps order states to the right phase', () => {
    expect(tripPhaseForOrderState('PLACED')).toBe('idle');
    expect(tripPhaseForOrderState('RIDER_ASSIGNED')).toBe('assigned');
    expect(tripPhaseForOrderState('PICKED_UP')).toBe('assigned');
    expect(tripPhaseForOrderState('IN_TRANSIT')).toBe('in_transit');
    expect(tripPhaseForOrderState('DELIVERED')).toBe('idle');
  });
});
