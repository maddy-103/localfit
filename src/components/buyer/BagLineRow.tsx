import type { BagLine, Product } from '@/api/types';
import { Img } from '@/components/ui/Img';
import { IconButton } from '@/components/ui/IconButton';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { Toggle } from '@/components/ui/Toggle';
import { useI18n } from '@/i18n';
import { formatPaise } from '@/lib/format';
import flow from './flow.module.css';

export interface BagLineRowProps {
  line: BagLine;
  product: Product;
  onQuantity: (qty: number) => void;
  onTryAtDoor: (tryAtDoor: boolean) => void;
  onRemove: () => void;
  busy?: boolean;
}

export function BagLineRow({
  line,
  product,
  onQuantity,
  onTryAtDoor,
  onRemove,
  busy = false,
}: BagLineRowProps) {
  const { t } = useI18n();
  const variant = product.variants.find((entry) => entry.id === line.variantId);
  const image = product.images[0];

  return (
    <li className={flow.line}>
      {image ? <Img image={image} className={flow.lineThumb} sizes="88px" /> : <div className={flow.lineThumb} />}
      <div>
        <div className={flow.lineTop}>
          <div className={flow.stack}>
            <strong>{product.title}</strong>
            <span className={flow.hint}>
              {t('bag.lineSize', {
                size: variant?.size ?? '—',
                colour: variant?.colour ?? '—',
              })}
            </span>
            <strong>{formatPaise((variant?.pricePaise ?? 0) * line.qty)}</strong>
          </div>
          <IconButton
            icon="trash"
            label={t('bag.remove', { item: product.title })}
            onClick={onRemove}
            disabled={busy}
            className={flow.remove}
          />
        </div>
        <div className={flow.lineBottom}>
          <QuantityStepper
            value={line.qty}
            onChange={onQuantity}
            max={Math.max(1, (variant?.quantity ?? 1) - (variant?.reservedQuantity ?? 0) + line.qty)}
            disabled={busy}
            label={t('bag.quantityLabel', { item: product.title })}
          />
          {product.tryAtDoorEligible ? (
            <Toggle
              checked={line.tryAtDoor}
              onChange={onTryAtDoor}
              label={t('bag.tryAtDoor')}
              disabled={busy}
              id={`try-${line.id}`}
            />
          ) : null}
        </div>
      </div>
    </li>
  );
}
