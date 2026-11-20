import { Link } from 'react-router-dom';
import { api } from '@/api/client';
import { StatusChip, type StatusTone } from '@/components/ui/StatusChip';
import { LanguageSwitch } from '@/components/ui/LanguageSwitch';
import { RiderStates } from '@/components/rider/RiderStates';
import { useAsync, useOnline } from '@/lib/useAsync';
import { useI18n } from '@/i18n';
import type { RiderApprovalStatus } from '@/api/types';
import styles from './rider.module.css';

const STATUS_TONE: Record<RiderApprovalStatus, StatusTone> = {
  not_started: 'pending',
  submitted: 'pending',
  pending: 'info',
  approved: 'success',
  rejected: 'error',
};

const VEHICLE_KEY = {
  bike: 'regRider.vehicle.bike',
  scooter: 'regRider.vehicle.scooter',
  cycle: 'regRider.vehicle.cycle',
} as const;

/** Profile shows document status, declared vehicle and the language switch. */
export default function ProfilePage() {
  const { t, lang } = useI18n();
  const online = useOnline();
  const profile = useAsync(() => api.getRiderProfile(), 'rider-profile');
  const view = profile.data;

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>{t('nav.rider')}</p>
        <h1 className={styles.title}>{t('rider.profileTitle')}</h1>
      </div>
      <RiderStates
        loading={profile.loading}
        error={profile.error}
        offline={!online}
        lastUpdated={profile.lastUpdated}
        onRetry={profile.reload}
      >
        {view ? (
          <>
            <div className={styles.tile}>
              <p className={styles.place}>{view.registration.fullName}</p>
              <p className={styles.muted}>{view.registration.phone}</p>
              <div className={styles.statusRow}>
                <span className={styles.muted}>{view.rider.zone}</span>
              </div>
            </div>

            <div className={styles.tile}>
              <p className={styles.eyebrow}>{t('rider.profile.documents')}</p>
              <div className={styles.statusRow}>
                <StatusChip
                  tone={STATUS_TONE[view.registration.status]}
                  label={t(`regRider.status.${view.registration.status}`)}
                />
                <StatusChip
                  tone={view.registration.selfieMatched ? 'success' : 'warning'}
                  icon={view.registration.selfieMatched ? 'check-circle' : 'alert'}
                  label={t('regRider.selfieStep')}
                />
              </div>
              <ul className={styles.list}>
                {(['idProof', 'licence', 'selfie'] as const).map((kind) => (
                  <li className={styles.listItem} key={kind}>
                    <span>{t(`regRider.${kind}`)}</span>
                    <StatusChip
                      tone={view.registration.documents[kind] ? 'success' : 'warning'}
                      icon={view.registration.documents[kind] ? 'check-circle' : 'alert'}
                      label={view.registration.documents[kind]?.name ?? t('common.empty')}
                    />
                  </li>
                ))}
              </ul>
              <Link className={styles.link} to="/register/rider">
                {t('rider.profile.editDocuments')}
              </Link>
            </div>

            <div className={styles.tile}>
              <p className={styles.eyebrow}>{t('rider.profile.vehicle')}</p>
              <p className={styles.place}>{t(VEHICLE_KEY[view.registration.vehicleType])}</p>
              <p className={styles.muted}>{view.registration.vehicleNumber}</p>
            </div>

            <div className={styles.tile}>
              <p className={styles.eyebrow}>{t('rider.profile.language')}</p>
              <p className={styles.muted}>{lang.toUpperCase()}</p>
              <LanguageSwitch />
            </div>

            <div className={styles.grid}>
              <div className={styles.tile}>
                <p className={styles.eyebrow}>{t('rider.profile.trips')}</p>
                <strong className={styles.statValue}>{view.rider.trips}</strong>
              </div>
              <div className={styles.tile}>
                <p className={styles.eyebrow}>{t('rider.profile.rating')}</p>
                <strong className={styles.statValue}>{view.rider.rating}</strong>
              </div>
            </div>
          </>
        ) : null}
      </RiderStates>
    </section>
  );
}
