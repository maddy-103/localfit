import { useI18n } from '@/i18n';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/Button';
import flow from './flow.module.css';

/**
 * Temporary phase 1 sign-in shown only when the checkout screen is rendered
 * without a session. The router still sends real guests to /login (rule 15),
 * so this is a defensive stub rather than a second sign-in path.
 */
export function CheckoutSignInStub() {
  const { t } = useI18n();
  const setSession = useAppStore((state) => state.setSession);

  return (
    <section className={flow.card} aria-labelledby="checkout-signin-title">
      <h2 className={flow.cardTitle} id="checkout-signin-title">
        {t('checkout.signInTitle')}
      </h2>
      <p className={flow.hint}>{t('checkout.signInBody')}</p>
      <Button
        onClick={() =>
          setSession({
            id: 'buyer-ananya',
            name: 'Ananya Iyer',
            phone: '+91 98860 22110',
            role: 'buyer',
          })
        }
      >
        {t('checkout.signInButton')}
      </Button>
    </section>
  );
}
