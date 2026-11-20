/** One guarded entry point for every admin mutation (ADM-04, ADM-09, NFR-12). */
import { assertAdminAction, can, type AdminAction } from '@/domain/permissions';
import { requireReason } from '@/domain/admin';
import { nowIso } from '@/lib/clock';
import { getState, notifyAdminTopics, setState, uid } from './mockStore';
import type { AdminActionInput, AuditEntry } from './types';

type Snapshot = Record<string, unknown>;

export interface AdminChange<T> {
  result: T;
  after: Snapshot;
  before?: Snapshot;
}

/**
 * Checks the role, requires a reason, runs the change and appends an audit
 * entry with before/after values. Nothing bypasses this helper.
 */
export function runAdminAction<T>(
  action: AdminAction,
  input: AdminActionInput,
  before: () => Snapshot,
  change: () => AdminChange<T>,
): T {
  assertAdminAction(input.actor.adminRole, action);
  const reason = requireReason(input.reason);
  const previous = before();
  const { result, after } = change();

  const entry: AuditEntry = {
    id: uid('audit'),
    action,
    actor: { ...input.actor },
    timestamp: nowIso(),
    reason,
    before: previous,
    after,
  };
  const state = getState();
  setState({ ...state, auditLog: [entry, ...state.auditLog] });
  notifyAdminTopics();
  return result;
}

/** Read-only helpers still need a role check, but never write audit. */
export function requireAdminView(role: string | null | undefined, permission: string): void {
  if (!can(role, permission)) throw new Error('Your role cannot view this data.');
}
