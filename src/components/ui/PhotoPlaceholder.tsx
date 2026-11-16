import { Icon } from '../icons/Icon';
import { cx } from '@/lib/cx';
import type { ImageTone } from '@/api/types';
import styles from './surfaces.module.css';

const TONE_CLASS: Record<ImageTone, string | undefined> = {
  sand: styles.photoToneSand,
  rose: styles.photoToneRose,
  sage: styles.photoToneSage,
  sky: styles.photoToneSky,
  lilac: styles.photoToneLilac,
  grey: styles.photoToneGrey,
};

export interface PhotoPlaceholderProps {
  label: string;
  tone?: ImageTone;
  width?: number;
  height?: number;
}

/** Keeps the image aspect ratio while the shop's real photo is missing. */
export function PhotoPlaceholder({
  label,
  tone = 'grey',
  width = 1,
  height = 1,
}: PhotoPlaceholderProps) {
  return (
    <div
      className={cx(styles.photoPlaceholder, TONE_CLASS[tone])}
      style={{ aspectRatio: `${width} / ${height}` }}
      role="img"
      aria-label={label}
    >
      <Icon name="camera" size={28} />
      <span className={styles.photoPlaceholderLabel}>{label}</span>
    </div>
  );
}
