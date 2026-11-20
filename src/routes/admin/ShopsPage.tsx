import { useEffect, useMemo, useState } from 'react';
import { api } from '@/api/client';
import type { ShopReview } from '@/api/types';
import { AdminStates } from '@/components/admin/AdminStates';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';
import { ReasonDialog } from '@/components/admin/ReasonDialog';
import { useAdminActor } from '@/components/admin/useAdminActor';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { StatusChip, type StatusTone } from '@/components/ui/StatusChip';
import { useI18n } from '@/i18n';
import { useAsync, useOnline } from '@/lib/useAsync';
import styles from './admin.module.css';

type Outcome = 'approve' | 'reject' | 'suspend' | 'flag';
interface Pending {
  outcome: Outcome;
  review: ShopReview;
}

const TONES: Record<ShopReview['status'], StatusTone> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  suspended: 'error',
};

/** ADM-02: onboarding queue with identity, GST, visit notes and product checks. */
export default function ShopsPage() {
  const { t } = useI18n();
  const online = useOnline();
  const { actor, canAct } = useAdminActor();
  const reviews = useAsync(() => api.adminListShopReviews(), 'admin-shops');
  const products = useAsync(() => api.listProducts(), 'admin-shops-products');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [pending, setPending] = useState<Pending | null>(null);
  const [flagProductId, setFlagProductId] = useState('');
  const [busy, setBusy] = useState(false);

  const { reload } = reviews;
  useEffect(() => api.subscribe('admin-audit', reload), [reload]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (reviews.data ?? []).filter((review) => {
      if (status !== 'all' && review.status !== status) return false;
      if (!needle) return true;
      return [review.shopName, review.ownerName, review.gstNumber ?? '', ...review.productChecks]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [reviews.data, query, status]);

  const productOptions = useMemo(
    () =>
      (products.data ?? [])
        .filter((product) => product.shopId === pending?.review.shopId)
        .map((product) => ({ value: product.id, label: product.title })),
    [products.data, pending],
  );

  function open(outcome: Outcome, review: ShopReview) {
    setFlagProductId(productOptions[0]?.value ?? '');
    setPending({ outcome, review });
  }

  async function confirm(reason: string) {
    if (!actor || !pending) return;
    setBusy(true);
    try {
      if (pending.outcome === 'flag') {
        await api.adminFlagProduct(pending.review.shopId, flagProductId, reason, { actor, reason });
      } else {
        await api.adminReviewShop(pending.review.shopId, pending.outcome, { actor, reason });
      }
      setPending(null);
      reload();
    } finally {
      setBusy(false);
    }
  }

  const columns: AdminColumn<ShopReview>[] = [
    {
      key: 'shop',
      header: t('admin.shops.shop'),
      render: (row) => (
        <span className={styles.main}>
          <span className={styles.strong}>{row.shopName}</span>
          <span className={styles.muted}>{row.id}</span>
        </span>
      ),
    },
    { key: 'owner', header: t('admin.shops.owner'), render: (row) => row.ownerName },
    {
      key: 'gst',
      header: t('admin.shops.gst'),
      render: (row) =>
        row.hasGst ? <span className={styles.mono}>{row.gstNumber ?? t('admin.yes')}</span> : t('admin.no'),
    },
    { key: 'visit', header: t('admin.shops.visit'), render: (row) => row.sampleVisitNotes },
    {
      key: 'checks',
      header: t('admin.shops.checks'),
      render: (row) => (row.productChecks.length ? row.productChecks.join(' · ') : t('admin.none')),
    },
    {
      key: 'flags',
      header: t('admin.shops.flags'),
      render: (row) => (row.authenticityFlags.length ? row.authenticityFlags.join(' · ') : t('admin.none')),
    },
    {
      key: 'status',
      header: t('admin.filter.status'),
      render: (row) => <StatusChip tone={TONES[row.status]} label={row.status} />,
    },
    {
      key: 'actions',
      header: t('admin.order.actions'),
      render: (row) => (
        <div className={styles.actions}>
          {canAct('shop.approve') ? (
            <Button size="sm" onClick={() => open('approve', row)}>
              {t('admin.shops.approve')}
            </Button>
          ) : null}
          {canAct('shop.reject') ? (
            <Button size="sm" variant="outline" onClick={() => open('reject', row)}>
              {t('admin.shops.reject')}
            </Button>
          ) : null}
          {canAct('shop.suspend') ? (
            <Button size="sm" variant="ghost" onClick={() => open('suspend', row)}>
              {t('admin.shops.suspend')}
            </Button>
          ) : null}
          {canAct('product.flag') ? (
            <Button size="sm" variant="ghost" onClick={() => open('flag', row)}>
              {t('admin.shops.flagProduct')}
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{t('app.name')}</p>
        <h1 className={styles.title}>{t('admin.shops.title')}</h1>
        <p className={styles.intro}>{t('admin.shops.subtitle')}</p>
      </header>

      <AdminStates
        loading={reviews.loading}
        error={reviews.error}
        empty={rows.length === 0}
        emptyTitle={t('admin.shops.title')}
        emptyBody={t('admin.shops.empty')}
        offline={!online}
        lastUpdated={reviews.lastUpdated}
        onRetry={reload}
      >
        <AdminTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          caption={t('admin.shops.title')}
          filterLabel={t('admin.shops.shop')}
          filterPlaceholder={t('admin.shops.shop')}
          filterValue={query}
          onFilterChange={setQuery}
          toolbar={
            <Select
              label={t('admin.filter.status')}
              options={[
                { value: 'all', label: t('common.all') },
                { value: 'pending', label: t('admin.status.pending') },
                { value: 'approved', label: t('admin.status.approved') },
                { value: 'rejected', label: t('admin.status.rejected') },
                { value: 'suspended', label: t('admin.status.suspended') },
              ]}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            />
          }
        />
      </AdminStates>

      <ReasonDialog
        open={pending !== null}
        title={
          pending?.outcome === 'flag'
            ? t('admin.shops.flagTitle')
            : t(`admin.shops.${pending?.outcome ?? 'approve'}Title` as 'admin.shops.approveTitle')
        }
        confirmLabel={
          pending?.outcome === 'flag'
            ? t('admin.shops.flagProduct')
            : t(`admin.shops.${pending?.outcome ?? 'approve'}` as 'admin.shops.approve')
        }
        busy={busy}
        onClose={() => setPending(null)}
        onConfirm={confirm}
        extra={
          pending?.outcome === 'flag' ? (
            <Select
              label={t('admin.shops.product')}
              options={productOptions}
              value={flagProductId}
              onChange={(event) => setFlagProductId(event.target.value)}
            />
          ) : undefined
        }
      />
    </div>
  );
}
