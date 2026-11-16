import { useI18n } from '@/i18n';
import { formatCount } from '@/lib/format';
import { Icon } from '../icons/Icon';
import styles from './chrome.module.css';

export interface RatingProps {
  value: number;
  count?: number;
  /** Hide the numeric value, for very tight rows. */
  compact?: boolean;
}

const STARS = [1, 2, 3, 4, 5];

export function Rating({ value, count, compact = false }: RatingProps) {
  const { t } = useI18n();
  const safeValue = Math.min(5, Math.max(0, value));
  const rounded = Math.round(safeValue * 10) / 10;

  return (
    <span
      className={styles.rating}
      role="img"
      aria-label={t('rating.outOf', { value: rounded })}
    >
      <span className={styles.stars} aria-hidden="true">
        {STARS.map((star) => {
          const fill = Math.min(1, Math.max(0, safeValue - (star - 1)));
          return (
            <span className={styles.starWrap} key={star}>
              <Icon name="star" size={16} />
              <span
                className={styles.starFill}
                style={{ width: `${fill * 100}%` }}
              >
                <Icon name="star" size={16} />
              </span>
            </span>
          );
        })}
      </span>
      {!compact ? (
        <span className={styles.ratingText} aria-hidden="true">
          <strong>{t('rating.outOf', { value: rounded })}</strong>
          {typeof count === 'number' ? ` (${formatCount(count)})` : null}
        </span>
      ) : null}
    </span>
  );
}
