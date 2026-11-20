import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import type { Order } from '@/api/types';
import { AdminStates } from '@/components/admin/AdminStates';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { StatusChip, type StatusTone } from '@/components/ui/StatusChip';
import { useI18n } from '@/i18n';
import { formatDateTime, formatPaise } from '@/lib/format';
import { useAsync, useOnline } from '@/lib/useAsync';
import styles from './admin.module.css';

/** ADM-04: searchable order list. Every row opens the full event timeline. */
export default function OrdersPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const online = useOnline();
  const orders = useAsync(() => api.listOrders(), 'admin-orders');
  const shops = useAsync(() => api.listShops(), 'admin-orders-shops');
  const buyers = useAsync(() => api.listBuyers(), 'admin-orders-buyers');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');

  const { reload } = orders;
  useEffect(() => api.subscribe('orders', reload), [reload]);

  const shopName = (id: string) => shops.data?.find((shop) => shop.id === id)?.name ?? id;
  const buyerName = (id: string) => buyers.data?.find((buyer) => buyer.id === id)?.name ?? id;

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (orders.data ?? []).filter((order) => {
      if (status !== 'all' && order.state !== status) return false;
      if (!needle) return true;
      return [order.id, buyerName(order.buyerId), shopName(order.shopId)]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders.data, shops.data, buyers.data, query, status]);

  const stateOptions = useMemo(() => {
    const states = [...new Set((orders.data ?? []).map((order) => order.state))].sort();
    return [
      { value: 'all', label: t('common.all') },
      ...states.map((value) => ({ value, label: value })),
    ];
  }, [orders.data, t]);

  const columns: AdminColumn<Order>[] = [
    {
      key: 'id',
      header: t('admin.orders.title'),
      render: (row) => (
        <span className={styles.main}>
          <span className={styles.strong}>{row.id}</span>
          <span className={styles.muted}>{formatDateTime(row.createdAt)}</span>
        </span>
      ),
    },
    { key: 'buyer', header: t('admin.orders.customer'), render: (row) => buyerName(row.buyerId) },
    { key: 'shop', header: t('admin.orders.shop'), render: (row) => shopName(row.shopId) },
    {
      key: 'state',
      header: t('admin.orders.state'),
      render: (row) => <StatusChip tone={toneFor(row.state)} label={row.state} />,
    },
    { key: 'value', header: t('admin.orders.value'), numeric: true, render: (row) => formatPaise(row.totalPaise) },
    {
      key: 'open',
      header: t('admin.details'),
      render: (row) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={(event) => {
            event.stopPropagation();
            navigate(`/admin/orders/${row.id}`);
          }}
        >
          {t('admin.open')}
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>LocalFit</p>
        <h1 className={styles.title}>{t('admin.orders.title')}</h1>
        <p className={styles.intro}>{t('admin.orders.subtitle')}</p>
      </header>

      <AdminStates
        loading={orders.loading || shops.loading || buyers.loading}
        error={orders.error ?? shops.error ?? buyers.error}
        empty={rows.length === 0}
        emptyTitle={t('admin.orders.title')}
        emptyBody={t('admin.orders.empty')}
        offline={!online}
        lastUpdated={orders.lastUpdated}
        onRetry={() => {
          orders.reload();
          shops.reload();
          buyers.reload();
        }}
      >
        <AdminTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          caption={t('admin.orders.title')}
          filterLabel={t('admin.orders.search')}
          filterPlaceholder={t('admin.orders.search')}
          filterValue={query}
          onFilterChange={setQuery}
          toolbar={
            <Select
              label={t('admin.filter.status')}
              options={stateOptions}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            />
          }
          onRowActivate={(row) => navigate(`/admin/orders/${row.id}`)}
          rowActionLabel={(row) => `${t('admin.open')} ${row.id}`}
        />
      </AdminStates>
    </div>
  );
}

function toneFor(state: string): StatusTone {
  if (state === 'PLACED') return 'warning';
  if (['DELIVERED', 'SETTLED', 'REFUNDED'].includes(state)) return 'success';
  if (state.includes('CANCEL') || state.includes('RETURN') || state === 'DISPUTED') return 'error';
  return 'info';
}
