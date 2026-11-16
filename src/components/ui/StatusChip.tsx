import { Icon, type IconName } from '../icons/Icon';
import { cx } from '@/lib/cx';
import styles from './surfaces.module.css';

export type StatusTone = 'success' | 'warning' | 'error' | 'info' | 'pending';

const DEFAULT_ICONS: Record<StatusTone, IconName> = {
  success: 'check-circle',
  warning: 'alert',
  error: 'alert',
  info: 'clock',
  pending: 'clock',
};

const TONE_CLASS: Record<StatusTone, string | undefined> = {
  success: styles.statusSuccess,
  warning: styles.statusWarning,
  error: styles.statusError,
  info: styles.statusInfo,
  pending: styles.statusPending,
};

export interface StatusChipProps {
  tone: StatusTone;
  label: string;
  icon?: IconName;
}

/** Status is always icon + text + colour, never colour alone. */
export function StatusChip({ tone, label, icon }: StatusChipProps) {
  return (
    <span className={cx(styles.statusChip, TONE_CLASS[tone])}>
      <Icon name={icon ?? DEFAULT_ICONS[tone]} size={16} />
      <span>{label}</span>
    </span>
  );
}
