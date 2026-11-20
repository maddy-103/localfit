import { Icon } from '@/components/icons/Icon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useI18n } from '@/i18n';
import styles from '@/routes/rider/rider.module.css';

export interface CaptureFieldProps {
  mode: 'photo' | 'scan';
  label: string;
  hint?: string;
  value: string;
  placeholderValue: string;
  onChange: (value: string) => void;
}

/** Camera placeholder plus code entry; a real upload replaces the mock id. */
export function CaptureField({
  mode,
  label,
  hint,
  value,
  placeholderValue,
  onChange,
}: CaptureFieldProps) {
  const { t } = useI18n();

  if (mode === 'scan') {
    return (
      <div className={styles.stack}>
        <Input
          label={label}
          hint={hint ?? t('rider.task.scanHint')}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="off"
        />
        <Button variant="outline" leftIcon="camera" onClick={() => onChange(placeholderValue)}>
          {t('rider.task.scanCamera')}
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.stack}>
      <p className={styles.eyebrow}>{label}</p>
      <div className={styles.photo}>
        <Icon name="camera" size={28} />
        <span className={styles.muted}>{value || hint || t('rider.task.photoHint')}</span>
      </div>
      <Button variant="outline" leftIcon="camera" onClick={() => onChange(placeholderValue)}>
        {t('rider.task.photoLabel')}
      </Button>
    </div>
  );
}
