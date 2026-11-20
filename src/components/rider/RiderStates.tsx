import type { ReactNode } from 'react';
import { useI18n } from '@/i18n';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { Skeleton } from '@/components/ui/Skeleton';
import styles from '@/routes/rider/rider.module.css';

export interface RiderStatesProps {
  loading: boolean;
  error: string | null;
  empty?: boolean;
  emptyTitle?: string;
  emptyBody?: string;
  offline?: boolean;
  lastUpdated?: number | null;
  onRetry?: () => void;
  children: ReactNode;
}

/** Loading, empty, error and offline states for every rider data screen. */
export function RiderStates({
  loading,
  error,
  empty = false,
  emptyTitle,
  emptyBody,
  offline = false,
  lastUpdated,
  onRetry,
  children,
}: RiderStatesProps) {
  const { t } = useI18n();

  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (loading) {
    return (
      <div className={styles.stack} aria-busy="true" aria-label={t('common.loading')}>
        <Skeleton variant="line" width="35%" height={32} />
        <Skeleton variant="card" count={3} />
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
