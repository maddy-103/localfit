import { useState, type ChangeEvent, type FormEvent } from 'react';
import { api } from '@/api/client';
import type { ListingDraft, ListingSuggestion } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/icons/Icon';
import { Input } from '@/components/ui/Input';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { SHOP_CATEGORIES, SIZES } from '@/domain/shop';
import { useI18n, type TranslationKey } from '@/i18n';
import { LISTING_HAPPY_PATH_STEPS } from '@/domain/shop';
import styles from '@/routes/shop/shop.module.css';

export interface ListingFormProps {
  draft?: ListingDraft | null;
  onSaved: () => void;
  onStep?: (step: string) => void;
}

function readPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read that photo.'));
    reader.readAsDataURL(file);
  });
}

/** SHOP-01/02: six steps from photo to published listing. */
export function ListingForm({ draft, onSaved, onStep }: ListingFormProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [photo, setPhoto] = useState<ListingDraft['photo']>(draft?.photo ?? null);
  const [suggestions, setSuggestions] = useState<ListingSuggestion | null>(draft?.suggestions ?? null);
  const [title, setTitle] = useState(draft?.title ?? '');
  const [category, setCategory] = useState(draft?.category ?? SHOP_CATEGORIES[0]);
  const [colour, setColour] = useState(draft?.colour ?? '');
  const [fabric, setFabric] = useState(draft?.fabric ?? '');
  const [sizes, setSizes] = useState<{ size: string; qty: number }[]>(draft?.sizes ?? []);
  const [rupees, setRupees] = useState(draft ? String(draft.pricePaise / 100) : '');
  const [analysing, setAnalysing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState(draft?.photo?.name ?? '');

  const photograph = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onStep?.(LISTING_HAPPY_PATH_STEPS[0]);
    setAnalysing(true);
    setError(null);
    try {
      const dataUrl = await readPhoto(file);
      const found = await api.analyzeListingPhoto(file.name);
      setPhoto({ dataUrl, name: file.name, mime: file.type });
      setPhotoName(file.name);
      setSuggestions(found);
      if (!title) {
        setTitle(file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
      }
      setCategory(found.category);
      setColour(found.colour);
      setFabric(found.fabric);
      onStep?.(LISTING_HAPPY_PATH_STEPS[1]);
      onStep?.(LISTING_HAPPY_PATH_STEPS[2]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('common.error'));
    } finally {
      setAnalysing(false);
    }
  };

  const toggleSize = (size: string) => {
    setSizes((current) =>
      current.some((entry) => entry.size === size)
        ? current.filter((entry) => entry.size !== size)
        : [...current, { size, qty: 1 }],
    );
    onStep?.(LISTING_HAPPY_PATH_STEPS[3]);
  };

  const setQty = (size: string, qty: number) => {
    setSizes((current) => current.map((entry) => (entry.size === size ? { ...entry, qty } : entry)));
    onStep?.(LISTING_HAPPY_PATH_STEPS[3]);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const pricePaise = Math.round(Number(rupees) * 100);
    if (!Number.isFinite(pricePaise) || pricePaise <= 0) {
      setError(t('shop.listing.priceHint'));
      return;
    }
    if (!sizes.some((entry) => entry.qty > 0)) {
      setError(t('shop.listing.sizes'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      onStep?.(LISTING_HAPPY_PATH_STEPS[4]);
      const saved = await api.saveListingDraft({
        ...(draft ? { id: draft.id } : {}),
        title: title.trim(),
        photo,
        suggestions,
        category,
        colour,
        fabric,
        sizes: sizes.filter((entry) => entry.qty > 0),
        pricePaise,
      });
      const published = await api.publishListingDraft(saved.id);
      onStep?.(LISTING_HAPPY_PATH_STEPS[5]);
      toast(
        t(published.status === 'queued' ? 'shop.listing.queued' : 'shop.listing.published'),
      );
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className={styles.stack} onSubmit={save}>
      <Input
        label={t('shop.listing.capture')}
        type="file"
        accept="image/*"
        capture="environment"
        hint={t('shop.listing.captureHint')}
        onChange={photograph}
      />
      {analysing ? <p className={styles.muted} role="status">{t('shop.listing.analysing')}</p> : null}
      {photoName ? (
        <p className={styles.muted} role="status">
          {t('shop.listing.photoAdded', { name: photoName })}
        </p>
      ) : null}
      {photo ? <img className={styles.photo} src={photo.dataUrl} alt={title || t('shop.listing.capture')} /> : null}
      {suggestions ? (
        <div className={styles.alert}>
          <Icon name="sparkle" size={18} />
          <span>{t('shop.listing.suggested')}</span>
        </div>
      ) : null}

      <Input
        label={t('shop.listing.name')}
        value={title}
        required
        onChange={(event) => setTitle(event.target.value)}
      />
      <div className={styles.grid}>
        <Select
          label={t('shop.listing.category')}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          options={SHOP_CATEGORIES.map((value) => ({
            value,
            label: t(`shop.category.${value}` as TranslationKey),
          }))}
        />
        <Input label={t('shop.listing.colour')} value={colour} onChange={(event) => setColour(event.target.value)} />
        <Input label={t('shop.listing.fabric')} value={fabric} onChange={(event) => setFabric(event.target.value)} />
      </div>
      {suggestions ? <p className={styles.muted}>{t('shop.listing.review')}</p> : null}

      <fieldset className={styles.stack}>
        <legend className={styles.muted}>{t('shop.listing.quickSizes')}</legend>
        <div className={styles.chips}>
          {SIZES.map((size) => (
            <Chip
              key={size}
              selected={sizes.some((entry) => entry.size === size)}
              onClick={() => toggleSize(size)}
            >
              {size}
            </Chip>
          ))}
        </div>
      </fieldset>
      <div className={styles.stack}>
        <p className={styles.muted}>{t('shop.listing.sizes')}</p>
        {sizes.length === 0 ? <p className={styles.muted}>{t('shop.listing.quickSizes')}</p> : null}
        {sizes.map((entry) => (
          <div className={styles.row} key={entry.size}>
            <strong>{entry.size}</strong>
            <QuantityStepper
              value={entry.qty}
              min={0}
              max={99}
              label={t('shop.listing.qty', { size: entry.size })}
              onChange={(value) => setQty(entry.size, value)}
            />
          </div>
        ))}
      </div>

      <Input
        label={t('shop.listing.price')}
        type="number"
        min={1}
        inputMode="numeric"
        value={rupees}
        hint={t('shop.listing.priceHint')}
        onChange={(event) => setRupees(event.target.value)}
      />
      {error ? <p className={styles.alertWarning} role="alert">{error}</p> : null}
      <div className={styles.actions}>
        <Button type="submit" size="lg" loading={busy}>
          {busy ? t('shop.listing.saving') : t('shop.listing.save')}
        </Button>
      </div>
    </form>
  );
}
