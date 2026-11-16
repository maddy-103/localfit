import { lazy, Suspense, useState, type FormEvent } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useAppStore } from '@/store/appStore';
import { AnnouncementBar } from './ui/AnnouncementBar';
import { Badge } from './ui/Badge';
import { IconButton } from './ui/IconButton';
import { Icon } from './icons/Icon';
import { LanguageSwitch } from './ui/LanguageSwitch';
import { Sheet } from './ui/Sheet';
import { SkipLink } from './ui/SkipLink';
import { cx } from '@/lib/cx';
import styles from './RootLayout.module.css';

const DemoPanel = import.meta.env.DEV ? lazy(() => import('./DemoPanel')) : null;

export function RootLayout() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const session = useAppStore((state) => state.session);
  const bagCount = useAppStore((state) => state.bagCount);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search');
  };

  const navItems = [
    { to: '/', label: t('nav.home'), end: true },
    { to: '/search', label: t('nav.search') },
    { to: '/orders', label: t('nav.orders') },
  ];

  return (
    <div className={styles.page}>
      <SkipLink />
      <aside aria-label={t('announcement.label')}>
        <AnnouncementBar
          text={t('announcement.text')}
          ctaLabel={t('announcement.cta')}
          ctaHref="/register"
        />
      </aside>

      <header className={styles.header}>
        <div className={cx('u-container', styles.headerInner)}>
          <IconButton
            className={styles.menuButton}
            icon="menu"
            label={t('nav.menu')}
            onClick={() => setMenuOpen(true)}
          />
          <Link to="/" className={styles.logo}>
            {t('app.name').toUpperCase()}
          </Link>

          <nav className={styles.nav} aria-label={t('a11y.mainNav')}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => cx(styles.navLink, isActive && styles.navLinkActive)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <form className={styles.search} role="search" onSubmit={submitSearch}>
            <Icon name="search" size={18} />
            <label className="u-visually-hidden" htmlFor="header-search">
              {t('nav.search')}
            </label>
            <input
              id="header-search"
              className={styles.searchInput}
              type="search"
              value={query}
              placeholder={t('common.searchPlaceholder')}
              onChange={(event) => setQuery(event.target.value)}
            />
          </form>

          <div className={styles.actions}>
            <div className={styles.language}>
              <LanguageSwitch />
            </div>
            <Link to="/bag" className={styles.iconLink} aria-label={t('nav.bag')}>
              <Icon name="cart" size={22} />
              <Badge count={bagCount} label={`${t('nav.bag')}: ${bagCount}`} />
            </Link>
            {session ? (
              <Link to="/profile" className={styles.iconLink} aria-label={t('nav.account')}>
                <Icon name="user-circle" size={22} />
              </Link>
            ) : (
              <Link to="/login" className={styles.signIn}>
                {t('nav.signIn')}
              </Link>
            )}
          </div>
        </div>
      </header>

      <main id="main" className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <div className={cx('u-container', styles.footerInner)}>
          <div className={styles.footerTop}>
            <div>
              <p className={styles.footerLogo}>{t('app.name').toUpperCase()}</p>
              <p className={styles.footerTag}>{t('footer.tagline')}</p>
            </div>
            <nav className={styles.footerNav} aria-label={t('a11y.footerNav')}>
              {navItems.map((item) => (
                <Link key={item.to} to={item.to}>
                  {item.label}
                </Link>
              ))}
              <Link to="/support">{t('route.support')}</Link>
            </nav>
          </div>
          <div className={styles.legal}>
            <span>{t('footer.legal')}</span>
            <span>{t('footer.prices')}</span>
          </div>
        </div>
      </footer>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title={t('nav.menu')}>
        <nav className={styles.mobileNav} aria-label={t('a11y.mobileNav')}>
          {navItems.map((item) => (
            <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)}>
              {item.label}
            </Link>
          ))}
          <Link to="/profile" onClick={() => setMenuOpen(false)}>
            {t('nav.profile')}
          </Link>
          <Link to="/support" onClick={() => setMenuOpen(false)}>
            {t('route.support')}
          </Link>
        </nav>
        <div className={styles.mobileLanguage}>
          <LanguageSwitch />
        </div>
      </Sheet>

      {import.meta.env.DEV && DemoPanel ? (
        <Suspense fallback={null}>
          <DemoPanel />
        </Suspense>
      ) : null}
    </div>
  );
}
