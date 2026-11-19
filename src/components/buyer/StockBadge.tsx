import type { Product, Shop, Variant } from '@/api/types';
import { useI18n } from '@/i18n';
import { formatDistance, formatTime } from '@/lib/format';
import { Icon } from '@/components/icons/Icon';
import styles from './flow.module.css';

interface Props {
  product: Product;
  shop: Shop;
  variant?: Variant;
}

/** Live stock uses the API timestamp, never the render time. */
export function StockBadge({ product, shop, variant }: Props) {
  const { t } = useI18n();
  const count = variant?.quantity ?? product.stockLeft;

  return (
    <span className={`${styles.badge} ${count === 0 ? styles.badgeSale : ''}`}>
      <Icon name="pin" size={16} />
      {t('product.stock', {
        count,
        distance: formatDistance(shop.distanceKm),
        time: formatTime(product.stockCheckedAt),
      })}
    </span>
  );
}
