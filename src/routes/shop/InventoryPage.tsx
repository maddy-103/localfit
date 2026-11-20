import { useCallback, useEffect, useState } from 'react';
import { api } from '@/api/client';
import type { CounterSaleResultApi } from '@/api/types';
import { InventoryVariantRow } from '@/components/shop/InventoryVariantRow';
import { ShopStates } from '@/components/shop/ShopStates';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/icons/Icon';
import { useI18n } from '@/i18n';
import { formatDateTime } from '@/lib/format';
import { useAsync, useOnline } from '@/lib/useAsync';
import styles from './shop.module.css';

export default function InventoryPage() {
  const { t } = useI18n();
  const online = useOnline();
  const [result, setResult] = useState<CounterSaleResultApi | null>(null);
  const products = useAsync(() => api.listShopProducts(), 'shop-inventory');
  const conflicts = useAsync(() => api.listConflicts(), 'shop-conflicts');
  const { reload: reloadProducts } = products;
  const { reload: reloadConflicts } = conflicts;

  const reload = useCallback(() => {
    reloadProducts();
    reloadConflicts();
  }, [reloadProducts, reloadConflicts]);

  useEffect(() => api.subscribe('inventory', reload), [reload]);
  useEffect(() => api.subscribe('conflicts', reload), [reload]);
  useEffect(() => api.subscribe('bag', reload), [reload]);

  const rows = (products.data ?? []).flatMap((product) =>
    product.variants.map((variant) => ({ product, variant })),
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('shop.inventory.title')}</h1>
        <p className={styles.intro}>{t('shop.inventory.intro')}</p>
      </header>

      <ShopStates
        loading={products.loading || conflicts.loading}
        error={products.error ?? conflicts.error}
        empty={rows.length === 0}
        emptyTitle={t('shop.inventory.title')}
        emptyBody={t('shop.inventory.empty')}
        offline={!online}
        lastUpdated={products.lastUpdated}
        onRetry={reload}
      >
        {result?.conflict ? (
          <div className={`${styles.alert} ${styles.alertWarning}`} role="alert">
            <Icon name="alert" size={20} />
            <div className={styles.stack}>
              <strong>{t('shop.inventory.conflictTitle')}</strong>
              <span>{t('shop.inventory.conflictBody')}</span>
            </div>
          </div>
        ) : null}

        {(conflicts.data ?? []).filter((entry) => !entry.resolved).length > 0 ? (
          <Card padded>
            <div className={styles.stack}>
              <strong>{t('shop.dashboard.conflicts')}</strong>
              <ul className={styles.list}>
                {(conflicts.data ?? []).filter((entry) => !entry.resolved).map((entry) => (
                  <li className={styles.listItem} key={entry.id}>
                    <span>{t('shop.inventory.conflictBody')}</span>
                    <span className={styles.muted}>{formatDateTime(entry.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ) : null}

        <div className={styles.stack}>
          {rows.length === 0 ? <p className={styles.muted}>{t('shop.inventory.empty')}</p> : null}
          {rows.map(({ product, variant }) => (
            <InventoryVariantRow
              key={variant.id}
              product={product}
              variant={variant}
              onChanged={reload}
              onResult={setResult}
            />
          ))}
        </div>
      </ShopStates>
    </div>
  );
}
