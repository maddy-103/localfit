import { useEffect, useMemo, useState } from 'react';
import { api } from '@/api/client';
import type { RiderReview } from '@/api/types';
import { AdminStates } from '@/components/admin/AdminStates';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';
import { ReasonDialog } from '@/components/admin/ReasonDialog';
import { useAdminActor } from '@/components/admin/useAdminActor';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { StatusChip } from '@/components/ui/StatusChip';
import { Toggle } from '@/components/ui/Toggle';
import { useI18n } from '@/i18n';
import { useAsync, useOnline } from '@/lib/useAsync';
import styles from './admin.module.css';

type Outcome = 'verify' | 'penalize' | 'suspend' | 'zone';
interface Pending {
  outcome: Outcome;
  review: RiderReview;
}

/** ADM-06: verification, performance and availability by zone. */
export default function RidersPage() {
  const { t } = useI18n();
  const online = useOnline();
  const { actor, canAct } = useAdminActor();
  const riders = useAsync(() => api.adminListRiderReviews(), 'admin-riders');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [pending, setPending] = useState<Pending | null>(null);
  const [zone, setZone] = useState('');
  const [available, setAvailable] = useState(true);
  const [busy, setBusy] = useState(false);

  const { reload } = riders;
  useEffect(() => api.subscribe('admin-audit', reload), [reload]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (riders.data ?? []).filter((rider) => {
      if (status !== 'all' && rider.status !== status) return false;
      if (!needle) return true;
      return [rider.name, rider.zone, rider.id].join(' ').toLowerCase().includes(needle);
    });
  }, [riders.data, query, status]);

  function open(outcome: Outcome, review: RiderReview) {
    setZone(review.zone);
    setAvailable(review.available);
    setPending({ outcome, review });
  }

  async function confirm(reason: string) {
    if (!actor || !pending) return;
    setBusy(true);
    try {
      const input = { actor, reason };
      if (pending.outcome === 'zone') {
        await api.adminSetRiderZone(pending.review.riderId, zone, available, input);
      } else {
        await api.adminReviewRider(pending.review.riderId, pending.outcome, input);
      }
      setPending(null);
      reload();
    } finally {
      setBusy(false);
    }
  }

  const columns: AdminColumn<RiderReview>[] = [
    {
      key: 'rider',
      header: t('admin.riders.rider'),
      render: (row) => (
        <span className={styles.main}>
          <span className={styles.strong}>{row.name}</span>
          <span className={styles.muted}>{row.riderId}</span>
        </span>
      ),
    },
    { key: 'zone', header: t('admin.riders.zone'), render: (row) => row.zone },
    { key: 'rating', header: t('admin.riders.rating'), numeric: true, render: (row) => row.rating.toFixed(1) },
    { key: 'incidents', header: t('admin.riders.incidents'), numeric: true, render: (row) => row.incidents },
    { key: 'penalties', header: t('admin.riders.penalties'), numeric: true, render: (row) => row.penalties },
    {
      key: 'available',
      header: t('admin.riders.available'),
      render: (row) => <StatusChip tone={row.available ? 'success' : 'pending'} label={row.available ? t('admin.yes') : t('admin.no')} />,
    },
    {
      key: 'status',
      header: t('admin.filter.status'),
      render: (row) => (
        <StatusChip
          tone={row.status === 'approved' ? 'success' : row.status === 'suspended' ? 'error' : 'warning'}
          label={row.status}
        />
      ),
    },
    {
      key: 'actions',
      header: t('admin.order.actions'),
      render: (row) => (
        <div className={styles.actions}>
          {canAct('rider.verify') ? (
            <Button size="sm" onClick={(event) => { event.stopPropagation(); open('verify', row); }}>
              {t('admin.riders.verify')}
            </Button>
          ) : null}
          {canAct('rider.penalize') ? (
            <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); open('penalize', row); }}>
              {t('admin.riders.penalize')}
            </Button>
          ) : null}
          {canAct('rider.penalize') ? (
            <Button size="sm" variant="ghost" onClick={(event) => { event.stopPropagation(); open('suspend', row); }}>
              {t('admin.riders.suspend')}
            </Button>
          ) : null}
          {canAct('rider.zone') ? (
            <Button size="sm" variant="ghost" onClick={(event) => { event.stopPropagation(); open('zone', row); }}>
              {t('admin.riders.setZone')}
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
        <h1 className={styles.title}>{t('admin.riders.title')}</h1>
        <p className={styles.intro}>{t('admin.riders.subtitle')}</p>
      </header>

      <AdminStates
        loading={riders.loading}
        error={riders.error}
        empty={rows.length === 0}
        emptyTitle={t('admin.riders.title')}
        emptyBody={t('admin.riders.empty')}
        offline={!online}
        lastUpdated={riders.lastUpdated}
        onRetry={reload}
      >
        <AdminTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          caption={t('admin.riders.title')}
          filterLabel={t('admin.riders.rider')}
          filterValue={query}
          onFilterChange={setQuery}
          toolbar={
            <Select
              label={t('admin.filter.status')}
              options={[
                { value: 'all', label: t('common.all') },
                { value: 'pending', label: 'pending' },
                { value: 'approved', label: 'approved' },
                { value: 'suspended', label: 'suspended' },
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
          pending?.outcome === 'zone'
            ? t('admin.riders.zoneTitle')
            : t(`admin.riders.${pending?.outcome ?? 'verify'}Title` as 'admin.riders.verifyTitle')
        }
        busy={busy}
        onClose={() => setPending(null)}
        onConfirm={confirm}
        extra={
          pending?.outcome === 'zone' ? (
            <>
              <Input
                label={t('admin.riders.zoneLabel')}
                value={zone}
                onChange={(event) => setZone(event.target.value)}
              />
              <Toggle
                checked={available}
                onChange={setAvailable}
                label={t('admin.riders.availableLabel')}
              />
            </>
          ) : undefined
        }
      />
    </div>
  );
}
