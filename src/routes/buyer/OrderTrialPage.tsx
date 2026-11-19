import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '@/api/client';
import type { Order, Product } from '@/api/types';
import type { OrderActor } from '@/domain/orderMachine';
import type { TrialDecision } from '@/domain/trial';
import { OrderTimeline } from '@/components/buyer/OrderTimeline';
import { TrialItemRow } from '@/components/buyer/TrialItemRow';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Icon } from '@/components/icons/Icon';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { Skeleton } from '@/components/ui/Skeleton';
import { useI18n } from '@/i18n';
import { formatPaise, formatRemaining } from '@/lib/format';
import { useNow } from '@/lib/useNow';
import { useAsync, useOnline } from '@/lib/useAsync';
import { useAppStore } from '@/store/appStore';
import flow from '@/components/buyer/flow.module.css';

interface TrialData {
  order: Order | null;
  products: Product[];
}

export default function OrderTrialPage() {
  const { id = '' } = useParams();
  const { t } = useI18n();
  const online = useOnline();
  const now = useNow(1000);
  const session = useAppStore((state) => state.session);
  const [refreshed, setRefreshed] = useState<{ id: string; order: Order } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const expiredRef = useRef<string | null>(null);
  const actor = useMemo<OrderActor>(
    () => ({ id: session?.id ?? 'buyer-ananya', role: 'buyer' }),
    [session?.id],
  );

  const { data, error, loading, lastUpdated, reload } = useAsync<TrialData>(
    async () => {
      const [loaded, products] = await Promise.all([api.getOrder(id), api.listProducts()]);
      return { order: loaded, products };
    },
    id,
  );

  const order = refreshed?.id === id ? refreshed.order : (data?.order ?? null);
  const setOrder = useCallback(
    (next: Order) => setRefreshed({ id, order: next }),
    [id],
  );

  useEffect(() => api.subscribe(`order:${id}`, reload), [id, reload]);

  const remaining = order?.trialEndsAt ? Math.max(0, Date.parse(order.trialEndsAt) - now) : 0;
  const live = order?.state === 'TRIAL_ACTIVE';

  useEffect(() => {
    if (!order || !live || remaining > 0 || expiredRef.current === order.id) return;
    expiredRef.current = order.id;
    void api.lockTrial(order.id, { id: 'system', role: 'system' }, 'timer').then(
      (locked) => setOrder(locked),
      () => {
        expiredRef.current = null;
      },
    );
  }, [live, order, remaining, setOrder]);

  if (loading && !data) {
    return (
      <main className={flow.page}>
        <div className={flow.container}>
          <h1>{t('common.loading')}</h1>
          <Skeleton variant="line" width="35%" height={36} />
          <Skeleton variant="card" count={2} />
        </div>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className={flow.page}>
        <div className={flow.container}>
          <h1>{t('trial.intro')}</h1>
          <ErrorState message={error} onRetry={reload} />
        </div>
      </main>
    );
  }

  const products = data?.products ?? [];
  if (!order || order.kind !== 'try_at_door') {
    return (
      <main className={flow.page}>
        <div className={flow.container}>
          <h1>{t('trial.notOpen')}</h1>
          <ErrorState message={t('trial.notOpen')} />
        </div>
      </main>
    );
  }

  const run = async (key: string, work: () => Promise<Order>) => {
    setBusy(key);
    setActionError(null);
    try {
      setOrder(await work());
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : t('common.error'));
    } finally {
      setBusy(null);
    }
  };

  const keptPaise = order.lines
    .filter((line) => line.decision === 'keep')
    .reduce((sum, line) => sum + line.pricePaise * line.qty, 0);
  const returnedLines = order.lines.filter((line) => line.decision !== 'keep');

  return (
    <main className={flow.page}>
      <div className={flow.container}>
        {!online ? <OfflineBanner lastUpdated={lastUpdated ?? undefined} /> : null}
        <h1>{live ? t('trial.intro') : t('trial.lockedTitle')}</h1>
        {live ? (
          <div className={flow.hold} aria-live="polite" aria-label={t('trial.remaining')}>
            <Icon name="clock" size={18} />
            <strong>{formatRemaining(remaining)}</strong>
            <span>{t('trial.remaining')}</span>
          </div>
        ) : null}
        {live && remaining < 120_000 ? <p className={flow.notice}>{t('trial.urgent')}</p> : null}
        {live ? <p className={flow.hint}>{t('trial.notice')}</p> : null}
        {actionError ? <ErrorState message={actionError} /> : null}

        <div className={flow.twoColumn}>
          <div className={flow.stack}>
            {live ? (
              <ul className={flow.lineList}>
                {order.lines.map((line) => {
                  const product = products.find((entry) => entry.id === line.productId);
                  if (!product) return null;
                  return (
                    <TrialItemRow
                      key={line.id}
                      line={line}
                      product={product}
                      order={order}
                      busy={busy !== null}
                      onDecision={(decision: TrialDecision) =>
                        run(line.id, () => api.setTrialDecision(order.id, line.id, decision, actor))
                      }
                      onSwap={(variantId) =>
                        run(`swap-${line.id}`, () =>
                          api.requestSizeSwap(order.id, { lineId: line.id, variantId }, actor),
                        )
                      }
                    />
                  );
                })}
              </ul>
            ) : (
              <section className={flow.card}>
                <h2 className={flow.cardTitle}>{t('trial.lockedTitle')}</h2>
                <p>{t('trial.lockedBody')}</p>
                <div className={flow.lockedSummary}>
                  <p>
                    <strong>{t('trial.keptTotal')}</strong> {formatPaise(keptPaise)}
                  </p>
                  <p>
                    <strong>{t('trial.returnedTitle')}</strong>
                  </p>
                  {returnedLines.length ? (
                    <ul className={flow.lineList}>
                      {returnedLines.map((line) => (
                        <li key={line.id}>
                          {products.find((entry) => entry.id === line.productId)?.title ?? line.productId}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>{t('trial.nothingReturned')}</p>
                  )}
                  <p>
                    <strong>{t('trial.refundTitle')}</strong>{' '}
                    {order.payment.refundPaise > 0
                      ? t(
                          order.payment.method === 'card'
                            ? 'trial.refundCard'
                            : order.payment.method === 'upi'
                              ? 'trial.refundUpi'
                              : 'trial.refundWallet',
                          { amount: formatPaise(order.payment.refundPaise) },
                        )
                      : t('trial.noRefund')}
                  </p>
                </div>
                <Link className={flow.link} to={`/orders/${order.id}/track`}>
                  {t('common.back')}
                </Link>
              </section>
            )}
          </div>

          <aside className={flow.summary}>
            {live ? (
              <>
                <p>{t('trial.notice')}</p>
                <Button
                  size="lg"
                  fullWidth
                  loading={busy === 'confirm'}
                  onClick={() =>
                    run('confirm', () => api.lockTrial(order.id, actor, 'buyer'))
                  }
                >
                  {t('trial.confirm')}
                </Button>
              </>
            ) : null}
            <OrderTimeline order={order} />
            <Link className={flow.link} to={`/support?order=${encodeURIComponent(order.id)}`}>
              {t('orders.help')}
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
