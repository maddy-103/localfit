import styles from './surfaces.module.css';

export interface ProgressBarProps {
  value: number;
  max?: number;
  label: string;
  showValue?: boolean;
}

export function ProgressBar({ value, max = 100, label, showValue = false }: ProgressBarProps) {
  const safeMax = Math.max(1, max);
  const clamped = Math.min(Math.max(0, value), safeMax);
  const percent = Math.round((clamped / safeMax) * 100);

  return (
    <div className={styles.progressWrap}>
      <div className={styles.progressHeader}>
        <span>{label}</span>
        {showValue ? <span>{percent}%</span> : null}
      </div>
      <div
        className={styles.progress}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={clamped}
      >
        <div className={styles.progressBar} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
