import type { Image as ApiImage } from '@/api/types';
import { cx } from '@/lib/cx';
import { PhotoPlaceholder } from './PhotoPlaceholder';
import styles from './chrome.module.css';

const IMAGE_BASE = (import.meta.env.VITE_IMAGE_BASE as string | undefined)?.replace(/\/$/, '') ?? '';

function resolveUrl(url: string): string {
  const absolute = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(url) || url.startsWith('data:');
  if (!IMAGE_BASE || absolute) return url;
  return `${IMAGE_BASE}/${url.replace(/^\//, '')}`;
}

function resolveSrcSet(srcSet?: string): string | undefined {
  if (!srcSet) return undefined;
  return srcSet
    .split(',')
    .map((candidate) => {
      const [url, ...descriptors] = candidate.trim().split(/\s+/);
      return url ? [resolveUrl(url), ...descriptors].join(' ') : candidate.trim();
    })
    .join(', ');
}

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
          src={resolveUrl(image.url)}
          srcSet={resolveSrcSet(image.srcSet)}
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
