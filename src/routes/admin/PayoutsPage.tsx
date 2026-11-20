import { useEffect, useMemo, useState } from 'react';
import { api } from '@/api/client';
import type { PayoutCase } from '@/api/types';
import { AdminStates } from '@/components/admin/AdminStates';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';
import { ReasonDialog } from '@/components/admin/ReasonDialog';
import { useAdminActor } from '@/components/admin/useAdminActor';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { StatusChip } from '@/components/ui/StatusChip';
import { csvFromRows, downloadCsv } from '@/domain/admin';
import { useI18n } from '@/i18n';
import { formatDateTime, formatPaise } from '@/lib/format';
import { useAsync, useOnline } from '@/lib/useAsync';
import styles from './admin.module.css';

/** SPEC 8.7: run, hold and reconcile settlements, then export a finance CSV. */
export default function PayoutsPage() {
  const { t } = useI18n();
  const online = useOnline();
  const { actor, canAct } = useAdminActor();
  const payouts = useAsync(() => api.adminListPayouts(), 'admin-payouts');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [pending, setPending] = useState<{
    kind: 'run' | 'hold' | 'reconcile';
    payout?: PayoutCase;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const { reload } = payouts;
  useEffect(() => api.subscribe('admin-audit', reload), [reload]);
  useEffect(() => api.subscribe('admin-payouts', reload), [reload]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (payouts.data ?? []).filter((payout) => {
      if (status !== 'all' && payout.status !== status) return false;
      if (!needle) return true;
      return [payout.id, payout.shopName, payout.period].join(' ').toLowerCase().includes(needle);
    });
  }, [payouts.data, query, status]);

  async function confirm(reason: string) {
    if (!actor || !pending) return;
    setBusy(true);
    try {
      const input = { actor, reason };
      if (pending.kind === 'run') await api.adminRunSettlement(input);
      if (pending.kind === 'hold' && pending.payout) {
        await api.adminHoldPayout(pending.payout.id, input);
      }
      if (pending.kind === 'reconcile' && pending.payout) {
        await api.adminReconcilePayout(pending.payout.id, input);
      }
      setPending(null);
      reload();
    } finally {
      setBusy(false);
    }
  }

  function exportCsv() {
    const csv = csvFromRows(
      ['payout_id', 'shop_id', 'shop_name', 'amount_paise', 'period', 'status', 'note'],
      rows.map((payout) => [
        payout.id,
        payout.shopId,
        payout.shopName,
        payout.amountPaise,
        payout.period,
        payout.status,
        payout.note ?? '',
      ]),
    );
    downloadCsv('localfit-finance-payouts.csv', csv);
  }

  const columns: AdminColumn<PayoutCase>[] = [
    {
      key: 'payout',
      header: t('admin.payouts.payout'),
      render: (row) => (
        <span className={styles.main}>
          <span className={styles.strong}>{row.id}</span>
          <span className={styles.muted}>{formatDateTime(row.createdAt)}</span>
        </span>
      ),
    },
    { key: 'shop', header: t('admin.payouts.shop'), render: (row) => row.shopName },
    {
      key: 'amount',
      header: t('admin.payouts.amount'),
      numeric: true,
      render: (row) => formatPaise(row.amountPaise),
    },
    { key: 'period', header: t('admin.payouts.period'), render: (row) => row.period },
    {
      key: 'status',
      header: t('admin.filter.status'),
      render: (row) => (
        <StatusChip
          tone={row.status === 'paid' ? 'success' : row.status === 'held' ? 'warning' : 'info'}
          label={row.status}
        />
      ),
    },
    {
      key: 'actions',
      header: t('admin.order.actions'),
      render: (row) => (
        <div className={styles.actions}>
          {canAct('payout.hold') && row.status !== 'held' ? (
            <Button
              size="sm"
              variant="outline"
              onClick={(event) => {
                event.stopPropagation();
                setPending({ kind: 'hold', payout: row });
              }}
            >
              {t('admin.payouts.hold')}
            </Button>
          ) : null}
          {canAct('payout.reconcile') && row.status !== 'paid' ? (
            <Button
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                setPending({ kind: 'reconcile', payout: row });
              }}
            >
              {t('admin.payouts.reconcile')}
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
        <h1 className={styles.title}>{t('admin.payouts.title')}</h1>
        <p className={styles.intro}>{t('admin.payouts.subtitle')}</p>
      </header>

      <div className={styles.actions}>
        {canAct('payout.run') ? (
          <Button onClick={() => setPending({ kind: 'run' })}>{t('admin.payouts.run')}</Button>
        ) : null}
        <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
          {t('admin.payouts.export')}
        </Button>
      </div>

      <AdminStates
        loading={payouts.loading}
        error={payouts.error}
        empty={rows.length === 0}
        emptyTitle={t('admin.payouts.title')}
        emptyBody={t('admin.payouts.empty')}
        offline={!online}
        lastUpdated={payouts.lastUpdated}
        onRetry={reload}
      >
        <AdminTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          caption={t('admin.payouts.title')}
          filterLabel={t('admin.payouts.shop')}
          filterValue={query}
          onFilterChange={setQuery}
          toolbar={
            <Select
              label={t('admin.filter.status')}
              options={[
                { value: 'all', label: t('common.all') },
                { value: 'ready', label: t('admin.status.ready') },
                { value: 'held', label: t('admin.status.held') },
                { value: 'paid', label: t('admin.status.paid') },
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
          pending?.kind === 'run'
            ? t('admin.payouts.runTitle')
            : pending?.kind === 'hold'
              ? t('admin.payouts.holdTitle')
              : t('admin.payouts.reconcileTitle')
        }
        busy={busy}
        onClose={() => setPending(null)}
        onConfirm={confirm}
      />
    </div>
  );
}
