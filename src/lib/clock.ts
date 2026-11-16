/**
 * The only source of business time in the app.
 *
 * Components never call Date.now() or use setTimeout for business timers.
 * They read now() through this clock (usually via useNow). Tests install a
 * fake clock. The fast-forward helper exists only in development builds.
 */

export interface Clock {
  now(): number;
}

export const realClock: Clock = {
  now: () => Date.now(),
};

let currentClock: Clock = realClock;
let devOffsetMs = 0;

export function getClock(): Clock {
  return currentClock;
}

export function setClock(clock: Clock): void {
  currentClock = clock;
  devOffsetMs = 0;
}

export function resetClock(): void {
  currentClock = realClock;
  devOffsetMs = 0;
}

/** Current time as epoch milliseconds. */
export function now(): number {
  return currentClock.now() + devOffsetMs;
}

/** Current time as an ISO 8601 string. */
export function nowIso(): string {
  return new Date(now()).toISOString();
}

export interface FakeClock extends Clock {
  advance(ms: number): void;
  set(ms: number): void;
  readonly start: number;
}

/** A controllable clock for unit tests. */
export function createFakeClock(start: number | string = '2026-11-16T10:00:00.000Z'): FakeClock {
  const startMs = typeof start === 'number' ? start : Date.parse(start);
  let value = startMs;

  return {
    start: startMs,
    now: () => value,
    advance: (ms: number) => {
      value += ms;
    },
    set: (ms: number) => {
      value = ms;
    },
  };
}

/**
 * Dev-only fast-forward. Moves the installed clock forward, or applies an
 * offset to the real clock. Production builds do nothing.
 */
export function devFastForward(ms: number): void {
  if (!import.meta.env.DEV) return;

  const clock = currentClock as Clock & { advance?: (amount: number) => void };
  if (typeof clock.advance === 'function') {
    clock.advance(ms);
    return;
  }
  devOffsetMs += ms;
}

export function devClockOffset(): number {
  return devOffsetMs;
}

export function devResetClock(): void {
  if (!import.meta.env.DEV) return;
  devOffsetMs = 0;
}
