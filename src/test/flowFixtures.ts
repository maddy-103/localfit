import { configureMock, resetMockData } from '@/api/mock';
import { devAdvanceOrder, devCreateTryAtDoorOrder } from '@/api/dev';
import type { Order } from '@/api/types';
import type { OrderState } from '@/domain/orderMachine';
import { createFakeClock, resetClock, setClock, type FakeClock } from '@/lib/clock';

const DEFAULT_START = '2026-11-16T10:00:00.000Z';

/** Shared setup for the mock-backed buyer flow tests. */
export async function setupFlow(start: string = DEFAULT_START): Promise<FakeClock> {
  const clock = createFakeClock(start);
  setClock(clock);
  configureMock({ latencyMs: 0 });
  await resetMockData();
  return clock;
}

export function teardownFlow(): void {
  resetClock();
}

/** Walks the dev-only lifecycle to a state without skipping events. */
export async function orderAt(state: OrderState): Promise<Order> {
  let order = await devCreateTryAtDoorOrder();
  for (let step = 0; step < 20 && order.state !== state; step += 1) {
    order = devAdvanceOrder(order.id);
  }
  if (order.state !== state) throw new Error(`Could not reach ${state}; stopped at ${order.state}.`);
  return order;
}
