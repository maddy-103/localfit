import { Icon } from '../icons/Icon';
import { useI18n } from '@/i18n';
import { cx } from '@/lib/cx';
import styles from './controls.module.css';

export interface Swatch {
  name: string;
  hex: string;
}

export interface SwatchPickerProps {
  swatches: readonly Swatch[];
  value: string;
  onChange: (name: string) => void;
  label?: string;
}

export function SwatchPicker({ swatches, value, onChange, label }: SwatchPickerProps) {
  const { t } = useI18n();

  return (
    <div className={styles.swatches} role="group" aria-label={label}>
      {swatches.map((swatch) => {
        const selected = swatch.name === value;
        return (
          <button
            key={swatch.name}
            type="button"
            className={cx(styles.swatch, selected && styles.swatchSelected)}
            aria-pressed={selected}
            aria-label={t('swatch.label', { name: swatch.name })}
            title={swatch.name}
            onClick={() => onChange(swatch.name)}
          >
            <span className={styles.swatchDot} style={{ background: swatch.hex }} aria-hidden="true" />
            {selected ? (
              <span className={styles.swatchCheck} aria-hidden="true">
                <Icon name="check-circle" size={16} />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
