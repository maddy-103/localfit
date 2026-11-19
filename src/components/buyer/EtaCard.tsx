import { Link } from 'react-router-dom';
import type { Product, Shop } from '@/api/types';
import { useI18n } from '@/i18n';
import { Icon } from '@/components/icons/Icon';
import { Img } from '@/components/ui/Img';
import { formatEta } from '@/lib/format';
import styles from './pages.module.css';

export interface EtaCardProps {
  product: Product;
  shop: Shop;
}

/** One card in the home "Need it today" live ETA strip. */
export function EtaCard({ product, shop }: EtaCardProps) {
  const { t } = useI18n();

  return (
    <Link to={`/product/${product.id}`} className={styles.etaCard}>
      <span className={styles.etaThumb}>
        <Img image={product.images[0] ?? { url: null, alt: product.title, tone: 'sand', width: 120, height: 120 }} />
      </span>
      <span className={styles.etaMeta}>
        <span className={`${styles.small} ${styles.muted}`}>{shop.name}</span>
        <span className={`${styles.small} ${styles.truncate}`}>{product.title}</span>
        <span className={styles.small}>
          <Icon name="clock" size={14} /> {t('product.eta', { window: formatEta(...shop.etaMin) })}
        </span>
        <span className={`${styles.small} ${styles.stockText}`}>{t('home.liveStock')}</span>
      </span>
    </Link>
  );
}
