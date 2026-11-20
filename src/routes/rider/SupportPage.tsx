import { Link } from 'react-router-dom';
import { api } from '@/api/client';
import { Icon } from '@/components/icons/Icon';
import { RiderStates } from '@/components/rider/RiderStates';
import { useAsync } from '@/lib/useAsync';
import { useI18n } from '@/i18n';
import styles from './rider.module.css';

/** Rider support entry point; order-specific help opens from the task. */
export default function SupportPage() {
  const { t } = useI18n();
  const config = useAsync(() => api.getRiderConfig(), 'rider-config');

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>{t('nav.rider')}</p>
        <h1 className={styles.title}>{t('rider.supportTitle')}</h1>
        <p className={styles.intro}>{t('rider.supportIntro')}</p>
      </div>
      <RiderStates loading={config.loading} error={config.error} onRetry={config.reload}>
        <div className={styles.tile}>
          <p className={styles.eyebrow}>{t('rider.supportLine')}</p>
          <p className={styles.place}>{config.data?.supportPhone ?? '1800 123 4567'}</p>
          <a className={styles.link} href={`tel:${config.data?.supportPhone ?? '18001234567'}`}>
            <Icon name="phone" size={16} /> {t('rider.callSupport')}
          </a>
        </div>
        <p className={styles.notice}>{t('rider.support.orderHelp')}</p>
        <Link className={styles.link} to="/rider/safety">
          <Icon name="shield" size={16} /> {t('nav.safety')}
        </Link>
      </RiderStates>
    </section>
  );
}
