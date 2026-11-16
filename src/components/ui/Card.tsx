import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '@/lib/cx';
import styles from './surfaces.module.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padded?: boolean;
}

export function Card({ children, padded = false, className, ...rest }: CardProps) {
  return (
    <div className={cx(styles.card, padded && styles.cardPad, className)} {...rest}>
      {children}
    </div>
  );
}
