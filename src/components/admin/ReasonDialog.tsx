import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { useI18n } from '@/i18n';
import styles from './admin.module.css';

export interface ReasonDialogProps {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  busy?: boolean;
  /** Optional fields (selectors) rendered above the reason box. */
  extra?: React.ReactNode;
  onClose: () => void;
  /** Called only with a non-empty, trimmed reason (ADM-04). */
  onConfirm: (reason: string) => void;
}

/**
 * Every money/order/staff action goes through this dialog so a reason exists.
 * The inner form mounts only while open, so stale reasons cannot leak between
 * successive actions.
 */
export function ReasonDialog(props: ReasonDialogProps) {
  if (!props.open) return null;
  return <ReasonDialogForm {...props} />;
}

function ReasonDialogForm({
  title,
  message,
  confirmLabel,
  busy = false,
  extra,
  onClose,
  onConfirm,
}: ReasonDialogProps) {
  const { t } = useI18n();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError(t('admin.reason.required'));
      return;
    }
    setError(null);
    onConfirm(trimmed);
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            {t('common.cancel')}
          </Button>
          <Button onClick={submit} loading={busy} disabled={busy}>
            {confirmLabel ?? t('common.confirm')}
          </Button>
        </>
      }
    >
      {message ? <p className={styles.reasonHelp}>{message}</p> : null}
      {extra}
      <Textarea
        label={t('admin.reason.label')}
        hint={t('admin.reason.hint')}
        value={reason}
        error={error ?? undefined}
        rows={3}
        onChange={(event) => setReason(event.target.value)}
      />
    </Dialog>
  );
}
