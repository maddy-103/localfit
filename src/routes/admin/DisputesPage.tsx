import { useEffect, useMemo, useState } from 'react';
import { api } from '@/api/client';
import type { DisputeCase, DisputeDecision } from '@/api/types';
import { AdminStates } from '@/components/admin/AdminStates';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';
import { ReasonDialog } from '@/components/admin/ReasonDialog';
import { useAdminActor } from '@/components/admin/useAdminActor';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { StatusChip } from '@/components/ui/StatusChip';
import { disputeSla } from '@/domain/admin';
import { useI18n } from '@/i18n';
import { formatDateTime, formatPaise } from '@/lib/format';
import { useNow } from '@/lib/useNow';
import { useAsync, useOnline } from '@/lib/useAsync';
import styles from './admin.module.css';
import { DisputeEvidenceSheet } from './DisputeEvidenceSheet';

/** ADM-03 and SPEC section 13: SLA queue, full evidence and decisions. */
export default function DisputesPage() {
  const { t } = useI18n();
  const online = useOnline();
  const at = useNow(60_000);
  const { actor, canAct } = useAdminActor();
  const disputes = useAsync(() => api.adminListDisputes(), 'admin-disputes');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [viewing, setViewing] = useState<DisputeCase | null>(null);
  const [deciding, setDeciding] = useState<DisputeCase | null>(null);
  const [decision, setDecision] = useState<DisputeDecision>('buyer_favoured');
  const [busy, setBusy] = useState(false);

  const { reload } = disputes;
  useEffect(() => api.subscribe('admin-disputes', reload), [reload]);
  useEffect(() => api.subscribe('admin-audit', reload), [reload]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (disputes.data ?? []).filter((dispute) => {
      if (status !== 'all' && dispute.status !== status) return false;
      if (!needle) return true;
      return [dispute.id, dispute.orderId, dispute.reason].join(' ').toLowerCase().includes(needle);
    });
  }, [disputes.data, query, status]);

  async function openEvidence(caseItem: DisputeCase) {
    if (!actor) return;
    const full = await api.adminGetDispute(caseItem.id, actor);
    setViewing(full ?? caseItem);
  }

  async function confirm(reason: string) {
    if (!actor || !deciding) return;
    setBusy(true);
    try {
      await api.adminDecideDispute(deciding.id, decision, { actor, reason });
      setDeciding(null);
      setViewing(null);
      reload();
    } finally {
      setBusy(false);
    }
  }

  const columns: AdminColumn<DisputeCase>[] = [
    {
      key: 'case',
      header: t('admin.disputes.case'),
      render: (row) => (
        <span className={styles.main}>
          <span className={styles.strong}>{row.id}</span>
          <span className={styles.muted}>{row.reason}</span>
        </span>
      ),
    },
    { key: 'order', header: t('admin.disputes.order'), render: (row) => row.orderId },
    { key: 'value', header: t('admin.disputes.value'), numeric: true, render: (row) => formatPaise(row.valuePaise) },
    { key: 'opened', header: t('admin.disputes.opened'), render: (row) => formatDateTime(row.openedAt) },
    {
      key: 'sla',
      header: t('admin.disputes.sla'),
      render: (row) => <SlaCell openedAt={row.openedAt} at={at} />,
    },
    {
      key: 'status',
      header: t('admin.filter.status'),
      render: (row) => (
        <span className={styles.main}>
          <StatusChip
            tone={row.status === 'decided' ? 'success' : row.status === 'escalated' ? 'warning' : 'pending'}
            label={row.status}
          />
          {row.escalatedTo ? (
            <span className={styles.muted}>
              {t('admin.disputes.escalatedTo', { name: row.escalatedTo })}
            </span>
          ) : null}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('admin.order.actions'),
      render: (row) => (
        <div className={styles.actions}>
          <Button size="sm" variant="outline" onClick={() => openEvidence(row)}>
            {t('admin.disputes.evidence')}
          </Button>
          {canAct('dispute.decide') && row.status !== 'decided' ? (
            <Button
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                setDecision('buyer_favoured');
                setDeciding(row);
              }}
            >
              {t('admin.disputes.decide')}
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
        <h1 className={styles.title}>{t('admin.disputes.title')}</h1>
        <p className={styles.intro}>{t('admin.disputes.subtitle')}</p>
      </header>

      <AdminStates
        loading={disputes.loading}
        error={disputes.error}
        empty={rows.length === 0}
        emptyTitle={t('admin.disputes.title')}
        emptyBody={t('admin.disputes.empty')}
        offline={!online}
        lastUpdated={disputes.lastUpdated}
        onRetry={reload}
      >
        <AdminTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          caption={t('admin.disputes.title')}
          filterLabel={t('admin.disputes.case')}
          filterValue={query}
          onFilterChange={setQuery}
          toolbar={
            <Select
              label={t('admin.filter.status')}
              options={[
                { value: 'all', label: t('common.all') },
                { value: 'open', label: t('admin.status.open') },
                { value: 'escalated', label: t('admin.status.escalated') },
                { value: 'decided', label: t('admin.status.decided') },
              ]}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            />
          }
          onRowActivate={(row) => openEvidence(row)}
        />
      </AdminStates>

      <DisputeEvidenceSheet
        caseItem={viewing}
        canDecide={canAct('dispute.decide')}
        onClose={() => setViewing(null)}
        onDecide={(caseItem) => {
          setDecision('buyer_favoured');
          setDeciding(caseItem);
          setViewing(null);
        }}
      />

      <ReasonDialog
        open={deciding !== null}
        title={t('admin.disputes.decisionTitle', { id: deciding?.id ?? '' })}
        busy={busy}
        onClose={() => setDeciding(null)}
        onConfirm={confirm}
        extra={
          <Select
            label={t('admin.disputes.decide')}
            options={[
              { value: 'buyer_favoured', label: t('admin.disputes.buyer') },
              { value: 'shop_favoured', label: t('admin.disputes.shop') },
              { value: 'split', label: t('admin.disputes.split') },
            ]}
            value={decision}
            onChange={(event) => setDecision(event.target.value as DisputeDecision)}
          />
        }
      />
    </div>
  );
}

function SlaCell({ openedAt, at }: { openedAt: string; at: number }) {
  const { t } = useI18n();
  const sla = disputeSla(openedAt, at);
  const minutes = Math.max(0, Math.ceil(sla.remainingMs / 60_000));
  return (
    <span aria-live="polite">
      <StatusChip
        tone={
          sla.breached ? 'error' : sla.remainingMs < 4 * 60 * 60_000 ? 'warning' : 'pending'
        }
        label={
          sla.breached
            ? t('admin.disputes.breached')
            : t('admin.disputes.remaining', { time: `${minutes} min` })
        }
      />
    </span>
  );
}
