import type { Address, CheckoutGroup } from '@/api/types';
import { Icon } from '@/components/icons/Icon';
import { useI18n } from '@/i18n';
import { insideServiceArea } from '@/domain/locationPolicy';
import { distanceKm } from '@/domain/locationPolicy';
import { formatEta, formatPaise } from '@/lib/format';
import flow from './flow.module.css';

export function CheckoutGroupCard({
  group,
  address,
}: {
  group: CheckoutGroup;
  address: Address | null;
}) {
  const { t } = useI18n();
  const inside = address ? insideServiceArea(address, group.shop) : false;
  const away = address ? distanceKm(address, group.shop) : 0;

  return (
    <section className={flow.card} aria-labelledby={`checkout-shop-${group.shop.id}`}>
      <div className={flow.groupHead}>
        <div>
          <h2 className={flow.cardTitle} id={`checkout-shop-${group.shop.id}`}>
            {group.shop.name}
          </h2>
          <p className={flow.hint}>
            {group.kind === 'try_at_door' ? t('bag.tryAtDoor') : t('checkout.standardEta', { window: formatEta(...group.etaMin) })}
          </p>
        </div>
        <span className={flow.badge}>{t('bag.eta', { window: formatEta(...group.etaMin) })}</span>
      </div>

      {address ? (
        <p className={inside ? flow.hint : flow.notice}>
          <Icon name={inside ? 'check-circle' : 'alert'} size={18} />
          {inside ? t('checkout.insideArea') : t('checkout.outsideArea')}
          {' · '}
          {t('checkout.areaDetail', {
            shop: group.shop.name,
            distance: `${away} km`,
            radius: `${group.shop.serviceRadiusKm} km`,
          })}
        </p>
      ) : (
        <p className={flow.hint}>{t('checkout.noAddress')}</p>
      )}

      <ul className={flow.lineList}>
        {group.lines.map((line) => {
          const product = group.products.find((entry) => entry.id === line.productId);
          const variant = product?.variants.find((entry) => entry.id === line.variantId);
          return (
            <li className={flow.summaryRow} key={line.id}>
              <span>
                {product?.title ?? line.productId}
                <span className={flow.hint}>
                  {' · '}
                  {t('bag.lineSize', { size: variant?.size ?? '—', colour: variant?.colour ?? '—' })}
                  {line.tryAtDoor ? ` · ${t('bag.tryAtDoor')}` : ''}
                </span>
              </span>
              <strong>{formatPaise((variant?.pricePaise ?? 0) * line.qty)}</strong>
            </li>
          );
        })}
      </ul>
      <div className={flow.summaryRow}>
        <span>{t('bag.delivery')}</span>
        <strong>{formatPaise(group.deliveryFeePaise)}</strong>
      </div>
      <div className={`${flow.summaryRow} ${flow.summaryTotal}`}>
        <span>{t('bag.total')}</span>
        <strong>{formatPaise(group.totalPaise)}</strong>
      </div>
    </section>
  );
}
