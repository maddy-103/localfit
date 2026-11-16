import { useId, type InputHTMLAttributes } from 'react';
import { Icon, type IconName } from '../icons/Icon';
import { cx } from '@/lib/cx';
import styles from './controls.module.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  icon?: IconName;
  hideLabel?: boolean;
}

export function Input({
  label,
  hint,
  error,
  icon,
  hideLabel = false,
  id,
  className,
  ...rest
}: InputProps) {
  const autoId = useId();
  const inputId = id ?? `input-${autoId}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={styles.fieldGroup}>
      <label className={cx(styles.label, hideLabel && 'u-visually-hidden')} htmlFor={inputId}>
        {label}
        {rest.required ? <span aria-hidden="true"> *</span> : null}
      </label>

      <div className={styles.inputWrap}>
        {icon ? (
          <span className={styles.inputIcon} aria-hidden="true">
            <Icon name={icon} size={20} />
          </span>
        ) : null}
        <input
          id={inputId}
          className={cx(styles.input, icon && styles.inputWithIcon, error && styles.inputInvalid, className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
      </div>

      {hint ? (
        <span className={styles.hint} id={hintId}>
          {hint}
        </span>
      ) : null}
      {error ? (
        <span className={styles.fieldError} id={errorId} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
