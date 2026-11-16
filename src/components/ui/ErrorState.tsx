import { Button } from './Button';
import { Icon, type IconName } from '../icons/Icon';
import { useI18n } from '@/i18n';
import styles from './surfaces.module.css';

export interface ErrorStateProps {
  message: string;
  title?: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: IconName;
}

/** Error state always offers the next action. */
export function ErrorState({
  message,
  title,
  onRetry,
  retryLabel,
  icon = 'alert',
}: ErrorStateProps) {
  const { t } = useI18n();

  return (
    <div className={styles.emptyState} role="alert">
      <span className={styles.stateIcon} aria-hidden="true">
        <Icon name={icon} size={28} />
      </span>
      <p className={styles.stateTitle}>{title ?? t('common.error')}</p>
      <p className={styles.stateBody}>{message}</p>
      {onRetry ? (
        <div className={styles.stateAction}>
          <Button variant="outline" onClick={onRetry}>
            {retryLabel ?? t('common.retry')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
