import type { ReactNode } from 'react';
import { Icon, type IconName } from '../icons/Icon';
import styles from './surfaces.module.css';

export interface EmptyStateProps {
  title: string;
  body?: string;
  icon?: IconName;
  action?: ReactNode;
}

export function EmptyState({ title, body, icon = 'box', action }: EmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      <span className={styles.stateIcon} aria-hidden="true">
        <Icon name={icon} size={28} />
      </span>
      <p className={styles.stateTitle}>{title}</p>
      {body ? <p className={styles.stateBody}>{body}</p> : null}
      {action ? <div className={styles.stateAction}>{action}</div> : null}
    </div>
  );
}
