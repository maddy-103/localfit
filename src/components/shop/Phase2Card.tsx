import { Icon, type IconName } from '@/components/icons/Icon';
import { useI18n } from '@/i18n';
import styles from '@/routes/shop/shop.module.css';

/** Placeholder card for S/L requirements; no fake behaviour behind it. */
export function Phase2Card({ label, icon = 'chart' }: { label: string; icon?: IconName }) {
  const { t } = useI18n();
  return (
    <div className={styles.tile}>
      <Icon name={icon} size={24} />
      <p className={styles.rowMain}>{label}</p>
      <p className={styles.muted}>{t('phase2.label')}</p>
    </div>
  );
}
