import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/client';
import { AdminStates } from '@/components/admin/AdminStates';
import { MapPlaceholder } from '@/components/ui/MapPlaceholder';
import { StatusChip } from '@/components/ui/StatusChip';
import { lateOrders } from '@/domain/admin';
import { useI18n } from '@/i18n';
import { formatDateTime } from '@/lib/format';
import { useNow } from '@/lib/useNow';
import { useAsync, useOnline } from '@/lib/useAsync';
import styles from './admin.module.css';

/** ADM-01 and ADM-05: live map, late-order alerts and stock conflicts. */
export default function DashboardPage() {
  const { t } = useI18n();
  const online = useOnline();
  const at = useNow(60_000);
  const orders = useAsync(() => api.listOrders(), 'admin-dash-orders');
  const conflicts = useAsync(() => api.listConflicts(), 'admin-dash-conflicts');
  const disputes = useAsync(() => api.adminListDisputes(), 'admin-dash-disputes');
  const riders = useAsync(() => api.listRiders(), 'admin-dash-riders');

  const { reload } = orders;
  useEffect(() => api.subscribe('orders', reload), [reload]);
  useEffect(() => api.subscribe('admin-disputes', disputes.reload), [disputes.reload]);

  const allOrders = orders.data ?? [];
  const active = allOrders.filter(
    (order) => !['DELIVERED', 'CANCELLED', 'CANCELLED_BY_SHOP', 'SHOP_DECLINED'].includes(order.state),
  );
  const late = lateOrders(allOrders, at);
  const openConflicts = (conflicts.data ?? []).filter((conflict) => !conflict.resolved);
  const openDisputes = (disputes.data ?? []).filter((dispute) => dispute.status !== 'decided');
  const onlineRiders = (riders.data ?? []).filter((rider) => rider.status === 'approved');

  const loading = orders.loading || conflicts.loading || disputes.loading || riders.loading;
  const error = orders.error ?? conflicts.error ?? disputes.error ?? riders.error;
  const lastUpdated = Math.min(
    ...[orders.lastUpdated, conflicts.lastUpdated, disputes.lastUpdated, riders.lastUpdated].filter(
      (value): value is number => value !== null,
    ),
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>LocalFit</p>
        <h1 className={styles.title}>{t('admin.dashboard.title')}</h1>
        <p className={styles.intro}>{t('admin.dashboard.subtitle')}</p>
      </header>

      <AdminStates
        loading={loading}
        error={error}
        offline={!online}
        lastUpdated={Number.isFinite(lastUpdated) ? lastUpdated : null}
        onRetry={() => {
          orders.reload();
          conflicts.reload();
          disputes.reload();
          riders.reload();
        }}
      >
        <div className={styles.kpis}>
          <Kpi label={t('admin.dashboard.activeOrders')} value={active.length} />
          <Kpi label={t('admin.dashboard.ridersOnline')} value={onlineRiders.length} />
          <Kpi label={t('admin.dashboard.openDisputes')} value={openDisputes.length} />
          <Kpi label={t('admin.dashboard.stockConflicts')} value={openConflicts.length} />
        </div>

        <div className={styles.split}>
          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>{t('admin.dashboard.activeOrders')}</h2>
            <MapPlaceholder
              caption={t('admin.dashboard.mapCaption')}
              progress={active.length ? 0.55 : 0}
            />
          </div>

          <div className={styles.stack}>
            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>{t('admin.dashboard.lateTitle')}</h2>
              {late.length === 0 ? (
                <p className={styles.muted}>{t('admin.dashboard.lateEmpty')}</p>
              ) : (
                <ul className={styles.list}>
                  {late.slice(0, 6).map((order) => {
                    const minutes = order.etaEndsAt
                      ? Math.max(0, Math.round((at - Date.parse(order.etaEndsAt)) / 60_000))
                      : 0;
                    return (
                      <li className={styles.listItem} key={order.id}>
                        <span className={styles.main}>
                          <StatusChip tone="error" label={t('admin.disputes.breached')} />
                          <span className={styles.muted}>
                            {t('admin.dashboard.lateAlert', { id: order.id, minutes })}
                          </span>
                        </span>
                        <Link to={`/admin/orders/${order.id}`}>{t('admin.open')}</Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>{t('admin.dashboard.conflictsTitle')}</h2>
              {openConflicts.length === 0 ? (
                <p className={styles.muted}>{t('admin.dashboard.conflictsEmpty')}</p>
              ) : (
                <ul className={styles.list}>
                  {openConflicts.slice(0, 6).map((conflict) => (
                    <li className={styles.listItem} key={conflict.id}>
                      <span className={styles.main}>
                        <span className={styles.strong}>
                          {t('admin.dashboard.conflictAlert', { productId: conflict.productId })}
                        </span>
                        <span className={styles.muted}>{formatDateTime(conflict.createdAt)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </AdminStates>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.kpi}>
      <p className={styles.kpiLabel}>{label}</p>
      <p className={styles.kpiValue}>{value}</p>
    </div>
  );
}
