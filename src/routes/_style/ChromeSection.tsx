import { useI18n } from '@/i18n';
import {
  AnnouncementBar,
  Breadcrumb,
  LanguageSwitch,
  MapPlaceholder,
  Marquee,
} from '@/components/ui';
import { StyleSection } from './StyleSection';
import styles from './style.module.css';

export function ChromeSection() {
  const { t } = useI18n();
  const brands = t('style.marqueeBrands')
    .split('·')
    .map((brand) => brand.trim())
    .filter(Boolean);

  return (
    <>
      <StyleSection title={t('style.announcement')}>
        <AnnouncementBar
          text={t('style.announcementText')}
          ctaLabel={t('common.viewAll')}
          ctaHref="/search"
          dismissible={false}
        />
      </StyleSection>

      <StyleSection title={t('style.breadcrumb')}>
        <Breadcrumb
          label={t('style.breadcrumb')}
          items={[
            { label: t('breadcrumb.home'), to: '/' },
            { label: t('route.search'), to: '/search' },
            { label: t('nav.orders') },
          ]}
        />
      </StyleSection>

      <StyleSection title={t('style.marquee')}>
        <Marquee items={brands} />
      </StyleSection>

      <StyleSection title={t('style.navigation')}>
        <div className={styles.columns}>
          <div className={styles.stack}>
            <LanguageSwitch />
            <Breadcrumb
              label={t('style.navigation')}
              items={[{ label: t('breadcrumb.home'), to: '/' }, { label: t('route.profile') }]}
            />
          </div>
          <div style={{ maxWidth: 360 }}>
            <MapPlaceholder caption={t('style.offlineTime')} />
          </div>
        </div>
      </StyleSection>
    </>
  );
}
