import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/api/client';
import { configureMock, resetMockData } from '@/api/mock';
import type { AdminActor } from '@/api/types';
import { createFakeClock, resetClock, setClock, type FakeClock } from '@/lib/clock';

const FINANCE: AdminActor = { id: 'admin-suresh', name: 'Suresh Pillai', adminRole: 'finance' };
const LEAD: AdminActor = { id: 'admin-farah', name: 'Farah Khan', adminRole: 'dispute_lead' };

let clock: FakeClock;

beforeEach(() => {
  configureMock({ latencyMs: 0 });
  resetMockData();
  // dispute-2 opened 07:30 on 16 Nov; dispute-1 at 09:00. At 08:59 next day
  // only dispute-2 has crossed the 24 h SLA.
  clock = createFakeClock('2026-11-17T08:59:00.000Z');
  setClock(clock);
});

afterEach(() => resetClock());

describe('ADM-03 dispute SLA', () => {
  it('escalates only cases older than 24 hours with the fake clock', async () => {
    const before = await api.adminListDisputes();
    expect(before.filter((caseItem) => caseItem.status === 'escalated').map((c) => c.id)).toEqual([
      'dispute-2',
    ]);
    expect(before.find((c) => c.id === 'dispute-2')?.escalatedTo).toBe('Senior admin');

    clock.advance(2 * 60_000);
    const after = await api.adminListDisputes();
    expect(after.filter((caseItem) => caseItem.status === 'escalated')).toHaveLength(2);

    const audit = await api.adminListAudit();
    const escalations = audit.filter((entry) => entry.action === 'dispute.escalate');
    expect(escalations).toHaveLength(2);
    expect(escalations.every((entry) => entry.reason === '24 hour dispute SLA breached')).toBe(true);
  });

  it('does not re-escalate a case that was already escalated', async () => {
    await api.adminListDisputes();
    clock.advance(24 * 60 * 60_000);
    await api.adminListDisputes();
    const audit = await api.adminListAudit();
    expect(audit.filter((entry) => entry.action === 'dispute.escalate')).toHaveLength(2);
  });

  it('withholds photos, GPS, OTP logs and history from finance (NFR-10)', async () => {
    const restricted = await api.adminGetDispute('dispute-1', FINANCE);
    expect(restricted).not.toBeNull();
    expect(restricted?.evidence).toBeUndefined();

    const full = await api.adminGetDispute('dispute-1', LEAD);
    expect(full?.evidence?.photos).toHaveLength(1);
    expect(full?.evidence?.gps).toEqual({ lat: 12.9784, lng: 77.6408 });
    expect(full?.evidence?.otpAttempts).toBe(1);
    expect(full?.evidence?.checkedAt).toBeTruthy();
  });
});
