import { Icon } from '@/components/icons/Icon';
import { useI18n } from '@/i18n';
import { trialRemainingMs } from '@/domain/trial';
import { formatRemaining } from '@/lib/format';
import { useNow } from '@/lib/useNow';
import styles from '@/routes/rider/rider.module.css';

/**
 * The rider and buyer screens both derive this number from order.trialEndsAt
 * and the same clock, so closing either app cannot change the time left
 * (TRIAL-02).
 */
export function TrialTimer({ endsAt }: { endsAt: string }) {
  const { t } = useI18n();
  const at = useNow(1000);
  const remaining = trialRemainingMs(endsAt, at);

  return (
    <div className={styles.timer} role="timer" aria-label={t('rider.task.trialTimer')}>
      <Icon name="clock" size={20} />
      <strong>{formatRemaining(remaining)}</strong>
      <span>{t('trial.remaining')}</span>
    </div>
  );
}
