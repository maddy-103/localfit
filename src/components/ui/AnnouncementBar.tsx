import { useState } from 'react';
import { IconButton } from './IconButton';
import { useI18n } from '@/i18n';
import styles from './chrome.module.css';

const DISMISS_KEY = 'lf:announcement-dismissed';

export interface AnnouncementBarProps {
  text: string;
  ctaLabel?: string;
  ctaHref?: string;
  /** Disable the session-level dismissal, e.g. on the style page. */
  dismissible?: boolean;
}

/** Black announcement strip. A dismissal is remembered for the session. */
export function AnnouncementBar({
  text,
  ctaLabel,
  ctaHref = '/register',
  dismissible = true,
}: AnnouncementBarProps) {
  const { t } = useI18n();
  const [dismissed, setDismissed] = useState(() => {
    if (!dismissible) return false;
    try {
      return window.sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      // Session storage can be unavailable in private modes.
      return false;
    }
  });

  if (dismissed) return null;

  const close = () => {
    setDismissed(true);
    try {
      window.sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Dismissal still works for this render.
    }
  };

  return (
    <div className={styles.announcementWrap}>
      <div className={styles.announcement}>
        <div className={styles.announcementInner}>
          <span>{text}</span>
          {ctaLabel ? (
            <a className={styles.announcementLink} href={ctaHref}>
              {ctaLabel}
            </a>
          ) : null}
        </div>
      </div>
      {dismissible ? (
        <IconButton
          className={styles.announcementClose}
          icon="close"
          label={t('announcement.close')}
          size={16}
          onClick={close}
        />
      ) : null}
    </div>
  );
}
