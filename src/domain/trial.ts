export type TrialDecision = 'keep' | 'return' | 'pending';

export function defaultDecision(): TrialDecision {
  return 'return';
}

export function lockDecisions<T extends { decision: TrialDecision }>(items: T[]): T[] {
  return items.map((i) => (i.decision === 'pending' ? { ...i, decision: 'return' } : i));
}

export function summarizeDecisions(items: { decision: TrialDecision }[]) {
  let keep = 0;
  let ret = 0;
  for (const i of items) {
    if (i.decision === 'keep') keep++;
    else ret++;
  }
  return { keep, return: ret };
}
