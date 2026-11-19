import { useState } from 'react';
import { useI18n } from '@/i18n';
import { useAppStore, type SessionUser } from '@/store/appStore';
import { devClockOffset, devFastForward, devResetClock } from '@/lib/clock';
import { mockFailuresEnabled, setMockFailures } from '@/api/mock';
import {
  devAdvanceOrder,
  devCreateTryAtDoorOrder,
  devResetOrders,
  devRunToDelivered,
  devVerifyOtp,
  devWrongOtp,
} from '@/api/dev';
import type { Order } from '@/api/types';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { IconButton } from './ui/IconButton';
import { LanguageSwitch } from './ui/LanguageSwitch';
import { Select } from './ui/Select';
import { Toggle } from './ui/Toggle';
import { Icon } from './icons/Icon';
import styles from './DemoPanel.module.css';

type Persona = 'guest' | 'buyer' | 'shop' | 'rider' | 'admin' | 'super_admin';

const PERSONAS: Record<Persona, SessionUser | null> = {
  guest: null,
  buyer: {
    id: 'demo-buyer',
    name: 'Ananya Iyer',
    phone: '+91 98860 22110',
    role: 'buyer',
  },
  shop: {
    id: 'demo-shop',
    name: 'Kiran Silks',
    phone: '+91 98450 11221',
    role: 'shop',
  },
  rider: {
    id: 'demo-rider',
    name: 'Arjun Nair',
    phone: '+91 97400 51234',
    role: 'rider',
  },
  admin: {
    id: 'demo-admin',
    name: 'Neha Kulkarni',
    phone: '+91 98800 11001',
    role: 'admin',
    adminRole: 'support_agent',
  },
  super_admin: {
    id: 'demo-super',
    name: 'Meera Krishnan',
    phone: '+91 98800 11005',
    role: 'super_admin',
    adminRole: 'super_admin',
  },
};

const PERSONA_OPTIONS = [
  { value: 'guest', label: 'Guest' },
  { value: 'buyer', label: 'Buyer' },
  { value: 'shop', label: 'Shopkeeper' },
  { value: 'rider', label: 'Rider' },
  { value: 'admin', label: 'Admin (support)' },
  { value: 'super_admin', label: 'Super admin' },
];

/** Development-only switchboard. Loaded through a dynamic import in DEV. */
export default function DemoPanel() {
  const { t } = useI18n();
  const session = useAppStore((state) => state.session);
  const setSession = useAppStore((state) => state.setSession);
  const [open, setOpen] = useState(false);
  const [failures, setFailures] = useState(() => mockFailuresEnabled());
  const [offset, setOffset] = useState(() => devClockOffset());
  const [order, setOrder] = useState<Order | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  const runOrderAction = (work: () => Order | Promise<Order>) => {
    setOrderError(null);
    void Promise.resolve()
      .then(work)
      .then(setOrder)
      .catch((cause: unknown) =>
        setOrderError(cause instanceof Error ? cause.message : t('demo.orderError')),
      );
  };

  if (!open) {
    return (
      <button
        type="button"
        className={styles.launcher}
        onClick={() => setOpen(true)}
        aria-label={t('demo.open')}
      >
        <Icon name="settings" size={18} />
        <span>{t('demo.open')}</span>
      </button>
    );
  }

  return (
    <Card className={styles.panel} padded>
      <div className={styles.head}>
        <p className={styles.title}>{t('demo.title')}</p>
        <IconButton icon="close" label={t('demo.close')} onClick={() => setOpen(false)} />
      </div>

      <Select
        label={t('demo.role')}
        options={PERSONA_OPTIONS}
        value={session?.role === 'super_admin' ? 'super_admin' : session?.role ?? 'guest'}
        onChange={(event) => {
          const persona = event.target.value as Persona;
          setSession(PERSONAS[persona]);
        }}
      />

      <div className={styles.group}>
        <p className={styles.groupLabel}>{t('demo.language')}</p>
        <LanguageSwitch />
      </div>

      <div className={styles.group}>
        <p className={styles.groupLabel}>{t('demo.time')}</p>
        <div className={styles.row}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              devFastForward(60_000);
              setOffset(devClockOffset());
            }}
          >
            {t('demo.plus1m')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              devFastForward(15 * 60_000);
              setOffset(devClockOffset());
            }}
          >
            {t('demo.plus15m')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              devResetClock();
              setOffset(0);
            }}
          >
            {t('demo.resetClock')}
          </Button>
        </div>
        <p className={styles.offset}>
          {t('demo.offset', { minutes: Math.round(offset / 60_000) })}
        </p>
      </div>

      <Toggle
        label={t('demo.mockFailures')}
        checked={failures}
        onChange={(checked) => {
          setFailures(checked);
          setMockFailures(checked);
        }}
      />

      <div className={styles.group}>
        <p className={styles.groupLabel}>{t('demo.orders')}</p>
        <p className={styles.offset}>
          {order ? t('demo.currentOrder', { id: order.id, state: order.state }) : t('demo.noOrder')}
        </p>
        <div className={styles.row}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => runOrderAction(() => devCreateTryAtDoorOrder())}
          >
            {t('demo.createOrder')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!order}
            onClick={() => order && runOrderAction(() => devAdvanceOrder(order.id))}
          >
            {t('demo.advance')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!order}
            onClick={() => order && runOrderAction(() => devRunToDelivered(order.id))}
          >
            {t('demo.runToDelivered')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={!order}
            onClick={() => order && runOrderAction(() => devVerifyOtp(order.id))}
          >
            {t('demo.verifyOtp')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={!order}
            onClick={() => order && runOrderAction(() => devWrongOtp(order.id))}
          >
            {t('demo.wrongOtp')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              devResetOrders();
              setOrder(null);
              setOrderError(null);
            }}
          >
            {t('demo.resetOrders')}
          </Button>
        </div>
        {orderError ? <p className={styles.offset}>{orderError}</p> : null}
      </div>
    </Card>
  );
}
