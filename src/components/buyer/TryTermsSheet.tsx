import { Sheet } from '@/components/ui/Sheet';
import { useI18n } from '@/i18n';
import styles from './flow.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Terms a buyer sees before enabling try-at-door on one item. */
export function TryTermsSheet({ open, onClose }: Props) {
  const { t } = useI18n();

  return (
    <Sheet open={open} onClose={onClose} title={t('product.tryTermsTitle')}>
      <div className={styles.stack}>
        <p className={styles.termsCopy}>{t('trialTerms.copy')}</p>
        <p>{t('trialTerms.defaultOutcome')}</p>
        <p className={styles.label}>{t('trialTerms.paymentTitle')}</p>
        <p className={styles.small}>{t('trialTerms.card')}</p>
        <p className={styles.small}>{t('trialTerms.upi')}</p>
        <p className={styles.small}>{t('trialTerms.wallet')}</p>
      </div>
    </Sheet>
  );
}
