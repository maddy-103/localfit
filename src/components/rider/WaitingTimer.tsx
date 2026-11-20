import type { CompensationClaim } from '@/api/types';
import { Icon } from '@/components/icons/Icon';
import { Button } from '@/components/ui/Button';
import { StatusChip } from '@/components/ui/StatusChip';
import { useI18n } from '@/i18n';
import { formatRemaining, formatTime } from '@/lib/format';
import { useNow } from '@/lib/useNow';
import styles from '@/routes/rider/rider.module.css';

export interface WaitingTimerProps {
  startedAt: string;
  thresholdMs: number;
  claimed?: boolean;
  claim?: CompensationClaim | null;
  claiming?: boolean;
  onClaim?: () => void;
}

/** RIDE-05/SPEC 13: elapsed time and the claim threshold come from one clock. */
export function WaitingTimer({
  startedAt,
  thresholdMs,
  claimed = false,
  claim = null,
  claiming = false,
  onClaim,
}: WaitingTimerProps) {
  const { t } = useI18n();
  const at = useNow(1000);
  const elapsed = Math.max(0, at - Date.parse(startedAt));
  const due = elapsed >= thresholdMs;

  return (
    <div className={styles.stack} aria-live="polite">
      <p className={styles.eyebrow}>{t('rider.task.waiting')}</p>
      <div className={styles.timer} role="timer">
        <Icon name="clock" size={20} />
        <strong>{formatRemaining(elapsed)}</strong>
        <span>
          {t('rider.task.waitThreshold', { minutes: Math.round(thresholdMs / 60_000) })}
        </span>
      </div>
      <div className={styles.statusRow}>
        <StatusChip
          tone={claim || claimed ? 'success' : due ? 'warning' : 'pending'}
          icon={claim || claimed || due ? 'check-circle' : 'clock'}
          label={
            claim || claimed
              ? t('rider.task.claimed')
              : due
                ? t('rider.task.claim')
                : t('rider.task.waiting')
          }
        />
        <span className={styles.muted}>
          {t('rider.task.waitingBody', { time: formatTime(startedAt) })}
        </span>
      </div>
      {claim ? (
        <p className={styles.notice} role="status">
          {t('rider.task.claimEvidence', {
            elapsed: formatRemaining(claim.evidence.elapsedMs),
            threshold: formatRemaining(claim.evidence.thresholdMs),
            at: formatTime(claim.evidence.checkedAt),
          })}
        </p>
      ) : due && onClaim ? (
        <Button variant="outline" loading={claiming} onClick={onClaim}>
          {t('rider.task.claim')}
        </Button>
      ) : null}
      <span className="u-visually-hidden">
        {formatRemaining(Math.max(0, thresholdMs - elapsed))}
      </span>
    </div>
  );
}
