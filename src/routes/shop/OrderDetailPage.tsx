import { useEffect, useState, type ChangeEvent } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/api/client';
import { SHOP_ACTOR } from '@/components/shop/actor';
import { ShopStates } from '@/components/shop/ShopStates';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { StatusChip } from '@/components/ui/StatusChip';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n';
import { formatDateTime, formatPaise } from '@/lib/format';
import { useAsync, useOnline } from '@/lib/useAsync';
import styles from './shop.module.css';

export default function OrderDetailPage() {
  const { id = '' } = useParams();
  const { t } = useI18n();
  const { toast } = useToast();
  const online = useOnline();
  const [pickupOtp, setPickupOtp] = useState('');
  const [scanCode, setScanCode] = useState('');
  const [photoId, setPhotoId] = useState('');
  const [busy, setBusy] = useState(false);
  const orders = useAsync(() => api.listShopOrders(), `shop-order-${id}`);

  const { reload } = orders;
  useEffect(() => api.subscribe('orders', reload), [reload]);
  useEffect(() => api.subscribe(`order:${id}`, reload), [id, reload]);

  const order = (orders.data ?? []).find((entry) => entry.id === id) ?? null;

  const act = async (action: 'accept' | 'pack' | 'ready') => {
    setBusy(true);
    try {
      if (action === 'accept') await api.acceptOrder(id, SHOP_ACTOR);
      if (action === 'pack') await api.packOrder(id, SHOP_ACTOR);
      if (action === 'ready') await api.readyOrder(id, SHOP_ACTOR);
      reload();
    } catch (error) {
      toast(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const handover = async () => {
    setBusy(true);
    try {
      await api.handoverOrder(id, { pickupOtp, scanCode, photoId }, SHOP_ACTOR);
      setPickupOtp('');
      setScanCode('');
      setPhotoId('');
      toast(t('shop.order.handoverDone'));
      reload();
    } catch (error) {
      toast(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const takePhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setPhotoId(file.name);
  };

  const scanPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setScanCode(file.name.replace(/\.[^.]+$/, ''));
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('shop.order.title', { id })}</h1>
        {order ? (
          <div className={styles.rowAside}>
            <StatusChip tone="info" label={order.state} />
            <span className={styles.muted}>
              {t('shop.orders.placed', { date: formatDateTime(order.createdAt) })}
            </span>
          </div>
        ) : null}
      </header>

      <ShopStates
        loading={orders.loading}
        error={orders.error}
        empty={!order}
        emptyTitle={t('shop.orders.title')}
        emptyBody={t('shop.orders.empty')}
        offline={!online}
        lastUpdated={orders.lastUpdated}
        onRetry={reload}
      >
        {order ? (
          <div className={styles.stack}>
            <Card padded>
              <h2 className={styles.title}>{t('shop.order.items')}</h2>
              <ul className={styles.list}>
                {order.lines.map((line) => (
                  <li className={styles.listItem} key={line.id}>
                    <div className={styles.rowMain}>
                      <strong>{line.variantId}</strong>
                      <span className={styles.muted}>
                        {t('shop.orders.itemCount', { count: line.qty })}
                      </span>
                    </div>
                    <span className={styles.price}>{formatPaise(line.pricePaise * line.qty)}</span>
                  </li>
                ))}
              </ul>
              <p className={styles.muted}>{t('shop.order.customer', { id: order.buyerId })}</p>
              <span className={styles.price}>{formatPaise(order.itemsPaise)}</span>
            </Card>

            {order.state === 'PLACED' ? (
              <div className={styles.actions}>
                <Button size="lg" loading={busy} onClick={() => void act('accept')}>
                  {t('shop.dashboard.accept')}
                </Button>
              </div>
            ) : null}

            {order.state === 'SHOP_ACCEPTED' ? (
              <div className={styles.actions}>
                <Button size="lg" loading={busy} onClick={() => void act('pack')}>
                  {t('shop.order.pack')}
                </Button>
              </div>
            ) : null}

            {order.state === 'PACKED' ? (
              <Card padded>
                <div className={styles.stack}>
                  <p className={styles.muted}>{t('shop.order.readyNote')}</p>
                  <div className={styles.actions}>
                    <Button size="lg" loading={busy} onClick={() => void act('ready')}>
                      {t('shop.order.ready')}
                    </Button>
                  </div>
                </div>
              </Card>
            ) : null}

            {order.state === 'RIDER_ASSIGNED' ? (
              <Card padded>
                <div className={styles.stack}>
                  <h2 className={styles.title}>{t('shop.order.pickupTitle')}</h2>
                  <p className={styles.intro}>{t('shop.order.pickupIntro')}</p>
                  <Input
                    label={t('shop.order.pickupOtp')}
                    inputMode="numeric"
                    value={pickupOtp}
                    onChange={(event) => setPickupOtp(event.target.value)}
                  />
                  <div className={styles.stack}>
                    <p className={styles.muted}>{t('shop.order.scanHint')}</p>
                    <div className={styles.chips}>
                      {order.lines.map((line) => (
                        <Chip
                          key={line.id}
                          selected={scanCode === line.variantId}
                          onClick={() => setScanCode(line.variantId)}
                        >
                          {line.variantId}
                        </Chip>
                      ))}
                    </div>
                    <Input
                      label={t('shop.order.scanCode')}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      hint={t('shop.order.scanHint')}
                      onChange={scanPhoto}
                    />
                    <Input
                      label={t('shop.order.scanCode')}
                      value={scanCode}
                      onChange={(event) => setScanCode(event.target.value)}
                    />
                  </div>
                  <Input
                    label={t('shop.order.photoLabel')}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    hint={t('shop.order.photoHint')}
                    onChange={takePhoto}
                  />
                  {photoId ? (
                    <p className={styles.muted} role="status">{t('shop.order.photo')}: {photoId}</p>
                  ) : null}
                  <div className={styles.actions}>
                    <Button size="lg" loading={busy} onClick={() => void handover()}>
                      {busy ? t('shop.order.handovering') : t('shop.order.handover')}
                    </Button>
                  </div>
                </div>
              </Card>
            ) : null}
          </div>
        ) : null}
      </ShopStates>
    </div>
  );
}
