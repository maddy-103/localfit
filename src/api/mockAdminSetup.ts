/** Admin sign-in, staff, configuration and audit (mock). */
import { ADMIN_2FA_CODE } from '@/domain/admin';
import { can } from '@/domain/permissions';
import { nowIso } from '@/lib/clock';
import { getState, setState, uid } from './mockStore';
import { runAdminAction } from './mockAdminCore';
import type {
  AdminAccount,
  AdminActor,
  AdminConfig,
  AuditEntry,
  ConfigChange,
  CreateStaffInput,
  StaffMember,
} from './types';

function eligible(account: StaffMember): boolean {
  // AUTH-06: only accounts created by a super admin may sign in.
  return account.status === 'active' && Boolean(account.createdBy);
}

export function adminSsoAccounts(): AdminAccount[] {
  return getState()
    .staff.filter(eligible)
    .map(({ id, name, phone, adminRole, status, createdBy }) => ({
      id,
      name,
      phone,
      adminRole,
      status,
      createdBy,
    }));
}

export function adminSignIn(input: { accountId: string; code: string }): AdminAccount {
  const account = getState().staff.find((entry) => entry.id === input.accountId);
  if (!account || !eligible(account)) {
    throw new Error('This account cannot sign in. Only active accounts created by a super admin can.');
  }
  if (input.code.trim() !== ADMIN_2FA_CODE) throw new Error('Incorrect two-factor code.');
  return {
    id: account.id,
    name: account.name,
    phone: account.phone,
    adminRole: account.adminRole,
    status: account.status,
    createdBy: account.createdBy,
  };
}

export function adminListStaff(): StaffMember[] {
  return getState().staff.map((entry) => ({ ...entry }));
}

export function adminCreateStaff(input: CreateStaffInput): StaffMember {
  return runAdminAction(
    'staff.create',
    { actor: input.actor, reason: input.reason },
    () => ({ staffCount: getState().staff.length }),
    () => {
      const state = getState();
      const pending = input.adminRole === 'super_admin';
      const at = nowIso();
      const member: StaffMember = {
        id: uid('staff'),
        name: input.name.trim(),
        phone: input.phone.trim(),
        adminRole: input.adminRole,
        status: pending ? 'pending_approval' : 'active',
        createdBy: input.actor.id,
        createdAt: at,
        updatedAt: at,
      };
      setState({ ...state, staff: [...state.staff, member] });
      return { result: { ...member }, after: { staffId: member.id, status: member.status } };
    },
  );
}

/**
 * Resolved ambiguity 13: a second, different super admin must approve a new
 * super admin before the account becomes active.
 */
export function adminApproveStaff(id: string, actor: AdminActor): StaffMember {
  return runAdminAction(
    'staff.approve',
    { actor, reason: 'Approved by a second super admin' },
    () => {
      const member = getState().staff.find((entry) => entry.id === id);
      return { staffId: id, status: member?.status ?? 'missing', createdBy: member?.createdBy ?? '' };
    },
    () => {
      const state = getState();
      const member = state.staff.find((entry) => entry.id === id);
      if (!member) throw new Error('Staff account not found.');
      if (member.adminRole !== 'super_admin') throw new Error('Only super admin accounts need approval.');
      if (!can(actor.adminRole, 'staff:manage') || actor.adminRole !== 'super_admin') {
        throw new Error('Only a super admin can approve a super admin.');
      }
      if (actor.id === member.createdBy) {
        throw new Error('A different super admin must approve this account.');
      }
      const approved: StaffMember = {
        ...member,
        status: 'active',
        approvedBy: actor.id,
        updatedAt: nowIso(),
      };
      setState({
        ...state,
        staff: state.staff.map((entry) => (entry.id === id ? approved : entry)),
      });
      return { result: { ...approved }, after: { staffId: id, status: 'active' } };
    },
  );
}

export function adminRevokeStaff(id: string, input: { actor: AdminActor; reason: string }): StaffMember {
  return runAdminAction(
    'staff.revoke',
    input,
    () => ({ staffId: id, status: getState().staff.find((e) => e.id === id)?.status ?? 'missing' }),
    () => {
      const state = getState();
      const member = state.staff.find((entry) => entry.id === id);
      if (!member) throw new Error('Staff account not found.');
      const revoked: StaffMember = { ...member, status: 'revoked', updatedAt: nowIso() };
      setState({ ...state, staff: state.staff.map((entry) => (entry.id === id ? revoked : entry)) });
      return { result: { ...revoked }, after: { staffId: id, status: 'revoked' } };
    },
  );
}

export function adminGetConfig(): AdminConfig {
  return { ...getState().adminConfig };
}

export function adminUpdateConfig(
  patch: Partial<AdminConfig>,
  input: { actor: AdminActor; reason: string },
): AdminConfig {
  return runAdminAction(
    'config.update',
    input,
    () => ({ ...getState().adminConfig }) as unknown as Record<string, unknown>,
    () => {
      const state = getState();
      const next: AdminConfig = { ...state.adminConfig, ...patch };
      const change: ConfigChange = {
        id: uid('config'),
        actor: input.actor,
        reason: input.reason.trim(),
        timestamp: nowIso(),
        before: state.adminConfig,
        after: next,
      };
      setState({
        ...state,
        adminConfig: next,
        configHistory: [change, ...state.configHistory],
      });
      return { result: { ...next }, after: { ...next } as unknown as Record<string, unknown> };
    },
  );
}

export function adminListAudit(): AuditEntry[] {
  return getState().auditLog.map((entry) => ({ ...entry }));
}

export function adminListConfigHistory(): ConfigChange[] {
  return getState().configHistory.map((entry) => ({ ...entry }));
}
