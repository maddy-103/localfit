import { useMemo } from 'react';
import { useI18n } from '@/i18n';
import { now } from '@/lib/clock';
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  OfflineBanner,
  ProgressBar,
  Skeleton,
  StatusChip,
  Timer,
  useToast,
} from '@/components/ui';
import type { StatusTone } from '@/components/ui';
import { StyleSection } from './StyleSection';
import styles from './style.module.css';

const TONES: StatusTone[] = ['success', 'warning', 'error', 'info', 'pending'];

export function FeedbackSection() {
  const { t } = useI18n();
  const { toast } = useToast();
  const at = useMemo(() => now(), []);
  const tenMinutes = at + 10 * 60 * 1000;
  const urgent = at + 90 * 1000;

  return (
    <>
      <StyleSection title={t('style.status')}>
        <div className={styles.row}>
          {TONES.map((tone) => (
            <StatusChip key={tone} tone={tone} label={t(`state.${tone}`)} />
          ))}
        </div>
      </StyleSection>

      <StyleSection title={t('style.timer')}>
        <div className={styles.row}>
          <Timer endsAt={tenMinutes} label={t('style.timerLabel')} />
          <Timer endsAt={urgent} label={t('style.timerLabel')} />
          <Timer endsAt={at - 1000} label={t('style.timerLabel')} />
        </div>
      </StyleSection>

      <StyleSection title={t('style.progress')}>
        <div className={styles.stack}>
          <ProgressBar value={64} label={t('style.progressLabel')} showValue />
          <ProgressBar value={0} label={t('style.progressLabel')} />
          <ProgressBar value={100} max={100} label={t('style.progressLabel')} showValue />
        </div>
      </StyleSection>

      <StyleSection title={t('style.toasts')}>
        <div className={styles.row}>
          <Button onClick={() => toast(t('style.toastMessage'))} leftIcon="check-circle">
            {t('style.showToast')}
          </Button>
          <Badge count={3} label={`${t('nav.bag')}: 3`} />
          <Badge count={120} max={99} />
          <Badge count={0} showZero />
          <Avatar name={t('style.avatarName')} />
          <Avatar name={t('style.avatarName')} size="lg" />
        </div>
      </StyleSection>

      <StyleSection title={t('style.avatars')}>
        <div className={styles.columns}>
          <EmptyState
            title={t('style.emptyTitle')}
            body={t('style.emptyBody')}
            icon="box"
            action={<Button variant="outline">{t('common.viewAll')}</Button>}
          />
          <ErrorState
            title={t('style.errorTitle')}
            message={t('style.errorBody')}
            onRetry={() => undefined}
          />
        </div>
      </StyleSection>

      <StyleSection title={t('style.skeleton')}>
        <div className={styles.columns}>
          <div className={styles.stack}>
            <Skeleton variant="card" />
            <Skeleton variant="row" count={2} />
          </div>
          <div className={styles.stack}>
            <Skeleton variant="line" width="80%" />
            <Skeleton variant="line" width="55%" />
            <Skeleton variant="image" height={180} />
          </div>
        </div>
      </StyleSection>

      <StyleSection title={t('style.offline')}>
        <OfflineBanner lastUpdated={at} />
      </StyleSection>
    </>
  );
}
