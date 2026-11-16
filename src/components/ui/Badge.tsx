import { useI18n } from '@/i18n';
import styles from './surfaces.module.css';

export interface BadgeProps {
  count: number;
  max?: number;
  /** Accessible description, e.g. "3 items in bag". */
  label?: string;
  showZero?: boolean;
}

export function Badge({ count, max = 99, label, showZero = false }: BadgeProps) {
  const { t } = useI18n();

  if (count <= 0 && !showZero) return null;
  const text = count > max ? `${max}+` : String(count);

  return (
    <span className={styles.badge} aria-label={label ?? t('nav.bag')}>
      {text}
    </span>
  );
}
