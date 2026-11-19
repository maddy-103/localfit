import { Link } from 'react-router-dom';
import { api } from '@/api/client';
import { useI18n } from '@/i18n';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Img } from '@/components/ui/Img';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { PriceTag } from '@/components/ui/PriceTag';
import { Skeleton } from '@/components/ui/Skeleton';
import { Toggle } from '@/components/ui/Toggle';
import { useAppStore } from '@/store/appStore';
import { useAsync, useOnline } from '@/lib/useAsync';
import styles from '@/components/buyer/pages.module.css';

/** Saved items and sizes; alerts are honest phase-2 placeholders (BUY-12). */
export default function WishlistPage() {
  const { t } = useI18n();
  const online = useOnline();
  const wishlist = useAppStore((state) => state.wishlist);
  const sizes = useAppStore((state) => state.wishlistSizes);
  const toggleWishlist = useAppStore((state) => state.toggleWishlist);
  const { data, error, loading, lastUpdated, reload } = useAsync(() => api.listProducts(), 'wishlist');
  const saved = (data ?? []).filter((product) => wishlist.includes(product.id));

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Breadcrumb items={[{ label: t('breadcrumb.home'), to: '/' }, { label: t('wishlist.title') }]} />
        <h1 className={styles.heading}>{t('wishlist.title')}</h1>
        {!online ? <OfflineBanner lastUpdated={lastUpdated ?? undefined} /> : null}

        {loading && !data ? (
          <div className={`${styles.skeletonGrid} ${styles.skeletonTop}`} aria-busy="true"><Skeleton variant="card" count={4} /></div>
        ) : error && !data ? (
          <ErrorState message={error} onRetry={reload} />
        ) : saved.length ? (
          <div className={`${styles.grid} ${styles.sectionGrid}`}>
            {saved.map((product) => {
              const savedSize = sizes[product.id];
              return (
              <article key={product.id} className={styles.card}>
                <Link to={`/product/${product.id}`}>
                  <Img image={product.images[0] ?? { url: null, alt: product.title, tone: 'grey', width: 800, height: 800 }} className={styles.productImg} />
                </Link>
                <div className={styles.productBody}>
                  <Link to={`/product/${product.id}`} className={styles.bold}>{product.title}</Link>
                  <PriceTag pricePaise={product.variants[0]?.pricePaise ?? 0} />
                  {savedSize ? (
                    <p className={styles.small}>{t('wishlist.savedSize', { size: savedSize })}</p>
                  ) : null}
                  <p className={styles.small}>{t('wishlist.alerts')}</p>
                  <Toggle label={`${t('wishlist.backInStock')} · ${t('stub.phase2')}`} checked={false} disabled onChange={() => undefined} />
                  <Toggle label={`${t('wishlist.priceDrop')} · ${t('stub.phase2')}`} checked={false} disabled onChange={() => undefined} />
                  <div className={styles.row}>
                    <Link to={`/product/${product.id}`} className={styles.link}>{t('wishlist.view')}</Link>
                    <button type="button" className={styles.link} onClick={() => toggleWishlist(product.id)}>
                      {t('product.wishlistRemove')}
                    </button>
                  </div>
                </div>
              </article>
              );
            })}
          </div>
        ) : (
          <EmptyState title={t('wishlist.empty')} action={<Link to="/search" className={styles.link}>{t('nav.search')}</Link>} />
        )}
      </div>
    </main>
  );
}
