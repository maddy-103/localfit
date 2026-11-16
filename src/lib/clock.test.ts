import { afterEach, describe, expect, it } from 'vitest';
import {
  createFakeClock,
  devFastForward,
  devResetClock,
  now,
  nowIso,
  resetClock,
  setClock,
} from './clock';

afterEach(() => resetClock());

describe('clock', () => {
  it('reads from the installed fake clock', () => {
    const clock = createFakeClock('2026-11-16T10:00:00.000Z');
    setClock(clock);

    expect(now()).toBe(Date.parse('2026-11-16T10:00:00.000Z'));
    clock.advance(90_000);
    expect(now()).toBe(Date.parse('2026-11-16T10:01:30.000Z'));
    expect(nowIso()).toBe('2026-11-16T10:01:30.000Z');
  });

  it('fast-forwards a fake clock in development', () => {
    const clock = createFakeClock('2026-11-16T10:00:00.000Z');
    setClock(clock);
    const before = now();

    devFastForward(15 * 60_000);

    expect(now() - before).toBe(15 * 60_000);
    devResetClock();
    expect(now()).toBe(before + 15 * 60_000);
  });

  it('applies an offset to the real clock after a fast-forward', () => {
    const before = now();
    devFastForward(60_000);
    const after = now();

    expect(after - before).toBeGreaterThanOrEqual(60_000);
    devResetClock();
    expect(now()).toBeLessThan(after + 1);
  });
});
