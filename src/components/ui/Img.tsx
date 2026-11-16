import type { Image as ApiImage } from '@/api/types';
import { cx } from '@/lib/cx';
import { PhotoPlaceholder } from './PhotoPlaceholder';
import styles from './chrome.module.css';

export interface ImgProps {
  image: ApiImage;
  /** Responsive sizes attribute for the browser's srcset picker. */
  sizes?: string;
  className?: string;
  /** Prioritise the hero image instead of lazy loading it. */
  priority?: boolean;
}

/**
 * Every image in the API is { url, alt, tone, width, height }. While url is
 * null the placeholder keeps the aspect ratio, so nothing shifts when the
 * shop uploads a real photo.
 */
export function Img({ image, sizes, className, priority = false }: ImgProps) {
  const ratio = `${image.width} / ${image.height}`;

  return (
    <div className={cx(styles.imgFrame, className)} style={{ aspectRatio: ratio }}>
      {image.url ? (
        <img
          className={styles.img}
          src={image.url}
          srcSet={image.srcSet}
          sizes={sizes}
          alt={image.alt}
          width={image.width}
          height={image.height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
        />
      ) : (
        <PhotoPlaceholder
          label={image.alt}
          tone={image.tone}
          width={image.width}
          height={image.height}
        />
      )}
    </div>
  );
}
