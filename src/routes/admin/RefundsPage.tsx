import { useEffect, useMemo, useState } from 'react';
import { api } from '@/api/client';
import type { RefundCase } from '@/api/types';
import { AdminStates } from '@/components/admin/AdminStates';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';
import { ReasonDialog } from '@/components/admin/ReasonDialog';
import { useAdminActor } from '@/components/admin/useAdminActor';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { StatusChip } from '@/components/ui/StatusChip';
import { useI18n } from '@/i18n';
import { formatDateTime, formatPaise } from '@/lib/format';
import { useAsync, useOnline } from '@/lib/useAsync';
import styles from './admin.module.css';

/** ADM-04: returns and refunds queue. Both outcomes need a reason. */
export default function RefundsPage() {
  const { t } = useI18n();
  const online = useOnline();
  const { actor, canAct } = useAdminActor();
  const refunds = useAsync(() => api.adminListRefunds(), 'admin-refunds');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [pending, setPending] = useState<{ outcome: 'approve' | 'reject'; refund: RefundCase } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  const { reload } = refunds;
  useEffect(() => api.subscribe('admin-audit', reload), [reload]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (refunds.data ?? []).filter((refund) => {
      if (status !== 'all' && refund.status !== status) return false;
      if (!needle) return true;
      return [refund.id, refund.orderId, refund.buyerName, refund.reason]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [refunds.data, query, status]);

  async function confirm(reason: string) {
    if (!actor || !pending) return;
    setBusy(true);
    try {
      await api.adminResolveRefund(pending.refund.id, pending.outcome, { actor, reason });
      setPending(null);
      reload();
    } finally {
      setBusy(false);
    }
  }

  const columns: AdminColumn<RefundCase>[] = [
    {
      key: 'refund',
      header: t('admin.refunds.refund'),
      render: (row) => (
        <span className={styles.main}>
          <span className={styles.strong}>{row.id}</span>
          <span className={styles.muted}>{formatDateTime(row.createdAt)}</span>
        </span>
      ),
    },
    { key: 'order', header: t('admin.disputes.order'), render: (row) => row.orderId },
    { key: 'buyer', header: t('admin.refunds.buyer'), render: (row) => row.buyerName },
    {
      key: 'amount',
      header: t('admin.refunds.amount'),
      numeric: true,
      render: (row) => formatPaise(row.amountPaise),
    },
    { key: 'reason', header: t('admin.audit.reason'), render: (row) => row.reason },
    {
      key: 'status',
      header: t('admin.filter.status'),
      render: (row) => (
        <StatusChip
          tone={row.status === 'approved' ? 'success' : row.status === 'rejected' ? 'error' : 'warning'}
          label={row.status}
        />
      ),
    },
    {
      key: 'actions',
      header: t('admin.order.actions'),
      render: (row) =>
        row.status === 'pending' ? (
          <div className={styles.actions}>
            {canAct('refund.approve') ? (
              <Button
                size="sm"
                onClick={(event) => {
                  event.stopPropagation();
                  setPending({ outcome: 'approve', refund: row });
                }}
              >
                {t('admin.refunds.approve')}
              </Button>
            ) : null}
            {canAct('refund.reject') ? (
              <Button
                size="sm"
                variant="outline"
                onClick={(event) => {
                  event.stopPropagation();
                  setPending({ outcome: 'reject', refund: row });
                }}
              >
                {t('admin.refunds.reject')}
              </Button>
            ) : null}
          </div>
        ) : (
          <span className={styles.muted}>{row.decisionReason ?? t('admin.none')}</span>
        ),
    },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>LocalFit</p>
        <h1 className={styles.title}>{t('admin.refunds.title')}</h1>
        <p className={styles.intro}>{t('admin.refunds.subtitle')}</p>
      </header>

      <AdminStates
        loading={refunds.loading}
        error={refunds.error}
        empty={rows.length === 0}
        emptyTitle={t('admin.refunds.title')}
        emptyBody={t('admin.refunds.empty')}
        offline={!online}
        lastUpdated={refunds.lastUpdated}
        onRetry={reload}
      >
        <AdminTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          caption={t('admin.refunds.title')}
          filterLabel={t('admin.refunds.refund')}
          filterValue={query}
          onFilterChange={setQuery}
          toolbar={
            <Select
              label={t('admin.filter.status')}
              options={[
                { value: 'all', label: t('common.all') },
                { value: 'pending', label: 'pending' },
                { value: 'approved', label: 'approved' },
                { value: 'rejected', label: 'rejected' },
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
          pending?.outcome === 'approve'
            ? t('admin.refunds.approveTitle')
            : t('admin.refunds.rejectTitle')
        }
        confirmLabel={
          pending?.outcome === 'approve' ? t('admin.refunds.approve') : t('admin.refunds.reject')
        }
        busy={busy}
        onClose={() => setPending(null)}
        onConfirm={confirm}
      />
    </div>
  );
}
