import type { CSSProperties } from 'react';
import { cx } from '@/lib/cx';
import styles from './surfaces.module.css';

export type SkeletonVariant = 'line' | 'card' | 'row' | 'image';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: number | string;
  height?: number | string;
  count?: number;
  className?: string;
}

function size(value: number | string | undefined): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === 'number' ? `${value}px` : value;
}

export function Skeleton({ variant = 'line', width, height, count = 1, className }: SkeletonProps) {
  const style: CSSProperties = { width: size(width), height: size(height) };

  return (
    <>
      {Array.from({ length: count }, (_, index) => {
        if (variant === 'card') {
          return (
            <div className={cx(styles.skeletonCard, className)} key={index} aria-hidden="true">
              <span className={cx(styles.skeleton, styles.skeletonImage)} style={{ height: size(height) }} />
              <span className={cx(styles.skeleton, styles.skeletonLine)} style={{ width: '70%' }} />
              <span className={cx(styles.skeleton, styles.skeletonLine)} style={{ width: '45%' }} />
            </div>
          );
        }

        if (variant === 'row') {
          return (
            <div className={cx(styles.skeletonRow, className)} key={index} aria-hidden="true">
              <span className={cx(styles.skeleton, styles.skeletonImage)} style={{ width: 56, height: 56, flex: '0 0 auto' }} />
              <span style={{ display: 'grid', gap: 8, flex: 1 }}>
                <span className={cx(styles.skeleton, styles.skeletonLine)} style={{ width: '60%' }} />
                <span className={cx(styles.skeleton, styles.skeletonLine)} style={{ width: '35%' }} />
              </span>
            </div>
          );
        }

        return (
          <span
            className={cx(styles.skeleton, variant === 'image' ? styles.skeletonImage : styles.skeletonLine, className)}
            style={style}
            key={index}
            aria-hidden="true"
          />
        );
      })}
    </>
  );
}
