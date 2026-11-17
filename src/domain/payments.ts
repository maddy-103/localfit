/**
 * Payment rules and the adapter boundary.
 *
 * The mock adapter is deterministic: cards return an authorization hold, UPI
 * and wallets return a charge, and COD records an amount due at the door. A
 * real gateway replaces `mockPaymentAdapter` without touching a screen.
 */

export type PaymentMethod = 'upi' | 'card' | 'wallet' | 'cod';

/** Exact refund timelines shown at checkout and after decisions lock. */
export const REFUND_TIMELINE_DAYS: Record<Exclude<PaymentMethod, 'cod'>, [number, number]> = {
  card: [5, 7],
  upi: [2, 3],
  wallet: [0, 1],
};

export const DELIVERY_FEE_PAISE = 4900;
export const FREE_DELIVERY_ABOVE_PAISE = 199900;

export function deliveryFeePaise(itemsPaise: number): number {
  return itemsPaise >= FREE_DELIVERY_ABOVE_PAISE ? 0 : DELIVERY_FEE_PAISE;
}

export function canUseCod(params: {
  isTryAtDoor: boolean;
  completedPrepaidOrders: number;
  completedOrders: number;
  amountPaise: number;
  codCapPaise?: number;
}): boolean {
  const cap = params.codCapPaise ?? 300000; // 3000 INR
  if (params.isTryAtDoor) return false;
  if (params.completedPrepaidOrders < 1) return false;
  if (params.completedOrders < 3 && params.amountPaise > cap) return false;
  return true;
}

export function formatPaise(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export type PaymentMode = 'hold' | 'charge' | 'none';
export type PaymentStatus = 'held' | 'charged' | 'captured' | 'released' | 'refunded' | 'cod_due';

export interface PaymentIntent {
  method: PaymentMethod;
  amountPaise: number;
  isTryAtDoor: boolean;
}

export interface PaymentAuthorization {
  method: PaymentMethod;
  mode: PaymentMode;
  status: PaymentStatus;
  authorizedPaise: number;
  capturedPaise: number;
  refundEtaDays?: [number, number];
  reference: string;
}

export interface PaymentAdapter {
  authorize(intent: PaymentIntent): Promise<PaymentAuthorization>;
}

/** Deterministic mock gateway. Never sees or stores card numbers (NFR-11). */
export const mockPaymentAdapter: PaymentAdapter = {
  async authorize(intent) {
    const reference = `mock-${intent.method}-${intent.amountPaise}`;

    if (intent.method === 'card') {
      return {
        method: 'card',
        mode: 'hold',
        status: 'held',
        authorizedPaise: intent.amountPaise,
        capturedPaise: 0,
        refundEtaDays: REFUND_TIMELINE_DAYS.card,
        reference,
      };
    }

    if (intent.method === 'upi' || intent.method === 'wallet') {
      return {
        method: intent.method,
        mode: 'charge',
        status: 'charged',
        authorizedPaise: intent.amountPaise,
        capturedPaise: intent.amountPaise,
        refundEtaDays: REFUND_TIMELINE_DAYS[intent.method],
        reference,
      };
    }

    return {
      method: 'cod',
      mode: 'none',
      status: 'cod_due',
      authorizedPaise: 0,
      capturedPaise: 0,
      reference,
    };
  },
};

export type LockEffect = 'none' | 'hold_released' | 'refund_initiated';

export interface LockSettlement {
  capturedPaise: number;
  refundPaise: number;
  status: PaymentStatus;
  effect: LockEffect;
}

/**
 * At decisions lock only kept items are captured. Cards release the hold on
 * returned items; charges start a refund for them (SPEC 8.2).
 */
export function settleAtLock(params: {
  authorization: PaymentAuthorization;
  keptPaise: number;
  returnedPaise: number;
}): LockSettlement {
  const { authorization, keptPaise, returnedPaise } = params;

  if (authorization.mode === 'none') {
    return {
      capturedPaise: keptPaise,
      refundPaise: 0,
      status: 'cod_due',
      effect: 'none',
    };
  }

  if (authorization.mode === 'hold') {
    return {
      capturedPaise: keptPaise,
      refundPaise: returnedPaise,
      status: 'captured',
      effect: returnedPaise > 0 ? 'hold_released' : 'none',
    };
  }

  return {
    capturedPaise: authorization.capturedPaise,
    refundPaise: returnedPaise,
    status: returnedPaise > 0 ? 'refunded' : 'captured',
    effect: returnedPaise > 0 ? 'refund_initiated' : 'none',
  };
}
