import { api } from '@/api/client';
import { RegistrationStatus } from '@/components/shop/RegistrationStatus';
import { ShopStates } from '@/components/shop/ShopStates';
import { useI18n } from '@/i18n';
import { useAsync, useOnline } from '@/lib/useAsync';
import styles from '@/routes/shop/shop.module.css';

export default function RegisterShopStatusPage() {
  const { t } = useI18n();
  const online = useOnline();
  const registration = useAsync(() => api.getShopRegistration(), 'register-status');

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('register.statusTitle')}</h1>
        <p className={styles.intro}>{t('register.statusIntro')}</p>
      </header>
      <ShopStates
        loading={registration.loading}
        error={registration.error}
        offline={!online}
        lastUpdated={registration.lastUpdated}
        onRetry={registration.reload}
      >
        <RegistrationStatus registration={registration.data} />
      </ShopStates>
    </div>
  );
}
