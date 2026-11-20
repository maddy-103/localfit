import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import type { AdminConfig, ConfigChange } from '@/api/types';
import { AdminStates } from '@/components/admin/AdminStates';
import { ReasonDialog } from '@/components/admin/ReasonDialog';
import { useAdminActor } from '@/components/admin/useAdminActor';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { useI18n } from '@/i18n';
import { formatDateTime } from '@/lib/format';
import { useAsync, useOnline } from '@/lib/useAsync';
import styles from './admin.module.css';

type NumberKey = Exclude<keyof AdminConfig, 'codTryAtDoorAllowed'>;

/** ADM-08: super-admin configuration with a reason and before/after history. */
export default function ConfigPage() {
  const { t } = useI18n();
  const online = useOnline();
  const { actor, canAct } = useAdminActor();
  const config = useAsync(() => api.adminGetConfig(), 'admin-config');
  const history = useAsync(() => api.adminListConfigHistory(), 'admin-config-history');
  const [patch, setPatch] = useState<Partial<AdminConfig>>({});
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  const { reload } = config;
  useEffect(() => api.subscribe('admin-audit', reload), [reload]);
  useEffect(() => api.subscribe('admin-audit', history.reload), [history.reload]);

  const current = config.data ? { ...config.data, ...patch } : null;

  function setNumber(key: NumberKey, value: string) {
    const number = Number(value);
    setPatch((previous) => ({ ...previous, [key]: Number.isFinite(number) ? number : 0 }));
  }

  function setMinutes(key: 'trialWindowMs' | 'reservationHoldMs' | 'acceptTimeoutMs' | 'compensationThresholdMs', value: string) {
    const number = Number(value);
    setPatch((previous) => ({
      ...previous,
      [key]: (Number.isFinite(number) ? number : 0) * 60_000,
    }));
  }

  async function save(reason: string) {
    if (!actor || Object.keys(patch).length === 0) return;
    setBusy(true);
    try {
      await api.adminUpdateConfig(patch, { actor, reason });
      setPatch({});
      setSaving(false);
      reload();
      history.reload();
    } finally {
      setBusy(false);
    }
  }

  const changes: ConfigChange[] = history.data ?? [];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>LocalFit</p>
        <h1 className={styles.title}>{t('admin.config.title')}</h1>
        <p className={styles.intro}>{t('admin.config.subtitle')}</p>
      </header>

      <AdminStates
        loading={config.loading || history.loading}
        error={config.error ?? history.error}
        offline={!online}
        lastUpdated={config.lastUpdated}
        onRetry={() => {
          reload();
          history.reload();
        }}
      >
        <div className={styles.split}>
          <Card padded>
            {current ? (
              <div className={styles.fieldGrid}>
                <Input
                  label={t('admin.config.radius')}
                  type="number"
                  min={0}
                  value={current.serviceRadiusKm}
                  onChange={(event) => setNumber('serviceRadiusKm', event.target.value)}
                />
                <Input
                  label={t('admin.config.commission')}
                  type="number"
                  min={0}
                  value={current.commissionBps}
                  onChange={(event) => setNumber('commissionBps', event.target.value)}
                />
                <Input
                  label={t('admin.config.trial')}
                  type="number"
                  min={1}
                  value={Math.round(current.trialWindowMs / 60_000)}
                  onChange={(event) => setMinutes('trialWindowMs', event.target.value)}
                />
                <Input
                  label={t('admin.config.reservation')}
                  type="number"
                  min={1}
                  value={Math.round(current.reservationHoldMs / 60_000)}
                  onChange={(event) => setMinutes('reservationHoldMs', event.target.value)}
                />
                <Input
                  label={t('admin.config.accept')}
                  type="number"
                  min={1}
                  value={Math.round(current.acceptTimeoutMs / 60_000)}
                  onChange={(event) => setMinutes('acceptTimeoutMs', event.target.value)}
                />
                <Input
                  label={t('admin.config.compensation')}
                  type="number"
                  min={1}
                  value={Math.round(current.compensationThresholdMs / 60_000)}
                  onChange={(event) => setMinutes('compensationThresholdMs', event.target.value)}
                />
                <Input
                  label={t('admin.config.codMin')}
                  type="number"
                  min={0}
                  value={current.codMinPrepaidOrders}
                  onChange={(event) => setNumber('codMinPrepaidOrders', event.target.value)}
                />
                <Input
                  label={t('admin.config.codCap')}
                  type="number"
                  min={0}
                  value={Math.round(current.codCapPaise / 100)}
                  onChange={(event) =>
                    setPatch((previous) => ({
                      ...previous,
                      codCapPaise: Number(event.target.value) * 100,
                    }))
                  }
                />
                <Input
                  label={t('admin.config.codCapUntil')}
                  type="number"
                  min={0}
                  value={current.codCapUntilOrders}
                  onChange={(event) => setNumber('codCapUntilOrders', event.target.value)}
                />
                <Toggle
                  checked={current.codTryAtDoorAllowed}
                  onChange={(checked) =>
                    setPatch((previous) => ({ ...previous, codTryAtDoorAllowed: checked }))
                  }
                  label={t('admin.config.codTrial')}
                />
              </div>
            ) : null}
            <div className={styles.actions}>
              {canAct('config.update') ? (
                <Button
                  disabled={!current || Object.keys(patch).length === 0}
                  onClick={() => setSaving(true)}
                >
                  {t('admin.config.save')}
                </Button>
              ) : null}
            </div>
          </Card>

          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>{t('admin.config.history')}</h2>
            {changes.length === 0 ? (
              <p className={styles.muted}>{t('admin.config.emptyHistory')}</p>
            ) : (
              <ul className={styles.history}>
                {changes.map((change) => (
                  <li className={styles.historyItem} key={change.id}>
                    <span className={styles.strong}>{formatDateTime(change.timestamp)}</span>
                    <span className={styles.muted}>
                      {change.actor.name} · {change.reason}
                    </span>
                    <code className={styles.json}>
                      {JSON.stringify({ before: change.before, after: change.after })}
                    </code>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </AdminStates>

      <ReasonDialog
        open={saving}
        title={t('admin.config.saveTitle')}
        busy={busy}
        onClose={() => setSaving(false)}
        onConfirm={save}
      />
    </div>
  );
}
