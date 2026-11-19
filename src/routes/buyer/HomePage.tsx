import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '@/api/client';
import { useI18n } from '@/i18n';
import { Icon } from '@/components/icons/Icon';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Img } from '@/components/ui/Img';
import { Marquee } from '@/components/ui/Marquee';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { Rating } from '@/components/ui/Rating';
import { Skeleton } from '@/components/ui/Skeleton';
import { EtaCard } from '@/components/buyer/EtaCard';
import { OccasionHub } from '@/components/buyer/OccasionHub';
import { ProductCard } from '@/components/buyer/ProductCard';
import { OCCASION_SLUGS } from '@/domain/config';
import { loadHomeCache, saveHomeCache, type HomeCache } from '@/lib/homeCache';
import { useAsync, useOnline } from '@/lib/useAsync';
import styles from '@/components/buyer/pages.module.css';

/** Theme-led home page with a cached offline snapshot (BUY-01, BUY-15). */
export default function HomePage() {
  const { t } = useI18n();
  const location = useLocation();
  const online = useOnline();
  const productsState = useAsync(() => api.listProducts(), 'home-products');
  const shopsState = useAsync(() => api.listShops(), 'home-shops');
  const [cached, setCached] = useState<HomeCache | null>(null);

  useEffect(() => {
    if (productsState.error || shopsState.error) {
      void loadHomeCache().then(setCached);
    }
  }, [productsState.error, shopsState.error]);

  useEffect(() => {
    if (productsState.data && shopsState.data) {
      void saveHomeCache({ products: productsState.data, shops: shopsState.data });
    }
  }, [productsState.data, shopsState.data]);

  const products = productsState.data ?? cached?.products ?? [];
  const shops = shopsState.data ?? cached?.shops ?? [];
  const failed = Boolean(productsState.error || shopsState.error);
  const lastUpdated = products.length && !failed ? productsState.lastUpdated : cached?.updatedAt;
  const shopOf = (shopId: string) => shops.find((shop) => shop.id === shopId);
  const categories = [...new Set(products.map((product) => product.category))];
  const etaItems = products.filter((product) => product.stockLeft > 0).slice(0, 4);

  if (productsState.loading && !products.length) {
    return (
      <main className={styles.page} aria-busy="true">
        <div className={styles.container}>
          <Skeleton width="55%" height={40} />
          <div className={`${styles.skeletonGrid} ${styles.skeletonTop}`}>
            <Skeleton variant="card" count={4} />
          </div>
        </div>
      </main>
    );
  }

  if (failed && !products.length) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.heading}>{t('route.home')}</h1>
          <ErrorState message={productsState.error ?? shopsState.error ?? t('common.error')} onRetry={productsState.reload} />
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {(location.state as { guest?: boolean } | null)?.guest ? (
          <p className={styles.banner} role="note">
            <Icon name="pin" size={18} /> {t('auth.guestLocationNote')}
          </p>
        ) : null}

        {!online || failed ? (
          <OfflineBanner lastUpdated={lastUpdated ?? undefined} />
        ) : null}

        <section className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>{t('app.name')}</p>
            <h1 className={styles.heroTitle}>{t('home.heroTitle')}</h1>
            <p className={styles.heroBody}>{t('home.heroBody')}</p>
            <div className={styles.actions}>
              <Link to="/search" className={styles.outlinePill}>
                {t('home.shopNow')}
              </Link>
            </div>
            <div className={styles.heroStats}>
              <div className={styles.stat}>
                <span className={styles.statNumber}>{shops.length || '120+'}</span>
                <span className={styles.small}>{t('home.statShops')}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>{products.length}</span>
                <span className={styles.small}>{t('home.statItems')}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>12k</span>
                <span className={styles.small}>{t('home.statBuyers')}</span>
              </div>
            </div>
          </div>
          <div>
            <div className={styles.sparkles} aria-hidden="true">
              <Icon name="sparkle" size={40} />
              <Icon name="sparkle" size={24} />
            </div>
            {products[0] ? (
              <Img image={products[0].images[0] ?? { url: null, alt: products[0].title, tone: 'sand', width: 800, height: 900 }} priority />
            ) : null}
          </div>
        </section>
      </div>

      <div className={styles.band}>
        <Marquee items={shops.map((shop) => shop.name)} label={t('a11y.marquee')} />
      </div>

      <div className={styles.container}>
        <section className={styles.section}>
          <h2 className={`${styles.heading} ${styles.center}`}>{t('home.needToday')}</h2>
          <p className={`${styles.sectionNote} ${styles.center}`}>{t('home.needTodayHelp')}</p>
          {etaItems.length ? (
            <div className={`${styles.gridWide} ${styles.sectionGrid}`}>
              {etaItems.map((product) => {
                const shop = shopOf(product.shopId);
                return shop ? <EtaCard key={product.id} product={product} shop={shop} /> : null;
              })}
            </div>
          ) : (
            <EmptyState title={t('search.noResults')} />
          )}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('home.occasions')}</h2>
          <div className={styles.grid}>
            {OCCASION_SLUGS.map((slug, index) => (
              <OccasionHub key={slug} slug={slug} index={index} />
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('home.categories')}</h2>
          <div className={styles.row}>
            {categories.map((category) => (
              <Link key={category} to={`/search?category=${encodeURIComponent(category)}`} className={styles.pill}>
                {category}
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('nav.search')}</h2>
          <Link to="/search" className={styles.card}>
            <Icon name="search" size={22} /> {t('home.searchEntry')}
          </Link>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>{t('home.nearby')}</h2>
            <Link to="/search" className={styles.link}>{t('common.viewAll')}</Link>
          </div>
          <p className={styles.sectionNote}>{t('home.nearbyHelp')}</p>
          <div className={`${styles.gridWide} ${styles.sectionGrid}`}>
            {shops.map((shop) => (
              <Link key={shop.id} to={`/shop/${shop.id}`} className={`${styles.card} ${styles.etaCard}`}>
                <span className={styles.etaThumb}>
                  <Img image={shop.image} />
                </span>
                <span className={styles.etaMeta}>
                  <span className={styles.bold}>{shop.name}</span>
                  <span className={styles.small}>{shop.area} · {shop.distanceKm} km</span>
                  <Rating value={shop.rating} count={shop.reviewCount} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('home.liveStock')}</h2>
          <div className={styles.grid}>
            {products.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} shop={shopOf(product.shopId)} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
