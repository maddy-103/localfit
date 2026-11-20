import type { AdminRole } from '@/api/types';

/**
 * Admin access matrix (SPEC section 4, ADM-09, NFR-12).
 *
 * Every screen and every mutating action is checked against this single table.
 * The API returns permissions on the session user once a backend exists; until
 * then this matrix is the source of truth. super_admin holds every permission.
 */
export const ADMIN_PERMISSIONS_LIST = [
  'read:dashboard',
  'read:orders',
  'manage:orders',
  'read:buyers',
  'support:sessions',
  'read:shops',
  'verify:shops',
  'flag:products',
  'read:riders',
  'verify:riders',
  'manage:riders',
  'read:disputes',
  'resolve:disputes',
  'evidence:view',
  'read:refunds',
  'issue:refunds',
  'read:payouts',
  'run:payouts',
  'read:audit',
  'read:risk',
  'manage:risk',
  'config:manage',
  'staff:manage',
  '*',
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS_LIST)[number];

export const ADMIN_PERMISSIONS: Record<AdminRole, readonly AdminPermission[]> = {
  // Orders and buyers, read only; support chat. No money actions, no config.
  support_agent: ['read:dashboard', 'read:orders', 'read:buyers', 'support:sessions'],
  // Verification queues and authenticity flags. No money actions.
  verifier: [
    'read:dashboard',
    'read:shops',
    'verify:shops',
    'flag:products',
    'read:riders',
    'verify:riders',
    'manage:riders',
  ],
  // Money operations and audit, but never dispute photos or evidence.
  finance: [
    'read:dashboard',
    'read:refunds',
    'issue:refunds',
    'read:payouts',
    'run:payouts',
    'read:disputes',
    'read:audit',
  ],
  // Full dispute evidence and the refund/payout decisions that follow it.
  dispute_lead: [
    'read:dashboard',
    'read:orders',
    'manage:orders',
    'read:disputes',
    'resolve:disputes',
    'evidence:view',
    'read:refunds',
    'issue:refunds',
    'read:payouts',
    'run:payouts',
  ],
  super_admin: ['*'],
};

/** The permission needed for each mutating admin action. */
export const ADMIN_ACTION_PERMISSIONS = {
  'shop.approve': 'verify:shops',
  'shop.reject': 'verify:shops',
  'shop.suspend': 'verify:shops',
  'product.flag': 'flag:products',
  'order.reassign': 'manage:orders',
  'order.cancel': 'manage:orders',
  'order.override': 'manage:orders',
  'dispute.decide': 'resolve:disputes',
  'dispute.escalate': 'resolve:disputes',
  'refund.approve': 'issue:refunds',
  'refund.reject': 'issue:refunds',
  'payout.run': 'run:payouts',
  'payout.hold': 'run:payouts',
  'payout.reconcile': 'run:payouts',
  'rider.verify': 'verify:riders',
  'rider.penalize': 'manage:riders',
  'rider.zone': 'manage:riders',
  'risk.limit': 'manage:risk',
  'risk.block': 'manage:risk',
  'config.update': 'config:manage',
  'staff.create': 'staff:manage',
  'staff.approve': 'staff:manage',
  'staff.revoke': 'staff:manage',
} as const satisfies Record<string, AdminPermission>;

export type AdminAction = keyof typeof ADMIN_ACTION_PERMISSIONS;

export function normalizeAdminRole(value: string | undefined | null): AdminRole | null {
  if (!value) return null;
  return value in ADMIN_PERMISSIONS ? (value as AdminRole) : null;
}

export function can(
  adminRole: AdminRole | string | null | undefined,
  permission: AdminPermission | string,
): boolean {
  const role = normalizeAdminRole(adminRole);
  if (!role) return false;
  const permissions: readonly string[] = ADMIN_PERMISSIONS[role];
  return permissions.includes('*') || permissions.includes(permission);
}

export function canPerformAction(
  adminRole: AdminRole | string | null | undefined,
  action: AdminAction,
): boolean {
  return can(adminRole, ADMIN_ACTION_PERMISSIONS[action]);
}

export class AdminPermissionError extends Error {
  constructor(action: AdminAction) {
    super(`Your role cannot perform ${action}.`);
    this.name = 'AdminPermissionError';
  }
}

/** Used by every admin API mutation before it touches state or writes audit. */
export function assertAdminAction(
  adminRole: AdminRole | string | null | undefined,
  action: AdminAction,
): void {
  if (!canPerformAction(adminRole, action)) throw new AdminPermissionError(action);
}

/** Routes only a super admin may open (SPEC screen map). */
export const SUPER_ADMIN_ONLY_ROUTES = ['/admin/config', '/admin/staff'] as const;

/** Permissions required by each admin route; undefined means "any signed-in admin". */
export const ADMIN_ROUTE_PERMISSIONS: Record<string, AdminPermission> = {
  '/admin': 'read:dashboard',
  '/admin/shops': 'read:shops',
  '/admin/orders': 'read:orders',
  '/admin/orders/:id': 'read:orders',
  '/admin/disputes': 'read:disputes',
  '/admin/refunds': 'read:refunds',
  '/admin/payouts': 'read:payouts',
  '/admin/riders': 'read:riders',
  '/admin/risk': 'read:risk',
  '/admin/campaigns': 'read:dashboard',
  '/admin/config': 'config:manage',
  '/admin/staff': 'staff:manage',
  '/admin/audit': 'read:audit',
};

export function canOpenAdminRoute(
  adminRole: string | null | undefined,
  pathname: string,
): boolean {
  const required = ADMIN_ROUTE_PERMISSIONS[pathname] ?? 'read:dashboard';
  return can(adminRole, required);
}
