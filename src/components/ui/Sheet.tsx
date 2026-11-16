import { useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from './IconButton';
import { useFocusTrap, useScrollLock } from '@/lib/focusTrap';
import { useI18n } from '@/i18n';
import styles from './surfaces.module.css';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Bottom sheet on mobile, side drawer on desktop. Focus is trapped, Escape
 * closes it, and the page behind it does not scroll.
 */
export function Sheet({ open, onClose, title, children, footer }: SheetProps) {
  const { t } = useI18n();
  const titleId = useId();
  const trapRef = useFocusTrap<HTMLDivElement>(open, onClose);
  useScrollLock(open);

  if (!open) return null;

  return createPortal(
    <>
      <div className={styles.overlay} onClick={onClose} aria-hidden="true" />
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={trapRef}
        tabIndex={-1}
      >
        <div className={styles.sheetHeader}>
          <h2 className={styles.sheetTitle} id={titleId}>
            {title}
          </h2>
          <IconButton icon="close" label={t('common.close')} onClick={onClose} />
        </div>
        <div className={styles.sheetBody}>{children}</div>
        {footer ? <div className={styles.sheetFooter}>{footer}</div> : null}
      </div>
    </>,
    document.body,
  );
}
