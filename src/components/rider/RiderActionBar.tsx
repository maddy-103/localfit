import type { ReactNode } from 'react';
import { useI18n } from '@/i18n';
import styles from '@/routes/rider/rider.module.css';

/** One fixed bottom action bar; screens put their main action here. */
export function RiderActionBar({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className={styles.actionBar} role="group" aria-label={t('rider.task.actions')}>
      {children}
    </div>
  );
}
