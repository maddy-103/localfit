import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { Icon, type IconName } from '@/components/icons/Icon';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/appStore';
import styles from '@/components/buyer/pages.module.css';

const LINKS: Array<{ to: string; label: 'profile.addresses' | 'profile.payments' | 'profile.language' | 'profile.privacy' | 'profile.roles'; icon: IconName }> = [
  { to: '/profile/addresses', label: 'profile.addresses', icon: 'pin' },
  { to: '/profile/payments', label: 'profile.payments', icon: 'wallet' },
  { to: '/profile/language', label: 'profile.language', icon: 'settings' },
  { to: '/profile/privacy', label: 'profile.privacy', icon: 'shield' },
  { to: '/profile/roles', label: 'profile.roles', icon: 'user-circle' },
];

/** Account hub. Every setting below is reachable in one tap. */
export default function ProfilePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const session = useAppStore((state) => state.session);
  const resetApp = useAppStore((state) => state.resetApp);

  const signOut = () => {
    resetApp();
    navigate('/welcome', { replace: true });
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Breadcrumb items={[{ label: t('breadcrumb.home'), to: '/' }, { label: t('profile.title') }]} />
        <h1 className={styles.heading}>{t('profile.title')}</h1>
        <p className={styles.muted}>{session?.name} · {session?.phone}</p>

        <nav className={`${styles.profileList} ${styles.sectionGrid}`} aria-label={t('profile.title')}>
          {LINKS.map((link) => (
            <Link key={link.to} to={link.to} className={styles.profileLink}>
              <span className={styles.row}>
                <Icon name={link.icon} size={20} />
                {t(link.label)}
              </span>
              <Icon name="chevron-right" size={18} />
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <Button variant="outline" onClick={signOut}>
            {t('profile.signOut')}
          </Button>
        </div>
      </div>
    </main>
  );
}
