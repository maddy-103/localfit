import { useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from './IconButton';
import { useFocusTrap, useScrollLock } from '@/lib/focusTrap';
import { useI18n } from '@/i18n';
import styles from './surfaces.module.css';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Dialog({ open, onClose, title, children, footer }: DialogProps) {
  const { t } = useI18n();
  const titleId = useId();
  const trapRef = useFocusTrap<HTMLDivElement>(open, onClose);
  useScrollLock(open);

  if (!open) return null;

  return createPortal(
    <>
      <div className={styles.overlay} onClick={onClose} aria-hidden="true" />
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={trapRef}
        tabIndex={-1}
      >
        <div className={styles.dialogHeader}>
          <h2 className={styles.dialogTitle} id={titleId}>
            {title}
          </h2>
          <IconButton icon="close" label={t('common.close')} onClick={onClose} />
        </div>
        <div className={styles.dialogBody}>{children}</div>
        {footer ? <div className={styles.dialogFooter}>{footer}</div> : null}
      </div>
    </>,
    document.body,
  );
}
