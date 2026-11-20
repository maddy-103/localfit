import type { DisputeCase } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { Img } from '@/components/ui/Img';
import { Sheet } from '@/components/ui/Sheet';
import { useI18n } from '@/i18n';
import { formatDateTime, formatPaise } from '@/lib/format';
import styles from './admin.module.css';

interface DisputeEvidenceSheetProps {
  caseItem: DisputeCase | null;
  canDecide: boolean;
  onClose: () => void;
  onDecide: (caseItem: DisputeCase) => void;
}

/** Evidence panel shared by the table row and the row-activation gesture. */
export function DisputeEvidenceSheet({
  caseItem,
  canDecide,
  onClose,
  onDecide,
}: DisputeEvidenceSheetProps) {
  const { t } = useI18n();

  return (
    <Sheet open={caseItem !== null} onClose={onClose} title={t('admin.disputes.evidenceTitle')}>
      {caseItem ? (
        <div className={styles.stack}>
          <p className={styles.strong}>{caseItem.reason}</p>
          <p className={styles.muted}>
            {caseItem.id} · {caseItem.orderId} · {formatPaise(caseItem.valuePaise)}
          </p>
          {caseItem.evidence ? (
            <>
              <div className={styles.evidenceGrid}>
                {caseItem.evidence.photos.map((photo) => (
                  <div className={styles.photo} key={photo.alt}>
                    <Img image={photo} />
                  </div>
                ))}
              </div>
              <p className={styles.muted}>
                {t('admin.disputes.gps')}: {caseItem.evidence.gps?.lat ?? t('admin.none')},{' '}
                {caseItem.evidence.gps?.lng ?? t('admin.none')}
              </p>
              <p className={styles.muted}>
                {t('admin.disputes.otpAttempts')}: {caseItem.evidence.otpAttempts}
              </p>
              <p className={styles.muted}>
                {t('admin.disputes.checkedAt')}: {formatDateTime(caseItem.evidence.checkedAt)}
              </p>
              <h3 className={styles.panelTitle}>{t('admin.disputes.events')}</h3>
              <ol className={styles.timeline}>
                {caseItem.evidence.events.map((event) => (
                  <li className={styles.timelineItem} key={event.id}>
                    <span className={styles.timelineDot} aria-hidden="true" />
                    <div className={styles.timelineBody}>
                      <span className={styles.strong}>
                        {event.from} → {event.to}
                      </span>
                      <span className={styles.muted}>
                        {formatDateTime(event.timestamp)} · {event.actor.role}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <p className={styles.notice}>{t('admin.disputes.restricted')}</p>
          )}
          {canDecide && caseItem.status !== 'decided' ? (
            <Button fullWidth onClick={() => onDecide(caseItem)}>
              {t('admin.disputes.decide')}
            </Button>
          ) : null}
        </div>
      ) : null}
    </Sheet>
  );
}
