/**
 * Pure admin helpers: SLA maths, reason rules, evidence redaction and CSV.
 * No React, no clock side effects and no API calls live here.
 */
import type {
  AdminConfig,
  AuditEntry,
  DisputeCase,
  Order,
} from '@/api/types';
import { DISPUTE_SLA_MS } from './sla';

/** Mock 2FA code, shown on the sign-in screen while VITE_API_MODE=mock. */
export const ADMIN_2FA_CODE = '246810';

export const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  serviceRadiusKm: 6,
  commissionBps: 0,
  trialWindowMs: 15 * 60 * 1000,
  reservationHoldMs: 10 * 60 * 1000,
  acceptTimeoutMs: 5 * 60 * 1000,
  compensationThresholdMs: 10 * 60 * 1000,
  codMinPrepaidOrders: 1,
  codCapPaise: 300_000,
  codCapUntilOrders: 3,
  codTryAtDoorAllowed: false,
};

export class ReasonRequiredError extends Error {
  constructor() {
    super('A reason is required for this action.');
    this.name = 'ReasonRequiredError';
  }
}

/** ADM-04/NFR-12: a blank reason is never accepted for an admin action. */
export function requireReason(reason: string | undefined | null): string {
  const value = (reason ?? '').trim();
  if (!value) throw new ReasonRequiredError();
  return value;
}

export interface DisputeSla {
  dueAt: string;
  remainingMs: number;
  breached: boolean;
}

export function disputeSla(openedAtIso: string, atMs: number): DisputeSla {
  const openedAt = Date.parse(openedAtIso);
  const dueAt = new Date(openedAt + DISPUTE_SLA_MS).toISOString();
  const remainingMs = openedAt + DISPUTE_SLA_MS - atMs;
  return { dueAt, remainingMs, breached: remainingMs <= 0 };
}

/**
 * SPEC section 13: a case with no decision after 24 h is escalated to a senior
 * admin. Pure so the fake clock can drive the test; the mock API commits it.
 */
export function escalatedDisputeIds(disputes: DisputeCase[], atMs: number): string[] {
  return disputes
    .filter(
      (dispute) =>
        dispute.status === 'open' && disputeSla(dispute.openedAt, atMs).breached,
    )
    .map((dispute) => dispute.id);
}

/**
 * NFR-10: finance may read a case but never its photos, GPS, OTP log or event
 * history. The redacted object is what the API returns without evidence:view.
 */
export function redactDispute(dispute: DisputeCase): DisputeCase {
  const safe: DisputeCase = { ...dispute };
  delete safe.evidence;
  return safe;
}

export function riskBand(score: number): 'low' | 'medium' | 'high' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/** Orders past their promised ETA, used by the live dashboard (ADM-01). */
export function lateOrders(orders: Order[], atMs: number): Order[] {
  return orders.filter((order) => {
    if (['DELIVERED', 'CANCELLED', 'RETURN_RECEIVED'].includes(order.state)) return false;
    if (!order.etaEndsAt) return false;
    return Date.parse(order.etaEndsAt) < atMs;
  });
}

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

/** One CSV writer for audit and finance exports. */
export function csvFromRows(headers: readonly string[], rows: readonly unknown[][]): string {
  return [headers.map(csvCell).join(','), ...rows.map((row) => row.map(csvCell).join(','))].join(
    '\r\n',
  );
}

export function auditCsv(entries: AuditEntry[]): string {
  return csvFromRows(
    ['id', 'action', 'actor_id', 'actor_role', 'timestamp', 'reason', 'before', 'after'],
    entries.map((entry) => [
      entry.id,
      entry.action,
      entry.actor.id,
      entry.actor.adminRole,
      entry.timestamp,
      entry.reason,
      JSON.stringify(entry.before ?? {}),
      JSON.stringify(entry.after ?? {}),
    ]),
  );
}

export function downloadCsv(filename: string, csv: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
