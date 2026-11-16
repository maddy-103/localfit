import { useEffect, useRef, useState } from 'react';
import { Icon } from '../icons/Icon';
import { useI18n } from '@/i18n';
import { formatRemaining } from '@/lib/format';
import { useNow } from '@/lib/useNow';
import { cx } from '@/lib/cx';
import styles from './chrome.module.css';

export interface TimerProps {
  /** ISO 8601 string or epoch milliseconds. */
  endsAt: string | number;
  label?: string;
  onExpire?: () => void;
}

/**
 * Reads the business clock. The visible digits update each second without
 * animation; screen readers hear the warning at most once per minute in the
 * last two minutes.
 */
export function Timer({ endsAt, label, onExpire }: TimerProps) {
  const { t } = useI18n();
  const at = useNow(1000);
  const end = typeof endsAt === 'string' ? Date.parse(endsAt) : endsAt;
  const remaining = Math.max(0, end - at);
  const urgent = remaining > 0 && remaining <= 2 * 60 * 1000;
  const minutesLeft = Math.ceil(remaining / 60_000);

  const [announcement, setAnnouncement] = useState('');
  const announcedMinute = useRef<number | null>(null);
  const expired = useRef(false);

  useEffect(() => {
    if (!urgent) return;
    if (announcedMinute.current === minutesLeft) return;
    announcedMinute.current = minutesLeft;
    setAnnouncement(t('timer.urgent'));
  }, [urgent, minutesLeft, t]);

  useEffect(() => {
    if (remaining > 0 || expired.current) return;
    expired.current = true;
    onExpire?.();
  }, [remaining, onExpire]);

  return (
    <>
      <span
        className={cx(styles.timer, urgent && styles.timerUrgent)}
        role="timer"
        aria-live="off"
      >
        <Icon name={urgent ? 'alert' : 'clock'} size={18} />
        <span className={styles.timerLabel}>{label ?? t('timer.label')}</span>
        <strong>{remaining > 0 ? formatRemaining(remaining) : t('timer.ended')}</strong>
      </span>
      <span className="u-visually-hidden" role="status" aria-live="polite">
        {announcement}
      </span>
    </>
  );
}
