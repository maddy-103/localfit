import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import type { BagLine, Product, Shop } from '@/api/types';
import { BagLineRow } from '@/components/buyer/BagLineRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Icon } from '@/components/icons/Icon';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { deliveryFeePaise, FREE_DELIVERY_ABOVE_PAISE } from '@/domain/payments';
import { useI18n } from '@/i18n';
import { formatEta, formatPaise, formatRemaining } from '@/lib/format';
import { useNow } from '@/lib/useNow';
import { useAsync, useOnline } from '@/lib/useAsync';
import flow from '@/components/buyer/flow.module.css';

interface BagData {
  lines: BagLine[];
  reservedUntil: string | null;
  products: Product[];
  shops: Shop[];
}

interface Group {
  shop: Shop;
  lines: BagLine[];
  products: Product[];
}

export default function BagPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const online = useOnline();
  const now = useNow(1000);
  const [busyLine, setBusyLine] = useState<string | null>(null);

  const { data, error, loading, lastUpdated, reload } = useAsync<BagData>(
    async () => {
      const [bag, products, shops] = await Promise.all([
        api.getBag(),
        api.listProducts(),
        api.listShops(),
      ]);
      return { lines: bag.lines, reservedUntil: bag.reservedUntil, products, shops };
    },
    'bag',
  );

  useEffect(() => api.subscribe('bag', reload), [reload]);

  const groups = useMemo<Group[]>(() => {
    const result: Group[] = [];
    for (const line of data?.lines ?? []) {
      const product = data?.products.find((entry) => entry.id === line.productId);
      const shop = data?.shops.find((entry) => entry.id === product?.shopId);
      if (!product || !shop) continue;
      let group = result.find((entry) => entry.shop.id === shop.id);
      if (!group) {
        group = { shop, lines: [], products: [] };
        result.push(group);
      }
      group.lines.push(line);
      if (!group.products.some((entry) => entry.id === product.id)) group.products.push(product);
    }
    return result;
  }, [data]);

  const itemsPaise = useMemo(
    () =>
      (data?.lines ?? []).reduce((sum, line) => {
        const product = data?.products.find((entry) => entry.id === line.productId);
        const variant = product?.variants.find((entry) => entry.id === line.variantId);
        return sum + (variant?.pricePaise ?? 0) * line.qty;
      }, 0),
    [data],
  );
  const fee = deliveryFeePaise(itemsPaise);
  const remainingMs = data?.reservedUntil ? Date.parse(data.reservedUntil) - now : 0;

  if (loading && !data) {
    return (
      <main className={flow.page}>
        <div className={flow.container}>
          <h1>{t('nav.bag')}</h1>
          <Skeleton variant="line" width="30%" height={36} />
          <Skeleton variant="card" count={3} />
        </div>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className={flow.page}>
        <div className={flow.container}>
          <h1>{t('nav.bag')}</h1>
          <ErrorState message={error} onRetry={reload} />
        </div>
      </main>
    );
  }

  if (!data || data.lines.length === 0) {
    return (
      <main className={flow.page}>
        <div className={flow.container}>
          <h1>{t('nav.bag')}</h1>
          <EmptyState
            title={t('bag.emptyTitle')}
            body={t('bag.emptyBody')}
            action={
              <Button onClick={() => navigate('/search')}>{t('bag.emptyAction')}</Button>
            }
          />
        </div>
      </main>
    );
  }

  const runAction = async (lineId: string, work: () => Promise<unknown>) => {
    setBusyLine(lineId);
    try {
      await work();
      reload();
    } finally {
      setBusyLine(null);
    }
  };

  return (
    <main className={flow.page}>
      <div className={flow.container}>
        {!online ? <OfflineBanner lastUpdated={lastUpdated ?? undefined} /> : null}
        <h1>{t('nav.bag')}</h1>
        <div className={flow.hold} aria-live="polite">
          <Icon name="clock" size={18} />
          <span>
            {t('bag.hold')} · {formatRemaining(remainingMs)}
          </span>
        </div>
        {remainingMs < 60_000 ? (
          <p className={flow.notice}>{t('bag.expiresSoon', { time: formatRemaining(remainingMs) })}</p>
        ) : null}

        <div className={flow.bagLayout}>
          <div className={flow.stack}>
            {groups.map((group) => (
              <section className={flow.groupCard} key={group.shop.id} aria-labelledby={`shop-${group.shop.id}`}>
                <header className={flow.groupHead}>
                  <div>
                    <h2 id={`shop-${group.shop.id}`}>{group.shop.name}</h2>
                    <p className={flow.hint}>
                      {t('bag.separate')} · {group.shop.area}
                    </p>
                  </div>
                  <span className={flow.badge}>
                    {t('bag.eta', { window: formatEta(...group.shop.etaMin) })}
                  </span>
                </header>
                <ul className={flow.lineList}>
                  {group.lines.map((line) => {
                    const product = group.products.find(
                      (entry) => entry.id === line.productId,
                    );
                    if (!product) return null;
                    return (
                      <BagLineRow
                        key={line.id}
                        line={line}
                        product={product}
                        busy={busyLine === line.id}
                        onQuantity={(qty) =>
                          runAction(line.id, () => api.updateBagLine(line.id, { qty }))
                        }
                        onTryAtDoor={(tryAtDoor) =>
                          runAction(line.id, () => api.updateBagLine(line.id, { tryAtDoor }))
                        }
                        onRemove={() => runAction(line.id, () => api.removeBagLine(line.id))}
                      />
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>

          <aside className={flow.summary} aria-label={t('bag.summary')}>
            <h2 className={flow.cardTitle}>{t('bag.summary')}</h2>
            <div className={flow.summaryRow}>
              <span>{t('bag.subtotal')}</span>
              <strong>{formatPaise(itemsPaise)}</strong>
            </div>
            <div className={flow.summaryRow}>
              <span>{t('bag.delivery')}</span>
              <strong>
                {fee === 0
                  ? t('bag.free')
                  : formatPaise(itemsPaise >= FREE_DELIVERY_ABOVE_PAISE ? 0 : fee)}
              </strong>
            </div>
            <div className={`${flow.summaryRow} ${flow.summaryTotal}`}>
              <span>{t('bag.total')}</span>
              <strong>{formatPaise(itemsPaise + fee)}</strong>
            </div>
            <Button size="lg" fullWidth onClick={() => navigate('/checkout')}>
              {t('bag.checkout')}
            </Button>
            <Link className={flow.link} to="/search">
              {t('common.viewAll')}
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
