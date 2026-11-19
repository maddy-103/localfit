import { useNavigate } from 'react-router-dom';
import { useI18n, type TranslationKey } from '@/i18n';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { useAppStore, type UserRole } from '@/store/appStore';
import styles from '@/components/buyer/pages.module.css';

const ROLES: Array<{ role: UserRole; label: TranslationKey; help: TranslationKey; path: string }> = [
  { role: 'buyer', label: 'nav.buyer', help: 'roles.buyerHelp', path: '/' },
  { role: 'shop', label: 'nav.shop', help: 'roles.shopHelp', path: '/shop' },
  { role: 'rider', label: 'nav.rider', help: 'roles.riderHelp', path: '/rider' },
];

/** AUTH-07: switch between buyer, shop and rider without another OTP. */
export default function ProfileRolesPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const session = useAppStore((state) => state.session);
  const switchRole = useAppStore((state) => state.switchRole);

  const switchTo = (role: UserRole, path: string) => {
    switchRole(role);
    navigate(path);
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Breadcrumb items={[{ label: t('profile.title'), to: '/profile' }, { label: t('roles.title') }]} />
        <h1 className={styles.heading}>{t('roles.title')}</h1>
        <p className={styles.intro}>
          {session ? t('roles.current', { role: session.role }) : ''} {t('roles.noOtp')}
        </p>

        <div className={`${styles.grid} ${styles.sectionGrid}`}>
          {ROLES.map((item) => (
            <section key={item.role} className={`${styles.card} ${styles.roleCard}`}>
              <h2 className={styles.bold}>{t(item.label)}</h2>
              <p className={styles.small}>{t(item.help)}</p>
              <Button
                variant={session?.role === item.role ? 'outline' : 'solid'}
                disabled={session?.role === item.role}
                onClick={() => switchTo(item.role, item.path)}
              >
                {t('roles.switch', { role: t(item.label) })}
              </Button>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
