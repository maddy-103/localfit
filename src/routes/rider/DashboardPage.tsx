import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/client';
import { Icon } from '@/components/icons/Icon';
import { Button } from '@/components/ui/Button';
import { StatusChip } from '@/components/ui/StatusChip';
import { Toggle } from '@/components/ui/Toggle';
import { TaskCard } from '@/components/rider/TaskCard';
import { RiderStates } from '@/components/rider/RiderStates';
import { useRiderOfflineQueue } from '@/components/rider/useRiderOfflineQueue';
import { useI18n } from '@/i18n';
import { useAsync, useOnline } from '@/lib/useAsync';
import styles from './rider.module.css';

/** Rider home: one switch, one next task and the required next screens. */
export default function DashboardPage() {
  const { t } = useI18n();
  const online = useOnline();
  const presence = useAsync(() => api.getRiderPresence(), 'rider-presence');
  const tasks = useAsync(() => api.listRiderTasks(), 'rider-tasks');
  const queue = useRiderOfflineQueue();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const offTasks = api.subscribe('rider-tasks', tasks.reload);
    const offPresence = api.subscribe('rider-presence', presence.reload);
    return () => {
      offTasks();
      offPresence();
    };
  }, [tasks.reload, presence.reload]);

  const toggle = async (value: boolean) => {
    setBusy(true);
    try {
      await api.setRiderOnline(value);
      presence.reload();
    } finally {
      setBusy(false);
    }
  };

  const next = tasks.data?.[0];

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>{t('console.riderTitle')}</p>
        <h1 className={styles.title}>{t('rider.nextTask')}</h1>
      </div>

      <div className={styles.onlineToggle}>
        <Toggle
          checked={presence.data?.online ?? false}
          onChange={(value) => void toggle(value)}
          disabled={busy}
          label={presence.data?.online ? t('rider.online') : t('rider.offline')}
          description={t('rider.toggleHint')}
        />
        <StatusChip
          tone={presence.data?.online ? 'success' : 'warning'}
          icon={presence.data?.online ? 'check-circle' : 'wifi-off'}
          label={presence.data?.online ? t('rider.online') : t('rider.offline')}
        />
      </div>

      {!online || queue.pending.length > 0 ? (
        <p className={styles.alert} role="status">
          <Icon name="wifi-off" size={18} />
          <span>
            {!online ? t('common.offline') : t('rider.task.pendingSync')}
            {queue.pending.length > 0 ? ` · ${t('rider.task.syncNow')}` : ''}
          </span>
        </p>
      ) : null}

      <RiderStates
        loading={tasks.loading}
        error={tasks.error}
        empty={!next}
        emptyTitle={t('rider.noTasks')}
        emptyBody={t('rider.noTasksBody')}
        offline={!online}
        lastUpdated={tasks.lastUpdated}
        onRetry={tasks.reload}
      >
        {next ? <TaskCard task={next} /> : null}
      </RiderStates>

      <div className={styles.row}>
        <Link className={styles.linkRow} to="/rider/tasks">
          <Icon name="truck" size={20} />
          <span className={styles.link}>{t('nav.tasks')}</span>
        </Link>
        <Link className={styles.linkRow} to="/rider/earnings">
          <Icon name="wallet" size={20} />
          <span className={styles.link}>{t('nav.earnings')}</span>
        </Link>
        <Link className={styles.linkRow} to="/rider/safety">
          <Icon name="shield" size={20} />
          <span className={styles.link}>{t('nav.safety')}</span>
        </Link>
      </div>
      {queue.pending.length > 0 ? (
        <Button variant="outline" onClick={() => void queue.sync()} loading={queue.syncing}>
          {t('rider.task.syncNow')}
        </Button>
      ) : null}
    </section>
  );
}
