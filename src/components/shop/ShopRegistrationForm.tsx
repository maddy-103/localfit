import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import type { ShopRegistration } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Toggle } from '@/components/ui/Toggle';
import { useI18n, type TranslationKey } from '@/i18n';
import { SAMPLE_VISIT_SLOTS, SHOP_CATEGORIES, ownerIdError } from '@/domain/shop';
import { useToast } from '@/components/ui/Toast';
import styles from '@/routes/shop/shop.module.css';

const categoryLabel = (value: string, t: (key: TranslationKey) => string) =>
  t(`shop.category.${value}` as TranslationKey);

export function ShopRegistrationForm({ existing }: { existing: ShopRegistration | null }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [shopName, setShopName] = useState(existing?.shopName ?? '');
  const [ownerName, setOwnerName] = useState(existing?.ownerName ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [hasGst, setHasGst] = useState(existing?.hasGst ?? false);
  const [gstNumber, setGstNumber] = useState(existing?.gstNumber ?? '');
  const [ownerId, setOwnerId] = useState(existing?.ownerId ?? null);
  const [idError, setIdError] = useState<string | null>(null);
  const [accountMasked, setAccountMasked] = useState(existing?.bank.accountMasked ?? '');
  const [ifsc, setIfsc] = useState(existing?.bank.ifsc ?? '');
  const [holder, setHolder] = useState(existing?.bank.holder ?? '');
  const [taxDetails, setTaxDetails] = useState(existing?.taxDetails ?? '');
  const [categories, setCategories] = useState<string[]>(existing?.categories ?? []);
  const [slot, setSlot] = useState(existing?.sampleVisitSlot ?? SAMPLE_VISIT_SLOTS[0]);
  const [gstError, setGstError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const chooseFile = (file: File | undefined) => {
    if (!file) return;
    const error = ownerIdError(file);
    if (error) {
      setIdError(t(error === 'type' ? 'register.ownerIdType' : 'register.ownerIdSize'));
      setOwnerId(null);
      return;
    }
    setIdError(null);
    setOwnerId({ name: file.name, type: file.type, size: file.size });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (hasGst && !gstNumber.trim()) {
      setGstError(t('register.gstError'));
      return;
    }
    setGstError(null);
    setBusy(true);
    try {
      await api.saveShopRegistration({
        shopName,
        ownerName,
        phone,
        hasGst,
        gstNumber: hasGst ? gstNumber.trim() : null,
        ownerId,
        bank: { accountMasked, ifsc, holder },
        taxDetails,
        categories,
        sampleVisitSlot: slot,
      });
      toast(t('register.statusTitle'));
      navigate('/register/shop/status');
    } catch (error) {
      toast(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const toggleCategory = (value: string) =>
    setCategories((current) =>
      current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value],
    );

  return (
    <form className={styles.stack} onSubmit={submit}>
      <div className={styles.grid}>
        <Input label={t('register.shopName')} value={shopName} required onChange={(e) => setShopName(e.target.value)} />
        <Input label={t('register.ownerName')} value={ownerName} required onChange={(e) => setOwnerName(e.target.value)} />
        <Input label={t('register.phone')} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>

      <Toggle checked={hasGst} onChange={setHasGst} label={t('register.gstToggle')} description={t('register.gstHint')} />
      {hasGst ? (
        <Input label={t('register.gstNumber')} value={gstNumber} error={gstError ?? undefined} onChange={(e) => setGstNumber(e.target.value)} />
      ) : null}

      <Input
        label={t('register.ownerId')}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        hint={t('register.ownerIdHint')}
        error={idError ?? undefined}
        onChange={(e) => chooseFile(e.target.files?.[0])}
      />

      <div className={styles.grid}>
        <Input label={t('register.bankAccount')} value={accountMasked} hint={t('register.bankHint')} onChange={(e) => setAccountMasked(e.target.value)} />
        <Input label={t('register.ifsc')} value={ifsc} onChange={(e) => setIfsc(e.target.value)} />
        <Input label={t('register.holder')} value={holder} onChange={(e) => setHolder(e.target.value)} />
      </div>
      <Input label={t('register.taxDetails')} value={taxDetails} onChange={(e) => setTaxDetails(e.target.value)} />

      <fieldset className={styles.stack}>
        <legend className={styles.muted}>{t('register.categories')}</legend>
        <div className={styles.chips}>
          {SHOP_CATEGORIES.map((category) => (
            <Chip
              key={category}
              selected={categories.includes(category)}
              onClick={() => toggleCategory(category)}
            >
              {categoryLabel(category, t)}
            </Chip>
          ))}
        </div>
      </fieldset>

      <Select
        label={t('register.visit')}
        hint={t('register.visitHint')}
        value={slot}
        onChange={(e) => setSlot(e.target.value)}
        options={SAMPLE_VISIT_SLOTS.map((value) => ({
          value,
          label: t(`register.slot.${value}` as TranslationKey),
        }))}
      />

      <div className={styles.actions}>
        <Button type="submit" size="lg" loading={busy}>
          {busy ? t('register.submitting') : t('register.submit')}
        </Button>
      </div>
    </form>
  );
}
