import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '@/api/client';
import { ProductGallery } from '@/components/buyer/ProductGallery';
import { ProductShopCard } from '@/components/buyer/ProductShopCard';
import { ProductTabs } from '@/components/buyer/ProductTabs';
import { SizeGuideSheet } from '@/components/buyer/SizeGuideSheet';
import { SizePicker } from '@/components/buyer/SizePicker';
import { StockBadge } from '@/components/buyer/StockBadge';
import { TryTermsSheet } from '@/components/buyer/TryTermsSheet';
import { Icon } from '@/components/icons/Icon';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { PriceTag } from '@/components/ui/PriceTag';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { Rating } from '@/components/ui/Rating';
import { Skeleton } from '@/components/ui/Skeleton';
import { SwatchPicker } from '@/components/ui/SwatchPicker';
import { Toggle } from '@/components/ui/Toggle';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n';
import { useAppStore } from '@/store/appStore';
import { useAsync, useOnline } from '@/lib/useAsync';
import { formatEta } from '@/lib/format';
import flow from '@/components/buyer/flow.module.css';

export default function ProductPage() {
  const { id = '' } = useParams();
  const { t } = useI18n();
  const { toast } = useToast();
  const online = useOnline();
  const wishlist = useAppStore((state) => state.wishlist);
  const toggleWishlist = useAppStore((state) => state.toggleWishlist);
  const setBagCount = useAppStore((state) => state.setBagCount);
  const productState = useAsync(() => api.getProduct(id), id);
  const shopState = useAsync(() => api.listShops(), 'shops');

  const [colour, setColour] = useState('');
  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);
  const [tryAtDoor, setTryAtDoor] = useState(false);
  const [sizeError, setSizeError] = useState('');
  const [guideOpen, setGuideOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  const product = productState.data;
  const shop = shopState.data?.find((entry) => entry.id === product?.shopId);
  const colours = [...new Set(product?.variants.map((variant) => variant.colour) ?? [])];
  const activeColour = colour || colours[0] || '';
  const forColour = product?.variants.filter((variant) => variant.colour === activeColour) ?? [];
  const activeSize = size || forColour.find((variant) => variant.quantity > 0)?.size || forColour[0]?.size || '';
  const variant = forColour.find((entry) => entry.size === activeSize);
  const swatches = [...new Map(
    product?.variants.map((entry) => [entry.colour, { name: entry.colour, hex: entry.colourHex }]),
  ).values()];
  const saved = wishlist.includes(id);

  const add = async () => {
    if (!activeSize || !variant) {
      setSizeError(t('product.sizeError'));
      return;
    }
    if (variant.quantity <= 0) {
      setSizeError(t('product.outOfStock'));
      return;
    }
    setSizeError('');
    try {
      const bag = await api.addToBag({
        productId: id,
        variantId: variant.id,
        qty,
        tryAtDoor: tryAtDoor && Boolean(product?.tryAtDoorEligible && shop?.tryAtDoor),
      });
      setBagCount(bag.lines.length);
      toast(t('product.added'));
    } catch (error) {
      setSizeError(error instanceof Error ? error.message : t('common.error'));
    }
  };

  if (productState.loading && !product) {
    return (
      <main className={flow.container} aria-busy="true">
        <Skeleton width="40%" height={32} />
        <div className={flow.productGrid} style={{ marginTop: 'var(--space-5)' }}>
          <Skeleton variant="image" height={460} />
          <Skeleton variant="card" count={3} />
        </div>
      </main>
    );
  }

  if (productState.error || !product) {
    return (
      <main className={flow.container}>
        <h1>{t('route.product')}</h1>
        <ErrorState
          message={productState.error ?? t('common.notFoundBody')}
          onRetry={productState.reload}
        />
      </main>
    );
  }

  const first = product.variants[0];

  return (
    <main className={flow.page}>
      <div className={flow.container}>
        <nav className={flow.crumb} aria-label={t('a11y.breadcrumb')}>
          <Link to="/">{t('breadcrumb.home')}</Link>
          <Icon name="chevron-right" size={14} />
          <span>{product.category}</span>
        </nav>

        {!online ? <OfflineBanner lastUpdated={productState.lastUpdated ?? undefined} /> : null}

        <div className={flow.productGrid}>
          <ProductGallery images={product.images} label={product.title} />

          <div className={flow.info}>
            <h1 className={flow.title}>{product.title}</h1>
            <div className={flow.badgeRow}>
              <Rating value={product.rating} count={product.reviewCount} />
              {product.authenticityVerified ? (
                <span className={flow.badge}>
                  <Icon name="verified" size={16} /> {t('product.authentic')}
                </span>
              ) : null}
            </div>
            <PriceTag pricePaise={first?.pricePaise ?? 0} mrpPaise={first?.mrpPaise} />
            <p className={flow.muted}>{product.description}</p>

            {shop ? <StockBadge product={product} shop={shop} variant={variant} /> : null}
            <div className={flow.badgeRow}>
              {product.fitTags.map((tag) => (
                <span className={flow.badge} key={tag}>{tag}</span>
              ))}
              <button type="button" className={flow.link} onClick={() => setGuideOpen(true)}>
                {t('product.sizeGuide')}
              </button>
            </div>

            {shop ? (
              <div className={flow.etaBox}>
                <Icon name="truck" size={20} />
                <span>{t('product.eta', { window: formatEta(shop.etaMin[0], shop.etaMin[1]) })}</span>
              </div>
            ) : null}

            {shop ? <ProductShopCard shop={shop} /> : null}

            <div className={flow.section}>
              <span className={flow.label}>{t('product.selectColour')}</span>
              <SwatchPicker
                swatches={swatches}
                value={activeColour}
                onChange={(next) => { setColour(next); setSize(''); }}
                label={t('product.selectColour')}
              />
            </div>

            <SizePicker
              sizes={forColour.map((entry) => ({
                size: entry.size,
                disabled: entry.quantity <= 0,
              }))}
              value={activeSize}
              onChange={(next) => { setSize(next); setSizeError(''); }}
              errorMessage={sizeError}
            />

            {product.tryAtDoorEligible && shop?.tryAtDoor ? (
              <Toggle
                label={t('product.tryAtDoor')}
                description={t('product.tryAtDoorHint')}
                checked={tryAtDoor}
                onChange={(checked) => {
                  setTryAtDoor(checked);
                  if (checked) setTermsOpen(true);
                }}
              />
            ) : null}

            <div className={flow.buyRow}>
              <QuantityStepper
                value={qty}
                onChange={setQty}
                max={Math.max(1, variant?.quantity ?? 1)}
                label={t('product.quantity')}
              />
              <Button className={flow.buyButton} size="lg" onClick={() => void add()}>
                {t('product.addToBag')}
              </Button>
              <button
                type="button"
                className={flow.wishButton}
                aria-label={t(saved ? 'product.wishlistRemove' : 'product.wishlistAdd')}
                aria-pressed={saved}
                onClick={() => toggleWishlist(id)}
              >
                <Icon name="heart" size={22} />
              </button>
            </div>

            <ProductTabs description={product.description} />
          </div>
        </div>
      </div>

      <SizeGuideSheet
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        rows={product.sizeGuide}
      />
      <TryTermsSheet open={termsOpen} onClose={() => setTermsOpen(false)} />
    </main>
  );
}
