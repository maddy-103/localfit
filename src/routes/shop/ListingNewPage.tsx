import { useCallback, useEffect, useState } from 'react';
import { api } from '@/api/client';
import type { ListingDraft } from '@/api/types';
import { ListingForm } from '@/components/shop/ListingForm';
import { ShopStates } from '@/components/shop/ShopStates';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/icons/Icon';
import { StatusChip } from '@/components/ui/StatusChip';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n';
import { formatDateTime } from '@/lib/format';
import { useAsync, useOnline } from '@/lib/useAsync';
import styles from './shop.module.css';

export default function ListingNewPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const online = useOnline();
  const [editing, setEditing] = useState<ListingDraft | null>(null);
  const [syncing, setSyncing] = useState(false);
  const drafts = useAsync(() => api.listListingDrafts(), 'shop-drafts');
  const { reload } = drafts;

  useEffect(() => api.subscribe('drafts', reload), [reload]);

  const sync = useCallback(async () => {
    setSyncing(true);
    try {
      await api.syncQueuedListings();
      reload();
    } catch {
      // The pending chips remain until the next successful sync.
    } finally {
      setSyncing(false);
    }
  }, [reload]);

  useEffect(() => {
    if (!online) return;
    let cancelled = false;
    void api.syncQueuedListings()
      .then(() => {
        if (!cancelled) reload();
      })
      .catch(() => {
        // Keep pending chips until the next successful sync.
      });
    return () => {
      cancelled = true;
    };
  }, [online, reload]);

  const remove = async (id: string) => {
    try {
      await api.deleteListingDraft(id);
      if (editing?.id === id) setEditing(null);
      reload();
    } catch (error) {
      toast(error instanceof Error ? error.message : t('common.error'));
    }
  };

  const queued = (drafts.data ?? []).filter((draft) => draft.status === 'queued');

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('shop.listing.title')}</h1>
        <p className={styles.intro}>{t('shop.listing.intro')}</p>
      </header>

      <Card padded>
        <ListingForm
          key={editing?.id ?? 'new'}
          draft={editing}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      </Card>

      <ShopStates
        loading={drafts.loading}
        error={drafts.error}
        empty={(drafts.data ?? []).length === 0}
        emptyTitle={t('shop.listing.drafts')}
        emptyBody={t('shop.listing.noDrafts')}
        offline={!online}
        lastUpdated={drafts.lastUpdated}
        onRetry={reload}
      >
        <div className={styles.stack}>
          <div className={styles.row}>
            <h2 className={styles.title}>{t('shop.listing.drafts')}</h2>
            {queued.length > 0 ? (
              <div className={styles.actions}>
                <StatusChip tone="pending" label={t('shop.listing.queued')} />
                <Button variant="outline" loading={syncing} onClick={() => void sync()}>
                  {syncing ? t('shop.listing.syncing') : t('shop.listing.sync')}
                </Button>
              </div>
            ) : null}
          </div>
          {!online && queued.length > 0 ? (
            <p className={styles.muted}>{t('shop.listing.offlineHint')}</p>
          ) : null}
          {(drafts.data ?? []).map((draft) => (
            <Card padded key={draft.id}>
              <div className={styles.row}>
                <div className={styles.rowMain}>
                  <strong>{draft.title}</strong>
                  <span className={styles.muted}>{formatDateTime(draft.updatedAt)}</span>
                  <span className={styles.price}>
                    {(draft.pricePaise / 100).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className={styles.rowAside}>
                  <StatusChip
                    tone={draft.status === 'published' ? 'success' : 'pending'}
                    label={t(
                      draft.status === 'published'
                        ? 'shop.listing.published'
                        : 'shop.listing.queued',
                    )}
                  />
                  <Button variant="outline" onClick={() => setEditing(draft)}>
                    {t('register.editDetails')}
                  </Button>
                  <Button
                    variant="ghost"
                    aria-label={t('shop.listing.remove')}
                    onClick={() => void remove(draft.id)}
                  >
                    <Icon name="trash" size={18} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ShopStates>
    </div>
  );
}
