import { useI18n } from '@/i18n';
import type { Product } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { RadioPills } from '@/components/ui/RadioPills';
import { RangeSlider } from '@/components/ui/RangeSlider';
import { formatPaise } from '@/lib/format';
import styles from './pages.module.css';

export interface FilterValues {
  price: [number, number];
  colours: string[];
  sizes: string[];
  distanceKm: number;
  etaMin: number;
  fitTags: string[];
}

// eslint-disable-next-line react-refresh/only-export-components
export function defaultFilters(): FilterValues {
  return { price: [0, 5000], colours: [], sizes: [], distanceKm: 0, etaMin: 0, fitTags: [] };
}

export interface SearchFiltersProps {
  value: FilterValues;
  onChange: (value: FilterValues) => void;
  products: readonly Product[];
  onApply?: () => void;
  onClear?: () => void;
}

function toggle(list: string[], item: string): string[] {
  return list.includes(item) ? list.filter((entry) => entry !== item) : [...list, item];
}

/** Bordered filter panel from the theme's category page. */
export function SearchFilters({ value, onChange, products, onApply, onClear }: SearchFiltersProps) {
  const { t } = useI18n();
  const colours = [...new Map(
    products.flatMap((product) =>
      product.variants.map((variant) => [variant.colour, variant.colourHex] as const),
    ),
  )].map(([name, hex]) => ({ name, hex: String(hex) }));
  const sizes = [...new Set(products.flatMap((product) => product.variants.map((variant) => variant.size)))];
  const fits = [...new Set(products.flatMap((product) => product.fitTags))];

  return (
    <div className={styles.filters}>
      <div className={styles.filterGroup}>
        <span className={styles.filterLabel}>{t('search.price')}</span>
        <RangeSlider
          min={0}
          max={5000}
          step={100}
          value={value.price}
          label={t('search.price')}
          formatValue={(rupees) => formatPaise(rupees * 100)}
          onChange={(price) => onChange({ ...value, price })}
        />
      </div>

      <div className={styles.filterGroup}>
        <span className={styles.filterLabel}>{t('search.colour')}</span>
        <div className={styles.swatches} role="group" aria-label={t('search.colour')}>
          {colours.map((colour) => (
            <button
              type="button"
              key={colour.name}
              className={`${styles.swatch} ${value.colours.includes(colour.name) ? styles.swatchActive : ''}`}
              aria-pressed={value.colours.includes(colour.name)}
              aria-label={colour.name}
              title={colour.name}
              onClick={() => onChange({ ...value, colours: toggle(value.colours, colour.name) })}
            >
              <span style={{ background: colour.hex, display: 'block', width: '100%', height: '100%', borderRadius: '50%' }} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      <div className={styles.filterGroup}>
        <span className={styles.filterLabel}>{t('search.size')}</span>
        <div className={styles.row}>
          {sizes.map((size) => (
            <button
              type="button"
              key={size}
              className={`${styles.pill} ${value.sizes.includes(size) ? styles.pillActive : ''}`}
              aria-pressed={value.sizes.includes(size)}
              onClick={() => onChange({ ...value, sizes: toggle(value.sizes, size) })}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <RadioPills
        legend={t('search.distance')}
        name="distance"
        value={String(value.distanceKm)}
        options={[
          { value: '0', label: t('common.all') },
          { value: '2', label: '≤ 2 km' },
          { value: '5', label: '≤ 5 km' },
          { value: '10', label: '≤ 10 km' },
        ]}
        onChange={(next) => onChange({ ...value, distanceKm: Number(next) })}
      />

      <RadioPills
        legend={t('search.eta')}
        name="eta"
        value={String(value.etaMin)}
        options={[
          { value: '0', label: t('common.all') },
          { value: '45', label: '≤ 45 min' },
          { value: '60', label: '≤ 60 min' },
        ]}
        onChange={(next) => onChange({ ...value, etaMin: Number(next) })}
      />

      <div className={styles.filterGroup}>
        <span className={styles.filterLabel}>{t('search.fit')}</span>
        <div className={styles.row}>
          {fits.map((fit) => (
            <button
              type="button"
              key={fit}
              className={`${styles.pill} ${value.fitTags.includes(fit) ? styles.pillActive : ''}`}
              aria-pressed={value.fitTags.includes(fit)}
              onClick={() => onChange({ ...value, fitTags: toggle(value.fitTags, fit) })}
            >
              {fit}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.row}>
        {onApply ? <Button className={styles.outlinePill} onClick={onApply}>{t('search.apply')}</Button> : null}
        {onClear ? (
          <button type="button" className={styles.link} onClick={onClear}>
            {t('search.clearFilters')}
          </button>
        ) : null}
      </div>
    </div>
  );
}
