import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/client';
import type { CompensationClaim } from '@/api/types';
import { Icon } from '@/components/icons/Icon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusChip } from '@/components/ui/StatusChip';
import { ErrorState } from '@/components/ui/ErrorState';
import { WaitingTimer } from '@/components/rider/WaitingTimer';
import { RiderActionBar } from '@/components/rider/RiderActionBar';
import { useRiderOfflineQueue } from '@/components/rider/useRiderOfflineQueue';
import { RIDER_ACTOR } from '@/components/rider/actor';
import { useAsync, useOnline } from '@/lib/useAsync';
import { useI18n } from '@/i18n';
import styles from './rider.module.css';
import type { TaskViewProps } from './taskTypes';

/** RIDE-03/RIDE-05: arrival starts the wait, OTP opens the door. */
export function OtpStep({ task, order, onOrder, onChange }: TaskViewProps) {
  const { t } = useI18n();
  const online = useOnline();
  const queue = useRiderOfflineQueue();
  const config = useAsync(() => api.getRiderConfig(), 'rider-config');
  const waiting = useAsync(() => api.getWaitingSession(task.orderId), `waiting:${task.orderId}`);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(order.otpAttempts);
  const [support, setSupport] = useState(false);
  const [queued, setQueued] = useState(false);
  const [busy, setBusy] = useState(false);
  const [claim, setClaim] = useState<CompensationClaim | null>(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => api.subscribe('rider-waiting', waiting.reload), [waiting.reload]);

  // A claimed session already has a stored claim; fetching it is idempotent.
  useEffect(() => {
    if (!waiting.data?.claimed || claim) return;
    void api.claimCompensation(task.orderId, RIDER_ACTOR).then(setClaim, () => undefined);
  }, [claim, task.orderId, waiting.data?.claimed]);

  const startTransit = async () => {
    setError('');
    setBusy(true);
    try {
      onOrder(await api.markInTransit(task.orderId, RIDER_ACTOR));
      onChange();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const arrive = async () => {
    setError('');
    setBusy(true);
    try {
      onOrder(await api.markArrived(task.orderId, RIDER_ACTOR));
      waiting.reload();
      onChange();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const claimWait = async () => {
    setError('');
    setClaiming(true);
    try {
      const next = await api.claimCompensation(task.orderId, RIDER_ACTOR);
      setClaim(next);
      waiting.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('rider.task.earlyClaim'));
    } finally {
      setClaiming(false);
    }
  };

  const verify = async () => {
    setError('');
    if (!online) {
      await queue.queue({
        orderId: task.orderId,
        kind: 'drop',
        payload: { otp, actor: RIDER_ACTOR },
      });
      setQueued(true);
      return;
    }
    setBusy(true);
    try {
      const result = await api.submitOtp(task.orderId, otp, RIDER_ACTOR);
      setAttempts(result.attempts);
      onOrder(result.order);
      if (result.ok) {
        onChange();
      } else {
        setError(t('rider.task.otpWrong'));
        setSupport(result.supportRequired);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  if (order.state === 'PICKED_UP' || order.state === 'IN_TRANSIT') {
    const pickedUp = order.state === 'PICKED_UP';
    return (
      <div className={styles.stack}>
        <p className={styles.place}>{task.buyer.name}</p>
        <p className={styles.muted}>
          {task.buyer.line}, {task.buyer.area}
        </p>
        {error ? <ErrorState message={error} /> : null}
        <RiderActionBar>
          <Button
            size="lg"
            loading={busy}
            onClick={() => void (pickedUp ? startTransit() : arrive())}
          >
            {pickedUp ? t('rider.task.startTransit') : t('rider.task.arrived')}
          </Button>
        </RiderActionBar>
      </div>
    );
  }

  const threshold = config.data?.waitingCompensationMs ?? 10 * 60_000;

  return (
    <div className={styles.stack}>
      {waiting.data ? (
        <WaitingTimer
          startedAt={waiting.data.startedAt}
          thresholdMs={threshold}
          claimed={waiting.data.claimed}
          claim={claim}
          claiming={claiming}
          onClaim={() => void claimWait()}
        />
      ) : null}
      <Input
        label={t('rider.task.buyerOtp')}
        hint={t('rider.task.otpHint')}
        value={otp}
        onChange={(event) => setOtp(event.target.value)}
        inputMode="numeric"
        maxLength={4}
        autoComplete="off"
      />
      <div className={styles.statusRow}>
        <StatusChip
          tone={attempts >= 3 ? 'error' : attempts > 0 ? 'warning' : 'info'}
          icon={attempts >= 3 ? 'alert' : 'clock'}
          label={t('rider.task.attempts', { count: attempts })}
        />
        {task.buyer.phone ? (
          <a className={styles.link} href={`tel:${task.buyer.phone}`}>
            <Icon name="phone" size={16} /> {t('rider.task.callBuyer')}
          </a>
        ) : null}
      </div>
      {support ? (
        <div className={styles.alert} role="alert">
          <Icon name="alert" size={20} />
          <span>
            {t('rider.task.supportOpened')}{' '}
            <Link className={styles.link} to="/rider/support">
              {t('rider.task.openSupport')}
            </Link>
          </span>
        </div>
      ) : null}
      {queued ? (
        <p className={styles.notice} role="status">
          {t('rider.task.offlineQueued')}
        </p>
      ) : null}
      {error ? <ErrorState message={error} /> : null}
      <RiderActionBar>
        <Button size="lg" loading={busy} onClick={() => void verify()}>
          {t('rider.task.verifyOtp')}
        </Button>
      </RiderActionBar>
    </div>
  );
}
