/**
 * Counter-sale rules (SHOP-04, resolved ambiguity 11).
 *
 * A bag hold is released when a shopkeeper sells that unit at the counter.
 * A unit already committed to a placed order is never taken: the sale becomes
 * a conflict record for the admin queue instead. Stock never drops below zero.
 */

export type CounterSaleOutcome = 'sold' | 'conflict' | 'unavailable';

export interface CounterSaleInput {
  quantity: number;
  /** Units on non-cancelled placed orders. */
  committedQty: number;
  /** Units in active bag holds. */
  heldQty: number;
  /** Units to sell at the counter. */
  qty?: number;
}

export interface CounterSaleResult {
  outcome: CounterSaleOutcome;
  quantity: number;
  releasedHolds: number;
  reason?: 'committed' | 'no_stock';
}

export function counterSale(input: CounterSaleInput): CounterSaleResult {
  const qty = input.qty ?? 1;
  if (input.quantity <= 0) {
    return { outcome: 'unavailable', quantity: 0, releasedHolds: 0, reason: 'no_stock' };
  }
  if (input.committedQty > 0) {
    return {
      outcome: 'conflict',
      quantity: Math.max(0, input.quantity),
      releasedHolds: 0,
      reason: 'committed',
    };
  }
  const releasedHolds = Math.min(input.heldQty, qty);
  return {
    outcome: 'sold',
    quantity: Math.max(0, input.quantity - qty),
    releasedHolds,
  };
}

/** Live stock shown to buyers: on-hand units minus committed and held units. */
export function availableToBuy(
  quantity: number,
  committedQty: number,
  heldQty: number,
): number {
  return Math.max(0, quantity - committedQty - heldQty);
}
