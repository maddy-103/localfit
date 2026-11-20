import type { ReactNode } from 'react';
import { useI18n } from '@/i18n';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { Skeleton } from '@/components/ui/Skeleton';
import styles from './admin.module.css';

export interface AdminStatesProps {
  loading: boolean;
  error: string | null;
  empty?: boolean;
  emptyTitle?: string;
  emptyBody?: string;
  offline?: boolean;
  lastUpdated?: number | null;
  onRetry?: () => void;
  skeletonRows?: number;
  children: ReactNode;
}

/**
 * Loading, empty, error and offline states for every admin data screen.
 * The loading skeleton is shaped like a queue table so nothing jumps.
 */
export function AdminStates({
  loading,
  error,
  empty = false,
  emptyTitle,
  emptyBody,
  offline = false,
  lastUpdated,
  onRetry,
  skeletonRows = 5,
  children,
}: AdminStatesProps) {
  const { t } = useI18n();

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (loading) {
    return (
      <div className={styles.skeletonRows} aria-busy="true" aria-label={t('common.loading')}>
        <Skeleton variant="line" width="30%" height={28} />
        {Array.from({ length: skeletonRows }, (_, index) => (
          <div className={styles.skeletonRow} key={index}>
            <Skeleton variant="line" />
            <Skeleton variant="line" />
            <Skeleton variant="line" />
            <Skeleton variant="line" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {offline ? <OfflineBanner lastUpdated={lastUpdated ?? undefined} /> : null}
      {empty ? (
        <EmptyState title={emptyTitle ?? t('common.empty')} body={emptyBody} />
      ) : (
        children
      )}
    </>
  );
}
