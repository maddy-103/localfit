import { Link } from 'react-router-dom';
import { api } from '@/api/client';
import type { RiderApprovalStatus } from '@/api/types';
import { StatusChip, type StatusTone } from '@/components/ui/StatusChip';
import { RiderStates } from '@/components/rider/RiderStates';
import { useAsync, useOnline } from '@/lib/useAsync';
import { useI18n } from '@/i18n';
import type { TranslationKey } from '@/i18n';
import styles from '@/routes/rider/rider.module.css';

const STATUS_KEY: Record<RiderApprovalStatus, TranslationKey> = {
  not_started: 'regRider.status.not_started',
  submitted: 'regRider.status.submitted',
  pending: 'regRider.status.pending',
  approved: 'regRider.status.approved',
  rejected: 'regRider.status.rejected',
};

const STATUS_TONE: Record<RiderApprovalStatus, StatusTone> = {
  not_started: 'pending',
  submitted: 'pending',
  pending: 'info',
  approved: 'success',
  rejected: 'error',
};

/** AUTH-05: approval progress, refreshable in an open tab. */
export default function RegisterRiderStatusPage() {
  const { t } = useI18n();
  const online = useOnline();
  const registration = useAsync(() => api.getRiderRegistration(), 'reg-rider-status');

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>{t('nav.rider')}</p>
        <h1 className={styles.title}>{t('regRider.statusTitle')}</h1>
        <p className={styles.intro}>{t('regRider.statusIntro')}</p>
      </div>
      <RiderStates
        loading={registration.loading}
        error={registration.error}
        offline={!online}
        lastUpdated={registration.lastUpdated}
        onRetry={registration.reload}
      >
        {registration.data ? (
          <div className={styles.stack}>
            <div className={styles.tile}>
              <StatusChip
                tone={STATUS_TONE[registration.data.status]}
                label={t(STATUS_KEY[registration.data.status])}
              />
              <p className={styles.place}>{registration.data.fullName}</p>
              <p className={styles.muted}>{t('rider.task.order', { id: registration.data.riderId })}</p>
              {registration.data.note ? (
                <p className={styles.muted}>
                  {t('regRider.statusNote', { note: registration.data.note })}
                </p>
              ) : null}
            </div>
            <p className={styles.notice}>{t('regRider.inactive')}</p>
            <div className={styles.row}>
              <Link className={styles.link} to="/register/rider">
                {t('regRider.edit')}
              </Link>
              {registration.data.status === 'approved' ? (
                <Link className={styles.link} to="/rider">
                  {t('nav.rider')}
                </Link>
              ) : null}
              <Link className={styles.link} to="/login">
                {t('regRider.backToLogin')}
              </Link>
            </div>
          </div>
        ) : null}
      </RiderStates>
    </section>
  );
}
