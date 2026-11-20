import { useMemo, useState } from 'react';
import { api } from '@/api/client';
import type { AuditEntry } from '@/api/types';
import { AdminStates } from '@/components/admin/AdminStates';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';
import { Button } from '@/components/ui/Button';
import { auditCsv, downloadCsv } from '@/domain/admin';
import { useI18n } from '@/i18n';
import { formatDateTime } from '@/lib/format';
import { useAsync, useOnline } from '@/lib/useAsync';
import styles from './admin.module.css';

/** NFR-12: every guarded admin action with actor, timestamp, reason and diff. */
export default function AuditPage() {
  const { t } = useI18n();
  const online = useOnline();
  const audit = useAsync(() => api.adminListAudit(), 'admin-audit-log');
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (audit.data ?? []).filter((entry) =>
      [entry.id, entry.action, entry.reason, entry.actor.id, entry.actor.name]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    );
  }, [audit.data, query]);

  function exportCsv() {
    downloadCsv('localfit-admin-audit.csv', auditCsv(rows));
  }

  const columns: AdminColumn<AuditEntry>[] = [
    {
      key: 'action',
      header: t('admin.audit.action'),
      render: (row) => <span className={styles.strong}>{row.action}</span>,
    },
    {
      key: 'actor',
      header: t('admin.audit.actor'),
      render: (row) => (
        <span className={styles.main}>
          <span className={styles.strong}>{row.actor.name}</span>
          <span className={styles.muted}>
            {row.actor.adminRole} · {row.actor.id}
          </span>
        </span>
      ),
    },
    { key: 'time', header: t('admin.audit.time'), render: (row) => formatDateTime(row.timestamp) },
    { key: 'reason', header: t('admin.audit.reason'), render: (row) => row.reason },
    {
      key: 'diff',
      header: t('admin.audit.before'),
      render: (row) =>
        row.before || row.after ? (
          <code className={styles.json}>
            {JSON.stringify({ before: row.before, after: row.after })}
          </code>
        ) : (
          t('admin.none')
        ),
    },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{t('app.name')}</p>
        <h1 className={styles.title}>{t('admin.audit.title')}</h1>
        <p className={styles.intro}>{t('admin.audit.subtitle')}</p>
      </header>

      <div className={styles.actions}>
        <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
          {t('admin.exportCsv')}
        </Button>
      </div>

      <AdminStates
        loading={audit.loading}
        error={audit.error}
        empty={rows.length === 0}
        emptyTitle={t('admin.audit.title')}
        emptyBody={t('admin.audit.empty')}
        offline={!online}
        lastUpdated={audit.lastUpdated}
        onRetry={audit.reload}
      >
        <AdminTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          caption={t('admin.audit.title')}
          filterLabel={t('admin.audit.search')}
          filterValue={query}
          onFilterChange={setQuery}
        />
      </AdminStates>
    </div>
  );
}
