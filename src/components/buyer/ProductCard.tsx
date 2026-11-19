import { Link } from 'react-router-dom';
import type { Product, Shop } from '@/api/types';
import { useI18n } from '@/i18n';
import { Icon } from '@/components/icons/Icon';
import { Img } from '@/components/ui/Img';
import { PriceTag } from '@/components/ui/PriceTag';
import { Rating } from '@/components/ui/Rating';
import { formatEta, formatTime } from '@/lib/format';
import styles from './pages.module.css';

export interface ProductCardProps {
  product: Product;
  shop?: Shop;
  /** Prioritise above-the-fold images on the home hero row. */
  priority?: boolean;
}

/** Compact product tile used by home, search, occasion and shop screens. */
export function ProductCard({ product, shop, priority = false }: ProductCardProps) {
  const { t } = useI18n();
  const variant = product.variants[0];

  return (
    <article className={styles.card}>
      <Link to={`/product/${product.id}`} aria-label={product.title}>
        <Img
          image={product.images[0] ?? {
            url: null,
            alt: product.title,
            tone: 'grey',
            width: 800,
            height: 800,
          }}
          sizes="(min-width: 1024px) 280px, (min-width: 640px) 200px, 45vw"
          priority={priority}
          className={styles.productImg}
        />
      </Link>
      <div className={styles.productBody}>
        <Link to={`/product/${product.id}`} className={styles.bold}>
          {product.title}
        </Link>
        {shop ? (
          <Link to={`/shop/${shop.id}`} className={styles.productShop}>
            {shop.name}
          </Link>
        ) : null}
        <Rating value={product.rating} count={product.reviewCount} />
        <PriceTag pricePaise={variant?.pricePaise ?? 0} mrpPaise={variant?.mrpPaise} />
        <p className={`${styles.small} ${styles.stockText}`}>
          <span className={styles.stockDot} aria-hidden="true" />
          {t('product.stock', {
            count: product.stockLeft,
            distance: shop ? `${shop.distanceKm.toFixed(1)} km` : '—',
            time: formatTime(product.stockCheckedAt),
          })}
        </p>
        {shop ? (
          <p className={styles.small}>
            <Icon name="truck" size={14} /> {t('product.eta', { window: formatEta(...shop.etaMin) })}
          </p>
        ) : null}
        <p className={styles.productShop}>
          {product.fitTags.join(' · ')}{' '}
          <Link to={`/product/${product.id}`} className={styles.link}>
            {t('product.sizeGuide')}
          </Link>
        </p>
      </div>
    </article>
  );
}
