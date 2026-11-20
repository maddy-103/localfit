import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/icons/Icon';
import { useI18n } from '@/i18n';
import styles from '@/routes/rider/rider.module.css';

/** RIDE-07: a two-second hold prevents an accidental admin alert. */
const HOLD_MS = 2000;

export function PressHoldButton({ onTrigger }: { onTrigger: () => void }) {
  const { t } = useI18n();
  const timer = useRef<number | null>(null);
  const [holding, setHolding] = useState(false);

  const cancel = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  };

  const start = () => {
    if (timer.current !== null) return;
    setHolding(true);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setHolding(false);
      onTrigger();
    }, HOLD_MS);
  };

  useEffect(() => cancel, []);

  return (
    <div className={styles.stack} aria-live="polite">
      <button
        type="button"
        className={styles.sos}
        aria-label={t('rider.sosHold')}
        aria-pressed={holding}
        onPointerDown={start}
        onPointerUp={cancel}
        onPointerCancel={cancel}
        onPointerLeave={cancel}
        onKeyDown={(event) => {
          if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) {
            event.preventDefault();
            start();
          }
        }}
        onKeyUp={(event) => {
          if (event.key === ' ' || event.key === 'Enter') cancel();
        }}
      >
        <Icon name="sos" size={28} /> {t('rider.sosHold')}
      </button>
      <p className={styles.muted}>{t('rider.sosHoldHint')}</p>
    </div>
  );
}
