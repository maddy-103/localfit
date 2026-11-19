import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { api } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Icon } from '@/components/icons/Icon';
import { useAppStore, type UserRole } from '@/store/appStore';
import { useNow } from '@/lib/useNow';
import { now } from '@/lib/clock';
import { getReturnPath } from '@/lib/returnTo';
import { DEMO_OTP, OTP_RESEND_MS, WHATSAPP_OFFER_MS } from '@/domain/config';
import styles from '@/components/auth/authPages.module.css';

interface OtpState {
  phone?: string;
  returnTo?: string;
}

/** Step two of phone sign-in: OTP with timed resend and WhatsApp fallback. */
export default function OtpPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as OtpState;
  const returnTo = getReturnPath(location.state, location.search);
  const consent = useAppStore((store) => store.settings.consent);
  const onboarded = useAppStore((store) => store.settings.onboarded);
  const setSession = useAppStore((store) => store.setSession);

  const [sentAt, setSentAt] = useState(() => now());
  const [channel, setChannel] = useState<'sms' | 'whatsapp'>('sms');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const current = useNow(500);

  const elapsed = current - sentAt;
  const resendIn = Math.max(0, Math.ceil((OTP_RESEND_MS - elapsed) / 1000));
  const resendReady = resendIn === 0;
  const whatsappReady = elapsed >= WHATSAPP_OFFER_MS;

  const sendAgain = (next: 'sms' | 'whatsapp') => {
    setSentAt(now());
    setChannel(next);
    setStatus(t(next === 'sms' ? 'auth.newCode' : 'auth.whatsappSent'));
    setError('');
  };

  const verify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const demo = import.meta.env.VITE_DEMO === 'true';
    const valid = demo ? code === DEMO_OTP : /^\d{6}$/.test(code);
    if (!valid) {
      setError(t('auth.codeError'));
      return;
    }
    setError('');

    const digits = (state.phone ?? '').replace(/\D/g, '');
    const [shops, riders] = await Promise.all([api.listShops(), api.listRiders()]);
    const matches = (phone: string) => phone.replace(/\D/g, '').endsWith(digits);
    const role: UserRole = shops.some((shop) => matches(shop.phone))
      ? 'shop'
      : riders.some((rider) => matches(rider.phone))
        ? 'rider'
        : 'buyer';

    setSession({
      id: `${role}-${digits || 'demo'}`,
      name: role === 'buyer' ? 'Buyer' : role === 'shop' ? 'Shop' : 'Rider',
      phone: `+91 ${digits}`,
      role,
      availableRoles: ['buyer', 'shop', 'rider'],
    });

    if (!consent.termsAccepted) {
      navigate('/consent', { state: { returnTo }, replace: true });
    } else if (!onboarded) {
      navigate('/onboarding/profile', { state: { returnTo }, replace: true });
    } else {
      navigate(returnTo, { replace: true });
    }
  };

  return (
    <section className={styles.page}>
      <div>
        <p className={styles.eyebrow}>+91 {state.phone}</p>
        <h1 className={styles.heading}>{t('auth.otpTitle')}</h1>
        <p className={styles.intro}>{t('auth.otpHint')}</p>
      </div>

      <form onSubmit={(event) => void verify(event)} className={styles.group} noValidate>
        <Input
          label={t('auth.otpLabel')}
          error={error || undefined}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          className={styles.code}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
        />
        {import.meta.env.VITE_DEMO === 'true' ? (
          <p className={styles.note}>{t('auth.demoCode', { code: DEMO_OTP })}</p>
        ) : null}
        <Button type="submit" size="lg" fullWidth>
          {t('auth.verify')}
        </Button>
      </form>

      <div className={styles.codeRow}>
        <span className={styles.note} role="status">{status || t(channel === 'sms' ? 'auth.smsSent' : 'auth.whatsappSent')}</span>
        <button
          type="button"
          className={styles.link}
          disabled={!resendReady}
          onClick={() => sendAgain('sms')}
        >
          {resendReady ? t('auth.resend') : t('auth.resendIn', { seconds: resendIn })}
        </button>
      </div>

      {whatsappReady ? (
        <div className={styles.divider} />
      ) : null}
      {whatsappReady ? (
        <p className={styles.note}>
          <Icon name="phone" size={16} /> {t('auth.whatsappAvailable')}{' '}
          <button type="button" className={styles.link} onClick={() => sendAgain('whatsapp')}>
            {t('auth.whatsapp')}
          </button>
        </p>
      ) : null}
    </section>
  );
}
