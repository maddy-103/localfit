export type PaymentMethod = 'upi' | 'card' | 'wallet' | 'cod';

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
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paise / 100);
}
