import type { ButtonHTMLAttributes } from 'react';
import { Icon, type IconName } from '../icons/Icon';
import { cx } from '@/lib/cx';
import styles from './controls.module.css';

type Variant = 'solid' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  destructive?: boolean;
  leftIcon?: IconName;
  rightIcon?: IconName;
}

export function Button({
  variant = 'solid',
  size = 'md',
  loading = false,
  fullWidth = false,
  destructive = false,
  leftIcon,
  rightIcon,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        styles.button,
        variant === 'outline' && styles.outline,
        variant === 'ghost' && styles.ghost,
        destructive && styles.destructive,
        size === 'lg' && styles.lg,
        size === 'sm' && styles.sm,
        fullWidth && styles.fullWidth,
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className={styles.spinner} aria-hidden="true" /> : null}
      {!loading && leftIcon ? <Icon name={leftIcon} size={18} /> : null}
      <span>{children}</span>
      {!loading && rightIcon ? <Icon name={rightIcon} size={18} /> : null}
    </button>
  );
}
