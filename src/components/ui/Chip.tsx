import type { ButtonHTMLAttributes } from 'react';
import { Icon } from '../icons/Icon';
import { cx } from '@/lib/cx';
import styles from './controls.module.css';

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export function Chip({ selected = false, className, children, type = 'button', ...rest }: ChipProps) {
  return (
    <button
      type={type}
      className={cx(styles.chip, selected && styles.chipSelected, className)}
      aria-pressed={selected}
      {...rest}
    >
      <span className={styles.chipCheck} aria-hidden="true">
        <Icon name="check-circle" size={16} />
      </span>
      {children}
    </button>
  );
}
