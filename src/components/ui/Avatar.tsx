import { cx } from '@/lib/cx';
import { initials } from '@/lib/format';
import styles from './surfaces.module.css';

export interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'md' | 'lg';
}

export function Avatar({ name, src, size = 'md' }: AvatarProps) {
  return (
    <span className={cx(styles.avatar, size === 'lg' && styles.avatarLg)} title={name}>
      {src ? (
        <img
          className={styles.avatarImage}
          src={src}
          alt=""
          width={size === 'lg' ? 56 : 40}
          height={size === 'lg' ? 56 : 40}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
      <span className="u-visually-hidden">{name}</span>
    </span>
  );
}
