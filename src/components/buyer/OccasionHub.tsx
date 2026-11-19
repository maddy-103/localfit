import { Link } from 'react-router-dom';
import { useI18n, type TranslationKey } from '@/i18n';
import { Icon } from '@/components/icons/Icon';
import { Img } from '@/components/ui/Img';
import type { ImageTone } from '@/api/types';
import styles from './pages.module.css';

const LABELS: Record<string, TranslationKey> = {
  'party-tonight': 'occasion.name.party-tonight',
  farewell: 'occasion.name.farewell',
  'festive-kurta': 'occasion.name.festive-kurta',
  engagement: 'occasion.name.engagement',
  office: 'occasion.name.office',
};

const TONES: ImageTone[] = ['rose', 'lilac', 'sand', 'sky', 'sage'];

export interface OccasionHubProps {
  slug: string;
  index: number;
}

/** Clickable occasion card on the home page, in spec order (BUY-01). */
export function OccasionHub({ slug, index }: OccasionHubProps) {
  const { t } = useI18n();
  const labelKey = LABELS[slug];

  return (
    <Link to={`/occasion/${slug}`} className={styles.card}>
      <Img
        image={{
          url: null,
          alt: labelKey ? t(labelKey) : slug,
          tone: TONES[index % TONES.length] ?? 'grey',
          width: 400,
          height: 500,
        }}
        className={styles.productImg}
      />
      <div className={styles.productBody}>
        <span className={styles.bold}>{labelKey ? t(labelKey) : slug}</span>
        <span className={styles.small} aria-hidden="true">
          <Icon name="arrow-right" size={16} />
        </span>
      </div>
    </Link>
  );
}
