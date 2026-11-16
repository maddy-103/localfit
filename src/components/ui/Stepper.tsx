import { Icon } from '../icons/Icon';
import { cx } from '@/lib/cx';
import styles from './surfaces.module.css';

export type StepState = 'done' | 'current' | 'upcoming';

export interface Step {
  id: string;
  label: string;
  state: StepState;
  time?: string;
}

export interface StepperProps {
  steps: readonly Step[];
  vertical?: boolean;
  label: string;
}

export function Stepper({ steps, vertical = false, label }: StepperProps) {
  return (
    <ol
      className={cx(
        styles.stepper,
        vertical ? styles.stepperVertical : styles.stepperHorizontal,
      )}
      aria-label={label}
    >
      {steps.map((step, index) => {
        const done = step.state === 'done';
        const current = step.state === 'current';
        return (
          <li
            key={step.id}
            className={styles.step}
            aria-current={current ? 'step' : undefined}
          >
            <span className={styles.stepTrack}>
              <span
                className={cx(
                  styles.stepDot,
                  done && styles.stepDotDone,
                  current && styles.stepDotCurrent,
                )}
              >
                {done ? <Icon name="check-circle" size={16} /> : null}
              </span>
              {index < steps.length - 1 ? (
                <span className={cx(styles.stepLine, done && styles.stepLineDone)} />
              ) : null}
            </span>
            <span className={styles.stepContent}>
              <span className={cx(styles.stepLabel, current && styles.stepLabelCurrent)}>
                {step.label}
              </span>
              {step.time ? <span className={styles.stepTime}>{step.time}</span> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
