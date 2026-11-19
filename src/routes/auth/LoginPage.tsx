import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getReturnPath } from '@/lib/returnTo';
import { DEMO_OTP } from '@/domain/config';
import styles from '@/components/auth/authPages.module.css';

/** Step one of phone sign-in: collect a 10-digit Indian mobile number. */
export default function LoginPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = getReturnPath(location.state, location.search);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const digits = phone.replace(/\s/g, '');
    if (!/^\d{10}$/.test(digits)) {
      setError(t('auth.phoneError'));
      return;
    }
    setError('');
    navigate('/login/otp', { state: { phone: digits, returnTo } });
  };

  return (
    <section className={styles.page}>
      <div>
        <p className={styles.eyebrow}>{t('app.name')}</p>
        <h1 className={styles.heading}>{t('route.login')}</h1>
        <p className={styles.intro}>{t('auth.phoneHint')}</p>
      </div>

      <form onSubmit={submit} className={styles.group} noValidate>
        <div className={styles.phoneRow}>
          <span className={styles.prefix} aria-hidden="true">+91</span>
          <Input
            label={t('auth.phoneLabel')}
            hint={t('auth.phoneHint')}
            error={error || undefined}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            value={phone}
            onChange={(event) => setPhone(event.target.value.replace(/[^\d\s]/g, ''))}
          />
        </div>
        <Button type="submit" size="lg" fullWidth>
          {t('auth.sendCode')}
        </Button>
      </form>

      {import.meta.env.VITE_DEMO === 'true' ? (
        <p className={styles.note}>{t('auth.demoCode', { code: DEMO_OTP })}</p>
      ) : null}
    </section>
  );
}
