import { useState } from 'react';
import { api } from '@/api/client';
import type { CounterSaleResultApi, Product, Variant } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { StatusChip } from '@/components/ui/StatusChip';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n';
import { formatPaise } from '@/lib/format';
import styles from '@/routes/shop/shop.module.css';

export function InventoryVariantRow({
  product,
  variant,
  onChanged,
  onResult,
}: {
  product: Product;
  variant: Variant;
  onChanged: () => void;
  onResult: (result: CounterSaleResultApi) => void;
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [quantity, setQuantity] = useState(String(variant.quantity));
  const [rupees, setRupees] = useState(String(variant.pricePaise / 100));
  const [busy, setBusy] = useState(false);
  const visible = variant.visible !== false;

  const save = async () => {
    const parsedQty = Number(quantity);
    const parsedPrice = Math.round(Number(rupees) * 100);
    if (!Number.isInteger(parsedQty) || parsedQty < 0 || !Number.isFinite(parsedPrice) || parsedPrice < 1) {
      toast(t('shop.inventory.edit'));
      return;
    }
    setBusy(true);
    try {
      await api.updateVariant(product.id, variant.id, {
        quantity: parsedQty,
        pricePaise: parsedPrice,
      });
      setEditing(false);
      onChanged();
    } catch (error) {
      toast(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const toggleVisibility = async () => {
    setBusy(true);
    try {
      await api.updateVariant(product.id, variant.id, { visible: !visible });
      onChanged();
    } catch (error) {
      toast(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const sell = async () => {
    setBusy(true);
    try {
      const result = await api.sellInShop(product.id, variant.id, 1);
      onResult(result);
      onChanged();
      if (!result.conflict) toast(t('shop.inventory.soldDone'));
    } catch (error) {
      toast(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card padded>
      <div className={styles.stack}>
        <div className={styles.row}>
          <div className={styles.rowMain}>
            <strong>{product.title}</strong>
            <span className={styles.muted}>
              {t('shop.inventory.variant', { size: variant.size, colour: variant.colour })}
            </span>
            <span className={styles.muted}>{t('shop.inventory.sku', { sku: variant.id })}</span>
          </div>
          <div className={styles.rowAside}>
            <StatusChip
              tone={variant.quantity <= 2 ? 'warning' : 'info'}
              label={
                variant.quantity <= 2
                  ? t('shop.inventory.low', { count: variant.quantity })
                  : t('shop.inventory.onHand')
              }
            />
            <span className={styles.price}>{formatPaise(variant.pricePaise)}</span>
          </div>
        </div>

        <div className={styles.list}>
          <div className={styles.listItem}>
            <span>{t('shop.inventory.onHand')}</span>
            <strong>{variant.quantity}</strong>
          </div>
          <div className={styles.listItem}>
            <span>{t('shop.inventory.reserved')}</span>
            <strong>{variant.reservedQuantity}</strong>
          </div>
        </div>

        {editing ? (
          <div className={styles.grid}>
            <Input
              label={t('shop.inventory.qtyLabel', {
                variant: `${product.title} ${variant.size}`,
              })}
              type="number"
              min={0}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
            <Input
              label={t('shop.inventory.priceLabel', {
                variant: `${product.title} ${variant.size}`,
              })}
              type="number"
              min={1}
              value={rupees}
              onChange={(event) => setRupees(event.target.value)}
            />
          </div>
        ) : null}

        <div className={styles.actions}>
          <Button size="lg" loading={busy} onClick={() => (editing ? void save() : setEditing(true))}>
            {editing ? t('shop.settings.save') : t('shop.inventory.edit')}
          </Button>
          <Button size="lg" variant="outline" disabled={busy} onClick={() => void toggleVisibility()}>
            {t(visible ? 'shop.inventory.hide' : 'shop.inventory.show')}
          </Button>
          <Button size="lg" destructive disabled={busy} onClick={() => void sell()}>
            {t('shop.inventory.sold')}
          </Button>
        </div>
        <p className={styles.muted}>{t('shop.inventory.soldHint')}</p>
      </div>
    </Card>
  );
}
