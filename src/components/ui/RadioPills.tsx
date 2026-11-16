import { useId } from 'react';
import styles from './controls.module.css';

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RadioPillsProps {
  legend: string;
  name: string;
  options: readonly RadioOption[];
  value: string;
  onChange: (value: string) => void;
}

export function RadioPills({ legend, name, options, value, onChange }: RadioPillsProps) {
  const groupId = useId();

  return (
    <fieldset className={styles.radioPills}>
      <legend className={styles.radioLegend}>{legend}</legend>
      <div className={styles.radioOptions}>
        {options.map((option, index) => {
          const id = `${groupId}-${index}`;
          return (
            <div className={styles.radioOption} key={option.value}>
              <input
                className={styles.radioInput}
                type="radio"
                id={id}
                name={name}
                value={option.value}
                checked={value === option.value}
                disabled={option.disabled}
                onChange={() => onChange(option.value)}
              />
              <label className={styles.radioPill} htmlFor={id}>
                {option.label}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
