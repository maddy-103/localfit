import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { Icon } from '@/components/icons/Icon';
import styles from '@/components/auth/authPages.module.css';

/** First run: pick a language, then sign in or browse as a guest (AUTH-02). */
export default function WelcomePage() {
  const { t, lang, setLang } = useI18n();

  return (
    <section className={styles.page}>
      <div>
        <p className={styles.eyebrow}>{t('app.name')}</p>
        <h1 className={styles.heading}>{t('welcome.heading')}</h1>
        <p className={styles.intro}>{t('welcome.subtitle')}</p>
      </div>

      <div className={styles.group}>
        <p className={styles.groupTitle}>{t('welcome.chooseLanguage')}</p>
        <div className={styles.langButtons} role="group" aria-label={t('welcome.chooseLanguage')}>
          <button
            type="button"
            className={`${styles.langButton} ${lang === 'en' ? styles.langActive : ''}`}
            aria-pressed={lang === 'en'}
            onClick={() => setLang('en')}
          >
            {t('language.en')}
          </button>
          <button
            type="button"
            className={`${styles.langButton} ${lang === 'hi' ? styles.langActive : ''}`}
            aria-pressed={lang === 'hi'}
            onClick={() => setLang('hi')}
          >
            {t('language.hi')}
          </button>
        </div>
        <p className={styles.note}>{t('welcome.languageHint')}</p>
      </div>

      <div className={styles.actions}>
        <Link to="/login" className={styles.actionLink}>
          {t('welcome.signIn')}
        </Link>
        <Link to="/" state={{ guest: true }} className={`${styles.actionLink} ${styles.actionLinkOutline}`}>
          {t('welcome.browse')}
        </Link>
      </div>

      <p className={styles.note}>
        <Icon name="pin" size={16} /> {t('welcome.browseNote')}
      </p>
    </section>
  );
}
