import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import type { AdminAccount } from '@/api/types';
import { ADMIN_2FA_CODE } from '@/domain/admin';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Select, type SelectOption } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { useI18n } from '@/i18n';
import { useAppStore } from '@/store/appStore';
import { useAsync } from '@/lib/useAsync';
import styles from './admin.module.css';

/** AUTH-06: SSO first, then a second factor, then a role-aware session. */
export default function AdminLoginPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const setSession = useAppStore((state) => state.setSession);
  const accounts = useAsync(() => api.adminSsoAccounts(), 'admin-sso-accounts');
  const [selectedId, setSelectedId] = useState('');
  const [step, setStep] = useState<'account' | 'code'>('account');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const list = accounts.data ?? [];
  const options: SelectOption[] = list.map((account) => ({
    value: account.id,
    label: `${account.name} · ${t(`role.${roleKey(account)}` as 'role.admin')}`,
  }));

  async function chooseAccount() {
    if (!selectedId) return;
    setError(null);
    setStep('code');
  }

  async function verify() {
    setBusy(true);
    setError(null);
    try {
      const account: AdminAccount = await api.adminSignIn({ accountId: selectedId, code });
      setSession({
        id: account.id,
        name: account.name,
        phone: account.phone,
        role: account.adminRole === 'super_admin' ? 'super_admin' : 'admin',
        adminRole: account.adminRole,
      });
      navigate('/admin', { replace: true });
    } catch {
      setError(t('admin.login.error'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.loginHead}>
        <h1 className={styles.title}>{t('admin.login.title')}</h1>
        <p className={styles.intro}>{t('admin.login.subtitle')}</p>
      </header>

      <Card className={styles.loginCard} padded>
        {accounts.error ? <ErrorState message={accounts.error} onRetry={accounts.reload} /> : null}
        {accounts.loading ? <Skeleton variant="line" count={3} /> : null}

        {!accounts.loading && !accounts.error ? (
          step === 'account' ? (
            <>
              <Select
                label={t('admin.login.account')}
                options={options}
                value={selectedId}
                placeholder="—"
                onChange={(event) => setSelectedId(event.target.value)}
              />
              <Button fullWidth disabled={!selectedId} onClick={chooseAccount}>
                {t('admin.login.sso')}
              </Button>
            </>
          ) : (
            <>
              <p className={styles.eyebrow}>{t('admin.login.twoFactor')}</p>
              <Input
                label={t('admin.login.code')}
                hint={t('admin.login.codeHint', { code: ADMIN_2FA_CODE })}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                error={error ?? undefined}
                onChange={(event) => setCode(event.target.value)}
              />
              <Button fullWidth loading={busy} disabled={code.length < 6} onClick={verify}>
                {t('admin.login.verify')}
              </Button>
              <Button
                variant="ghost"
                fullWidth
                onClick={() => {
                  setStep('account');
                  setCode('');
                  setError(null);
                }}
              >
                {t('admin.login.back')}
              </Button>
            </>
          )
        ) : null}
      </Card>
    </section>
  );
}

function roleKey(account: AdminAccount): string {
  switch (account.adminRole) {
    case 'support_agent':
      return 'supportAgent';
    case 'dispute_lead':
      return 'disputeLead';
    case 'super_admin':
      return 'superAdmin';
    default:
      return account.adminRole;
  }
}
