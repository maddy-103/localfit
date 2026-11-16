import { describe, expect, it } from 'vitest';
import {
  ADMIN_PERMISSIONS,
  can,
  canOpenAdminRoute,
  normalizeAdminRole,
} from './permissions';
import type { AdminRole } from '@/api/types';

const ROLES = Object.keys(ADMIN_PERMISSIONS) as AdminRole[];

describe('admin permissions', () => {
  it('gives every role its permissions and super admin a wildcard', () => {
    for (const role of ROLES) {
      expect(ADMIN_PERMISSIONS[role].length).toBeGreaterThan(0);
    }
    expect(ADMIN_PERMISSIONS.super_admin).toEqual(['*']);
  });

  it('checks individual permissions', () => {
    expect(can('verifier', 'approve:shops')).toBe(true);
    expect(can('verifier', 'issue:refunds')).toBe(false);
    expect(can('finance', 'issue:refunds')).toBe(true);
    expect(can('super_admin', 'anything:at:all')).toBe(true);
    expect(can(undefined, 'read:orders')).toBe(false);
  });

  it('normalises unknown admin roles to null', () => {
    expect(normalizeAdminRole('finance')).toBe('finance');
    expect(normalizeAdminRole('owner')).toBeNull();
    expect(normalizeAdminRole(null)).toBeNull();
  });

  it('allows super admin into every screen and filters others by route', () => {
    expect(canOpenAdminRoute('super_admin', '/admin/config')).toBe(true);
    expect(canOpenAdminRoute('super_admin', '/admin/staff')).toBe(true);
    expect(canOpenAdminRoute('support_agent', '/admin/config')).toBe(false);
    expect(canOpenAdminRoute('support_agent', '/admin/orders')).toBe(true);
    expect(canOpenAdminRoute('support_agent', '/admin/payouts')).toBe(false);
  });
});
