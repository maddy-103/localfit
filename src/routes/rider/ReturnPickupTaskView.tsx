import { useState } from 'react';
import { api } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { StatusChip } from '@/components/ui/StatusChip';
import { ErrorState } from '@/components/ui/ErrorState';
import { CaptureField } from '@/components/rider/CaptureField';
import { RiderActionBar } from '@/components/rider/RiderActionBar';
import { RIDER_ACTOR } from '@/components/rider/actor';
import { useI18n } from '@/i18n';
import styles from './rider.module.css';
import type { TaskViewProps } from './taskTypes';

/** RIDE-09: scan returns at the door, then hand them over at the shop. */
export function ReturnPickupTaskView({ task, order, onOrder, onChange }: TaskViewProps) {
  const { t } = useI18n();
  const [scanCode, setScanCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const scanned = order.returnedScanCodes ?? [];

  const run = async (work: () => Promise<typeof order>, success?: () => void) => {
    setError('');
    setBusy(true);
    try {
      onOrder(await work());
      success?.();
      onChange();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  if (order.state === 'RETURN_RECEIVED') {
    return (
      <p className={styles.notice} role="status">
        <StatusChip tone="success" label={t('rider.task.returnHandoverDone')} />
      </p>
    );
  }

  if (order.state === 'RETURN_PICKED') {
    if (scanned.length === 0) {
      return (
        <div className={styles.stack}>
          <CaptureField
            mode="scan"
            label={t('rider.task.scanReturns')}
            hint={t('rider.task.returnScanHint')}
            value={scanCode}
            placeholderValue={`RET-${order.lines[0]?.variantId ?? 'ITEM'}`}
            onChange={setScanCode}
          />
          {error ? <ErrorState message={error} /> : null}
          <RiderActionBar>
            <Button
              size="lg"
              loading={busy}
              onClick={() =>
                void run(
                  () => api.scanReturnedItems(task.orderId, [scanCode], RIDER_ACTOR),
                  () => setScanCode(''),
                )
              }
            >
              {t('rider.task.scanReturns')}
            </Button>
          </RiderActionBar>
        </div>
      );
    }
    return (
      <div className={styles.stack}>
        <StatusChip tone="success" label={`${t('rider.task.scanReturns')} · ${scanned.length}`} />
        {error ? <ErrorState message={error} /> : null}
        <RiderActionBar>
          <Button
            size="lg"
            loading={busy}
            onClick={() => void run(() => api.handOverReturnAtShop(task.orderId, RIDER_ACTOR))}
          >
            {t('rider.task.handOverShop')}
          </Button>
        </RiderActionBar>
      </div>
    );
  }

  return (
    <div className={styles.stack}>
      <p className={styles.intro}>{t('rider.task.returnScanHint')}</p>
      <CaptureField
        mode="scan"
        label={t('rider.task.scanReturns')}
        value={scanCode}
        placeholderValue={`RET-${order.lines[0]?.variantId ?? 'ITEM'}`}
        onChange={setScanCode}
      />
      {scanned.length > 0 ? (
        <StatusChip tone="success" label={`${t('rider.task.scanReturns')} · ${scanned.length}`} />
      ) : null}
      {error ? <ErrorState message={error} /> : null}
      <RiderActionBar>
        <Button
          size="lg"
          loading={busy}
          onClick={() =>
            void run(
              async () => {
                const scannedOrder = await api.scanReturnedItems(
                  task.orderId,
                  [scanCode],
                  RIDER_ACTOR,
                );
                return api.closeTrip(task.orderId, RIDER_ACTOR, scannedOrder.handoverPhotoId);
              },
              () => setScanCode(''),
            )
          }
        >
          {t('rider.task.closeTrip')}
        </Button>
      </RiderActionBar>
    </div>
  );
}
