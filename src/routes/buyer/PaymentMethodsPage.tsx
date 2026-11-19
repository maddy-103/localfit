import { api } from '@/api/client';
import { useI18n } from '@/i18n';
import { Icon } from '@/components/icons/Icon';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAsync } from '@/lib/useAsync';
import styles from '@/components/buyer/pages.module.css';

/** Saved gateway tokens only; no card number reaches the client (NFR-11). */
export default function PaymentMethodsPage() {
  const { t } = useI18n();
  const { data, error, loading, reload } = useAsync(() => api.listPaymentMethods(), 'payment-methods');

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Breadcrumb items={[{ label: t('profile.title'), to: '/profile' }, { label: t('payments.title') }]} />
        <h1 className={styles.heading}>{t('payments.title')}</h1>
        <p className={styles.intro}>{t('payments.note')}</p>

        {loading && !data ? (
          <div aria-busy="true"><Skeleton variant="card" count={3} /></div>
        ) : error || !data ? (
          <ErrorState message={error ?? t('common.error')} onRetry={reload} />
        ) : (
          <div className={`${styles.col} ${styles.sectionGrid}`}>
            {data.map((method) => (
              <article key={method.id} className={styles.card}>
                <div className={styles.orderMeta}>
                  <span className={styles.row}>
                    <Icon name={method.brand === 'card' ? 'wallet' : method.brand === 'upi' ? 'phone' : 'shield'} size={20} />
                    <span className={styles.bold}>{method.label}</span>
                  </span>
                  {method.isDefault ? <span className={styles.pill}>{t('addresses.defaultBadge')}</span> : null}
                </div>
                <p className={styles.small}>{t('payments.token')}: {method.token}</p>
              </article>
            ))}
          </div>
        )}

        <div className={styles.actions}>
          <Button variant="outline" disabled>{t('payments.addNew')}</Button>
          <p className={styles.note}>{t('payments.addNewHelp')}</p>
        </div>
      </div>
    </main>
  );
}
