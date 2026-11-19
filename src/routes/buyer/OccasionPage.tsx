import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '@/api/client';
import { useI18n, type TranslationKey } from '@/i18n';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProductCard } from '@/components/buyer/ProductCard';
import { rankProducts } from '@/domain/ranking';
import { useAsync, useOnline } from '@/lib/useAsync';
import styles from '@/components/buyer/pages.module.css';

const LABELS: Record<string, TranslationKey> = {
  'party-tonight': 'occasion.name.party-tonight',
  farewell: 'occasion.name.farewell',
  'festive-kurta': 'occasion.name.festive-kurta',
  engagement: 'occasion.name.engagement',
  office: 'occasion.name.office',
};

/** Occasion hub: products ranked by availability, fit and ETA (section 6.1). */
export default function OccasionPage() {
  const { slug = '' } = useParams();
  const { t } = useI18n();
  const online = useOnline();
  const productsState = useAsync(() => api.listProducts({ occasion: slug }), `occasion:${slug}`);
  const shopsState = useAsync(() => api.listShops(), 'occasion-shops');
  const labelKey = LABELS[slug];

  const ranked = useMemo(() => {
    const shops = shopsState.data ?? [];
    return rankProducts(
      productsState.data ?? [],
      shops.map((shop) => ({
        id: shop.id,
        etaMin: shop.etaMin,
        distanceKm: shop.distanceKm,
        rating: shop.rating,
      })),
    );
  }, [productsState.data, shopsState.data]);

  const heading = labelKey ? t(labelKey) : slug;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Breadcrumb
          items={[{ label: t('breadcrumb.home'), to: '/' }, { label: heading }]}
        />
        <h1 className={styles.heading}>{heading}</h1>
        {!online ? <OfflineBanner lastUpdated={productsState.lastUpdated ?? undefined} /> : null}

        {productsState.loading && !ranked.length ? (
          <div className={`${styles.skeletonGrid} ${styles.skeletonTop}`} aria-busy="true">
            <Skeleton variant="card" count={4} />
          </div>
        ) : productsState.error && !ranked.length ? (
          <ErrorState message={productsState.error} onRetry={productsState.reload} />
        ) : ranked.length ? (
          <>
            <p className={styles.sectionNote} role="status">
              {t('occasion.items', { count: ranked.length })} · {t('occasion.rankedBy')}
            </p>
            <div className={`${styles.grid} ${styles.sectionGrid}`}>
              {ranked.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  shop={shopsState.data?.find((shop) => shop.id === product.shopId)}
                />
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            title={t('occasion.empty')}
            action={<Link to="/search" className={styles.link}>{t('nav.search')}</Link>}
          />
        )}
      </div>
    </main>
  );
}
