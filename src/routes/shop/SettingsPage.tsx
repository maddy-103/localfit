import { useState, type FormEvent } from 'react';
import { api } from '@/api/client';
import type { ShopSettings, ShopStaff } from '@/api/types';
import { ShopStates } from '@/components/shop/ShopStates';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { useI18n, type TranslationKey } from '@/i18n';
import { useAsync, useOnline } from '@/lib/useAsync';
import styles from './shop.module.css';

const ROLES: ShopStaff['role'][] = ['manager', 'packer', 'accountant'];

export default function SettingsPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const online = useOnline();
  const settings = useAsync(() => api.getShopSettings(), 'shop-settings');
  const [draft, setDraft] = useState<ShopSettings | null>(null);
  const [busy, setBusy] = useState(false);

  const value = draft ?? settings.data;
  const patch = (next: Partial<ShopSettings>) =>
    setDraft({ ...(value ?? initialSettings()), ...next });

  const initialSettings = (): ShopSettings => ({
    shopId: 'shop-kiran',
    serviceRadiusKm: 6,
    hours: '10:00–21:00',
    bankAccountMasked: '',
    ifsc: '',
    taxId: '',
    staff: [],
  });

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!value) return;
    setBusy(true);
    try {
      await api.saveShopSettings({
        serviceRadiusKm: value.serviceRadiusKm,
        hours: value.hours,
        bankAccountMasked: value.bankAccountMasked,
        ifsc: value.ifsc,
        taxId: value.taxId,
        staff: value.staff,
      });
      setDraft(null);
      settings.reload();
      toast(t('shop.settings.saved'));
    } catch (error) {
      toast(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const changeStaff = (index: number, next: Partial<ShopStaff>) => {
    if (!value) return;
    patch({
      staff: value.staff.map((entry, position) => (position === index ? { ...entry, ...next } : entry)),
    });
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('shop.settings.title')}</h1>
      </header>

      <ShopStates
        loading={settings.loading}
        error={settings.error}
        offline={!online}
        lastUpdated={settings.lastUpdated}
        onRetry={settings.reload}
      >
        {value ? (
          <form className={styles.stack} onSubmit={(event) => void save(event)}>
            <Card padded>
              <div className={styles.stack}>
                <h2 className={styles.title}>{t('shop.settings.serviceArea')}</h2>
                <Input
                  label={t('shop.settings.radius')}
                  type="range"
                  min={1}
                  max={30}
                  step={1}
                  value={value.serviceRadiusKm}
                  hint={t('shop.settings.radiusHint')}
                  onChange={(event) => patch({ serviceRadiusKm: Number(event.target.value) })}
                />
                <Input
                  label={t('shop.settings.radius')}
                  type="number"
                  min={1}
                  max={30}
                  value={value.serviceRadiusKm}
                  onChange={(event) => patch({ serviceRadiusKm: Number(event.target.value) })}
                />
                <Input
                  label={t('shop.settings.hours')}
                  value={value.hours}
                  onChange={(event) => patch({ hours: event.target.value })}
                />
              </div>
            </Card>

            <Card padded>
              <div className={styles.stack}>
                <h2 className={styles.title}>{t('shop.settings.staff')}</h2>
                {(value.staff ?? []).map((member, index) => (
                  <div className={styles.stack} key={member.id}>
                    <div className={styles.grid}>
                      <Input
                        label={t('shop.settings.staffName')}
                        value={member.name}
                        onChange={(event) => changeStaff(index, { name: event.target.value })}
                      />
                      <Input
                        label={t('shop.settings.staffPhone')}
                        type="tel"
                        value={member.phone}
                        onChange={(event) => changeStaff(index, { phone: event.target.value })}
                      />
                      <Select
                        label={t('shop.settings.staffRole')}
                        value={member.role}
                        onChange={(event) =>
                          changeStaff(index, { role: event.target.value as ShopStaff['role'] })
                        }
                        options={ROLES.map((role) => ({
                          value: role,
                          label: t(`shop.settings.role.${role}` as TranslationKey),
                        }))}
                      />
                    </div>
                    <div className={styles.actions}>
                      <Button
                        variant="outline"
                        onClick={() =>
                          patch({ staff: value.staff.filter((_, position) => position !== index) })
                        }
                      >
                        {t('shop.settings.removeStaff', { name: member.name || member.id })}
                      </Button>
                    </div>
                  </div>
                ))}
                <div className={styles.actions}>
                  <Button
                    variant="outline"
                    onClick={() =>
                      patch({
                        staff: [
                          ...value.staff,
                          {
                            id: `staff-${value.staff.length + 1}`,
                            name: '',
                            phone: '',
                            role: 'packer',
                          },
                        ],
                      })
                    }
                  >
                    {t('shop.settings.addStaff')}
                  </Button>
                </div>
              </div>
            </Card>

            <Card padded>
              <div className={styles.stack}>
                <h2 className={styles.title}>{t('shop.settings.bank')}</h2>
                <p className={styles.muted}>{t('shop.settings.maskedHint')}</p>
                <div className={styles.grid}>
                  <Input
                    label={t('register.bankAccount')}
                    value={value.bankAccountMasked}
                    onChange={(event) => patch({ bankAccountMasked: event.target.value })}
                  />
                  <Input
                    label={t('register.ifsc')}
                    value={value.ifsc}
                    onChange={(event) => patch({ ifsc: event.target.value })}
                  />
                  <Input
                    label={t('register.taxDetails')}
                    value={value.taxId}
                    onChange={(event) => patch({ taxId: event.target.value })}
                  />
                </div>
              </div>
            </Card>

            <div className={styles.actions}>
              <Button type="submit" size="lg" loading={busy}>
                {t('shop.settings.save')}
              </Button>
            </div>
          </form>
        ) : null}
      </ShopStates>
    </div>
  );
}
