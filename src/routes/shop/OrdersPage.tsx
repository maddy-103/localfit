import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/client';
import type { Order } from '@/api/types';
import { ShopStates } from '@/components/shop/ShopStates';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { StatusChip, type StatusTone } from '@/components/ui/StatusChip';
import { Timer } from '@/components/ui/Timer';
import { useI18n, type TranslationKey } from '@/i18n';
import { formatDateTime, formatPaise } from '@/lib/format';
import { useAsync, useOnline } from '@/lib/useAsync';
import styles from './shop.module.css';

type View = 'all' | 'awaiting' | 'active' | 'done';

const DONE_STATES: string[] = [
  'DELIVERED', 'SHOP_DECLINED', 'CANCELLED', 'CANCELLED_BY_SHOP',
  'REFUNDED', 'SETTLED', 'RETURN_REJECTED', 'FAILED_DELIVERY',
];

function toneFor(order: Order): StatusTone {
  if (order.state === 'PLACED') return 'warning';
  if (DONE_STATES.includes(order.state)) return 'info';
  if (order.state.startsWith('RETURN') || order.state === 'DISPUTED') return 'error';
  return 'success';
}

const VIEWS: View[] = ['all', 'awaiting', 'active', 'done'];

export default function OrdersPage() {
  const { t } = useI18n();
  const online = useOnline();
  const [view, setView] = useState<View>('all');
  const orders = useAsync(() => api.listShopOrders(), 'shop-orders-list');

  const { reload } = orders;
  useEffect(() => api.subscribe('orders', reload), [reload]);

  const all = orders.data ?? [];
  const filtered = all.filter((order) => {
    if (view === 'awaiting') return order.state === 'PLACED';
    if (view === 'active') return !DONE_STATES.includes(order.state) && order.state !== 'PLACED';
    if (view === 'done') return DONE_STATES.includes(order.state);
    return true;
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('shop.orders.title')}</h1>
        <p className={styles.intro}>{t('shop.orders.subtitle')}</p>
      </header>

      <div className={styles.chips} role="group" aria-label={t('shop.orders.title')}>
        {VIEWS.map((value) => (
          <Chip key={value} selected={view === value} onClick={() => setView(value)}>
            {t(`shop.orders.${value}` as TranslationKey)}
          </Chip>
        ))}
      </div>

      <ShopStates
        loading={orders.loading}
        error={orders.error}
        empty={filtered.length === 0}
        emptyTitle={t('shop.orders.title')}
        emptyBody={t('shop.orders.empty')}
        offline={!online}
        lastUpdated={orders.lastUpdated}
        onRetry={reload}
      >
        <div className={styles.stack}>
          {filtered.map((order) => (
            <Card padded key={order.id}>
              <div className={styles.row}>
                <div className={styles.rowMain}>
                  <strong>{t('shop.order.title', { id: order.id })}</strong>
                  <span className={styles.muted}>
                    {t('shop.orders.placed', { date: formatDateTime(order.createdAt) })}
                  </span>
                  <span className={styles.muted}>
                    {t('shop.orders.itemCount', {
                      count: order.lines.reduce((sum, line) => sum + line.qty, 0),
                    })}
                  </span>
                  <span className={styles.price}>{formatPaise(order.itemsPaise)}</span>
                </div>
                <div className={styles.rowAside}>
                  <StatusChip tone={toneFor(order)} label={order.state} />
                  {order.state === 'PLACED' && order.acceptsUntil ? (
                    <Timer endsAt={order.acceptsUntil} label={t('shop.dashboard.awaiting')} onExpire={reload} />
                  ) : null}
                  <Link to={`/shop/orders/${order.id}`}>{t('shop.orders.open')}</Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ShopStates>
    </div>
  );
}
