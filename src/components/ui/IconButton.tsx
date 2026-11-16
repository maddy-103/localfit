import type { ButtonHTMLAttributes } from 'react';
import { Icon, type IconName } from '../icons/Icon';
import { cx } from '@/lib/cx';
import styles from './controls.module.css';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  /** Required for screen readers unless the button has an aria-label already. */
  label: string;
  variant?: 'ghost' | 'outline';
  size?: number;
}

export function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 22,
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        styles.iconButton,
        variant === 'outline' && styles.iconButtonOutline,
        className,
      )}
      aria-label={label}
      title={label}
      {...rest}
    >
      <Icon name={icon} size={size} />
    </button>
  );
}
