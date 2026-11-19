import type { SizeGuideRow } from '@/api/types';
import { Sheet } from '@/components/ui/Sheet';
import { useI18n } from '@/i18n';
import styles from './flow.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  rows: SizeGuideRow[];
}

export function SizeGuideSheet({ open, onClose, rows }: Props) {
  const { t } = useI18n();

  return (
    <Sheet open={open} onClose={onClose} title={t('product.sizeGuideTitle')}>
      <p className={styles.hint}>{t('product.sizeGuideHint')}</p>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">{t('product.size')}</th>
            <th scope="col">{t('product.chest')}</th>
            <th scope="col">{t('product.waist')}</th>
            <th scope="col">{t('product.length')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.size}>
              <th scope="row">{row.size}</th>
              <td>{row.chestCm ?? '—'}</td>
              <td>{row.waistCm ?? '—'}</td>
              <td>{row.lengthCm ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Sheet>
  );
}
