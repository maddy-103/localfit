import { Link } from 'react-router-dom';
import { api } from '@/api/client';
import { ShopRegistrationForm } from '@/components/shop/ShopRegistrationForm';
import { ShopStates } from '@/components/shop/ShopStates';
import { useI18n } from '@/i18n';
import { useAsync, useOnline } from '@/lib/useAsync';
import styles from '@/routes/shop/shop.module.css';

export default function RegisterShopPage() {
  const { t } = useI18n();
  const online = useOnline();
  const registration = useAsync(() => api.getShopRegistration(), 'register-shop');

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('register.title')}</h1>
        <p className={styles.intro}>{t('register.intro')}</p>
      </header>
      <ShopStates
        loading={registration.loading}
        error={registration.error}
        offline={!online}
        lastUpdated={registration.lastUpdated}
        onRetry={registration.reload}
      >
        <ShopRegistrationForm existing={registration.data} />
        <Link to="/register/shop/status">{t('register.viewStatus')}</Link>
      </ShopStates>
    </div>
  );
}
