import styles from './controls.module.css';

export interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: readonly [number, number];
  onChange: (value: [number, number]) => void;
  label: string;
  formatValue?: (value: number) => string;
}

export function RangeSlider({
  min,
  max,
  step = 100,
  value,
  onChange,
  label,
  formatValue = (value) => String(value),
}: RangeSliderProps) {
  const [low, high] = value;
  const span = Math.max(1, max - min);
  const lowPercent = ((low - min) / span) * 100;
  const highPercent = ((high - min) / span) * 100;

  return (
    <div className={styles.range}>
      <div className={styles.rangeValues}>
        <output>{formatValue(low)}</output>
        <output>{formatValue(high)}</output>
      </div>
      <div className={styles.rangeTrack}>
        <span className={styles.rangeRail} aria-hidden="true" />
        <span
          className={styles.rangeFill}
          style={{ left: `${lowPercent}%`, width: `${Math.max(0, highPercent - lowPercent)}%` }}
          aria-hidden="true"
        />
        <input
          className={styles.rangeInput}
          type="range"
          min={min}
          max={max}
          step={step}
          value={low}
          aria-label={`${label} minimum`}
          onChange={(event) => {
            const next = Number(event.target.value);
            onChange([Math.min(next, high - step), high]);
          }}
        />
        <input
          className={styles.rangeInput}
          type="range"
          min={min}
          max={max}
          step={step}
          value={high}
          aria-label={`${label} maximum`}
          onChange={(event) => {
            const next = Number(event.target.value);
            onChange([low, Math.max(next, low + step)]);
          }}
        />
      </div>
    </div>
  );
}
