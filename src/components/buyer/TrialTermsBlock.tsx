import { useEffect } from 'react';
import type { PaymentMethod } from '@/domain/payments';
import { useI18n } from '@/i18n';
import { Checkbox } from '@/components/ui/Checkbox';
import { useOnScreen } from '@/lib/useOnScreen';
import flow from './flow.module.css';

export interface TrialTermsBlockProps {
  paymentMethod: PaymentMethod;
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
  onReadyChange: (ready: boolean) => void;
}

/**
 * BUY-08: the Pay action stays disabled until the exact terms have been on
 * screen and the buyer has ticked them. IntersectionObserver drives `seen`;
 * jsdom falls back to the mounted element being visible.
 */
export function TrialTermsBlock({
  paymentMethod,
  accepted,
  onAcceptedChange,
  onReadyChange,
}: TrialTermsBlockProps) {
  const { t } = useI18n();
  const [ref, seen] = useOnScreen<HTMLDivElement>();
  const ready = seen && accepted;

  useEffect(() => {
    onReadyChange(ready);
  }, [ready, onReadyChange]);

  return (
    <div
      className={flow.terms}
      ref={ref}
      data-testid="trial-terms"
      data-terms-visible={seen ? 'true' : 'false'}
    >
      <h2 className={flow.cardTitle}>{t('trialTerms.title')}</h2>
      <p className={flow.termsCopy}>{t('trialTerms.copy')}</p>
      <p className={flow.termsCopy}>{t('trialTerms.defaultOutcome')}</p>
      <h3 className={flow.label}>{t('trialTerms.paymentTitle')}</h3>
      <p className={flow.termsCopy}>{t('trialTerms.card')}</p>
      <p className={flow.termsCopy}>{t('trialTerms.upi')}</p>
      <p className={flow.termsCopy}>{t('trialTerms.wallet')}</p>
      <p className={flow.termsCopy}>{t('trialTerms.cod')}</p>
      <p className={flow.hint}>
        {t(paymentMethod === 'cod' ? 'trialTerms.cod' : 'checkout.payment')}
      </p>
      <Checkbox
        label={t('checkout.tick')}
        checked={accepted}
        onChange={(event) => onAcceptedChange(event.target.checked)}
      />
    </div>
  );
}
