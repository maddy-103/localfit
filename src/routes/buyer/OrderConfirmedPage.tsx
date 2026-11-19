import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '@/api/client';
import type { Order } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { Skeleton } from '@/components/ui/Skeleton';
import { useI18n } from '@/i18n';
import { formatEta, formatPaise, formatTime } from '@/lib/format';
import { useAsync, useOnline } from '@/lib/useAsync';
import flow from '@/components/buyer/flow.module.css';

export default function OrderConfirmedPage() {
  const { id = '' } = useParams();
  const location = useLocation();
  const { t } = useI18n();
  const online = useOnline();
  const passedIds = (location.state as { orderIds?: string[] } | null)?.orderIds ?? [];
  const ids = passedIds.length ? passedIds : [id];

  const { data, error, loading, lastUpdated, reload } = useAsync<Order[]>(
    async () => {
      const orders = await Promise.all(ids.map((orderId) => api.getOrder(orderId)));
      return orders.filter((order): order is Order => Boolean(order));
    },
    ids.join(','),
  );

  if (loading && !data) {
    return (
      <main className={flow.page}>
        <div className={flow.container}>
          <h1>{t('common.loading')}</h1>
          <Skeleton variant="line" width="40%" height={36} />
          <Skeleton variant="card" count={2} />
        </div>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className={flow.page}>
        <div className={flow.container}>
          <h1>{t('confirmed.eyebrow')}</h1>
          <ErrorState message={error} onRetry={reload} />
        </div>
      </main>
    );
  }

  const primary = data?.[0];
  if (!primary) {
    return (
      <main className={flow.page}>
        <div className={flow.container}>
          <h1>{t('common.notFound')}</h1>
          <ErrorState message={t('common.notFoundBody')} />
        </div>
      </main>
    );
  }

  return (
    <main className={flow.page}>
      <div className={flow.container}>
        {!online ? <OfflineBanner lastUpdated={lastUpdated ?? undefined} /> : null}
        <p className={flow.hint}>{t('confirmed.eyebrow')}</p>
        <h1>{formatPaise(primary.totalPaise)}</h1>
        <p className={flow.hint}>
          {primary.payment.mode === 'hold' ? t('trialTerms.card') : t('trialTerms.upi')}
        </p>

        <div className={flow.twoColumn}>
          <div className={flow.stack}>
            <section className={flow.card}>
              <dl>
                <dt className={flow.hint}>{t('confirmed.orderId')}</dt>
                <dd>{primary.id}</dd>
                <dt className={flow.hint}>{t('confirmed.shop')}</dt>
                <dd>{primary.shopId}</dd>
                <dt className={flow.hint}>{t('confirmed.eta')}</dt>
                <dd>
                  {formatEta(...primary.etaMin)} · {formatTime(primary.createdAt)}
                </dd>
              </dl>
            </section>

            {data.length > 1 ? (
              <section className={flow.card}>
                <h2 className={flow.cardTitle}>{t('confirmed.other')}</h2>
                <p className={flow.hint}>{t('confirmed.multi')}</p>
                <ul className={flow.lineList}>
                  {data.slice(1).map((order) => (
                    <li className={flow.summaryRow} key={order.id}>
                      <span>{order.shopId}</span>
                      <Link className={flow.link} to={`/orders/${order.id}/track`}>
                        {formatEta(...order.etaMin)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside className={flow.summary}>
            <h2 className={flow.cardTitle}>{t('confirmed.nextTitle')}</h2>
            <ol className={flow.nextList}>
              <li>{t('confirmed.next1')}</li>
              <li>{t('confirmed.next2')}</li>
              <li>{t('confirmed.next3')}</li>
              <li>{t('confirmed.next4')}</li>
            </ol>
            <Link to={`/orders/${primary.id}/track`}>
              <Button size="lg" fullWidth rightIcon="arrow-right">
                {t('confirmed.track')}
              </Button>
            </Link>
            <Link className={flow.link} to={`/support?order=${encodeURIComponent(primary.id)}`}>
              {t('orders.help')}
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
