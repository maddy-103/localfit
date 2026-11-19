import { Link } from 'react-router-dom';
import type { Shop } from '@/api/types';
import { Rating } from '@/components/ui/Rating';
import { Icon } from '@/components/icons/Icon';
import { useI18n } from '@/i18n';
import { formatDistance } from '@/lib/format';
import styles from './flow.module.css';

interface Props {
  shop: Shop;
}

export function ProductShopCard({ shop }: Props) {
  const { t } = useI18n();

  return (
    <div className={styles.shopCard}>
      <div className={styles.shopMeta}>
        <strong>{shop.name}</strong>
        <Rating value={shop.rating} count={shop.reviewCount} compact />
        <span className={styles.small}>
          {shop.area} · {formatDistance(shop.distanceKm)} · {shop.hours}
        </span>
      </div>
      <Link className={styles.link} to={`/shop/${shop.id}`}>
        {t('product.shopLink')}
        <Icon name="chevron-right" size={16} />
      </Link>
    </div>
  );
}
