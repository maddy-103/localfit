/**
 * Trial window rules (TRIAL-01 to TRIAL-03).
 *
 * The window is derived from a stored start time, never from component state,
 * so closing and reopening the app shows the same remaining time (TRIAL-02).
 */

export type TrialDecision = 'keep' | 'return' | 'pending';

/** SPEC 8.2 and TRIAL-01: fifteen minutes by default. */
export const TRIAL_WINDOW_MS = 15 * 60 * 1000;
export const TRIAL_WINDOW_MINUTES = TRIAL_WINDOW_MS / 60_000;

/** Default outcome: unmarked items go back with the rider. */
export function defaultDecision(): TrialDecision {
  return 'return';
}

export function trialEndsAt(startIso: string, windowMs = TRIAL_WINDOW_MS): string {
  return new Date(Date.parse(startIso) + windowMs).toISOString();
}

export function trialRemainingMs(endsAtIso: string, atMs: number): number {
  return Math.max(0, Date.parse(endsAtIso) - atMs);
}

export function trialExpired(endsAtIso: string, atMs: number): boolean {
  return trialRemainingMs(endsAtIso, atMs) <= 0;
}

export function lockDecisions<T extends { decision: TrialDecision | null }>(items: T[]): T[] {
  return items.map((item) =>
    item.decision === 'pending' || item.decision === null
      ? { ...item, decision: defaultDecision() }
      : item,
  );
}

export function summarizeDecisions(items: { decision: TrialDecision | null }[]) {
  let keep = 0;
  let ret = 0;
  for (const item of items) {
    if (item.decision === 'keep') keep++;
    else ret++;
  }
  return { keep, return: ret };
}
