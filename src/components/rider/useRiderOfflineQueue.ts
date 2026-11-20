import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/api/client';
import type { QueuedRiderAction } from '@/api/types';
import { RIDER_ACTOR } from './actor';
import { useAsync, useOnline } from '@/lib/useAsync';

type QueueInput = Omit<QueuedRiderAction, 'id' | 'createdAt' | 'status'>;

/** NFR-04: queued pickup/drop actions are replayed when the phone reconnects. */
export function useRiderOfflineQueue() {
  const online = useOnline();
  const queue = useAsync(() => api.listQueuedRiderActions(), 'rider-queue');
  const { reload, data } = queue;
  const [syncing, setSyncing] = useState(false);

  useEffect(() => api.subscribe('rider-queue', reload), [reload]);

  const add = useCallback(
    async (action: QueueInput) => {
      await api.queueRiderAction(action);
      reload();
    },
    [reload],
  );

  const sync = useCallback(async () => {
    const pending = (data ?? []).filter((action) => action.status === 'pending');
    if (pending.length === 0) return;
    setSyncing(true);
    for (const action of pending) {
      try {
        const actor = action.payload.actor ?? RIDER_ACTOR;
        if (action.kind === 'pickup') {
          await api.collectPickup(
            action.orderId,
            {
              pickupOtp: action.payload.pickupOtp ?? '',
              scanCode: action.payload.scanCode ?? '',
              photoId: action.payload.photoId ?? '',
            },
            actor,
          );
        } else if (action.kind === 'drop') {
          await api.submitOtp(action.orderId, action.payload.otp ?? '', actor);
        } else {
          await api.recordHandoverPhoto(action.orderId, action.payload.photoId ?? '', actor);
        }
        await api.markRiderActionSynced(action.id);
      } catch {
        // Keep the action pending; the next online event retries it.
      }
    }
    setSyncing(false);
    reload();
  }, [data, reload]);

  // Only a connection change (or mount) triggers an automatic replay.
  const syncRef = useRef(sync);
  useEffect(() => {
    syncRef.current = sync;
  });
  useEffect(() => {
    if (online) void syncRef.current();
  }, [online]);

  const actions = data ?? [];
  return {
    actions,
    pending: actions.filter((action) => action.status === 'pending'),
    queue: add,
    sync,
    syncing,
  };
}
