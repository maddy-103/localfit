import { useEffect, useState, type ChangeEvent } from 'react';
import { api } from '@/api/client';
import type { Order } from '@/api/types';
import { SHOP_ACTOR } from '@/components/shop/actor';
import { ShopStates } from '@/components/shop/ShopStates';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { StatusChip } from '@/components/ui/StatusChip';
import { useToast } from '@/components/ui/Toast';
import { RETURN_DISPUTE_REASONS } from '@/domain/shop';
import { useI18n, type TranslationKey } from '@/i18n';
import { formatDateTime } from '@/lib/format';
import { useAsync, useOnline } from '@/lib/useAsync';
import styles from './shop.module.css';

export default function ReturnsPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const online = useOnline();
  const [photos, setPhotos] = useState<Record<string, string[]>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const returns = useAsync(() => api.listReturnOrders(), 'shop-returns');

  const { reload } = returns;
  useEffect(() => api.subscribe('orders', reload), [reload]);

  const setPhoto = (order: Order, index: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotos((current) => {
      const next = [...(current[order.id] ?? [])];
      next[index] = file.name;
      return { ...current, [order.id]: next };
    });
  };

  const decide = async (order: Order, decision: 'accept' | 'dispute') => {
    setBusy(order.id);
    try {
      const photoIds = (photos[order.id] ?? []).filter(Boolean);
      if (photoIds.length < order.lines.length) {
        toast(t('shop.returns.photos'));
        return;
      }
      await api.inspectReturn(
        order.id,
        {
          decision,
          ...(decision === 'dispute' ? { reason: reasons[order.id] ?? RETURN_DISPUTE_REASONS[0] } : {}),
          photoIds,
        },
        SHOP_ACTOR,
      );
      toast(t('shop.returns.submitted'));
      reload();
    } catch (error) {
      toast(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setBusy(null);
    }
  };

  const open = (returns.data ?? []).filter((order) =>
    ['RETURN_REQUESTED', 'RETURN_PICKED', 'RETURN_RECEIVED'].includes(order.state),
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('shop.returns.title')}</h1>
        <p className={styles.intro}>{t('shop.returns.intro')}</p>
      </header>

      <ShopStates
        loading={returns.loading}
        error={returns.error}
        empty={open.length === 0}
        emptyTitle={t('shop.returns.title')}
        emptyBody={t('shop.returns.empty')}
        offline={!online}
        lastUpdated={returns.lastUpdated}
        onRetry={reload}
      >
        <div className={styles.stack}>
          {open.map((order) => (
            <Card padded key={order.id}>
              <div className={styles.stack}>
                <div className={styles.row}>
                  <strong>{t('shop.returns.order', { id: order.id })}</strong>
                  <StatusChip tone="warning" label={order.state} />
                </div>
                <span className={styles.muted}>{formatDateTime(order.createdAt)}</span>
                <ul className={styles.list}>
                  {order.lines.map((line, index) => (
                    <li className={styles.listItem} key={line.id}>
                      <div className={styles.rowMain}>
                        <strong>{line.variantId}</strong>
                        <span className={styles.muted}>
                          {t('shop.orders.itemCount', { count: line.qty })}
                        </span>
                      </div>
                      <Input
                        label={`${t('shop.returns.photoLabel')}: ${line.variantId}`}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(event) => setPhoto(order, index, event)}
                      />
                    </li>
                  ))}
                </ul>
                <Select
                  label={t('shop.returns.reason')}
                  value={reasons[order.id] ?? RETURN_DISPUTE_REASONS[0]}
                  onChange={(event) =>
                    setReasons((current) => ({ ...current, [order.id]: event.target.value }))
                  }
                  options={RETURN_DISPUTE_REASONS.map((value) => ({
                    value,
                    label: t(`shop.returns.reason.${value}` as TranslationKey),
                  }))}
                />
                <div className={styles.actions}>
                  <Button
                    size="lg"
                    loading={busy === order.id}
                    onClick={() => void decide(order, 'accept')}
                  >
                    {t('shop.returns.accept')}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    disabled={busy === order.id}
                    onClick={() => void decide(order, 'dispute')}
                  >
                    {t('shop.returns.dispute')}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ShopStates>
    </div>
  );
}
