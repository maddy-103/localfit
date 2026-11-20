import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/api/client';
import {
  ORDER_STATES,
  allowedRoles,
  nextStates,
  type OrderState,
} from '@/domain/orderMachine';
import { AdminStates } from '@/components/admin/AdminStates';
import { ReasonDialog } from '@/components/admin/ReasonDialog';
import { useAdminActor } from '@/components/admin/useAdminActor';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { StatusChip } from '@/components/ui/StatusChip';
import { useI18n } from '@/i18n';
import { formatDateTime, formatPaise } from '@/lib/format';
import { useAsync, useOnline } from '@/lib/useAsync';
import styles from './admin.module.css';

type Action = 'reassign' | 'cancel' | 'override';

/** ADM-04: every state change with actor, time, GPS and photo references. */
export default function OrderDetailPage() {
  const { id = '' } = useParams();
  const { t } = useI18n();
  const online = useOnline();
  const { actor, canAct } = useAdminActor();
  const order = useAsync(() => api.getOrder(id), `admin-order-${id}`);
  const riders = useAsync(() => api.listRiders(), 'admin-order-riders');
  const [action, setAction] = useState<Action | null>(null);
  const [riderId, setRiderId] = useState('');
  const [target, setTarget] = useState<OrderState>('CANCELLED');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { reload } = order;
  useEffect(() => api.subscribe('orders', reload), [reload]);
  useEffect(() => api.subscribe('admin-audit', reload), [reload]);

  const current = order.data;
  const riderOptions = (riders.data ?? []).map((rider) => ({ value: rider.id, label: rider.name }));
  const overrideOptions = current
    ? ORDER_STATES.filter(
        (state) =>
          nextStates(current.state).includes(state) &&
          allowedRoles(current.state, state).includes('admin'),
      ).map((state) => ({ value: state, label: state }))
    : [];

  function open(next: Action) {
    setError(null);
    if (next === 'reassign') setRiderId(riderOptions[0]?.value ?? '');
    if (next === 'override') setTarget(overrideOptions[0]?.value ?? current?.state ?? 'CANCELLED');
    setAction(next);
  }

  async function confirm(reason: string) {
    if (!actor || !action) return;
    setBusy(true);
    setError(null);
    try {
      if (action === 'reassign') await api.adminReassignRider(id, riderId, { actor, reason });
      if (action === 'cancel') await api.adminCancelOrder(id, { actor, reason });
      if (action === 'override') await api.adminOverrideOrder(id, target, { actor, reason });
      setAction(null);
      reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{t('app.name')}</p>
        <h1 className={styles.title}>{t('admin.orders.detailTitle', { id })}</h1>
        <p className={styles.intro}>{t('admin.orders.subtitle')}</p>
      </header>

      <AdminStates
        loading={order.loading || riders.loading}
        error={order.error ?? riders.error ?? error}
        empty={!order.loading && !current}
        emptyTitle={t('admin.orders.title')}
        emptyBody={t('admin.order.notFound')}
        offline={!online}
        lastUpdated={order.lastUpdated}
        onRetry={reload}
      >
        {current ? (
          <>
            <Card padded>
              <div className={styles.kpis}>
                <div className={styles.kpi}>
                  <p className={styles.kpiLabel}>{t('admin.orders.state')}</p>
                  <StatusChip tone="info" label={current.state} />
                </div>
                <div className={styles.kpi}>
                  <p className={styles.kpiLabel}>{t('admin.orders.value')}</p>
                  <p className={styles.kpiValue}>{formatPaise(current.totalPaise)}</p>
                </div>
                <div className={styles.kpi}>
                  <p className={styles.kpiLabel}>{t('admin.orders.placed')}</p>
                  <p className={styles.strong}>{formatDateTime(current.createdAt)}</p>
                </div>
                <div className={styles.kpi}>
                  <p className={styles.kpiLabel}>{t('admin.orders.customer')}</p>
                  <p className={styles.strong}>{current.buyerId}</p>
                </div>
              </div>
            </Card>

            <div className={styles.split}>
              <section className={styles.panel}>
                <h2 className={styles.panelTitle}>{t('admin.order.timeline')}</h2>
                <ol className={styles.timeline}>
                  {[...current.events].reverse().map((event) => (
                    <li className={styles.timelineItem} key={event.id}>
                      <span className={styles.timelineDot} aria-hidden="true" />
                      <div className={styles.timelineBody}>
                        <span className={styles.strong}>
                          {event.from} → {event.to}
                        </span>
                        <span className={styles.timelineMeta}>
                          <span>{formatDateTime(event.timestamp)}</span>
                          <span>
                            {t('admin.order.actor')}: {event.actor.role} · {event.actor.id}
                          </span>
                          {event.note ? <span>{event.note}</span> : null}
                          {event.gps
                            ? t('admin.order.gps', { lat: event.gps.lat, lng: event.gps.lng })
                            : null}
                          {event.photoIds?.length
                            ? t('admin.order.photos', { ids: event.photoIds.join(', ') })
                            : null}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              <section className={styles.panel}>
                <h2 className={styles.panelTitle}>{t('admin.order.actions')}</h2>
                <div className={styles.actions}>
                  {canAct('order.reassign') ? (
                    <Button variant="outline" onClick={() => open('reassign')}>
                      {t('admin.order.reassign')}
                    </Button>
                  ) : null}
                  {canAct('order.cancel') ? (
                    <Button variant="outline" onClick={() => open('cancel')}>
                      {t('admin.order.cancel')}
                    </Button>
                  ) : null}
                  {canAct('order.override') && overrideOptions.length ? (
                    <Button variant="outline" onClick={() => open('override')}>
                      {t('admin.order.override')}
                    </Button>
                  ) : null}
                </div>
                <p className={styles.muted}>{t('admin.reason.hint')}</p>
              </section>
            </div>
          </>
        ) : null}
      </AdminStates>

      <ReasonDialog
        open={action !== null}
        title={
          action
            ? t(`admin.order.${action}Title` as 'admin.order.reassignTitle')
            : t('admin.order.actions')
        }
        confirmLabel={action ? t(`admin.order.${action}` as 'admin.order.reassign') : undefined}
        busy={busy}
        onClose={() => setAction(null)}
        onConfirm={confirm}
        extra={
          action === 'reassign' ? (
            <Select
              label={t('admin.order.newRider')}
              options={riderOptions}
              value={riderId}
              onChange={(event) => setRiderId(event.target.value)}
            />
          ) : action === 'override' ? (
            <Select
              label={t('admin.order.targetState')}
              options={overrideOptions}
              value={target}
              onChange={(event) => setTarget(event.target.value as OrderState)}
            />
          ) : undefined
        }
      />
    </div>
  );
}
