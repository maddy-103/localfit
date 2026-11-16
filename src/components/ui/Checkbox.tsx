import { useId, type InputHTMLAttributes } from 'react';
import styles from './controls.module.css';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

export function Checkbox({ label, id, ...rest }: CheckboxProps) {
  const autoId = useId();
  const inputId = id ?? `checkbox-${autoId}`;

  return (
    <label className={styles.checkboxRow} htmlFor={inputId}>
      <input id={inputId} type="checkbox" className={styles.checkboxInput} {...rest} />
      <span className={styles.checkboxBox} aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="m2.5 7.4 2.9 2.9 6.1-6.6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className={styles.checkboxLabel}>{label}</span>
    </label>
  );
}
