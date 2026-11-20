import { api } from '@/api/client';
import { ShopStates } from '@/components/shop/ShopStates';
import { Phase2Card } from '@/components/shop/Phase2Card';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useI18n } from '@/i18n';
import { formatDateTime, formatPaise } from '@/lib/format';
import { useAsync, useOnline } from '@/lib/useAsync';
import { settlementCsv } from '@/domain/settlements';
import styles from './shop.module.css';

export default function PayoutsPage() {
  const { t } = useI18n();
  const online = useOnline();
  const report = useAsync(() => api.getSettlementReport(), 'shop-payouts');

  const { reload } = report;

  const download = () => {
    if (!report.data) return;
    const blob = new Blob([settlementCsv(report.data)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `localfit-settlement-${report.data.shopId}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const data = report.data;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('shop.payouts.title')}</h1>
        {data ? (
          <p className={styles.intro}>
            {t('shop.payouts.intro', {
              from: formatDateTime(data.from),
              to: formatDateTime(data.to),
              date: formatDateTime(data.payoutDate),
            })}
          </p>
        ) : null}
      </header>

      <ShopStates
        loading={report.loading}
        error={report.error}
        offline={!online}
        lastUpdated={report.lastUpdated}
        onRetry={reload}
      >
        {data ? (
          <div className={styles.stack}>
            <div className={styles.grid}>
              <Card padded>
                <span className={styles.statValue}>{formatPaise(data.salesPaise)}</span>
                <span className={styles.muted}>{t('shop.payouts.sales')}</span>
              </Card>
              <Card padded>
                <span className={styles.statValue}>{formatPaise(data.returnsPaise)}</span>
                <span className={styles.muted}>{t('shop.payouts.returns')}</span>
              </Card>
              <Card padded>
                <span className={styles.statValue}>{formatPaise(data.deductionsPaise)}</span>
                <span className={styles.muted}>{t('shop.payouts.deductions')}</span>
              </Card>
              <Card padded>
                <span className={styles.statValue}>{formatPaise(data.netPaise)}</span>
                <span className={styles.muted}>{t('shop.payouts.net')}</span>
              </Card>
            </div>

            <div className={styles.row}>
              <div className={styles.rowMain}>
                <span className={styles.muted}>{t('shop.payouts.cycle')}</span>
                <strong>{data.cycle}</strong>
                <span className={styles.muted}>{t('shop.payouts.payoutDate')}</span>
                <strong>{formatDateTime(data.payoutDate)}</strong>
              </div>
              <div className={styles.actions}>
                <Button size="lg" leftIcon="file" onClick={download} disabled={data.lines.length === 0}>
                  {t('shop.payouts.download')}
                </Button>
              </div>
            </div>

            <Card padded>
              <ul className={styles.list}>
                {data.lines.length === 0 ? (
                  <li className={styles.muted}>{t('shop.payouts.empty')}</li>
                ) : null}
                {data.lines.map((line) => (
                  <li className={styles.listItem} key={line.orderId}>
                    <div className={styles.rowMain}>
                      <strong>{t('shop.payouts.order', { id: line.orderId })}</strong>
                      <span className={styles.muted}>{formatDateTime(line.createdAt)}</span>
                      <span className={styles.muted}>
                        {t('shop.payouts.gross')}: {formatPaise(line.grossPaise)}
                        {' · '}
                        {t('shop.payouts.held')}: {formatPaise(line.heldPaise)}
                      </span>
                    </div>
                    <span className={styles.price}>{formatPaise(line.netPaise)}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Phase2Card label={t('shop.payouts.bookkeeping')} icon="file" />
          </div>
        ) : null}
      </ShopStates>
    </div>
  );
}
