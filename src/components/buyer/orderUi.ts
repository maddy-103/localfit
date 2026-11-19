import type { OrderState } from '@/domain/orderMachine';
import type { StatusTone } from '@/components/ui/StatusChip';
import type { TranslationKey } from '@/i18n';

/** Presentation-only mapping of order states to chips and filters. */

const TONES: Partial<Record<OrderState, StatusTone>> = {
  PLACED: 'pending',
  SHOP_ACCEPTED: 'info',
  PACKED: 'info',
  RIDER_ASSIGNED: 'info',
  REASSIGNED: 'info',
  PICKED_UP: 'info',
  IN_TRANSIT: 'info',
  ARRIVED: 'info',
  OTP_VERIFIED: 'info',
  TRIAL_ACTIVE: 'warning',
  DECISIONS_LOCKED: 'warning',
  RETURN_REQUESTED: 'warning',
  RETURN_PICKED: 'warning',
  RETURN_RECEIVED: 'warning',
  RETURN_REJECTED: 'error',
  FAILED_DELIVERY: 'error',
  SHOP_DECLINED: 'error',
  CANCELLED: 'error',
  CANCELLED_BY_SHOP: 'error',
  DISPUTED: 'error',
  DELIVERED: 'success',
  RESOLVED: 'success',
  REFUNDED: 'success',
  SETTLED: 'success',
};

export function orderTone(state: OrderState): StatusTone {
  return TONES[state] ?? 'pending';
}

export function orderLabelKey(state: OrderState): TranslationKey {
  return `timeline.${state}` as TranslationKey;
}

const DONE: readonly OrderState[] = [
  'DELIVERED', 'SETTLED', 'REFUNDED', 'RESOLVED', 'CANCELLED',
  'CANCELLED_BY_SHOP', 'SHOP_DECLINED', 'RETURN_REJECTED',
];

export function isDone(state: OrderState): boolean {
  return DONE.includes(state);
}
