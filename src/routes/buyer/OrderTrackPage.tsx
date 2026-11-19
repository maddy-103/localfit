import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '@/api/client';
import type { Order } from '@/api/types';
import { EtaCountdown } from '@/components/buyer/EtaCountdown';
import { OrderTimeline } from '@/components/buyer/OrderTimeline';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Icon } from '@/components/icons/Icon';
import { Input } from '@/components/ui/Input';
import { MapPlaceholder } from '@/components/ui/MapPlaceholder';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { Skeleton } from '@/components/ui/Skeleton';
import { useI18n } from '@/i18n';
import { useNow } from '@/lib/useNow';
import { useAsync, useOnline } from '@/lib/useAsync';
import { useAppStore } from '@/store/appStore';
import flow from '@/components/buyer/flow.module.css';

export default function OrderTrackPage() {
  const { id = '' } = useParams();
  const { t } = useI18n();
  const online = useOnline();
  const now = useNow(1000);
  const session = useAppStore((state) => state.session);
  const [refreshed, setRefreshed] = useState<{ id: string; order: Order } | null>(null);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [support, setSupport] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const lastMinute = useRef<number | null>(null);

  const { data, error, loading, lastUpdated, reload } = useAsync<Order | null>(
    () => api.getOrder(id),
    id,
  );

  const order = refreshed?.id === id ? refreshed.order : (data ?? null);
  const setOrder = useCallback(
    (next: Order) => setRefreshed({ id, order: next }),
    [id],
  );

  useEffect(() => {
    let active = true;
    const refresh = () => {
      void api.getOrder(id).then(
        (next) => {
          if (active && next) setOrder(next);
        },
        () => {
          // The cached order stays visible when a refresh fails.
        },
      );
    };
    const timer = window.setInterval(refresh, 1000);
    const unsubscribe = api.subscribe(`order:${id}`, refresh);
    return () => {
      active = false;
      window.clearInterval(timer);
      unsubscribe();
    };
  }, [id, setOrder]);

  const arrived = Boolean(
    order && ['ARRIVED', 'OTP_VERIFIED', 'TRIAL_ACTIVE', 'DECISIONS_LOCKED', 'DELIVERED'].includes(order.state),
  );
  const remaining = order?.etaEndsAt ? Math.max(0, Date.parse(order.etaEndsAt) - now) : 0;
  const minutes = Math.ceil(remaining / 60_000);

  useEffect(() => {
    if (!order?.etaEndsAt || minutes <= 0 || arrived) return;
    if (lastMinute.current === minutes) return;
    lastMinute.current = minutes;
    setAnnouncement(t('track.etaAnnounce', { minutes: Math.max(1, minutes) }));
  }, [arrived, minutes, order?.etaEndsAt, t]);

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
          <h1>{t('track.timeline')}</h1>
          <ErrorState message={error} onRetry={reload} />
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className={flow.page}>
        <div className={flow.container}>
          <h1>{t('common.notFound')}</h1>
          <ErrorState message={t('common.notFoundBody')} />
        </div>
      </main>
    );
  }

  const verify = async () => {
    setVerifying(true);
    setOtpError(null);
    try {
      const result = await api.submitOtp(order.id, otp, {
        id: session?.id ?? 'buyer-ananya',
        role: 'buyer',
      });
      setOrder(result.order);
      setSupport(result.supportRequired);
      if (!result.ok) setOtpError(t('track.otpError'));
      else setOtp('');
    } catch (cause) {
      setOtpError(cause instanceof Error ? cause.message : t('track.otpError'));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <main className={flow.page}>
      <div className={flow.container}>
        {!online ? <OfflineBanner lastUpdated={lastUpdated ?? undefined} /> : null}
        <div aria-live="polite" className="u-visually-hidden">
          {announcement}
        </div>
        <h1>{t('track.window', { window: `${order.etaMin[0]}–${order.etaMin[1]} min` })}</h1>
        <div className={flow.twoColumn}>
          <div className={flow.stack}>
            <EtaCountdown etaMin={order.etaMin} etaEndsAt={order.etaEndsAt} now={now} arrived={arrived} />
            <div className={flow.mapCard}>
              <MapPlaceholder progress={order.riderProgress ?? 0} caption={t('track.live')} />
              <p className={flow.hint}>{t('track.pickup')}</p>
            </div>

            <section className={flow.card} aria-label={t('track.rider')}>
              <h2 className={flow.cardTitle}>{t('track.rider')}</h2>
              {order.rider ? (
                <p>
                  {order.rider.name}
                  <a className={flow.link} href={`tel:${order.rider.phone}`}>
                    {' · '}
                    <Icon name="phone" size={16} /> {t('track.callRider')}
                  </a>
                </p>
              ) : (
                <p className={flow.hint}>{t('track.noRider')}</p>
              )}
            </section>

            {order.state === 'ARRIVED' ? (
              <section className={flow.card} aria-labelledby="otp-title">
                <h2 className={flow.cardTitle} id="otp-title">
                  {t('track.otpTitle')}
                </h2>
                <p>{t('track.otpBody')}</p>
                <p className={flow.otp}>{order.handoverOtp ?? order.otp ?? '————'}</p>
                <Input
                  label={t('track.otpLabel')}
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 4))}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  error={otpError ?? undefined}
                />
                <Button onClick={verify} disabled={otp.length !== 4} loading={verifying}>
                  {t('track.verify')}
                </Button>
                {support ? <p className={flow.notice}>{t('track.supportOpened')}</p> : null}
                {order.otpAttempts > 0 && !support ? (
                  <p className={flow.hint}>{order.otpAttempts}/3</p>
                ) : null}
              </section>
            ) : null}

            {order.state === 'TRIAL_ACTIVE' ? (
              <Link className={flow.link} to={`/orders/${order.id}/trial`}>
                {t('trial.intro')}
              </Link>
            ) : null}
            {order.state === 'DELIVERED' ? (
              <Link className={flow.link} to={`/orders/${order.id}/return`}>
                {t('return.intro')}
              </Link>
            ) : null}
          </div>

          <aside className={flow.summary}>
            <OrderTimeline order={order} />
            <Link className={flow.link} to="/support">
              <Button variant="outline" fullWidth>
                {t('track.support')}
              </Button>
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
