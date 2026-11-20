import type { ReactNode } from 'react';
import { useI18n } from '@/i18n';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { Skeleton } from '@/components/ui/Skeleton';
import styles from '@/routes/shop/shop.module.css';

export interface ShopStatesProps {
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

/** Loading, empty, error and offline states shared by every console screen. */
export function ShopStates({
  loading,
  error,
  empty = false,
  emptyTitle,
  emptyBody,
  offline = false,
  lastUpdated,
  onRetry,
  children,
}: ShopStatesProps) {
  const { t } = useI18n();

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }
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
