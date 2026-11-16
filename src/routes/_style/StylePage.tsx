import { useI18n } from '@/i18n';
import { ChromeSection } from './ChromeSection';
import { ControlsSection } from './ControlsSection';
import { DataSection } from './DataSection';
import { FeedbackSection } from './FeedbackSection';
import { SurfacesSection } from './SurfacesSection';
import styles from './style.module.css';

/**
 * Development-only design system gallery. Every primitive appears in every
 * state. It is loaded through a conditional dynamic import in the router, so
 * production builds do not ship it.
 */
export default function StylePage() {
  const { t } = useI18n();

  return (
    <div className={styles.page}>
      <p className={styles.eyebrow}>{t('app.name')}</p>
      <h1 className={styles.title}>{t('style.title')}</h1>
      <p className={styles.intro}>{t('style.intro')}</p>

      <ControlsSection />
      <DataSection />
      <FeedbackSection />
      <SurfacesSection />
      <ChromeSection />
    </div>
  );
}
