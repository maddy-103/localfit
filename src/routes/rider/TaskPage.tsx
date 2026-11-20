import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '@/api/client';
import type { Order } from '@/api/types';
import { Icon } from '@/components/icons/Icon';
import { StatusChip } from '@/components/ui/StatusChip';
import { RiderStates } from '@/components/rider/RiderStates';
import { mapsLinkForTask } from '@/domain/rider';
import { useAsync, useOnline } from '@/lib/useAsync';
import { useI18n } from '@/i18n';
import type { TranslationKey } from '@/i18n';
import { PickupTaskView } from './PickupTaskView';
import { DropTaskView } from './DropTaskView';
import { ReturnPickupTaskView } from './ReturnPickupTaskView';
import styles from './rider.module.css';

const TYPE_KEY: Record<string, TranslationKey> = {
  pickup: 'rider.task.pickup',
  drop: 'rider.task.drop',
  return_pickup: 'rider.task.returnPickup',
};

/** RIDE-01: one main task per screen, with a single fixed bottom action. */
export default function TaskPage() {
  const { id = '' } = useParams();
  const { t } = useI18n();
  const online = useOnline();
  const detail = useAsync(() => api.getRiderTask(id), `task:${id}`);
  const [refreshed, setRefreshed] = useState<{ id: string; order: Order } | null>(null);

  useEffect(() => {
    const offTasks = api.subscribe('rider-tasks', detail.reload);
    const offQueue = api.subscribe('rider-queue', detail.reload);
    return () => {
      offTasks();
      offQueue();
    };
  }, [detail.reload]);

  const task = detail.data?.task;
  const order = refreshed?.id === id ? refreshed.order : detail.data?.order;

  const body = () => {
    if (!task || !order) return null;
    const props = { task, order, onOrder: (next: Order) => setRefreshed({ id, order: next }), onChange: detail.reload };
    if (task.type === 'pickup') return <PickupTaskView {...props} />;
    if (task.type === 'return_pickup') return <ReturnPickupTaskView {...props} />;
    return <DropTaskView {...props} />;
  };

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>{t('nav.tasks')}</p>
        <h1 className={styles.title}>
          {task ? t(TYPE_KEY[task.type] ?? 'rider.task.drop') : t('rider.task.notFound')}
        </h1>
        <Link className={styles.link} to="/rider/tasks">
          <Icon name="arrow-right" size={16} /> {t('rider.task.back')}
        </Link>
      </div>

      <RiderStates
        loading={detail.loading}
        error={detail.error}
        offline={!online}
        lastUpdated={detail.lastUpdated}
        onRetry={detail.reload}
      >
        {task ? (
          <>
            <div className={styles.tile}>
              <p className={styles.place}>{t('rider.task.order', { id: task.orderId })}</p>
              <p className={styles.muted}>
                {t(task.type === 'drop' ? 'rider.task.buyer' : 'rider.task.shop')}:{' '}
                {(task.type === 'drop' ? task.buyer : task.shop).name}
              </p>
              <a
                className={styles.linkRow}
                href={mapsLinkForTask(task)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="pin" size={20} />
                <span className={styles.link}>{t('rider.task.navigate')}</span>
              </a>
            </div>
            {order ? (
              <div className={styles.statusRow}>
                <StatusChip
                  tone={task.pendingSync ? 'pending' : 'info'}
                  icon={task.pendingSync ? 'clock' : 'truck'}
                  label={task.pendingSync ? t('rider.task.pendingSync') : t('rider.task.order', { id: order.state })}
                />
              </div>
            ) : null}
            {body()}
          </>
        ) : (
          <div className={styles.notice} role="status">
            <StatusChip tone="success" label={t('rider.task.closed')} />
            <Link className={styles.link} to="/rider/tasks">
              {t('rider.task.back')}
            </Link>
          </div>
        )}
      </RiderStates>
    </section>
  );
}
