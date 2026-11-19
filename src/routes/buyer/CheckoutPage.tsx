import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import type { CheckoutView } from '@/api/types';
import type { PaymentMethod } from '@/domain/payments';
import { CheckoutGroupCard } from '@/components/buyer/CheckoutGroupCard';
import { TrialTermsBlock } from '@/components/buyer/TrialTermsBlock';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { RadioPills } from '@/components/ui/RadioPills';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { canUseCod } from '@/domain/payments';
import { insideServiceArea } from '@/domain/locationPolicy';
import { useI18n } from '@/i18n';
import { formatPaise } from '@/lib/format';
import { useAsync, useOnline } from '@/lib/useAsync';
import { useAppStore } from '@/store/appStore';
import flow from '@/components/buyer/flow.module.css';

export default function CheckoutPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const online = useOnline();
  const session = useAppStore((state) => state.session);
  const [addressId, setAddressId] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [accepted, setAccepted] = useState(false);
  const [termsReady, setTermsReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const { data, error, loading, lastUpdated, reload } = useAsync<CheckoutView>(
    () => api.getCheckout(),
    'checkout',
  );

  useEffect(() => api.subscribe('bag', reload), [reload]);

  const effectiveAddressId = addressId || data?.addresses[0]?.id || '';
  const address = data?.addresses.find((entry) => entry.id === effectiveAddressId) ?? null;
  const hasTry = data?.groups.some((group) => group.kind === 'try_at_door') ?? false;
  const allInside =
    Boolean(address) &&
    (data?.groups ?? []).every((group) => insideServiceArea(address!, group.shop));

  const codAllowed = useMemo(() => {
    const buyer = data?.buyer;
    if (!buyer || !data || hasTry) return false;
    return data.groups.every((group) =>
      canUseCod({
        isTryAtDoor: false,
        completedPrepaidOrders: buyer.completedPrepaidOrders,
        completedOrders: buyer.completedOrders,
        amountPaise: group.totalPaise,
      }),
    );
  }, [data, hasTry]);

  const effectiveMethod: PaymentMethod = method === 'cod' && !codAllowed ? 'upi' : method;

  const handleReady = useCallback((ready: boolean) => setTermsReady(ready), []);
  const ready = Boolean(address) && allInside && (!hasTry || termsReady) && !paying;

  if (!session) {
    return (
      <Navigate
        to="/login"
        state={{ returnTo: `${location.pathname}${location.search}` }}
        replace
      />
    );
  }

  if (loading && !data) {
    return (
      <main className={flow.page}>
        <div className={flow.container}>
          <h1>{t('checkout.deliveryTo')}</h1>
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
          <h1>{t('checkout.deliveryTo')}</h1>
          <ErrorState message={error} onRetry={reload} />
        </div>
      </main>
    );
  }

  if (!data || data.groups.length === 0) {
    return (
      <main className={flow.page}>
        <div className={flow.container}>
          <h1>{t('checkout.deliveryTo')}</h1>
          <EmptyState
            title={t('bag.emptyTitle')}
            body={t('bag.emptyBody')}
            action={
              <Button onClick={() => navigate('/bag')}>{t('common.back')}</Button>
            }
          />
        </div>
      </main>
    );
  }

  const codReason = hasTry
    ? t('checkout.codTry')
    : (data.buyer?.completedPrepaidOrders ?? 0) < 1
      ? t('checkout.codNew')
      : t('checkout.codCap');

  const pay = async () => {
    if (!ready) return;
    setPaying(true);
    setPayError(null);
    try {
      const result = await api.placeCheckout({
        paymentMethod: effectiveMethod,
        addressId: address!.id,
        termsAccepted: accepted || undefined,
      });
      navigate(`/orders/${result.orderIds[0] ?? result.orders[0]?.id}/confirmed`, {
        state: { orderIds: result.orderIds, checkoutId: result.checkoutId },
      });
    } catch (cause) {
      setPayError(cause instanceof Error ? cause.message : t('checkout.payError'));
    } finally {
      setPaying(false);
    }
  };

  return (
    <main className={flow.page}>
      <div className={flow.container}>
        {!online ? <OfflineBanner lastUpdated={lastUpdated ?? undefined} /> : null}
        <h1>{t('checkout.deliveryTo')}</h1>
        <div className={flow.twoColumn}>
          <div className={flow.stack}>
            <section className={flow.card} aria-label={t('checkout.selectAddress')}>
              <Select
                label={t('checkout.selectAddress')}
                value={effectiveAddressId}
                onChange={(event) => setAddressId(event.target.value)}
                options={data.addresses.map((entry) => ({
                  value: entry.id,
                  label: `${entry.label} · ${entry.line1}, ${entry.area}`,
                }))}
              />
              {!address ? <p className={flow.notice}>{t('checkout.noAddress')}</p> : null}
              {!allInside && address ? <p className={flow.notice}>{t('checkout.outsideArea')}</p> : null}
              {data.groups.length > 1 ? (
                <p className={flow.hint}>
                  {t('checkout.split', { count: data.groups.length })}
                </p>
              ) : null}
            </section>

            {data.groups.map((group) => (
              <CheckoutGroupCard group={group} address={address} key={group.shop.id} />
            ))}

            <section className={flow.card} aria-label={t('checkout.payment')}>
              <h2 className={flow.cardTitle}>{t('checkout.payment')}</h2>
              <RadioPills
                legend={t('checkout.payment')}
                name="payment-method"
                value={effectiveMethod}
                onChange={(value) => setMethod(value as PaymentMethod)}
                options={[
                  { value: 'upi', label: t('checkout.upi') },
                  { value: 'card', label: t('checkout.card') },
                  { value: 'wallet', label: t('checkout.wallet') },
                  { value: 'cod', label: t('checkout.cod'), disabled: !codAllowed },
                ]}
              />
              {!codAllowed ? <p className={flow.hint}>{codReason}</p> : null}
            </section>

            {hasTry ? (
              <TrialTermsBlock
                paymentMethod={effectiveMethod}
                accepted={accepted}
                onAcceptedChange={setAccepted}
                onReadyChange={handleReady}
              />
            ) : (
              <section className={flow.card}>
                <h2 className={flow.cardTitle}>{t('checkout.standardReturnsTitle')}</h2>
                <p>{t('checkout.standardReturnsBody')}</p>
              </section>
            )}
          </div>

          <aside className={flow.summary} aria-label={t('bag.summary')}>
            <h2 className={flow.cardTitle}>{t('bag.summary')}</h2>
            <div className={flow.summaryRow}>
              <span>{t('bag.subtotal')}</span>
              <strong>{formatPaise(data.itemsPaise)}</strong>
            </div>
            <div className={flow.summaryRow}>
              <span>{t('bag.delivery')}</span>
              <strong>{formatPaise(data.deliveryFeePaise)}</strong>
            </div>
            <div className={`${flow.summaryRow} ${flow.summaryTotal}`}>
              <span>{t('bag.total')}</span>
              <strong>{formatPaise(data.totalPaise)}</strong>
            </div>
            {payError ? <ErrorState message={payError} onRetry={pay} /> : null}
            <Button size="lg" fullWidth disabled={!ready} loading={paying} onClick={pay}>
              {t('checkout.pay', { amount: formatPaise(data.totalPaise) })}
            </Button>
            <Link className={flow.link} to="/bag">
              {t('common.back')}
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
