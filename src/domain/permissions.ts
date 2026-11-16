import type { AdminRole } from '@/api/types';

/**
 * Admin permissions. The API returns permissions on the session user; the
 * matrix here is the fallback used to check a role before a backend exists.
 * super_admin holds every permission.
 */
export const ADMIN_PERMISSIONS: Record<AdminRole, readonly string[]> = {
  support_agent: ['read:orders', 'read:buyers', 'support:sessions'],
  verifier: ['read:shops', 'approve:shops', 'read:riders'],
  finance: ['read:payouts', 'run:payouts', 'read:refunds', 'issue:refunds'],
  dispute_lead: ['read:disputes', 'resolve:disputes', 'issue:refunds', 'read:orders'],
  super_admin: ['*'],
};

export function normalizeAdminRole(value: string | undefined | null): AdminRole | null {
  if (!value) return null;
  return value in ADMIN_PERMISSIONS ? (value as AdminRole) : null;
}

export function can(
  adminRole: AdminRole | string | null | undefined,
  permission: string,
): boolean {
  const role = normalizeAdminRole(adminRole);
  if (!role) return false;
  const permissions = ADMIN_PERMISSIONS[role];
  return permissions.includes('*') || permissions.includes(permission);
}

/** Routes only a super admin may open (SPEC screen map). */
export const SUPER_ADMIN_ONLY_ROUTES = ['/admin/config', '/admin/staff'] as const;

/** Permissions required by each admin route; undefined means "any admin". */
export const ADMIN_ROUTE_PERMISSIONS: Record<string, string | undefined> = {
  '/admin': 'read:orders',
  '/admin/shops': 'read:shops',
  '/admin/orders': 'read:orders',
  '/admin/disputes': 'read:disputes',
  '/admin/refunds': 'read:refunds',
  '/admin/payouts': 'read:payouts',
  '/admin/riders': 'read:riders',
  '/admin/risk': 'read:buyers',
  '/admin/campaigns': 'read:orders',
  '/admin/config': '*',
  '/admin/staff': '*',
  '/admin/audit': 'read:orders',
};

export function canOpenAdminRoute(
  adminRole: string | null | undefined,
  pathname: string,
): boolean {
  const required = ADMIN_ROUTE_PERMISSIONS[pathname];
  if (!required) return can(adminRole, 'read:orders');
  return can(adminRole, required);
}
