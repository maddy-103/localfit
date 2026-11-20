import { useState } from 'react';
import { api } from '@/api/client';
import { Icon } from '@/components/icons/Icon';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { StatusChip } from '@/components/ui/StatusChip';
import { ErrorState } from '@/components/ui/ErrorState';
import { CaptureField } from '@/components/rider/CaptureField';
import { TrialTimer } from '@/components/rider/TrialTimer';
import { DecisionList } from '@/components/rider/DecisionList';
import { RiderActionBar } from '@/components/rider/RiderActionBar';
import { MOCK_HANDOVER_PHOTO, RIDER_ACTOR } from '@/components/rider/actor';
import { useI18n } from '@/i18n';
import styles from './rider.module.css';
import type { TaskViewProps } from './taskTypes';

/** TRIAL-02: the rider sees the same trial timer and decisions as the buyer. */
export function TrialStep({ task, order, onOrder, onChange }: TaskViewProps) {
  const { t } = useI18n();
  const [photoId, setPhotoId] = useState(order.handoverPhotoId ?? '');
  const [byPhone, setByPhone] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setError('');
    setBusy(true);
    try {
      onOrder(
        await api.confirmRiderDecisions(
          task.orderId,
          RIDER_ACTOR,
          byPhone ? t('rider.task.confirmedByPhone') : undefined,
        ),
      );
      onChange();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const savePhoto = async () => {
    setError('');
    if (!photoId.trim()) return;
    setBusy(true);
    try {
      onOrder(await api.recordHandoverPhoto(task.orderId, photoId, RIDER_ACTOR));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.stack}>
      {order.trialEndsAt ? <TrialTimer endsAt={order.trialEndsAt} /> : null}
      <div className={styles.statusRow}>
        <span className={styles.eyebrow}>{t('rider.task.decisions')}</span>
      </div>
      <DecisionList lines={order.lines} />
      <hr className={styles.divider} />

      {order.handoverPhotoId ? (
        <StatusChip tone="success" label={t('rider.task.handoverPhoto')} />
      ) : (
        <>
          <CaptureField
            mode="photo"
            label={t('rider.task.handoverPhoto')}
            value={photoId}
            placeholderValue={MOCK_HANDOVER_PHOTO}
            onChange={setPhotoId}
          />
          <Button variant="outline" loading={busy} onClick={() => void savePhoto()}>
            {t('rider.task.savePhoto')}
          </Button>
        </>
      )}

      {task.buyer.phone ? (
        <a className={styles.link} href={`tel:${task.buyer.phone}`}>
          <Icon name="phone" size={16} /> {t('rider.task.callBuyer')}
        </a>
      ) : null}
      <Checkbox
        label={t('rider.task.confirmByPhone')}
        checked={byPhone}
        onChange={(event) => setByPhone(event.target.checked)}
      />
      {error ? <ErrorState message={error} /> : null}
      <RiderActionBar>
        <Button
          size="lg"
          loading={busy}
          disabled={!order.handoverPhotoId}
          onClick={() => void confirm()}
        >
          {t('rider.task.confirmDecisions')}
        </Button>
      </RiderActionBar>
    </div>
  );
}
