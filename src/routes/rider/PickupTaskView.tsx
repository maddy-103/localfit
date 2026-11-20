import { useState } from 'react';
import { api } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusChip } from '@/components/ui/StatusChip';
import { ErrorState } from '@/components/ui/ErrorState';
import { CaptureField } from '@/components/rider/CaptureField';
import { RiderActionBar } from '@/components/rider/RiderActionBar';
import { useRiderOfflineQueue } from '@/components/rider/useRiderOfflineQueue';
import { MOCK_PICKUP_PHOTO, RIDER_ACTOR } from '@/components/rider/actor';
import { useI18n } from '@/i18n';
import { useOnline } from '@/lib/useAsync';
import styles from './rider.module.css';
import type { TaskViewProps } from './taskTypes';

/** RIDE-02: code, item scan and photo are all checked before pickup. */
export function PickupTaskView({ task, order, onOrder, onChange }: TaskViewProps) {
  const { t } = useI18n();
  const online = useOnline();
  const queue = useRiderOfflineQueue();
  const [pickupOtp, setPickupOtp] = useState(task.pickupOtp ?? '');
  const [scanCode, setScanCode] = useState('');
  const [photoId, setPhotoId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const confirm = async () => {
    setError('');
    if (!online) {
      await queue.queue({
        orderId: task.orderId,
        kind: 'pickup',
        payload: { pickupOtp, scanCode, photoId, actor: RIDER_ACTOR },
      });
      setDone(true);
      return;
    }
    setBusy(true);
    try {
      onOrder(
        await api.collectPickup(
          task.orderId,
          { pickupOtp, scanCode, photoId },
          RIDER_ACTOR,
        ),
      );
      setDone(true);
      onChange();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <p className={styles.notice} role="status">
        <StatusChip tone="success" label={t('rider.task.pickupDone')} />
      </p>
    );
  }

  return (
    <div className={styles.stack}>
      <Input
        label={t('rider.task.pickupOtp')}
        value={pickupOtp}
        onChange={(event) => setPickupOtp(event.target.value)}
        inputMode="numeric"
        autoComplete="off"
      />
      <CaptureField
        mode="scan"
        label={t('rider.task.scanItems')}
        value={scanCode}
        placeholderValue={`SKU-${order.lines[0]?.variantId ?? 'ITEM'}`}
        onChange={setScanCode}
      />
      <CaptureField
        mode="photo"
        label={t('rider.task.pickupPhoto')}
        value={photoId}
        placeholderValue={MOCK_PICKUP_PHOTO}
        onChange={setPhotoId}
      />
      {error ? <ErrorState message={error} /> : null}
      <RiderActionBar>
        <Button size="lg" loading={busy} onClick={() => void confirm()}>
          {t('rider.task.confirmPickup')}
        </Button>
      </RiderActionBar>
    </div>
  );
}
