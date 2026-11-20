import { useState } from 'react';
import { api } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { StatusChip } from '@/components/ui/StatusChip';
import { ErrorState } from '@/components/ui/ErrorState';
import { CaptureField } from '@/components/rider/CaptureField';
import { DecisionList } from '@/components/rider/DecisionList';
import { RiderActionBar } from '@/components/rider/RiderActionBar';
import { RIDER_ACTOR } from '@/components/rider/actor';
import { useI18n } from '@/i18n';
import styles from './rider.module.css';
import type { TaskViewProps } from './taskTypes';

/** RIDE-09: scan every returned item, then close the trip. */
export function CloseStep({ task, order, onOrder, onChange }: TaskViewProps) {
  const { t } = useI18n();
  const [scanCode, setScanCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const scanned = order.returnedScanCodes ?? [];
  const returning = order.lines.filter((line) => line.decision === 'return');

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

  const scanReturns = () =>
    run(
      () => api.scanReturnedItems(task.orderId, [...scanned, scanCode], RIDER_ACTOR),
      () => setScanCode(''),
    );

  const close = () => run(() => api.closeTrip(task.orderId, RIDER_ACTOR));

  return (
    <div className={styles.stack}>
      <DecisionList lines={order.lines} />
      {returning.length > 0 ? (
        <>
          <p className={styles.intro}>{t('rider.task.returnScanHint')}</p>
          <CaptureField
            mode="scan"
            label={t('rider.task.scanReturns')}
            hint={t('rider.task.returnScanHint')}
            value={scanCode}
            placeholderValue={`RET-${order.lines.find((line) => line.decision === 'return')?.variantId ?? 'ITEM'}`}
            onChange={setScanCode}
          />
          {scanned.length > 0 ? (
            <StatusChip tone="success" label={`${t('rider.task.scanReturns')} · ${scanned.length}`} />
          ) : null}
          <Button variant="outline" loading={busy} onClick={() => void scanReturns()}>
            {t('rider.task.scanReturns')}
          </Button>
        </>
      ) : null}
      {error ? <ErrorState message={error} /> : null}
      <RiderActionBar>
        <Button
          size="lg"
          loading={busy}
          disabled={returning.length > 0 && scanned.length === 0}
          onClick={() => void close()}
        >
          {t('rider.task.closeTrip')}
        </Button>
      </RiderActionBar>
    </div>
  );
}
