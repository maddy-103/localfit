import { Link, Outlet } from 'react-router-dom';
import { useI18n } from '@/i18n';
import styles from './AuthLayout.module.css';

/** Slim shell for sign-in, onboarding and consent screens. */
export function AuthLayout() {
  const { t } = useI18n();

  return (
    <div className={styles.wrap}>
      <main className={styles.panel}>
        <Link to="/" className={styles.brand}>
          {t('app.name').toUpperCase()}
        </Link>
        <p className={styles.tagline}>{t('app.tagline')}</p>
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
