import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/api/client';
import { useI18n } from '@/i18n';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { Select } from '@/components/ui/Select';
import { Sheet } from '@/components/ui/Sheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProductCard } from '@/components/buyer/ProductCard';
import { SearchFilters, defaultFilters, type FilterValues } from '@/components/buyer/SearchFilters';
import { useAsync, useOnline } from '@/lib/useAsync';
import styles from '@/components/buyer/pages.module.css';

interface SpeechResult {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechResult) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type SpeechCtor = new () => SpeechRecognitionLike;

function speechCtor(): SpeechCtor | null {
  const scope = window as unknown as {
    SpeechRecognition?: SpeechCtor;
    webkitSpeechRecognition?: SpeechCtor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

/** Text and voice search with the theme's category-page filter panel. */
export default function SearchPage() {
  const { t, lang } = useI18n();
  const online = useOnline();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const category = params.get('category') ?? '';
  const [text, setText] = useState(query);
  const [syncedQuery, setSyncedQuery] = useState(query);
  const [sort, setSort] = useState('relevance');
  const [draft, setDraft] = useState<FilterValues>(defaultFilters);
  const [filters, setFilters] = useState<FilterValues>(defaultFilters);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const productsState = useAsync(() => api.listProducts({ q: query || undefined }), `search:${query}`);
  const shopsState = useAsync(() => api.listShops(), 'search-shops');
  const products = useMemo(() => productsState.data ?? [], [productsState.data]);
  const shops = useMemo(() => shopsState.data ?? [], [shopsState.data]);
  const canListen = Boolean(speechCtor());

  useEffect(() => api.subscribe('inventory', productsState.reload), [productsState.reload]);

  // Keep the input in step when the URL changes (for example after voice search).
  if (query !== syncedQuery) {
    setSyncedQuery(query);
    setText(query);
  }

  const visible = useMemo(() => {
    const byShop = new Map(shops.map((shop) => [shop.id, shop]));
    const matches = products.filter((product) => {
      const shop = byShop.get(product.shopId);
      if (category && product.category !== category) return false;
      if (filters.colours.length && !product.variants.some((variant) => filters.colours.includes(variant.colour))) return false;
      if (filters.sizes.length && !product.variants.some((variant) => filters.sizes.includes(variant.size))) return false;
      if (filters.fitTags.length && !filters.fitTags.some((tag) => product.fitTags.includes(tag))) return false;
      const price = product.variants[0]?.pricePaise ?? 0;
      if (price < filters.price[0] * 100 || price > filters.price[1] * 100) return false;
      if (shop && filters.distanceKm && shop.distanceKm > filters.distanceKm) return false;
      if (shop && filters.etaMin && shop.etaMin[0] > filters.etaMin) return false;
      return true;
    });
    if (sort === 'price-asc') return [...matches].sort((a, b) => (a.variants[0]?.pricePaise ?? 0) - (b.variants[0]?.pricePaise ?? 0));
    if (sort === 'price-desc') return [...matches].sort((a, b) => (b.variants[0]?.pricePaise ?? 0) - (a.variants[0]?.pricePaise ?? 0));
    if (sort === 'eta') return [...matches].sort((a, b) => (byShop.get(a.shopId)?.etaMin[0] ?? 999) - (byShop.get(b.shopId)?.etaMin[0] ?? 999));
    return matches;
  }, [products, shops, category, filters, sort]);

  const updateQuery = (value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set('q', value);
    else next.delete('q');
    setParams(next, { replace: true });
  };

  const voiceSearch = () => {
    const Ctor = speechCtor();
    if (!Ctor) return;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setListening(false);
      return;
    }
    const recognition = new Ctor();
    recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
      if (transcript) updateQuery(transcript.trim());
    };
    recognition.onerror = () => { setListening(false); recognitionRef.current = null; };
    recognition.onend = () => { setListening(false); recognitionRef.current = null; };
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  const clearFilters = () => {
    setDraft(defaultFilters());
    setFilters(defaultFilters());
  };

  const applyFilters = () => {
    setFilters(draft);
    setSheetOpen(false);
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Breadcrumb items={[{ label: t('breadcrumb.home'), to: '/' }, { label: t('search.title') }]} />
        <h1 className={styles.heading}>{t('search.title')}</h1>

        {!online ? <OfflineBanner lastUpdated={productsState.lastUpdated ?? undefined} /> : null}

        <form
          className={styles.row}
          role="search"
          onSubmit={(event) => { event.preventDefault(); updateQuery(text); }}
        >
          <Input
            label={t('common.searchPlaceholder')}
            hideLabel
            value={text}
            onChange={(event) => setText(event.target.value)}
            className={styles.fieldFull}
          />
          <Button type="submit">{t('common.searchPlaceholder')}</Button>
          {canListen ? (
            <Button
              variant="outline"
              leftIcon="mic"
              aria-label={listening ? t('search.voiceStop') : t('search.voice')}
              onClick={voiceSearch}
            >
              {listening ? t('search.voiceStop') : t('search.voice')}
            </Button>
          ) : null}
          <div className={styles.filterMobile}>
            <Button variant="outline" leftIcon="sliders" onClick={() => setSheetOpen(true)}>
              {t('search.filters')}
            </Button>
          </div>
        </form>

        {productsState.loading && !products.length ? (
          <div className={`${styles.skeletonGrid} ${styles.skeletonTop}`} aria-busy="true">
            <Skeleton variant="card" count={4} />
          </div>
        ) : productsState.error && !products.length ? (
          <ErrorState message={productsState.error} onRetry={productsState.reload} />
        ) : (
          <>
            <div className={styles.resultsHead}>
              <p className={styles.small} role="status" aria-live="polite">
                {t('search.resultCount', { count: visible.length, total: products.length })}
              </p>
              <Select
                label={t('search.sort')}
                value={sort}
                options={[
                  { value: 'relevance', label: t('search.sortRelevance') },
                  { value: 'price-asc', label: t('search.sortPriceLow') },
                  { value: 'price-desc', label: t('search.sortPriceHigh') },
                  { value: 'eta', label: t('search.sortEta') },
                ]}
                onChange={(event) => setSort(event.target.value)}
              />
            </div>

            <div className={styles.filterLayout}>
              <aside className={styles.card} aria-label={t('search.filters')}>
                <SearchFilters value={draft} onChange={setDraft} products={products} onApply={applyFilters} onClear={clearFilters} />
              </aside>
              <div>
                {visible.length ? (
                  <div className={styles.grid}>
                    {visible.map((product, index) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        shop={shops.find((shop) => shop.id === product.shopId)}
                        priority={index < 4}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState title={t('search.noResults')} action={<Button variant="outline" onClick={clearFilters}>{t('search.clearFilters')}</Button>} />
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={t('search.filters')}
        footer={<Button size="lg" fullWidth onClick={applyFilters}>{t('search.apply')}</Button>}
      >
        <div className={styles.sheetFilters}>
          <SearchFilters value={draft} onChange={setDraft} products={products} />
        </div>
      </Sheet>
    </main>
  );
}
