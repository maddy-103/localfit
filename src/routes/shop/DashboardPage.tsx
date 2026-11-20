import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/client';
import type { Order } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/icons/Icon';
import { Select } from '@/components/ui/Select';
import { Timer } from '@/components/ui/Timer';
import { useToast } from '@/components/ui/Toast';
import { ShopStates } from '@/components/shop/ShopStates';
import { Phase2Card } from '@/components/shop/Phase2Card';
import { useI18n, type TranslationKey } from '@/i18n';
import { formatPaise, formatRelative } from '@/lib/format';
import { useAsync, useOnline } from '@/lib/useAsync';
import { useNow } from '@/lib/useNow';
import { DECLINE_REASONS } from '@/domain/shop';
import { SHOP_ACTOR } from '@/components/shop/actor';
import styles from './shop.module.css';

export default function DashboardPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const online = useOnline();
  const current = useNow(60_000);
  const [declineFor, setDeclineFor] = useState<string | null>(null);
  const [reason, setReason] = useState<string>(DECLINE_REASONS[0]);
  const [busy, setBusy] = useState<string | null>(null);

  const summary = useAsync(() => api.getShopSummary(), 'shop-summary');
  const orders = useAsync(() => api.listShopOrders(), 'shop-orders');
  const { reload: reloadSummary } = summary;
  const { reload: reloadOrders } = orders;
  const reload = useCallback(() => {
    reloadSummary();
    reloadOrders();
  }, [reloadSummary, reloadOrders]);

  useEffect(() => api.subscribe('orders', reload), [reload]);
  useEffect(() => api.subscribe('inventory', reload), [reload]);
  useEffect(() => {
    void api.releaseExpiredOrders().then(reload).catch(() => {
      // The countdown still works if the release call fails.
    });
  }, [reload]);

  const act = async (order: Order, action: 'accept' | 'decline') => {
    setBusy(order.id);
    try {
      if (action === 'accept') await api.acceptOrder(order.id, SHOP_ACTOR);
      else await api.declineOrder(order.id, reason, SHOP_ACTOR);
      setDeclineFor(null);
      toast(t(action === 'accept' ? 'shop.dashboard.accept' : 'shop.dashboard.decline'));
      reload();
    } catch (error) {
      toast(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setBusy(null);
    }
  };

  const awaiting = (orders.data ?? []).filter((order) => order.state === 'PLACED');

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('shop.dashboard.title')}</h1>
        <p className={styles.intro}>{t('shop.orders.subtitle')}</p>
      </header>

      <ShopStates
        loading={summary.loading || orders.loading}
        error={summary.error ?? orders.error}
        offline={!online}
        lastUpdated={orders.lastUpdated}
        onRetry={reload}
      >
        <div className={styles.grid}>
          <Card padded>
            <span className={styles.statValue}>{awaiting.length}</span>
            <span className={styles.muted}>{t('shop.dashboard.awaiting')}</span>
          </Card>
          <Card padded>
            <span className={styles.statValue}>{formatPaise(summary.data?.salesPaise ?? 0)}</span>
            <span className={styles.muted}>{t('shop.dashboard.sales')}</span>
          </Card>
          <Card padded>
            <span className={styles.statValue}>{formatPaise(summary.data?.earningsPaise ?? 0)}</span>
            <span className={styles.muted}>{t('shop.dashboard.earnings')}</span>
          </Card>
        </div>

        <div className={styles.grid}>
          <div className={styles.alert}>
            <Icon name="alert" size={20} />
            <span>{t('shop.dashboard.lowStock')}: {summary.data?.lowStock ?? 0}</span>
          </div>
          <div className={styles.alert}>
            <Icon name="shield" size={20} />
            <span>{t('shop.dashboard.conflicts')}: {summary.data?.conflicts ?? 0}</span>
          </div>
          <div className={styles.alert}>
            <Icon name="box" size={20} />
            <span>{t('shop.dashboard.returns')}: {summary.data?.returns ?? 0}</span>
          </div>
        </div>

        <div className={styles.stack}>
          {awaiting.length === 0 ? (
            <p className={styles.muted}>{t('shop.dashboard.noOrders')}</p>
          ) : null}
          {awaiting.map((order) => (
            <Card padded key={order.id}>
              <div className={styles.row}>
                <div className={styles.rowMain}>
                  <strong>{t('shop.order.title', { id: order.id })}</strong>
                  <span className={styles.muted}>
                    {t('shop.orders.itemCount', { count: order.lines.reduce((sum, line) => sum + line.qty, 0) })}
                    {' · '}
                    {formatRelative(order.createdAt, current)}
                  </span>
                  <span className={styles.price}>{formatPaise(order.itemsPaise)}</span>
                  <Timer
                    endsAt={order.acceptsUntil ?? order.createdAt}
                    label={t('shop.dashboard.awaiting')}
                    onExpire={reload}
                  />
                </div>
                <div className={styles.rowAside}>
                  <Button size="lg" loading={busy === order.id} onClick={() => act(order, 'accept')}>
                    {t('shop.dashboard.accept')}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => {
                      setDeclineFor(declineFor === order.id ? null : order.id);
                      setReason(DECLINE_REASONS[0]);
                    }}
                  >
                    {t('shop.dashboard.decline')}
                  </Button>
                  <Link to={`/shop/orders/${order.id}`}>{t('shop.orders.open')}</Link>
                </div>
              </div>
              {declineFor === order.id ? (
                <div className={styles.stack}>
                  <p className={styles.muted}>{t('shop.dashboard.declineHint')}</p>
                  <Select
                    label={t('shop.dashboard.declineTitle')}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    options={DECLINE_REASONS.map((value) => ({
                      value,
                      label: t(`shop.dashboard.decline.${value}` as TranslationKey),
                    }))}
                  />
                  <div className={styles.actions}>
                    <Button destructive loading={busy === order.id} onClick={() => act(order, 'decline')}>
                      {t('shop.dashboard.decline')}
                    </Button>
                  </div>
                </div>
              ) : null}
            </Card>
          ))}
          <div className={styles.actions}>
            <Link to="/shop/orders">
              <Button variant="outline" size="lg">{t('shop.dashboard.viewOrders')}</Button>
            </Link>
          </div>
          <p className={styles.muted}>{t('shop.dashboard.releaseNote')}</p>
        </div>

        <div className={styles.grid}>
          <Phase2Card label={t('shop.dashboard.insights')} icon="chart" />
          <Phase2Card label={t('shop.dashboard.campaigns')} icon="bell" />
        </div>
      </ShopStates>
    </div>
  );
}
