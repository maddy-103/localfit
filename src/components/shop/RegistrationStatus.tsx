import { Link } from 'react-router-dom';
import type { RegistrationStage, ShopRegistration } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/icons/Icon';
import { StatusChip, type StatusTone } from '@/components/ui/StatusChip';
import { useI18n, type TranslationKey } from '@/i18n';
import { formatDateTime } from '@/lib/format';
import styles from '@/routes/shop/shop.module.css';

const STAGES: RegistrationStage[] = [
  'submitted',
  'correction_needed',
  'sample_visit_scheduled',
  'approved',
];
const TONES: Record<RegistrationStage, StatusTone> = {
  not_started: 'pending',
  submitted: 'info',
  correction_needed: 'warning',
  sample_visit_scheduled: 'pending',
  approved: 'success',
  rejected: 'error',
};

export function RegistrationStatus({ registration }: { registration: ShopRegistration | null }) {
  const { t } = useI18n();

  if (!registration) {
    return (
      <div className={styles.stack}>
        <p className={styles.muted}>{t('register.noRegistration')}</p>
        <div className={styles.actions}>
          <Link to="/register/shop">
            <Button size="lg">{t('register.start')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const tone = TONES[registration.stage];
  const approved = registration.stage === 'approved';

  return (
    <div className={styles.stack}>
      <Card padded>
        <StatusChip tone={tone} label={t(`register.stage.${registration.stage}` as TranslationKey)} />
        {registration.submittedAt ? (
          <p className={styles.muted}>{formatDateTime(registration.submittedAt)}</p>
        ) : null}
        {registration.note ? (
          <p className={styles.muted}>
            {t('register.note')}: {registration.note}
          </p>
        ) : null}
        <p className={styles.muted}>
          {registration.stage === 'correction_needed'
            ? t('register.correctionHint')
            : approved
              ? t('register.approvedHint')
              : t('register.statusIntro')}
        </p>
        {!approved ? <p className={styles.muted}>{t('register.locked')}</p> : null}
        <div className={styles.actions}>
          {approved ? (
            <Link to="/shop">
              <Button size="lg">{t('register.openConsole')}</Button>
            </Link>
          ) : (
            <Link to="/register/shop">
              <Button size="lg" variant="outline">{t('register.editDetails')}</Button>
            </Link>
          )}
        </div>
      </Card>

      <ol className={styles.list}>
        {STAGES.map((stage, index) => {
          const done =
            stage === registration.stage ||
            (registration.stage === 'approved' && index < STAGES.length) ||
            (registration.stage === 'sample_visit_scheduled' && index === 0);
          return (
            <li className={styles.listItem} key={stage}>
              <span className={styles.rowMain}>
                <Icon name={done ? 'check-circle' : 'clock'} size={18} />
                {t(`register.stage.${stage}` as TranslationKey)}
              </span>
              <StatusChip
                tone={done ? 'success' : 'pending'}
                label={done ? t('common.confirm') : t('register.stage.not_started')}
              />
            </li>
          );
        })}
      </ol>
    </div>
  );
}
