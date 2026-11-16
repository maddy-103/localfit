import { useState } from 'react';
import { useI18n } from '@/i18n';
import { formatPaise } from '@/lib/format';
import {
  Img,
  PhotoPlaceholder,
  PriceTag,
  QuantityStepper,
  RangeSlider,
  Rating,
  SwatchPicker,
} from '@/components/ui';
import type { ImageTone } from '@/api/types';
import { StyleSection } from './StyleSection';
import styles from './style.module.css';

const TONES: ImageTone[] = ['sand', 'rose', 'sage', 'sky', 'lilac', 'grey'];

const SWATCHES = [
  { name: 'Ivory', hex: '#EFE6D8' },
  { name: 'Rose', hex: '#D9A5A5' },
  { name: 'Sage', hex: '#B7C6B1' },
  { name: 'Indigo', hex: '#3C4A63' },
];

export function DataSection() {
  const { t } = useI18n();
  const [quantity, setQuantity] = useState(2);
  const [swatch, setSwatch] = useState('Rose');
  const [range, setRange] = useState<[number, number]>([1500, 15000]);

  return (
    <>
      <StyleSection title={t('style.rating')}>
        <div className={styles.row}>
          <Rating value={4.5} count={128} />
          <Rating value={3.2} count={41} />
          <Rating value={5} />
          <Rating value={2.5} compact />
          <PriceTag pricePaise={189900} mrpPaise={249900} />
          <PriceTag pricePaise={129900} />
        </div>
      </StyleSection>

      <StyleSection title={t('style.quantity')}>
        <div className={styles.columns}>
          <div className={styles.stack}>
            <div className={styles.row}>
              <QuantityStepper value={quantity} onChange={setQuantity} label={t('nav.bag')} />
              <QuantityStepper value={1} onChange={() => undefined} min={1} max={1} />
              <QuantityStepper value={5} onChange={() => undefined} disabled />
            </div>
            <SwatchPicker
              swatches={SWATCHES}
              value={swatch}
              onChange={setSwatch}
              label={t('style.sampleLegend')}
            />
          </div>
          <div className={styles.stack}>
            <p className={styles.caption}>{t('img.placeholder')}</p>
            <div className={styles.row}>
              {TONES.map((tone) => (
                <div key={tone} style={{ width: 96 }}>
                  <PhotoPlaceholder
                    label={tone}
                    tone={tone}
                    width={1}
                    height={1}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </StyleSection>

      <StyleSection title={t('style.slider')}>
        <div className={styles.stack}>
          <RangeSlider
            min={0}
            max={20000}
            step={500}
            value={range}
            onChange={setRange}
            label={t('range.label')}
            formatValue={(value) => formatPaise(value * 100)}
          />
        </div>
      </StyleSection>

      <StyleSection title={t('style.offline')}>
        <div className={styles.row}>
          <div style={{ width: 180 }}>
            <Img
              image={{
                url: null,
                alt: t('style.photoLabel'),
                tone: 'sand',
                width: 800,
                height: 800,
              }}
            />
          </div>
          <div style={{ width: 240 }}>
            <Img
              image={{
                url: null,
                alt: t('photo.placeholder'),
                tone: 'rose',
                width: 800,
                height: 1000,
              }}
            />
          </div>
        </div>
      </StyleSection>
    </>
  );
}
