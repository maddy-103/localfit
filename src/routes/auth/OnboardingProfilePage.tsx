import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useI18n, type Lang } from '@/i18n';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useAppStore } from '@/store/appStore';
import { CITIES } from '@/domain/config';
import { getReturnPath } from '@/lib/returnTo';
import styles from '@/components/auth/authPages.module.css';

/** New-account profile step: name, serviceable city and preferred language. */
export default function OnboardingProfilePage() {
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = getReturnPath(location.state, location.search);
  const session = useAppStore((store) => store.session);
  const setSession = useAppStore((store) => store.setSession);
  const completeOnboarding = useAppStore((store) => store.completeOnboarding);
  const [name, setName] = useState(session?.name === 'Buyer' ? '' : session?.name ?? '');
  const [city, setCity] = useState<string>(CITIES[0]);
  const [error, setError] = useState('');

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setError(t('onboarding.name'));
      return;
    }
    if (session) setSession({ ...session, name: name.trim() });
    setLang(lang);
    completeOnboarding();
    navigate(returnTo, { replace: true });
  };

  return (
    <section className={styles.page}>
      <div>
        <p className={styles.eyebrow}>{t('app.name')}</p>
        <h1 className={styles.heading}>{t('onboarding.title')}</h1>
        <p className={styles.intro}>{t('onboarding.intro')}</p>
      </div>

      <form onSubmit={save} className={styles.group} noValidate>
        <Input
          label={t('onboarding.name')}
          autoComplete="name"
          value={name}
          error={error || undefined}
          onChange={(event) => { setName(event.target.value); setError(''); }}
        />
        <Select
          label={t('onboarding.city')}
          hint={t('onboarding.cityHint')}
          value={city}
          options={CITIES.map((entry) => ({ value: entry, label: entry }))}
          onChange={(event) => setCity(event.target.value)}
        />
        <Select
          label={t('onboarding.language')}
          value={lang}
          options={[
            { value: 'en', label: t('language.en') },
            { value: 'hi', label: t('language.hi') },
          ]}
          onChange={(event) => setLang(event.target.value as Lang)}
        />
        <Button type="submit" size="lg" fullWidth>
          {t('onboarding.continue')}
        </Button>
      </form>
    </section>
  );
}
