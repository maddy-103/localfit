import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { useToast } from '@/components/ui/Toast';
import { useAppStore } from '@/store/appStore';
import { clearHomeCache } from '@/lib/homeCache';
import { nowIso } from '@/lib/clock';
import styles from '@/components/buyer/pages.module.css';

/** Consent changes, JSON export and a deliberate two-step deletion (BUY-17). */
export default function PrivacyPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { toast } = useToast();
  const settings = useAppStore((state) => state.settings);
  const session = useAppStore((state) => state.session);
  const setConsent = useAppStore((state) => state.setConsent);
  const resetApp = useAppStore((state) => state.resetApp);
  const [understood, setUnderstood] = useState(false);
  const [confirmation, setConfirmation] = useState('');

  const download = () => {
    const payload = JSON.stringify(
      { exportedAt: nowIso(), session, settings },
      null,
      2,
    );
    const blob = new Blob([payload], { type: 'application/json' });
    if (typeof URL.createObjectURL === 'function') {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'localfit-my-data.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }
    toast(t('privacy.downloaded'));
  };

  const removeAccount = () => {
    if (!understood || confirmation !== 'DELETE') return;
    resetApp();
    void clearHomeCache();
    navigate('/welcome', { replace: true });
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Breadcrumb items={[{ label: t('profile.title'), to: '/profile' }, { label: t('privacy.title') }]} />
        <h1 className={styles.heading}>{t('privacy.title')}</h1>

        <section className={`${styles.card} ${styles.sectionGrid}`}>
          <h2 className={styles.sectionTitle}>{t('privacy.data')}</h2>
          <Toggle label={t('consent.location')} description={t('consent.locationHelp')} checked={settings.consent.location} onChange={(location) => setConsent({ location })} />
          <Toggle label={t('consent.marketing')} description={t('consent.marketingHelp')} checked={settings.consent.marketing} onChange={(marketing) => setConsent({ marketing })} />
          <Toggle label={t('consent.personalisation')} description={t('consent.personalisationHelp')} checked={settings.consent.personalisation} onChange={(personalisation) => setConsent({ personalisation })} />
          <div>
            <Button variant="outline" leftIcon="file" onClick={download}>
              {t('privacy.download')}
            </Button>
          </div>
        </section>

        <section className={`${styles.card} ${styles.sectionGrid}`}>
          <h2 className={styles.sectionTitle}>{t('privacy.delete')}</h2>
          <p className={styles.small}>{t('privacy.deleteHelp')}</p>
          <Checkbox label={t('privacy.confirmStep1')} checked={understood} onChange={(event) => setUnderstood(event.target.checked)} />
          <Input label={t('privacy.confirmStep2')} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
          <div className={styles.row}>
            <Button destructive disabled={!understood || confirmation !== 'DELETE'} onClick={removeAccount}>
              {t('privacy.deleteButton')}
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
