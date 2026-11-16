import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { api } from '@/api/client';
import { useI18n } from '@/i18n';
import { useAppStore } from '@/store/appStore';
import { canOpenAdminRoute } from '@/domain/permissions';
import type { TranslationKey } from '@/i18n';
import { Button } from './ui/Button';
import { Icon } from './icons/Icon';
import { cx } from '@/lib/cx';
import styles from './ConsoleLayout.module.css';

type ConsoleRole = 'shop' | 'rider' | 'admin';

interface NavItem {
  to: string;
  labelKey: TranslationKey;
  end?: boolean;
}

const SHOP_NAV: NavItem[] = [
  { to: '/shop', labelKey: 'nav.dashboard', end: true },
  { to: '/shop/orders', labelKey: 'nav.orders' },
  { to: '/shop/listing/new', labelKey: 'nav.listing' },
  { to: '/shop/inventory', labelKey: 'nav.inventory' },
  { to: '/shop/returns', labelKey: 'nav.returns' },
  { to: '/shop/payouts', labelKey: 'nav.payouts' },
  { to: '/shop/settings', labelKey: 'nav.settings' },
  { to: '/shop/support', labelKey: 'nav.support' },
];

const RIDER_NAV: NavItem[] = [
  { to: '/rider', labelKey: 'nav.dashboard', end: true },
  { to: '/rider/tasks', labelKey: 'nav.tasks' },
  { to: '/rider/earnings', labelKey: 'nav.earnings' },
  { to: '/rider/safety', labelKey: 'nav.safety' },
  { to: '/rider/profile', labelKey: 'nav.profile' },
  { to: '/rider/support', labelKey: 'nav.support' },
];

const ADMIN_NAV: NavItem[] = [
  { to: '/admin', labelKey: 'nav.dashboard', end: true },
  { to: '/admin/shops', labelKey: 'nav.shop' },
  { to: '/admin/orders', labelKey: 'nav.orders' },
  { to: '/admin/disputes', labelKey: 'nav.disputes' },
  { to: '/admin/refunds', labelKey: 'nav.refunds' },
  { to: '/admin/payouts', labelKey: 'nav.payouts' },
  { to: '/admin/riders', labelKey: 'nav.riders' },
  { to: '/admin/risk', labelKey: 'nav.risk' },
  { to: '/admin/campaigns', labelKey: 'nav.campaigns' },
  { to: '/admin/config', labelKey: 'nav.config' },
  { to: '/admin/staff', labelKey: 'nav.staff' },
  { to: '/admin/audit', labelKey: 'nav.audit' },
];

const NAV_BY_ROLE: Record<ConsoleRole, NavItem[]> = {
  shop: SHOP_NAV,
  rider: RIDER_NAV,
  admin: ADMIN_NAV,
};

const TITLE_KEY: Record<ConsoleRole, TranslationKey> = {
  shop: 'console.shopTitle',
  rider: 'console.riderTitle',
  admin: 'console.adminTitle',
};

export function ConsoleLayout({ role }: { role: ConsoleRole }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const session = useAppStore((state) => state.session);
  const setSession = useAppStore((state) => state.setSession);
  const setBagCount = useAppStore((state) => state.setBagCount);

  useEffect(() => {
    if (role !== 'shop') return;
    api
      .getBag()
      .then((bag) => setBagCount(bag.lines.reduce((sum, line) => sum + line.qty, 0)))
      .catch(() => {
        // The console still renders without a bag count.
      });
  }, [role, setBagCount]);

  const nav = NAV_BY_ROLE[role].filter((item) =>
    role === 'admin' ? canOpenAdminRoute(session?.adminRole, item.to) : true,
  );

  const roleName =
    session?.role === 'super_admin'
      ? t('role.superAdmin')
      : session?.role
        ? t(`role.${session.role}` as TranslationKey)
        : t('role.guest');

  const signOut = () => {
    setSession(null);
    setBagCount(0);
    navigate('/');
  };

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <Link to="/" className={styles.brandName}>
            {t('app.name').toUpperCase()}
          </Link>
          <span className={styles.brandRole}>{t(TITLE_KEY[role])}</span>
        </div>

        <nav className={styles.nav} aria-label={t(TITLE_KEY[role])}>
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => cx(styles.navLink, isActive && styles.navLinkActive)}
            >
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link to="/" className={styles.homeLink}>
            <Icon name="arrow-right" size={16} />
            {t('nav.home')}
          </Link>
          <Button variant="outline" size="sm" fullWidth onClick={signOut}>
            {t('nav.signOut')}
          </Button>
        </div>
      </aside>

      <div className={styles.body}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.consoleTitle}>{t(TITLE_KEY[role])}</p>
            <p className={styles.session}>
              {session
                ? t('console.signedInAs', { name: session.name })
                : t('role.guest')}
            </p>
          </div>
          <p className={styles.roleLabel}>{t('console.roleLabel', { role: roleName })}</p>
        </header>
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
