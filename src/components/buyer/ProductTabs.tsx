import { useState } from 'react';
import { Tabs } from '@/components/ui/Tabs';
import { useI18n } from '@/i18n';
import styles from './flow.module.css';

interface Props {
  description: string;
}

export function ProductTabs({ description }: Props) {
  const { t } = useI18n();
  const [active, setActive] = useState('details');
  const items = [
    { id: 'details', label: t('product.detailsTab') },
    { id: 'ratings', label: t('product.ratingsTab') },
    { id: 'faqs', label: t('product.faqsTab') },
  ];

  return (
    <section aria-label={t('product.detailsTab')}>
      <Tabs items={items} active={active} onChange={setActive} label={t('product.detailsTab')} />
      <div className={styles.tabPanel} role="tabpanel">
        {active === 'details' ? (
          <div className={styles.stack}>
            <p>{description}</p>
            <p className={styles.small}>{t('product.sizeGuideHint')}</p>
          </div>
        ) : null}
        {active === 'ratings' ? (
          <div>
            <p className={styles.badge}>{t('product.phase2')}</p>
            <p className={styles.muted}>{t('product.ratingsBody')}</p>
          </div>
        ) : null}
        {active === 'faqs' ? (
          <div>
            {[1, 2, 3].map((index) => (
              <div className={styles.faq} key={index}>
                <strong>{t(`product.faq${index}Q` as 'product.faq1Q')}</strong>
                <span className={styles.muted}>{t(`product.faq${index}A` as 'product.faq1A')}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
