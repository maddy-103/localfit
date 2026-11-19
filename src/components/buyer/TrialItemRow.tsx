import { useState } from 'react';
import type { Order, OrderLine, Product } from '@/api/types';
import type { TrialDecision } from '@/domain/trial';
import { Img } from '@/components/ui/Img';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useI18n } from '@/i18n';
import { formatPaise } from '@/lib/format';
import flow from './flow.module.css';

export interface TrialItemRowProps {
  line: OrderLine;
  product: Product;
  order: Order;
  busy: boolean;
  onDecision: (decision: TrialDecision) => void;
  onSwap: (variantId: string) => void;
}

export function TrialItemRow({
  line,
  product,
  order,
  busy,
  onDecision,
  onSwap,
}: TrialItemRowProps) {
  const { t } = useI18n();
  const [variantId, setVariantId] = useState('');
  const variant = product.variants.find((entry) => entry.id === line.variantId);
  const image = product.images[0];
  const swaps = order.swapRequests.filter((swap) => swap.lineId === line.id);
  const sizes = product.variants.filter(
    (entry) => entry.id !== line.variantId && entry.quantity - entry.reservedQuantity > 0,
  );

  return (
    <li className={flow.trialItem}>
      <div className={flow.lineTop}>
        <div className={flow.line}>
          {image ? <Img image={image} className={flow.lineThumb} sizes="88px" /> : <div className={flow.lineThumb} />}
          <div className={flow.stack}>
            <strong>{product.title}</strong>
            <span className={flow.hint}>
              {t('trial.itemSummary', { size: variant?.size ?? '—', colour: variant?.colour ?? '—' })}
            </span>
            <strong>{formatPaise(line.pricePaise * line.qty)}</strong>
          </div>
        </div>
        <span className={flow.badge}>
          {t(
            line.decision === 'keep'
              ? 'trial.markedKeep'
              : line.decision === 'return'
                ? 'trial.markedReturn'
                : 'trial.notMarked',
          )}
        </span>
      </div>

      <div className={flow.segmented} role="group" aria-label={product.title}>
        <button
          type="button"
          className={`${flow.segment} ${line.decision === 'keep' ? flow.segmentActive : ''}`}
          aria-pressed={line.decision === 'keep'}
          disabled={busy}
          onClick={() => onDecision('keep')}
        >
          {t('trial.keep')}
        </button>
        <button
          type="button"
          className={`${flow.segment} ${line.decision === 'return' ? flow.segmentActive : ''}`}
          aria-pressed={line.decision === 'return'}
          disabled={busy}
          onClick={() => onDecision('return')}
        >
          {t('trial.return')}
        </button>
      </div>

      {sizes.length && order.state === 'TRIAL_ACTIVE' ? (
        <div className={flow.swapRow}>
          <Select
            label={t('trial.swapLabel', { item: product.title })}
            value={variantId}
            onChange={(event) => setVariantId(event.target.value)}
            options={sizes.map((entry) => ({ value: entry.id, label: entry.size }))}
            placeholder={t('product.selectSize')}
          />
          <Button
            variant="outline"
            disabled={!variantId || busy}
            loading={busy}
            onClick={() => onSwap(variantId)}
          >
            {t('trial.swapButton')}
          </Button>
        </div>
      ) : null}

      {swaps.map((swap) => (
        <p className={flow.hint} key={swap.id}>
          {t('trial.swapRequested', {
            size: product.variants.find((entry) => entry.id === swap.toVariantId)?.size ?? '—',
          })}
          {swap.status === 'confirmed' ? ` · ${t('trial.swapPending')}` : ''}
        </p>
      ))}
    </li>
  );
}
