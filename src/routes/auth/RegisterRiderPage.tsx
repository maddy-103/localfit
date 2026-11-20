import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import type { RiderDocument, RiderDocumentKind, SelfieMatchResult } from '@/api/types';
import { Icon } from '@/components/icons/Icon';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { StatusChip } from '@/components/ui/StatusChip';
import { RiderActionBar } from '@/components/rider/RiderActionBar';
import { useI18n } from '@/i18n';
import type { TranslationKey } from '@/i18n';
import styles from '@/routes/rider/rider.module.css';

const DOC_KEYS: Record<RiderDocumentKind, TranslationKey> = {
  idProof: 'regRider.idProof',
  licence: 'regRider.licence',
  selfie: 'regRider.selfie',
};

const EMPTY_DOCS: Record<RiderDocumentKind, RiderDocument | null> = {
  idProof: null,
  licence: null,
  selfie: null,
};

/** AUTH-05: documents, a mock selfie match and vehicle details. */
export default function RegisterRiderPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [vehicleType, setVehicleType] = useState<'bike' | 'scooter' | 'cycle'>('scooter');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [documents, setDocuments] = useState(EMPTY_DOCS);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [match, setMatch] = useState<SelfieMatchResult | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const setDoc = (kind: RiderDocumentKind, file: File | null) => {
    setDocuments((previous) => ({
      ...previous,
      [kind]: file ? { name: file.name, type: file.type, size: file.size } : null,
    }));
  };

  const runMatch = async () => {
    const result = await api.matchRiderSelfie(documents.selfie?.name ?? 'selfie.jpg');
    setMatch(result);
    setError('');
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!match?.matched) {
      setError(t('regRider.matchRequired'));
      return;
    }
    setBusy(true);
    try {
      await api.saveRiderRegistration({
        fullName,
        phone,
        city,
        vehicleType,
        vehicleNumber,
        documents,
        selfieMatched: match.matched,
      });
      navigate('/register/rider/status', { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>{t('nav.rider')}</p>
        <h1 className={styles.title}>{t('regRider.title')}</h1>
        <p className={styles.intro}>{t('regRider.intro')}</p>
      </div>

      <form className={styles.stack} onSubmit={(event) => void submit(event)} noValidate>
        <Input label={t('regRider.fullName')} value={fullName} required onChange={(e) => setFullName(e.target.value)} />
        <Input label={t('regRider.phone')} value={phone} inputMode="tel" required onChange={(e) => setPhone(e.target.value)} />
        <Input label={t('regRider.city')} value={city} required onChange={(e) => setCity(e.target.value)} />

        <h2 className={styles.taskTitle}>{t('regRider.vehicle')}</h2>
        <Select
          label={t('regRider.vehicleType')}
          value={vehicleType}
          onChange={(e) => setVehicleType(e.target.value as typeof vehicleType)}
          options={[
            { value: 'bike', label: t('regRider.vehicle.bike') },
            { value: 'scooter', label: t('regRider.vehicle.scooter') },
            { value: 'cycle', label: t('regRider.vehicle.cycle') },
          ]}
        />
        <Input label={t('regRider.vehicleNumber')} value={vehicleNumber} required onChange={(e) => setVehicleNumber(e.target.value)} />

        <h2 className={styles.taskTitle}>{t('regRider.documents')}</h2>
        <p className={styles.muted}>{t('regRider.uploadHint')}</p>
        {(['idProof', 'licence', 'selfie'] as const).map((kind) => (
          <Input
            key={kind}
            label={t(DOC_KEYS[kind])}
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setDoc(kind, e.target.files?.[0] ?? null)}
          />
        ))}

        <h2 className={styles.taskTitle}>{t('regRider.selfieStep')}</h2>
        <p className={styles.muted}>{t('regRider.selfieHint')}</p>
        <Button
          variant="outline"
          leftIcon="camera"
          onClick={() => {
            setCameraOpen(true);
            setDocuments((previous) => ({
              ...previous,
              selfie: previous.selfie ?? { name: 'selfie-mock.jpg', type: 'image/jpeg', size: 150_000 },
            }));
          }}
        >
          {t('regRider.openCamera')}
        </Button>
        {cameraOpen ? (
          <div className={styles.photo}>
            <Icon name="camera" size={28} />
            <span className={styles.muted}>{documents.selfie?.name}</span>
          </div>
        ) : null}
        <Button variant="outline" onClick={() => void runMatch()}>
          {t('regRider.matchSelfie')}
        </Button>
        {match?.matched ? (
          <StatusChip
            tone="success"
            label={t('regRider.matchResult', { score: Math.round(match.score * 100) })}
          />
        ) : null}
        {error ? <ErrorState message={error} /> : null}
        <RiderActionBar>
          <Button type="submit" size="lg" loading={busy} fullWidth>
            {t('regRider.submit')}
          </Button>
        </RiderActionBar>
      </form>
    </section>
  );
}
