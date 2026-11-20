import { Link, useParams } from 'react-router-dom';
import { api } from '@/api/client';
import { useI18n } from '@/i18n';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Icon } from '@/components/icons/Icon';
import { Img } from '@/components/ui/Img';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { Rating } from '@/components/ui/Rating';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProductCard } from '@/components/buyer/ProductCard';
import { useAsync, useOnline } from '@/lib/useAsync';
import styles from '@/components/buyer/pages.module.css';

/** Shop profile with verified badge, service details and its products. */
export default function ShopProfilePage() {
  const { id = '' } = useParams();
  const { t } = useI18n();
  const online = useOnline();
  const shopState = useAsync(() => api.getShop(id), `shop:${id}`);
  const productsState = useAsync(() => api.listProducts({ shopId: id }), `shop-products:${id}`);
  const shop = shopState.data;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Breadcrumb items={[{ label: t('breadcrumb.home'), to: '/' }, { label: t('route.shopProfile') }]} />

        {!online ? <OfflineBanner lastUpdated={shopState.lastUpdated ?? undefined} /> : null}

        {shopState.loading && !shop ? (
          <div aria-busy="true"><Skeleton variant="image" height={240} /><Skeleton variant="line" width="50%" /></div>
        ) : shopState.error || !shop ? (
          <ErrorState message={shopState.error ?? t('common.notFoundBody')} onRetry={shopState.reload} />
        ) : (
          <>
            <h1 className={styles.heading}>{shop.name}</h1>
            <div className={styles.hero}>
              <Img image={shop.image} sizes="(min-width: 768px) 50vw, 100vw" />
              <div className={styles.col}>
                <p className={styles.row}>
                  <Rating value={shop.rating} count={shop.reviewCount} />
                  {shop.verified ? (
                    <span className={styles.badgeRow}>
                      <Icon name="verified" size={16} /> {t('shop.verifiedHelp')}
                    </span>
                  ) : null}
                </p>
                <p className={styles.muted}>{shop.area}, {shop.city}</p>
                <p>{t('shop.distance', { distance: shop.distanceKm.toFixed(1) })}</p>
                <p>{t('shop.hours')}: {shop.hours}</p>
                <p>{t('shop.radius')}: {shop.serviceRadiusKm} {t('common.km')}</p>
                <div className={styles.actions}>
                  <a className={styles.outlinePill} href={`tel:${shop.phone.replace(/\s/g, '')}`}>
                    <Icon name="phone" size={16} /> {t('shop.call')}
                  </a>
                </div>
              </div>
            </div>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>{t('shop.products')}</h2>
              {productsState.loading && !productsState.data?.length ? (
                <div className={`${styles.skeletonGrid} ${styles.skeletonTop}`} aria-busy="true">
                  <Skeleton variant="card" count={4} />
                </div>
              ) : productsState.error && !productsState.data?.length ? (
                <ErrorState message={productsState.error} onRetry={productsState.reload} />
              ) : productsState.data?.length ? (
                <div className={styles.grid}>
                  {productsState.data.map((product) => (
                    <ProductCard key={product.id} product={product} shop={shop} />
                  ))}
                </div>
              ) : (
                <EmptyState title={t('search.noResults')} action={<Link to="/search" className={styles.link}>{t('nav.search')}</Link>} />
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
