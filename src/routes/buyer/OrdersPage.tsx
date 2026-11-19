import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/client';
import { useI18n } from '@/i18n';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { RadioPills } from '@/components/ui/RadioPills';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusChip } from '@/components/ui/StatusChip';
import { isDone, orderLabelKey, orderTone } from '@/components/buyer/orderUi';
import { formatDateTime, formatPaise } from '@/lib/format';
import { useAsync, useOnline } from '@/lib/useAsync';
import styles from '@/components/buyer/pages.module.css';

/** Order list with status chips (icon + text + colour) and filters. */
export default function OrdersPage() {
  const { t } = useI18n();
  const online = useOnline();
  const [filter, setFilter] = useState('all');
  const { data, error, loading, lastUpdated, reload } = useAsync(() => api.listOrders(), 'orders');

  useEffect(() => api.subscribe('orders', reload), [reload]);

  const orders = (data ?? []).filter((order) =>
    filter === 'all' ? true : filter === 'done' ? isDone(order.state) : !isDone(order.state),
  );

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Breadcrumb items={[{ label: t('breadcrumb.home'), to: '/' }, { label: t('orders.title') }]} />
        <h1 className={styles.heading}>{t('orders.title')}</h1>
        {!online ? <OfflineBanner lastUpdated={lastUpdated ?? undefined} /> : null}

        <RadioPills
          legend={t('orders.title')}
          name="order-filter"
          value={filter}
          options={[
            { value: 'all', label: t('orders.filterAll') },
            { value: 'active', label: t('orders.filterActive') },
            { value: 'done', label: t('orders.filterDone') },
          ]}
          onChange={setFilter}
        />

        {loading && !data ? (
          <div className={`${styles.skeletonRow} ${styles.skeletonTop}`} aria-busy="true">
            <Skeleton variant="card" count={3} />
          </div>
        ) : error && !data ? (
          <ErrorState message={error} onRetry={reload} />
        ) : orders.length ? (
          <div className={`${styles.statusList} ${styles.sectionGrid}`}>
            {orders.map((order) => (
              <article key={order.id} className={styles.card}>
                <div className={styles.orderMeta}>
                  <Link to={`/orders/${order.id}`} className={styles.bold}>
                    {t('orders.orderNumber', { id: order.id })}
                  </Link>
                  <StatusChip tone={orderTone(order.state)} label={t(orderLabelKey(order.state))} />
                </div>
                <p className={styles.small}>
                  {t('orders.placedOn', { date: formatDateTime(order.createdAt) })} · {t('orders.itemCount', { count: order.lines.length })}
                </p>
                <p className={styles.small}>
                  {t('orders.total')}: {formatPaise(order.totalPaise)} · {t('product.eta', { window: `${order.etaMin[0]}–${order.etaMin[1]} min` })}
                </p>
                <div className={styles.row}>
                  <Link to={`/orders/${order.id}`} className={styles.link}>{t('orders.details')}</Link>
                  <Link to={`/support?order=${encodeURIComponent(order.id)}`} className={styles.link}>
                    {t('orders.help')}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title={t('orders.empty')} action={<Link to="/" className={styles.link}>{t('common.goHome')}</Link>} />
        )}
      </div>
    </main>
  );
}
