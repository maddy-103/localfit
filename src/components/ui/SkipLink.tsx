import { useI18n } from '@/i18n';
import styles from './chrome.module.css';

export interface SkipLinkProps {
  /** Id of the main landmark. */
  targetId?: string;
}

/** First focusable element on every page. Visible only while focused. */
export function SkipLink({ targetId = 'main' }: SkipLinkProps) {
  const { t } = useI18n();

  return (
    <a className={styles.skipLink} href={`#${targetId}`}>
      {t('a11y.skipToContent')}
    </a>
  );
}
