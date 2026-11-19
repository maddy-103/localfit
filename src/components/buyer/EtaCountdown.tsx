import { Icon } from '@/components/icons/Icon';
import { useI18n } from '@/i18n';
import { formatEta, formatRemaining } from '@/lib/format';
import flow from './flow.module.css';

export interface EtaCountdownProps {
  etaMin: [number, number];
  etaEndsAt?: string;
  now: number;
  arrived?: boolean;
}

/** Promised window plus a countdown derived from the app clock. */
export function EtaCountdown({ etaMin, etaEndsAt, now, arrived = false }: EtaCountdownProps) {
  const { t } = useI18n();
  const remaining = etaEndsAt ? Math.max(0, Date.parse(etaEndsAt) - now) : 0;
  const label = arrived || remaining <= 0 ? t('track.etaNow') : formatRemaining(remaining);

  return (
    <div className={flow.etaBox}>
      <Icon name="clock" size={20} />
      <span>
        <strong>{label}</strong>
        <span className={flow.hint}> · {t('track.etaLabel')}</span>
        <span className={flow.hint}> · {t('track.window', { window: formatEta(...etaMin) })}</span>
      </span>
    </div>
  );
}
