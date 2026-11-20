import { useState } from 'react';
import { api } from '@/api/client';
import type { GpsPoint } from '@/domain/orderMachine';
import { Icon } from '@/components/icons/Icon';
import { StatusChip } from '@/components/ui/StatusChip';
import { PressHoldButton } from '@/components/rider/PressHoldButton';
import { RiderStates } from '@/components/rider/RiderStates';
import { RIDER_ACTOR } from '@/components/rider/actor';
import { currentGps } from '@/lib/gps';
import { useAsync, useOnline } from '@/lib/useAsync';
import { useNow } from '@/lib/useNow';
import { useI18n } from '@/i18n';
import styles from './rider.module.css';

/** RIDE-07: long-press SOS with coordinates, support line and night guidance. */
export default function SafetyPage() {
  const { t } = useI18n();
  const online = useOnline();
  const at = useNow(60_000);
  const config = useAsync(() => api.getRiderConfig(), 'rider-config');
  const [alert, setAlert] = useState<GpsPoint | null>(null);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const hour = new Date(at).getHours();
  const lateNight = config.data ? hour >= config.data.lateNightHour : hour >= 21;

  const sos = async () => {
    setSending(true);
    setError('');
    try {
      const gps = await currentGps();
      await api.sendSos({ gps }, RIDER_ACTOR);
      setAlert(gps);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('common.error'));
    } finally {
      setSending(false);
    }
  };

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>{t('nav.rider')}</p>
        <h1 className={styles.title}>{t('rider.safetyTitle')}</h1>
        <p className={styles.intro}>{t('rider.safetyIntro')}</p>
      </div>

      <RiderStates
        loading={config.loading}
        error={config.error || error}
        offline={!online}
        lastUpdated={config.lastUpdated}
        onRetry={config.reload}
      >
        <div className={styles.tile}>
          <PressHoldButton onTrigger={() => void sos()} />
          {sending ? <p className={styles.muted}>{t('common.loading')}</p> : null}
          {alert ? (
            <p className={styles.notice} role="alert">
              <StatusChip tone="error" icon="sos" label={t('rider.sosSent')} />
              {t('rider.location', { lat: alert.lat, lng: alert.lng })}
            </p>
          ) : null}
        </div>

        <div className={styles.tile}>
          <p className={styles.eyebrow}>{t('rider.supportLine')}</p>
          <p className={styles.place}>{config.data?.supportPhone ?? '1800 123 4567'}</p>
          <a className={styles.link} href={`tel:${config.data?.supportPhone ?? '18001234567'}`}>
            <Icon name="phone" size={16} /> {t('rider.callSupport')}
          </a>
        </div>

        <div className={styles.tile}>
          <p className={styles.eyebrow}>{t('rider.safeZoneTitle')}</p>
          <p className={styles.intro}>
            {t('rider.safeZoneBody', { hour: config.data?.lateNightHour ?? 21 })}
          </p>
          {lateNight ? (
            <div className={styles.alert} role="status">
              <Icon name="shield" size={20} />
              <span>{t('rider.safeZoneNow')}</span>
            </div>
          ) : null}
        </div>
      </RiderStates>
    </section>
  );
}
