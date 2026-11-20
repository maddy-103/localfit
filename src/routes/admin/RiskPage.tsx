import { useEffect, useMemo, useState } from 'react';
import { api } from '@/api/client';
import type { RiskEntry } from '@/api/types';
import { AdminStates } from '@/components/admin/AdminStates';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';
import { ReasonDialog } from '@/components/admin/ReasonDialog';
import { useAdminActor } from '@/components/admin/useAdminActor';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { StatusChip } from '@/components/ui/StatusChip';
import { riskBand } from '@/domain/admin';
import { useI18n } from '@/i18n';
import { formatCount, formatPaise } from '@/lib/format';
import { useAsync, useOnline } from '@/lib/useAsync';
import styles from './admin.module.css';

type Kind = 'limit' | 'block' | 'unblock';
interface Pending {
  kind: Kind;
  entry: RiskEntry;
}

/** ADM-07: risk scores, COD limits and blocks by account and address. */
export default function RiskPage() {
  const { t } = useI18n();
  const online = useOnline();
  const { actor, canAct } = useAdminActor();
  const risk = useAsync(() => api.adminListRisk(), 'admin-risk');
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('all');
  const [pending, setPending] = useState<Pending | null>(null);
  const [limit, setLimit] = useState(0);
  const [busy, setBusy] = useState(false);

  const { reload } = risk;
  useEffect(() => api.subscribe('admin-audit', reload), [reload]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (risk.data ?? []).filter((entry) => {
      if (kind !== 'all' && entry.kind !== kind) return false;
      if (!needle) return true;
      return [entry.label, entry.id].join(' ').toLowerCase().includes(needle);
    });
  }, [risk.data, query, kind]);

  function open(next: Kind, entry: RiskEntry) {
    setLimit(Math.round(entry.codLimitPaise / 100));
    setPending({ kind: next, entry });
  }

  async function confirm(reason: string) {
    if (!actor || !pending) return;
    setBusy(true);
    try {
      const input = { actor, reason };
      if (pending.kind === 'limit') {
        await api.adminSetRiskLimit(pending.entry.id, Math.max(0, Math.round(limit * 100)), input);
      } else {
        await api.adminBlockRisk(pending.entry.id, pending.kind === 'block', input);
      }
      setPending(null);
      reload();
    } finally {
      setBusy(false);
    }
  }

  const columns: AdminColumn<RiskEntry>[] = [
    {
      key: 'subject',
      header: t('admin.risk.subject'),
      render: (row) => (
        <span className={styles.main}>
          <span className={styles.strong}>{row.label}</span>
          <span className={styles.muted}>{row.id}</span>
        </span>
      ),
    },
    { key: 'kind', header: t('admin.risk.kind'), render: (row) => row.kind },
    {
      key: 'score',
      header: t('admin.risk.score'),
      numeric: true,
      render: (row) => `${row.score} · ${riskBand(row.score)}`,
    },
    { key: 'orders', header: t('admin.risk.orders'), numeric: true, render: (row) => formatCount(row.completedOrders) },
    {
      key: 'value',
      header: t('admin.orders.value'),
      numeric: true,
      render: (row) => formatPaise(row.orderValuePaise),
    },
    { key: 'limit', header: t('admin.risk.limit'), numeric: true, render: (row) => formatPaise(row.codLimitPaise) },
    {
      key: 'blocked',
      header: t('admin.risk.blocked'),
      render: (row) => (
        <StatusChip tone={row.blocked ? 'error' : 'success'} label={row.blocked ? t('admin.yes') : t('admin.no')} />
      ),
    },
    {
      key: 'actions',
      header: t('admin.order.actions'),
      render: (row) => (
        <div className={styles.actions}>
          {canAct('risk.limit') ? (
            <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); open('limit', row); }}>
              {t('admin.risk.setLimit')}
            </Button>
          ) : null}
          {canAct('risk.block') ? (
            <Button
              size="sm"
              variant={row.blocked ? 'outline' : 'solid'}
              onClick={(event) => {
                event.stopPropagation();
                open(row.blocked ? 'unblock' : 'block', row);
              }}
            >
              {row.blocked ? t('admin.risk.unblock') : t('admin.risk.block')}
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>LocalFit</p>
        <h1 className={styles.title}>{t('admin.risk.title')}</h1>
        <p className={styles.intro}>{t('admin.risk.subtitle')}</p>
      </header>

      <AdminStates
        loading={risk.loading}
        error={risk.error}
        empty={rows.length === 0}
        emptyTitle={t('admin.risk.title')}
        emptyBody={t('admin.risk.empty')}
        offline={!online}
        lastUpdated={risk.lastUpdated}
        onRetry={reload}
      >
        <AdminTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          caption={t('admin.risk.title')}
          filterLabel={t('admin.risk.subject')}
          filterValue={query}
          onFilterChange={setQuery}
          toolbar={
            <Select
              label={t('admin.risk.kind')}
              options={[
                { value: 'all', label: t('common.all') },
                { value: 'account', label: 'account' },
                { value: 'address', label: 'address' },
              ]}
              value={kind}
              onChange={(event) => setKind(event.target.value)}
            />
          }
        />
      </AdminStates>

      <ReasonDialog
        open={pending !== null}
        title={
          pending?.kind === 'limit'
            ? t('admin.risk.limitTitle')
            : pending?.kind === 'block'
              ? t('admin.risk.blockTitle')
              : t('admin.risk.unblockTitle')
        }
        busy={busy}
        onClose={() => setPending(null)}
        onConfirm={confirm}
        extra={
          pending?.kind === 'limit' ? (
            <Input
              label={t('admin.risk.limitLabel')}
              type="number"
              min={0}
              value={limit}
              onChange={(event) => setLimit(Number(event.target.value))}
            />
          ) : undefined
        }
      />
    </div>
  );
}
