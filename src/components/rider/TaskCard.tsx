import { Link } from 'react-router-dom';
import { Icon } from '@/components/icons/Icon';
import { StatusChip, type StatusTone } from '@/components/ui/StatusChip';
import { useI18n } from '@/i18n';
import { mapsLinkForTask, type RiderTask } from '@/domain/rider';
import styles from '@/routes/rider/rider.module.css';

const TYPE_KEY = {
  pickup: 'rider.task.pickup',
  drop: 'rider.task.drop',
  return_pickup: 'rider.task.returnPickup',
} as const;

const TYPE_TONE: Record<RiderTask['type'], StatusTone> = {
  pickup: 'info',
  drop: 'pending',
  return_pickup: 'warning',
};

const TYPE_ICON = {
  pickup: 'box',
  drop: 'door',
  return_pickup: 'truck',
} as const;

/** One task per card, with directions built from coordinates (RIDE-01). */
export function TaskCard({ task }: { task: RiderTask }) {
  const { t } = useI18n();
  const typeKey = TYPE_KEY[task.type];
  const destination = task.type === 'drop' ? task.buyer : task.shop;

  return (
    <article className={styles.taskCard}>
      <p className={styles.taskTitle}>{t(typeKey)}</p>
      <div className={styles.chips}>
        <StatusChip tone={TYPE_TONE[task.type]} icon={TYPE_ICON[task.type]} label={t(typeKey)} />
        <span className={styles.muted}>{t('rider.task.order', { id: task.orderId })}</span>
        {task.pendingSync ? (
          <StatusChip tone="pending" label={t('rider.task.pendingSync')} />
        ) : null}
      </div>
      <p className={styles.place}>
        {t(task.type === 'drop' ? 'rider.task.buyer' : 'rider.task.shop')}: {destination.name}
      </p>
      <p className={styles.muted}>
        {destination.line}, {destination.area}
      </p>
      <div className={styles.row}>
        <a
          className={styles.linkRow}
          href={mapsLinkForTask(task)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon name="pin" size={20} />
          <span className={styles.link}>{t('rider.task.navigate')}</span>
        </a>
        <Link className={styles.linkRow} to={`/rider/tasks/${task.id}`}>
          <Icon name="chevron-right" size={20} />
          <span className={styles.link}>{t('rider.task.open')}</span>
        </Link>
      </div>
    </article>
  );
}
