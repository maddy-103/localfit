import { useEffect } from 'react';
import { api } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { StatusChip } from '@/components/ui/StatusChip';
import { TaskCard } from '@/components/rider/TaskCard';
import { RiderStates } from '@/components/rider/RiderStates';
import { useRiderOfflineQueue } from '@/components/rider/useRiderOfflineQueue';
import { useI18n } from '@/i18n';
import { useAsync, useOnline } from '@/lib/useAsync';
import styles from './rider.module.css';

/** RIDE-01/RIDE-09: one ordered list, pickup before drop, returns in place. */
export default function TasksPage() {
  const { t } = useI18n();
  const online = useOnline();
  const tasks = useAsync(() => api.listRiderTasks(), 'rider-tasks');
  const queue = useRiderOfflineQueue();

  useEffect(() => api.subscribe('rider-tasks', tasks.reload), [tasks.reload]);

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>{t('nav.rider')}</p>
        <h1 className={styles.title}>{t('rider.tasksTitle')}</h1>
        <p className={styles.intro}>{t('rider.tasksIntro')}</p>
      </div>

      {queue.pending.length > 0 ? (
        <div className={styles.statusRow}>
          <StatusChip tone="pending" label={t('rider.task.pendingSync')} />
          <Button variant="ghost" onClick={() => void queue.sync()} loading={queue.syncing}>
            {t('rider.task.syncNow')}
          </Button>
        </div>
      ) : null}

      <RiderStates
        loading={tasks.loading}
        error={tasks.error}
        empty={!tasks.data?.length}
        emptyTitle={t('rider.noTasks')}
        emptyBody={t('rider.noTasksBody')}
        offline={!online}
        lastUpdated={tasks.lastUpdated}
        onRetry={tasks.reload}
      >
        <div className={styles.stack}>
          {tasks.data?.map((task) => <TaskCard key={task.id} task={task} />)}
        </div>
      </RiderStates>
    </section>
  );
}
