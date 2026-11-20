import { useMemo } from 'react';
import type { AdminActor } from '@/api/types';
import { canPerformAction, normalizeAdminRole, type AdminAction } from '@/domain/permissions';
import { useAppStore } from '@/store/appStore';

/** Builds the actor attached to every guarded admin action from the session. */
export function useAdminActor(): {
  actor: AdminActor | null;
  canAct: (action: AdminAction) => boolean;
} {
  const session = useAppStore((state) => state.session);

  const actor = useMemo<AdminActor | null>(() => {
    const adminRole = normalizeAdminRole(session?.adminRole);
    if (!session || !adminRole) return null;
    return { id: session.id, name: session.name, adminRole };
  }, [session]);

  return {
    actor,
    canAct: (action) => Boolean(actor && canPerformAction(actor.adminRole, action)),
  };
}
