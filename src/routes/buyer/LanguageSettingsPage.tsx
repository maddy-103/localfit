import { useI18n, type Lang } from '@/i18n';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { RadioPills } from '@/components/ui/RadioPills';
import { Toggle } from '@/components/ui/Toggle';
import { useAppStore } from '@/store/appStore';
import styles from '@/components/buyer/pages.module.css';

/** Language and notification preferences, persisted with settings. */
export default function LanguageSettingsPage() {
  const { t, lang, setLang } = useI18n();
  const notifications = useAppStore((state) => state.settings.notifications);
  const setNotification = useAppStore((state) => state.setNotification);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Breadcrumb items={[{ label: t('profile.title'), to: '/profile' }, { label: t('profile.language') }]} />
        <h1 className={styles.heading}>{t('profile.language')}</h1>

        <section className={`${styles.card} ${styles.sectionGrid}`}>
          <RadioPills
            legend={t('language.label')}
            name="language"
            value={lang}
            options={[
              { value: 'en', label: t('language.en') },
              { value: 'hi', label: t('language.hi') },
            ]}
            onChange={(value) => setLang(value as Lang)}
          />
        </section>

        <section className={`${styles.card} ${styles.sectionGrid}`}>
          <h2 className={styles.sectionTitle}>{t('notifications.title')}</h2>
          <Toggle
            label={t('notifications.orders')}
            checked={notifications.orders}
            onChange={(value) => setNotification('orders', value)}
          />
          <Toggle
            label={t('notifications.offers')}
            checked={notifications.offers}
            onChange={(value) => setNotification('offers', value)}
          />
        </section>
      </div>
    </main>
  );
}
