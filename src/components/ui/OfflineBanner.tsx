import { Icon } from '../icons/Icon';
import { useI18n } from '@/i18n';
import { formatTime } from '@/lib/format';
import styles from './surfaces.module.css';

export interface OfflineBannerProps {
  lastUpdated?: string | number;
}

export function OfflineBanner({ lastUpdated }: OfflineBannerProps) {
  const { t } = useI18n();

  return (
    <div className={styles.offlineBanner} role="status">
      <Icon name="wifi-off" size={18} />
      <span>{t('offline.banner')}</span>
      {lastUpdated ? (
        <span>
          {t('offline.updated', {
            time: formatTime(lastUpdated),
          })}
        </span>
      ) : null}
    </div>
  );
}
