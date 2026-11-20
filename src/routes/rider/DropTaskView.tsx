import { StatusChip } from '@/components/ui/StatusChip';
import { useI18n } from '@/i18n';
import { OtpStep } from './OtpStep';
import { TrialStep } from './TrialStep';
import { CloseStep } from './CloseStep';
import styles from './rider.module.css';
import type { TaskViewProps } from './taskTypes';

/** RIDE-03: the drop screen shows only the step for the current order state. */
export function DropTaskView(props: TaskViewProps) {
  const { t } = useI18n();

  switch (props.order.state) {
    case 'PICKED_UP':
    case 'IN_TRANSIT':
    case 'ARRIVED':
      return <OtpStep {...props} />;
    case 'OTP_VERIFIED':
    case 'TRIAL_ACTIVE':
      return <TrialStep {...props} />;
    case 'DECISIONS_LOCKED':
      return <CloseStep {...props} />;
    case 'DELIVERED':
    case 'RETURN_PICKED':
    case 'RETURN_RECEIVED':
      return (
        <p className={styles.notice} role="status">
          <StatusChip tone="success" label={t('rider.task.closed')} />
        </p>
      );
    default:
      return <OtpStep {...props} />;
  }
}
