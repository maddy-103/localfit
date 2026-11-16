import { useI18n } from '@/i18n';
import { cx } from '@/lib/cx';
import styles from './chrome.module.css';

/** English / Hindi segmented control. Both labels are always visible. */
export function LanguageSwitch() {
  const { t, lang, setLang } = useI18n();

  return (
    <div className={styles.languageSwitch} role="group" aria-label={t('language.label')}>
      <button
        type="button"
        className={cx(styles.languageOption, lang === 'en' && styles.languageOptionActive)}
        aria-pressed={lang === 'en'}
        onClick={() => setLang('en')}
      >
        {t('language.en')}
      </button>
      <button
        type="button"
        className={cx(styles.languageOption, lang === 'hi' && styles.languageOptionActive)}
        aria-pressed={lang === 'hi'}
        onClick={() => setLang('hi')}
      >
        {t('language.hi')}
      </button>
    </div>
  );
}
