import { useState } from 'react';
import { Icon } from '../icons/Icon';
import { useI18n } from '@/i18n';
import { cx } from '@/lib/cx';
import styles from './controls.module.css';

export interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  label?: string;
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  label,
}: QuantityStepperProps) {
  const { t } = useI18n();
  const [bumping, setBumping] = useState(false);

  const change = (next: number) => {
    if (next < min || next > max) return;
    setBumping(true);
    onChange(next);
  };

  return (
    <div className={styles.quantity} role="group" aria-label={label}>
      <button
        type="button"
        className={styles.quantityButton}
        aria-label={t('quantity.decrease')}
        disabled={disabled || value <= min}
        onClick={() => change(value - 1)}
      >
        <Icon name="minus" size={18} />
      </button>
      <span
        className={cx(styles.quantityValue, bumping && styles.bump)}
        aria-live="polite"
        onAnimationEnd={() => setBumping(false)}
      >
        {value}
      </span>
      <button
        type="button"
        className={styles.quantityButton}
        aria-label={t('quantity.increase')}
        disabled={disabled || value >= max}
        onClick={() => change(value + 1)}
      >
        <Icon name="plus" size={18} />
      </button>
    </div>
  );
}
