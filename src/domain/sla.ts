/**
 * Business timers and deadlines. Pure by design: callers pass the clock time
 * so tests can inject createFakeClock(). Defaults follow AGENTS.md ambiguities
 * 3 (shop accept), 6 (waiting compensation) and the SPEC 24 h dispute SLA.
 */

export const SHOP_ACCEPT_MS = 5 * 60_000;
export const WAITING_COMPENSATION_MS = 10 * 60_000;
export const DISPUTE_SLA_MS = 24 * 60 * 60_000;
export const LATE_NIGHT_HOUR = 21;

export interface Deadline {
  endsAt: string;
  remainingMs: number;
  expired: boolean;
}

/** Deadline for a shop to accept a PLACED order. */
export function acceptDeadline(
  placedAtIso: string,
  atMs: number,
  timeoutMs: number = SHOP_ACCEPT_MS,
): Deadline {
  const ends = Date.parse(placedAtIso) + timeoutMs;
  return {
    endsAt: new Date(ends).toISOString(),
    remainingMs: Math.max(0, ends - atMs),
    expired: atMs >= ends,
  };
}

export function acceptWindowExpired(
  placedAtIso: string,
  atMs: number,
  timeoutMs: number = SHOP_ACCEPT_MS,
): boolean {
  return acceptDeadline(placedAtIso, atMs, timeoutMs).expired;
}

/** Rider waiting compensation starts after the configured threshold. */
export function waitingCompensationDue(
  waitStartedAtIso: string,
  atMs: number,
  thresholdMs: number = WAITING_COMPENSATION_MS,
): boolean {
  return atMs - Date.parse(waitStartedAtIso) >= thresholdMs;
}

/** SPEC 13: an undecided dispute is escalated after 24 hours. */
export function disputeDeadline(openedAtIso: string): string {
  return new Date(Date.parse(openedAtIso) + DISPUTE_SLA_MS).toISOString();
}

export function disputeOverdue(openedAtIso: string, atMs: number): boolean {
  return atMs >= Date.parse(disputeDeadline(openedAtIso));
}

/** Late-night safe-zone guidance starts after 21:00 local time. */
export function isLateNight(atMs: number, hour: number = LATE_NIGHT_HOUR): boolean {
  return new Date(atMs).getHours() >= hour;
}
