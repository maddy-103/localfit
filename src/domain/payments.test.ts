import { describe, expect, it } from 'vitest';
import {
  canUseCod,
  deliveryFeePaise,
  mockPaymentAdapter,
  settleAtLock,
  type PaymentAuthorization,
} from './payments';

const standard = {
  isTryAtDoor: false,
  completedPrepaidOrders: 1,
  completedOrders: 1,
  amountPaise: 100_000,
};

describe('AMBIGUITY-10 COD rules', () => {
  it('never allows COD for try-at-door orders', () => {
    expect(canUseCod({ ...standard, isTryAtDoor: true })).toBe(false);
  });

  it('requires at least one completed prepaid order', () => {
    expect(canUseCod({ ...standard, completedPrepaidOrders: 0 })).toBe(false);
    expect(canUseCod(standard)).toBe(true);
  });

  it('caps COD at 3,000 rupees until three completed orders, configurably', () => {
    expect(canUseCod({ ...standard, amountPaise: 300_001 })).toBe(false);
    expect(canUseCod({ ...standard, amountPaise: 300_000 })).toBe(true);
    expect(canUseCod({ ...standard, completedOrders: 3, amountPaise: 900_000 })).toBe(true);
    expect(
      canUseCod({
        ...standard,
        amountPaise: 500_000,
        codCapPaise: 600_000,
      }),
    ).toBe(true);
  });
});

describe('SPEC 13 settlement at decisions lock', () => {
  const authorization: PaymentAuthorization = {
    method: 'card',
    mode: 'hold',
    status: 'held',
    authorizedPaise: 30_000,
    capturedPaise: 0,
    refundEtaDays: [5, 7],
    reference: 'mock-card-30000',
  };

  it('releases the hold for unmarked items that default to return', () => {
    const result = settleAtLock({ authorization, keptPaise: 20_000, returnedPaise: 10_000 });
    expect(result).toMatchObject({
      capturedPaise: 20_000,
      refundPaise: 10_000,
      status: 'captured',
      effect: 'hold_released',
    });
  });

  it('starts a refund for returned items paid by charge', () => {
    const charged: PaymentAuthorization = {
      ...authorization,
      method: 'upi',
      mode: 'charge',
      status: 'charged',
      capturedPaise: 30_000,
      refundEtaDays: [2, 3],
    };
    const result = settleAtLock({ authorization: charged, keptPaise: 20_000, returnedPaise: 10_000 });
    expect(result.effect).toBe('refund_initiated');
    expect(result.refundPaise).toBe(10_000);
  });

  it('documents the hold-versus-charge split shown at checkout', async () => {
    const hold = await mockPaymentAdapter.authorize({
      method: 'card',
      amountPaise: 10_000,
      isTryAtDoor: true,
    });
    const charge = await mockPaymentAdapter.authorize({
      method: 'upi',
      amountPaise: 10_000,
      isTryAtDoor: true,
    });
    expect(hold.mode).toBe('hold');
    expect(hold.refundEtaDays).toEqual([5, 7]);
    expect(charge.mode).toBe('charge');
    expect(charge.refundEtaDays).toEqual([2, 3]);
    expect(deliveryFeePaise(100_000)).toBe(4900);
  });
});
