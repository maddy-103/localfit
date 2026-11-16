import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAppStore } from '@/store/appStore';
import type { UserRole } from '@/store/appStore';
import { can } from '@/domain/permissions';

type Props = {
  children: ReactNode;
  requiredRole?: UserRole | readonly UserRole[];
  requiresAuth?: boolean;
  /** Extra admin permission, e.g. "read:payouts" (ADM-09). */
  adminPermission?: string;
};

/**
 * Route-level guard. Guests can open buyer routes; checkout and every console
 * require a session. A signed-in user with the wrong role sees the access
 * denied screen instead of a redirect loop.
 */
export function RoleGuard({
  children,
  requiredRole,
  requiresAuth = false,
  adminPermission,
}: Props) {
  const session = useAppStore((state) => state.session);
  const location = useLocation();

  if (!session && (requiresAuth || requiredRole)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!session || !allowed.includes(session.role)) {
      return <Navigate to="/forbidden" replace />;
    }
  }

  if (adminPermission && !can(session?.adminRole, adminPermission)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
}
