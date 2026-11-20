import { StatusChip, type StatusTone } from '@/components/ui/StatusChip';
import { useI18n } from '@/i18n';
import type { TranslationKey } from '@/i18n';
import type { OrderLine } from '@/api/types';
import styles from '@/routes/rider/rider.module.css';

const DECISION = {
  keep: { key: 'rider.task.decision.keep', tone: 'success' },
  return: { key: 'rider.task.decision.return', tone: 'warning' },
  pending: { key: 'rider.task.decision.pending', tone: 'pending' },
} as const satisfies Record<string, { key: TranslationKey; tone: StatusTone }>;

function decisionFor(value: string | null | undefined) {
  return value === 'keep' || value === 'return' ? DECISION[value] : DECISION.pending;
}

/** Status is always icon + text + colour (NFR-06), including decisions. */
export function DecisionList({ lines }: { lines: OrderLine[] }) {
  const { t } = useI18n();
  return (
    <ul className={styles.list}>
      {lines.map((line, index) => {
        const decision = decisionFor(line.decision);
        return (
          <li className={styles.listItem} key={line.id}>
            <span className={styles.place}>
              {t('rider.task.order', { id: line.variantId })} · {index + 1}
            </span>
            <StatusChip tone={decision.tone} label={t(decision.key)} />
          </li>
        );
      })}
    </ul>
  );
}
