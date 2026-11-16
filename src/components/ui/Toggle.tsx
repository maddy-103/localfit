import { useId } from 'react';
import { cx } from '@/lib/cx';
import styles from './controls.module.css';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}

export function Toggle({ checked, onChange, label, description, disabled, id }: ToggleProps) {
  const autoId = useId();
  const labelId = id ?? `toggle-${autoId}`;

  return (
    <div className={styles.toggleRow}>
      <span className={styles.toggleText}>
        <span className={styles.label} id={labelId}>
          {label}
        </span>
        {description ? <span className={styles.hint}>{description}</span> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        disabled={disabled}
        className={cx(styles.toggle, checked && styles.toggleOn)}
        onClick={() => onChange(!checked)}
      >
        <span className={styles.toggleTrack} aria-hidden="true" />
        <span className={styles.toggleThumb} aria-hidden="true" />
      </button>
    </div>
  );
}
