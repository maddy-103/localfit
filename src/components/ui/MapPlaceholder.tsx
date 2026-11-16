import { useI18n } from '@/i18n';
import styles from './surfaces.module.css';

export interface MapPlaceholderProps {
  /** Optional caption shown under the schematic. */
  caption?: string;
}

/**
 * Schematic route map. No map provider or API key is used; a real map can
 * replace this component without touching any screen.
 */
export function MapPlaceholder({ caption }: MapPlaceholderProps) {
  const { t } = useI18n();

  return (
    <figure style={{ margin: 0 }}>
      <svg
        className={styles.map}
        viewBox="0 0 320 200"
        role="img"
        aria-label={t('map.label')}
      >
        <title>{t('map.label')}</title>
        <rect x="0" y="0" width="320" height="200" fill="var(--soft)" />
        <g stroke="var(--line)" strokeWidth="1">
          <path d="M0 62h320M0 138h320M78 0v200M212 0v200" />
        </g>
        <g fill="var(--tile)">
          <rect x="10" y="12" width="56" height="38" rx="4" />
          <rect x="92" y="12" width="108" height="38" rx="4" />
          <rect x="226" y="12" width="84" height="38" rx="4" />
          <rect x="10" y="78" width="56" height="48" rx="4" />
          <rect x="92" y="78" width="108" height="48" rx="4" />
          <rect x="226" y="78" width="84" height="48" rx="4" />
          <rect x="10" y="154" width="56" height="36" rx="4" />
          <rect x="92" y="154" width="108" height="36" rx="4" />
          <rect x="226" y="154" width="84" height="36" rx="4" />
        </g>

        <path
          d="M58 118h44v-58h62v42h44"
          fill="none"
          stroke="var(--ink)"
          strokeWidth="1.5"
          strokeDasharray="5 4"
          strokeLinecap="round"
        />
        <circle cx="58" cy="118" r="7" fill="var(--ink)" />
        <circle cx="208" cy="102" r="7" fill="var(--bg)" stroke="var(--ink)" strokeWidth="2" />
        <path d="M222 94v16l-7-4h14l-7 4Z" fill="var(--ink)" transform="translate(-7 0)" />

        <g fontSize="11" fontFamily="var(--font-body)" fill="var(--muted)">
          <text x="42" y="142">{t('map.shop')}</text>
          <text x="192" y="80">{t('map.rider')}</text>
          <text x="238" y="132">{t('map.destination')}</text>
        </g>
      </svg>
      {caption ? (
        <figcaption style={{ marginTop: 'var(--space-2)', color: 'var(--muted)', fontSize: 'var(--fs-small)' }}>
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
