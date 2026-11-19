import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '@/api/client';
import type { Order } from '@/api/types';
import { OrderTimeline } from '@/components/buyer/OrderTimeline';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Icon } from '@/components/icons/Icon';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { RadioPills } from '@/components/ui/RadioPills';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';
import { useI18n } from '@/i18n';
import { useAsync, useOnline } from '@/lib/useAsync';
import { useAppStore } from '@/store/appStore';
import flow from '@/components/buyer/flow.module.css';

const SLOT_KEYS = [
  { value: 'morning', key: 'return.slotMorning' },
  { value: 'afternoon', key: 'return.slotAfternoon' },
  { value: 'evening', key: 'return.slotEvening' },
] as const;

const REASON_KEYS = [
  'return.reasonSize',
  'return.reasonWrong',
  'return.reasonDamaged',
  'return.reasonNotDescribed',
  'return.reasonChanged',
] as const;

export default function OrderReturnPage() {
  const { id = '' } = useParams();
  const { t } = useI18n();
  const online = useOnline();
  const session = useAppStore((state) => state.session);
  const [reason, setReason] = useState('');
  const [slot, setSlot] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<Order | null>(null);
  const actor = useMemo(
    () => ({ id: session?.id ?? 'buyer-ananya', role: 'buyer' as const }),
    [session?.id],
  );

  const { data, loading, error: loadError, lastUpdated, reload } = useAsync<Order | null>(
    () => api.getOrder(id),
    id,
  );
  const order = submitted ?? data;

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

  if (loadError && !data) {
    return (
      <main className={flow.page}>
        <div className={flow.container}>
          <h1>{t('return.intro')}</h1>
          <ErrorState message={loadError} onRetry={reload} />
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

  const submit = async () => {
    if (!reason) {
      setError(t('return.reasonError'));
      return;
    }
    if (!slot) {
      setError(t('return.slotError'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await api.requestReturn(
        order.id,
        {
          reason: t(reason as (typeof REASON_KEYS)[number]),
          ...(note.trim() ? { note: note.trim() } : {}),
          photoIds: [],
          pickupSlot: t(SLOT_KEYS.find((entry) => entry.value === slot)!.key),
        },
        actor,
      );
      setSubmitted(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted || order.returnRequest) {
    const slotLabel = submitted?.returnRequest?.pickupSlot ?? order.returnRequest?.pickupSlot ?? '';
    return (
      <main className={flow.page}>
        <div className={flow.container}>
          <h1>{t('return.doneTitle')}</h1>
          <p>{t('return.doneBody', { slot: slotLabel })}</p>
          <p className={flow.hint}>
            {t('return.doneId')}: {submitted?.returnRequest?.id ?? order.returnRequest?.id}
          </p>
          <Link className={flow.link} to={`/orders/${order.id}/track`}>
            <Button>{t('return.back')}</Button>
          </Link>
        </div>
      </main>
    );
  }

  if (order.state !== 'DELIVERED') {
    return (
      <main className={flow.page}>
        <div className={flow.container}>
          <h1>{t('return.intro')}</h1>
          <ErrorState message={t('return.unavailable')} />
        </div>
      </main>
    );
  }

  return (
    <main className={flow.page}>
      <div className={flow.container}>
        {!online ? <OfflineBanner lastUpdated={lastUpdated ?? undefined} /> : null}
        <h1>{t('return.intro')}</h1>
        <div className={flow.twoColumn}>
          <div className={flow.stack}>
            <section className={flow.card}>
              <RadioPills
                legend={t('return.reason')}
                name="return-reason"
                value={reason}
                onChange={setReason}
                options={REASON_KEYS.map((key) => ({ value: key, label: t(key) }))}
              />
              {error?.includes(t('return.reasonError')) ? (
                <p className={flow.errorText}>{error}</p>
              ) : null}
            </section>

            <section className={flow.card}>
              <h2 className={flow.cardTitle}>{t('return.photos')}</h2>
              <p className={flow.hint}>{t('return.photosHint')}</p>
              <div className={flow.photoTiles}>
                {[1, 2, 3].map((number) => (
                  <div className={flow.mapCard} key={number}>
                    <Icon name="camera" size={24} />
                    <p className={flow.hint}>{t('return.photoN', { n: number })}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className={flow.card}>
              <Textarea
                label={t('return.note')}
                placeholder={t('return.notePlaceholder')}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </section>
          </div>

          <aside className={flow.summary}>
            <RadioPills
              legend={t('return.slot')}
              name="return-slot"
              value={slot}
              onChange={setSlot}
              options={SLOT_KEYS.map((entry) => ({ value: entry.value, label: t(entry.key) }))}
            />
            {error ? <ErrorState message={error} /> : null}
            <Button size="lg" fullWidth loading={submitting} onClick={submit}>
              {t('return.confirm')}
            </Button>
            <Link className={flow.link} to={`/orders/${order.id}/track`}>
              {t('return.back')}
            </Link>
            <OrderTimeline order={order} />
          </aside>
        </div>
      </div>
    </main>
  );
}
