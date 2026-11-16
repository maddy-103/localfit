import { Link } from 'react-router-dom';
import { Icon } from '../icons/Icon';
import { useI18n } from '@/i18n';
import styles from './chrome.module.css';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export interface BreadcrumbProps {
  items: readonly BreadcrumbItem[];
  /** Override the default nav label when two breadcrumbs share a page. */
  label?: string;
}

export function Breadcrumb({ items, label }: BreadcrumbProps) {
  const { t } = useI18n();

  return (
    <nav className={styles.breadcrumb} aria-label={label ?? t('a11y.breadcrumb')}>
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className={styles.breadcrumbItem}>
            {item.to && !last ? (
              <Link className={styles.breadcrumbLink} to={item.to}>
                {item.label}
              </Link>
            ) : (
              <span className={styles.breadcrumbCurrent} aria-current={last ? 'page' : undefined}>
                {item.label}
              </span>
            )}
            {!last ? (
              <span className={styles.breadcrumbSep} aria-hidden="true">
                <Icon name="chevron-right" size={14} />
              </span>
            ) : null}
          </span>
        );
      })}
    </nav>
  );
}
