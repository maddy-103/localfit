import { useState } from 'react';
import type { Image } from '@/api/types';
import { Img } from '@/components/ui/Img';
import { useI18n } from '@/i18n';
import { cx } from '@/lib/cx';
import styles from './flow.module.css';

interface Props {
  images: Image[];
  label: string;
}

export function ProductGallery({ images, label }: Props) {
  const { t } = useI18n();
  const [active, setActive] = useState(0);
  const shown = images[active] ?? images[0];
  if (!shown) return null;

  return (
    <div className={styles.gallery}>
      <div className={styles.thumbs} role="group" aria-label={label}>
        {images.map((image, index) => (
          <button
            type="button"
            key={`${image.alt}-${index}`}
            className={cx(styles.thumb, index === active && styles.thumbActive)}
            aria-label={t('product.thumbnail', { index: index + 1 })}
            aria-pressed={index === active}
            onClick={() => setActive(index)}
          >
            <Img image={image} sizes="88px" />
          </button>
        ))}
      </div>
      <div className={styles.heroImage}>
        <Img image={shown} sizes="(max-width: 767px) 100vw, 640px" priority />
      </div>
    </div>
  );
}
