import { useI18n } from '@/i18n';
import styles from './chrome.module.css';

export interface MarqueeProps {
  items: readonly string[];
  /** Accessible name for the strip. */
  label?: string;
}

/**
 * Black partner strip. The list is duplicated for a seamless loop and the
 * duplicate is hidden from assistive technology.
 */
export function Marquee({ items, label }: MarqueeProps) {
  const { t } = useI18n();

  return (
    <div className={styles.marquee} role="region" aria-label={label ?? t('a11y.marquee')}>
      <div className={styles.marqueeTrack}>
        {[0, 1].map((copy) => (
          <div className={styles.marqueeGroup} key={copy} aria-hidden={copy === 1}>
            {items.map((item) => (
              <span className={styles.marqueeItem} key={`${copy}-${item}`}>
                {item}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
