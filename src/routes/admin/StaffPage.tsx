import { useEffect, useMemo, useState } from 'react';
import { api } from '@/api/client';
import type { AdminRole, StaffMember, StaffStatus } from '@/api/types';
import { AdminStates } from '@/components/admin/AdminStates';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';
import { ReasonDialog } from '@/components/admin/ReasonDialog';
import { useAdminActor } from '@/components/admin/useAdminActor';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { StatusChip, type StatusTone } from '@/components/ui/StatusChip';
import { useI18n, type TranslationKey } from '@/i18n';
import { formatDateTime } from '@/lib/format';
import { useAsync, useOnline } from '@/lib/useAsync';
import styles from './admin.module.css';

type Action = 'create' | 'revoke';

// The seeded primary admin is the only super admin; no others can be created.
const ROLES: AdminRole[] = ['support_agent', 'verifier', 'finance', 'dispute_lead'];

const STATUS_TONES: Record<StaffStatus, StatusTone> = {
  active: 'success',
  pending_approval: 'warning',
  revoked: 'error',
};

/** AUTH-06 and ADM-10: staff creation, roles and revocation. */
export default function StaffPage() {
  const { t } = useI18n();
  const online = useOnline();
  const { actor, canAct } = useAdminActor();
  const staff = useAsync(() => api.adminListStaff(), 'admin-staff');
  const [query, setQuery] = useState('');
  const [action, setAction] = useState<Action | null>(null);
  const [target, setTarget] = useState<StaffMember | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<AdminRole>('support_agent');
  const [busy, setBusy] = useState(false);

  const { reload } = staff;
  useEffect(() => api.subscribe('admin-audit', reload), [reload]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (staff.data ?? []).filter((member) =>
      [member.name, member.phone, member.adminRole, member.id]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    );
  }, [staff.data, query]);

  const roleOptions = ROLES.map((value) => ({
    value,
    label: t(`role.${roleKey(value)}` as TranslationKey),
  }));

  function open(next: Action, member: StaffMember | null) {
    setTarget(member);
    setName('');
    setPhone('');
    setRole('support_agent');
    setAction(next);
  }

  async function confirm(reason: string) {
    if (!actor || !action) return;
    setBusy(true);
    try {
      if (action === 'create') {
        await api.adminCreateStaff({ actor, reason, name, phone, adminRole: role });
      }
      if (action === 'revoke' && target) {
        await api.adminRevokeStaff(target.id, { actor, reason });
      }
      setAction(null);
      setTarget(null);
      reload();
    } finally {
      setBusy(false);
    }
  }

  const columns: AdminColumn<StaffMember>[] = [
    {
      key: 'name',
      header: t('admin.staff.name'),
      render: (row) => (
        <span className={styles.main}>
          <span className={styles.strong}>{row.name}</span>
          <span className={styles.muted}>{row.id}</span>
        </span>
      ),
    },
    { key: 'phone', header: t('admin.staff.phone'), render: (row) => row.phone },
    {
      key: 'role',
      header: t('admin.staff.role'),
      render: (row) => t(`role.${roleKey(row.adminRole)}` as TranslationKey),
    },
    {
      key: 'createdBy',
      header: t('admin.staff.createdBy'),
      render: (row) =>
        row.createdBy && row.createdBy !== 'bootstrap' ? row.createdBy : t('admin.none'),
    },
    { key: 'created', header: t('admin.disputes.opened'), render: (row) => formatDateTime(row.createdAt) },
    {
      key: 'status',
      header: t('admin.filter.status'),
      render: (row) => <StatusChip tone={STATUS_TONES[row.status]} label={row.status} />,
    },
    {
      key: 'actions',
      header: t('admin.order.actions'),
      render: (row) => (
        <div className={styles.actions}>
          {canAct('staff.revoke') && row.status !== 'revoked' && row.id !== 'admin-owner' ? (
            <Button
              size="sm"
              variant="outline"
              onClick={(event) => {
                event.stopPropagation();
                open('revoke', row);
              }}
            >
              {t('admin.staff.revoke')}
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
        <h1 className={styles.title}>{t('admin.staff.title')}</h1>
        <p className={styles.intro}>{t('admin.staff.subtitle')}</p>
      </header>

      <div className={styles.actions}>
        {canAct('staff.create') ? (
          <Button onClick={() => open('create', null)}>{t('admin.staff.create')}</Button>
        ) : null}
      </div>

      <AdminStates
        loading={staff.loading}
        error={staff.error}
        empty={rows.length === 0}
        emptyTitle={t('admin.staff.title')}
        emptyBody={t('admin.staff.empty')}
        offline={!online}
        lastUpdated={staff.lastUpdated}
        onRetry={reload}
      >
        <AdminTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          caption={t('admin.staff.title')}
          filterLabel={t('admin.staff.name')}
          filterValue={query}
          onFilterChange={setQuery}
        />
      </AdminStates>

      <ReasonDialog
        open={action !== null}
        title={
          action === 'create' ? t('admin.staff.createTitle') : t('admin.staff.revokeTitle')
        }
        confirmLabel={
          action === 'create' ? t('admin.staff.create') : t('admin.staff.revoke')
        }
        busy={busy}
        onClose={() => setAction(null)}
        onConfirm={confirm}
        extra={
          action === 'create' ? (
            <div className={styles.fieldGrid}>
              <Input
                label={t('admin.staff.name')}
                value={name}
                required
                onChange={(event) => setName(event.target.value)}
              />
              <Input
                label={t('admin.staff.phone')}
                value={phone}
                required
                onChange={(event) => setPhone(event.target.value)}
              />
              <Select
                label={t('admin.staff.role')}
                options={roleOptions}
                value={role}
                onChange={(event) => setRole(event.target.value as AdminRole)}
              />
            </div>
          ) : undefined
        }
      />
    </div>
  );
}

function roleKey(role: AdminRole): string {
  switch (role) {
    case 'support_agent':
      return 'supportAgent';
    case 'dispute_lead':
      return 'disputeLead';
    case 'super_admin':
      return 'superAdmin';
    default:
      return role;
  }
}
