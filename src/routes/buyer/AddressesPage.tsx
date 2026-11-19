import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/client';
import type { Address, SaveAddressInput } from '@/api/types';
import { useI18n } from '@/i18n';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Sheet } from '@/components/ui/Sheet';
import { useAppStore } from '@/store/appStore';
import { useAsync } from '@/lib/useAsync';
import styles from '@/components/buyer/pages.module.css';

function blank(buyerId: string): SaveAddressInput {
  return { buyerId, label: '', line1: '', area: '', city: 'Bengaluru', pincode: '', lat: 0, lng: 0, isDefault: false };
}

/** Address book with add, edit and set-default (profile requirement). */
export default function AddressesPage() {
  const { t } = useI18n();
  const session = useAppStore((state) => state.session);
  const buyerId = session?.id ?? 'buyer-ananya';
  const { data, error, loading, reload } = useAsync(() => api.listAddresses(buyerId), `addresses:${buyerId}`);
  const [editing, setEditing] = useState<SaveAddressInput | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const openNew = () => { setFormError(''); setEditing(blank(buyerId)); };
  const openEdit = (address: Address) => { setFormError(''); setEditing({ ...address }); };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing || !editing.label.trim() || !editing.line1.trim() || !/^\d{6}$/.test(editing.pincode)) {
      setFormError(t('addresses.save'));
      return;
    }
    setSaving(true);
    try {
      await api.saveAddress(editing);
      setEditing(null);
      reload();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const setDefault = async (address: Address) => {
    await api.saveAddress({ ...address, isDefault: true });
    reload();
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Breadcrumb items={[{ label: t('profile.title'), to: '/profile' }, { label: t('addresses.title') }]} />
        <div className={styles.sectionHead}>
          <h1 className={styles.heading}>{t('addresses.title')}</h1>
          <Button leftIcon="plus" onClick={openNew}>{t('addresses.add')}</Button>
        </div>

        {loading && !data ? (
          <div aria-busy="true"><Skeleton variant="card" count={2} /></div>
        ) : error && !data ? (
          <ErrorState message={error} onRetry={reload} />
        ) : data?.length ? (
          <div className={`${styles.col} ${styles.sectionGrid}`}>
            {data.map((address) => (
              <article key={address.id} className={styles.card}>
                <div className={styles.addressCard}>
                  <div className={styles.orderMeta}>
                    <span className={styles.bold}>{address.label}</span>
                    {address.isDefault ? <span className={styles.pill}>{t('addresses.defaultBadge')}</span> : null}
                  </div>
                  <p className={styles.small}>{address.line1}, {address.area}</p>
                  <p className={styles.small}>{address.city} — {address.pincode}</p>
                  <div className={styles.row}>
                    <button type="button" className={styles.link} onClick={() => openEdit(address)}>
                      {t('addresses.edit')}
                    </button>
                    {!address.isDefault ? (
                      <button type="button" className={styles.link} onClick={() => void setDefault(address)}>
                        {t('addresses.setDefault')}
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title={t('addresses.empty')} action={<Link to="/profile" className={styles.link}>{t('profile.title')}</Link>} />
        )}
      </div>

      <Sheet
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? t('addresses.edit') : t('addresses.add')}
        footer={<Button type="submit" form="address-form" size="lg" fullWidth loading={saving}>{t('addresses.save')}</Button>}
      >
        {editing ? (
          <form id="address-form" className={styles.fieldGrid} onSubmit={(event) => void save(event)}>
            <Input label={t('addresses.label')} value={editing.label} onChange={(event) => setEditing({ ...editing, label: event.target.value })} />
            <Input label={t('addresses.line1')} className={styles.fieldFull} value={editing.line1} onChange={(event) => setEditing({ ...editing, line1: event.target.value })} />
            <Input label={t('addresses.area')} value={editing.area} onChange={(event) => setEditing({ ...editing, area: event.target.value })} />
            <Input label={t('addresses.city')} value={editing.city} onChange={(event) => setEditing({ ...editing, city: event.target.value })} />
            <Input label={t('addresses.pincode')} inputMode="numeric" maxLength={6} value={editing.pincode} onChange={(event) => setEditing({ ...editing, pincode: event.target.value })} />
            <Checkbox label={t('addresses.default')} checked={Boolean(editing.isDefault)} onChange={(event) => setEditing({ ...editing, isDefault: event.target.checked })} />
            {formError ? <p className={styles.small}>{formError}</p> : null}
          </form>
        ) : null}
      </Sheet>
    </main>
  );
}
