import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/icons/Icon';
import { useI18n, type TranslationKey } from '@/i18n';
import styles from './shop.module.css';

const FAQS = ['shop.support.faq1Q', 'shop.support.faq2Q'] as const;
const ANSWERS: Record<(typeof FAQS)[number], TranslationKey> = {
  'shop.support.faq1Q': 'shop.support.faq1A',
  'shop.support.faq2Q': 'shop.support.faq2A',
};

export default function SupportPage() {
  const { t } = useI18n();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('shop.support.title')}</h1>
        <p className={styles.intro}>{t('shop.support.intro')}</p>
      </header>

      <Card padded>
        <div className={styles.stack}>
          <p className={styles.muted}>{t('shop.support.hours')}</p>
          <div className={styles.actions}>
            <a href="tel:18001234567">
              <Button size="lg" leftIcon="phone">{t('nav.support')}</Button>
            </a>
            <Link to="/register/shop/status">
              <Button size="lg" variant="outline">{t('register.viewStatus')}</Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className={styles.stack}>
        {FAQS.map((question) => (
          <details key={question}>
            <summary className={styles.row}>
              <Icon name="chevron-right" size={18} />
              <strong>{t(question)}</strong>
            </summary>
            <p className={styles.muted}>{t(ANSWERS[question])}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
