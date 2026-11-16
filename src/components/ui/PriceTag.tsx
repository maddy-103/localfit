import { useI18n } from '@/i18n';
import { formatPaise, percentOff } from '@/lib/format';
import styles from './chrome.module.css';

export interface PriceTagProps {
  pricePaise: number;
  mrpPaise?: number;
  /** Show the red "% OFF" pill when the MRP is higher. */
  showOff?: boolean;
}

export function PriceTag({ pricePaise, mrpPaise, showOff = true }: PriceTagProps) {
  const { t } = useI18n();
  const off = mrpPaise ? percentOff(pricePaise, mrpPaise) : 0;

  return (
    <span className={styles.priceTag}>
      <span className={styles.price}>{formatPaise(pricePaise)}</span>
      {mrpPaise && mrpPaise > pricePaise ? (
        <span className={styles.mrp}>{formatPaise(mrpPaise)}</span>
      ) : null}
      {showOff && off > 0 ? (
        <span className={styles.offPill}>{t('price.off', { percent: off })}</span>
      ) : null}
    </span>
  );
}
