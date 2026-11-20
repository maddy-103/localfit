import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '@/api/client';
import { useI18n, type TranslationKey } from '@/i18n';
import type { OrderEvent, OrderEventAction } from '@/domain/orderMachine';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusChip } from '@/components/ui/StatusChip';
import { orderLabelKey, orderTone } from '@/components/buyer/orderUi';
import { formatDateTime, formatPaise } from '@/lib/format';
import { useAsync, useOnline } from '@/lib/useAsync';
import styles from '@/components/buyer/pages.module.css';

const ACTION_KEYS: Record<OrderEventAction, TranslationKey> = {
  transition: 'timeline.PLACED',
  decision_keep: 'timeline.decisionKeep',
  decision_return: 'timeline.decisionReturn',
  swap_requested: 'timeline.swapRequested',
  swap_confirmed: 'timeline.swapConfirmed',
  otp_failed: 'timeline.otpFailed',
  support_opened: 'timeline.supportOpened',
  handover_photo: 'timeline.handoverPhoto',
  return_scanned: 'timeline.returnScanned',
  rider_confirmed: 'timeline.riderConfirmed',
  hold_released: 'timeline.holdReleased',
  refund_initiated: 'timeline.refundInitiated',
};

function actorKey(role: string): TranslationKey {
  if (role === 'buyer') return 'timeline.actorBuyer';
  if (role === 'shop') return 'timeline.actorShop';
  if (role === 'rider') return 'timeline.actorRider';
  return 'timeline.actorAdmin';
}

function EventRow({ event }: { event: OrderEvent }) {
  const { t } = useI18n();
  return (
    <li className={styles.event}>
      <span className={`${styles.eventDot} ${styles.eventDotDone}`} aria-hidden="true" />
      <div className={styles.eventBody}>
        <span className={styles.bold}>{t(orderLabelKey(event.to))}</span>
        {event.action && event.action !== 'transition' ? (
          <span className={styles.small}>{t(ACTION_KEYS[event.action])}</span>
        ) : null}
        {event.note ? <span className={styles.small}>{event.note}</span> : null}
        <span className={styles.small}>
          {t(actorKey(event.actor.role))} · {formatDateTime(event.timestamp)}
        </span>
      </div>
    </li>
  );
}

/** Canonical order details page: details, timeline, support and returns. */
export default function OrderDetailPage() {
  const { id = '' } = useParams();
  const { t } = useI18n();
  const online = useOnline();
  const { data, error, loading, lastUpdated, reload } = useAsync(() => api.getOrder(id), `order:${id}`);

  useEffect(() => api.subscribe('orders', reload), [reload]);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Breadcrumb
          items={[
            { label: t('breadcrumb.home'), to: '/' },
            { label: t('orders.title'), to: '/orders' },
            { label: t('orders.details') },
          ]}
        />
        {!online ? <OfflineBanner lastUpdated={lastUpdated ?? undefined} /> : null}

        {loading && !data ? (
          <div aria-busy="true"><Skeleton variant="card" count={3} /></div>
        ) : error || !data ? (
          <ErrorState message={error ?? t('common.notFoundBody')} onRetry={reload} />
        ) : (
          <>
            <div className={styles.orderMeta}>
              <h1 className={styles.heading}>{t('orders.orderNumber', { id: data.id })}</h1>
              <StatusChip tone={orderTone(data.state)} label={t(orderLabelKey(data.state))} />
            </div>
            <p className={styles.small}>
              {t('orders.placedOn', { date: formatDateTime(data.createdAt) })} · {t('orders.itemCount', { count: data.lines.length })}
            </p>

            <section className={`${styles.card} ${styles.sectionGrid}`}>
              <h2 className={styles.sectionTitle}>{t('orders.details')}</h2>
              {data.lines.map((line) => (
                <div key={line.id} className={styles.invoiceRow}>
                  <span>{line.productId}</span>
                  <span>{line.qty} × {formatPaise(line.pricePaise)}</span>
                </div>
              ))}
              <hr className={styles.divider} />
              <div className={styles.invoiceRow}><span>{t('orders.total')}</span><span className={styles.bold}>{formatPaise(data.totalPaise)}</span></div>
              <p className={styles.small}>{t('orders.placeholderNote')}</p>
              <div className={styles.row}>
                <Link to={`/support?order=${encodeURIComponent(data.id)}`} className={styles.outlinePill}>
                  {t('orders.help')}
                </Link>
                <Link to={`/orders/${data.id}/return`} className={styles.link}>{t('orders.return')}</Link>
              </div>
            </section>

            <section className={`${styles.card} ${styles.sectionGrid}`}>
              <h2 className={styles.sectionTitle}>{t('timeline.title')}</h2>
              <ol className={styles.timeline}>
                {[...data.events].reverse().map((event) => <EventRow key={event.id} event={event} />)}
              </ol>
            </section>

            <section className={`${styles.card} ${styles.sectionGrid}`}>
              <h2 className={styles.sectionTitle}>{t('orders.invoice')}</h2>
              <div className={styles.invoice}>
                <div className={styles.invoiceRow}><span>{t('orders.itemCount', { count: data.lines.length })}</span><span>{formatPaise(data.itemsPaise)}</span></div>
                <div className={styles.invoiceRow}><span>{t('bag.delivery')}</span><span>{formatPaise(data.deliveryFeePaise)}</span></div>
                <div className={styles.invoiceRow}><span className={styles.bold}>{t('orders.total')}</span><span className={styles.bold}>{formatPaise(data.totalPaise)}</span></div>
              </div>
              <p className={styles.small}>{t('orders.placeholderNote')}</p>
            </section>

            <section className={`${styles.disabledBlock} ${styles.sectionGrid}`}>
              <p className={styles.bold}>{t('orders.reviewComing')}</p>
              <p className={styles.small}>{t('orders.reviewHelp')}</p>
              <Button variant="outline" disabled>{t('stub.phase2')}</Button>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
