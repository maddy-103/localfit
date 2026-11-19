import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Dialog } from '@/components/ui/Dialog';
import { Toggle } from '@/components/ui/Toggle';
import { useAppStore } from '@/store/appStore';
import { getReturnPath } from '@/lib/returnTo';
import styles from '@/components/auth/authPages.module.css';

/** Three independent consents, with terms kept separate (AUTH-03, NFR-08). */
export default function ConsentPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = getReturnPath(location.state, location.search);
  const consent = useAppStore((store) => store.settings.consent);
  const onboarded = useAppStore((store) => store.settings.onboarded);
  const setConsent = useAppStore((store) => store.setConsent);
  const [termsOpen, setTermsOpen] = useState(false);

  const save = () => {
    if (!consent.termsAccepted) return;
    navigate(onboarded ? returnTo : '/onboarding/profile', {
      state: onboarded ? undefined : { returnTo },
      replace: true,
    });
  };

  return (
    <section className={styles.page}>
      <div>
        <p className={styles.eyebrow}>{t('app.name')}</p>
        <h1 className={styles.heading}>{t('consent.title')}</h1>
        <p className={styles.intro}>{t('consent.intro')}</p>
      </div>

      <div className={styles.rows}>
        <Toggle
          label={t('consent.location')}
          description={t('consent.locationHelp')}
          checked={consent.location}
          onChange={(liveLocation) => setConsent({ location: liveLocation })}
        />
        <Toggle
          label={t('consent.marketing')}
          description={t('consent.marketingHelp')}
          checked={consent.marketing}
          onChange={(marketing) => setConsent({ marketing })}
        />
        <Toggle
          label={t('consent.personalisation')}
          description={t('consent.personalisationHelp')}
          checked={consent.personalisation}
          onChange={(personalisation) => setConsent({ personalisation })}
        />
      </div>

      <div className={styles.terms}>
        <Checkbox
          label={t('consent.terms')}
          checked={consent.termsAccepted}
          onChange={(event) => setConsent({ termsAccepted: event.target.checked })}
        />
        <button type="button" className={styles.link} onClick={() => setTermsOpen(true)}>
          {t('consent.termsLink')}
        </button>
      </div>

      <div className={styles.actions}>
        <Button size="lg" fullWidth disabled={!consent.termsAccepted} onClick={save}>
          {t('consent.continue')}
        </Button>
        <p className={styles.note}>{t('consent.laterLink')}</p>
      </div>

      <Dialog
        open={termsOpen}
        onClose={() => setTermsOpen(false)}
        title={t('consent.termsTitle')}
        footer={<Button onClick={() => setTermsOpen(false)}>{t('common.close')}</Button>}
      >
        <p>{t('consent.termsBody')}</p>
      </Dialog>
    </section>
  );
}
