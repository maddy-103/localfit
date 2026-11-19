import { useI18n } from '@/i18n';
import { cx } from '@/lib/cx';
import styles from './flow.module.css';

export interface SizeOption {
  size: string;
  disabled?: boolean;
}

interface Props {
  sizes: SizeOption[];
  value: string;
  onChange: (size: string) => void;
  errorMessage: string;
}

/** The row shakes and announces its error when Add is pressed without a size. */
export function SizePicker({ sizes, value, onChange, errorMessage }: Props) {
  const { t } = useI18n();

  return (
    <div className={styles.section}>
      <div className={styles.label}>{t('product.selectSize')}</div>
      <div
        className={cx(styles.pills, errorMessage && styles.shake)}
        role="group"
        aria-label={t('product.selectSize')}
        key={errorMessage ? `shaking-${errorMessage}` : 'sizes'}
      >
        {sizes.map((option) => (
          <button
            type="button"
            key={option.size}
            className={cx(
              styles.pill,
              value === option.size && styles.pillSelected,
              option.disabled && styles.pillDisabled,
            )}
            aria-pressed={value === option.size}
            disabled={option.disabled}
            onClick={() => onChange(option.size)}
          >
            {option.size}
          </button>
        ))}
      </div>
      <span className={styles.errorText} role="status" aria-live="assertive">
        {errorMessage}
      </span>
    </div>
  );
}
