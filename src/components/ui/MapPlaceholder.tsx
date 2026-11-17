import { useI18n } from '@/i18n';
import styles from './surfaces.module.css';

export interface MapPlaceholderProps {
  /** Optional caption shown under the schematic. */
  caption?: string;
  /**
   * Where the rider is on the route, 0 at the shop and 1 at the door.
   * Omit on screens that are not tracking a live delivery.
   */
  progress?: number;
}

const ROUTE = [
  { x: 58, y: 118 },
  { x: 102, y: 118 },
  { x: 102, y: 60 },
  { x: 164, y: 60 },
  { x: 164, y: 102 },
  { x: 208, y: 102 },
];

/** Walks the polyline so the marker follows the drawn route, not a straight line. */
function pointAt(progress: number): { x: number; y: number } {
  const clamped = Math.min(1, Math.max(0, progress));
  const lengths = ROUTE.slice(1).map((point, index) => {
    const previous = ROUTE[index]!;
    return Math.hypot(point.x - previous.x, point.y - previous.y);
  });
  const total = lengths.reduce((sum, length) => sum + length, 0);
  let remaining = clamped * total;

  for (let index = 0; index < lengths.length; index += 1) {
    const length = lengths[index]!;
    if (remaining <= length || index === lengths.length - 1) {
      const from = ROUTE[index]!;
      const to = ROUTE[index + 1]!;
      const ratio = length === 0 ? 0 : Math.min(1, remaining / length);
      return {
        x: from.x + (to.x - from.x) * ratio,
        y: from.y + (to.y - from.y) * ratio,
      };
    }
    remaining -= length;
  }

  return ROUTE[ROUTE.length - 1]!;
}

/**
 * Schematic route map. No map provider or API key is used; a real map can
 * replace this component without touching any screen.
 */
export function MapPlaceholder({ caption, progress }: MapPlaceholderProps) {
  const { t } = useI18n();
  const rider = pointAt(progress ?? 0.55);

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
        <g transform={`translate(${rider.x} ${rider.y})`}>
          <circle r="9" fill="var(--ink)" />
          <path d="M-4 1v5l3-2h5l3 2v-5Z" fill="var(--bg)" />
        </g>

        <g fontSize="11" fontFamily="var(--font-body)" fill="var(--muted)">
          <text x="42" y="142">{t('map.shop')}</text>
          <text x={Math.min(250, Math.max(8, rider.x - 14))} y={rider.y - 14}>
            {t('map.rider')}
          </text>
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
