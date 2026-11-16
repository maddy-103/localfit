import { useLocation } from 'react-router-dom';
import type { TranslationKey } from '@/i18n';
import { useI18n } from '@/i18n';
import { Card } from './ui/Card';
import { StatusChip } from './ui/StatusChip';
import styles from './ScreenStub.module.css';

export interface ScreenStubProps {
  titleKey: TranslationKey;
  /** 2 for priority S and L screens that only get a placeholder. */
  phase?: 1 | 2;
}

/**
 * Honest phase 0 placeholder. It names the route and says when the screen is
 * built. No product behaviour is simulated behind it.
 */
export function ScreenStub({ titleKey, phase = 1 }: ScreenStubProps) {
  const { t } = useI18n();
  const location = useLocation();

  return (
    <section className={styles.page}>
      <p className={styles.eyebrow}>{t('app.name')}</p>
      <h1 className={styles.title}>{t(titleKey)}</h1>
      <Card className={styles.card} padded>
        <StatusChip
          tone={phase === 2 ? 'pending' : 'info'}
          label={phase === 2 ? t('stub.phase2') : t('stub.phase1')}
          icon={phase === 2 ? 'clock' : 'box'}
        />
        <p className={styles.note}>{t('stub.note')}</p>
        <p className={styles.path}>{location.pathname}</p>
      </Card>
    </section>
  );
}
