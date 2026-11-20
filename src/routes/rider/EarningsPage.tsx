import { api } from '@/api/client';
import { StatusChip } from '@/components/ui/StatusChip';
import { RiderStates } from '@/components/rider/RiderStates';
import { useAsync, useOnline } from '@/lib/useAsync';
import { formatDateTime, formatPaise } from '@/lib/format';
import { useI18n } from '@/i18n';
import styles from './rider.module.css';

/** RIDE-06: per-trip pay, every bonus line and the weekly payout date. */
export default function EarningsPage() {
  const { t } = useI18n();
  const online = useOnline();
  const earnings = useAsync(() => api.getRiderEarnings(), 'rider-earnings');
  const data = earnings.data;

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>{t('nav.rider')}</p>
        <h1 className={styles.title}>{t('rider.earningsTitle')}</h1>
        <p className={styles.intro}>{t('rider.earningsIntro')}</p>
      </div>
      <RiderStates
        loading={earnings.loading}
        error={earnings.error}
        empty={!data?.trips.length}
        emptyTitle={t('rider.earnings.empty')}
        offline={!online}
        lastUpdated={earnings.lastUpdated}
        onRetry={earnings.reload}
      >
        {data ? (
          <>
            <div className={styles.grid}>
              <div className={styles.tile}>
                <p className={styles.eyebrow}>{t('rider.earnings.total')}</p>
                <strong className={styles.statValue}>{formatPaise(data.totalPaise)}</strong>
              </div>
              <div className={styles.tile}>
                <p className={styles.eyebrow}>{t('rider.earnings.pending')}</p>
                <strong className={styles.statValue}>{formatPaise(data.pendingPaise)}</strong>
              </div>
            </div>

            <div className={styles.tile}>
              <p className={styles.eyebrow}>{t('rider.earningsIntro')}</p>
              <ul className={styles.list}>
                <li className={styles.listItem}>
                  <span>{t('rider.earnings.bonusTry')}</span>
                  <strong>{formatPaise(data.bonusesPaise.tryAtDoor)}</strong>
                </li>
                <li className={styles.listItem}>
                  <span>{t('rider.earnings.bonusNight')}</span>
                  <strong>{formatPaise(data.bonusesPaise.lateNight)}</strong>
                </li>
                <li className={styles.listItem}>
                  <span>{t('rider.earnings.bonusWaiting')}</span>
                  <strong>{formatPaise(data.bonusesPaise.waiting)}</strong>
                </li>
              </ul>
            </div>

            <p className={styles.notice}>
              {t('rider.earnings.payout', { date: formatDateTime(data.payoutDate) })}
            </p>

            <div className={styles.stack}>
              {data.trips.map((trip) => (
                <div className={styles.tile} key={trip.orderId}>
                  <div className={styles.row}>
                    <p className={styles.place}>{t('rider.task.order', { id: trip.orderId })}</p>
                    <StatusChip
                      tone={trip.status === 'paid' ? 'success' : 'pending'}
                      label={t(`rider.earnings.status.${trip.status}`)}
                    />
                  </div>
                  <p className={styles.muted}>{formatDateTime(trip.date)}</p>
                  <ul className={styles.list}>
                    <li className={styles.listItem}>
                      <span>{t('rider.earnings.base')}</span>
                      <span>{formatPaise(trip.basePaise)}</span>
                    </li>
                    <li className={styles.listItem}>
                      <span>{t('rider.earnings.bonusTry')}</span>
                      <span>{formatPaise(trip.bonusesPaise.tryAtDoor)}</span>
                    </li>
                    <li className={styles.listItem}>
                      <span>{t('rider.earnings.bonusNight')}</span>
                      <span>{formatPaise(trip.bonusesPaise.lateNight)}</span>
                    </li>
                    <li className={styles.listItem}>
                      <span>{t('rider.earnings.bonusWaiting')}</span>
                      <span>{formatPaise(trip.bonusesPaise.waiting)}</span>
                    </li>
                  </ul>
                  <div className={styles.row}>
                    <strong>{formatPaise(trip.totalPaise)}</strong>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </RiderStates>
    </section>
  );
}
