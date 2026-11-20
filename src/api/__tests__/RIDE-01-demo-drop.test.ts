import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/api/client';
import { MOCK_OTP, MOCK_PICKUP_OTP } from '@/api/mockFlow';
import { orderAt, setupFlow, teardownFlow } from '@/test/flowFixtures';
import type { OrderState } from '@/domain/orderMachine';

const RIDER = { id: 'rider-arjun', role: 'rider' as const };
const PICKUP = { pickupOtp: MOCK_PICKUP_OTP, scanCode: 'var-kurta-m', photoId: 'photo-pickup-mock' };
const GPS = { lat: 12.9719, lng: 77.6412 };

beforeEach(async () => {
  await setupFlow();
});

afterEach(() => {
  teardownFlow();
});

describe('RIDE-01 demo rider path', () => {
  it('walks a try-at-door pickup through the drop to a closed trip', async () => {
    const assigned = await orderAt('RIDER_ASSIGNED');
    const taskId = `${assigned.id}:pickup`;
    expect((await api.listRiderTasks()).some((task) => task.id === taskId)).toBe(true);

    const picked = await api.collectPickup(assigned.id, PICKUP, RIDER);
    expect(picked.state).toBe('IN_TRANSIT');
    expect((await api.listRiderTasks()).some((task) => task.id === taskId)).toBe(false);
    expect((await api.listRiderTasks()).some((task) => task.id === `${assigned.id}:drop`)).toBe(
      true,
    );

    const arrived = await api.markArrived(assigned.id, RIDER, GPS);
    expect(arrived.state).toBe('ARRIVED');
    const verified = await api.submitOtp(assigned.id, arrived.otp ?? MOCK_OTP, RIDER);
    expect(verified.order.state).toBe('TRIAL_ACTIVE');
    await api.recordHandoverPhoto(assigned.id, 'photo-handover-mock', RIDER);
    const locked = await api.confirmRiderDecisions(assigned.id, RIDER);
    expect(locked.state).toBe('DECISIONS_LOCKED');

    const scanned = await api.scanReturnedItems(assigned.id, ['var-kurta-m'], RIDER);
    expect(scanned.returnedScanCodes).toEqual(['var-kurta-m']);
    const pickedReturn = await api.closeTrip(assigned.id, RIDER);
    expect(pickedReturn.state).toBe('RETURN_PICKED');
    expect((await api.listRiderTasks()).some((task) => task.type === 'return_pickup')).toBe(true);
    const received = await api.handOverReturnAtShop(assigned.id, RIDER);
    expect(received.state).toBe('RETURN_RECEIVED');
    expect((await api.listRiderTasks()).some((task) => task.orderId === assigned.id)).toBe(false);

    const visited = new Set(received.events.flatMap((event) => [event.from, event.to]));
    for (const state of [
      'RIDER_ASSIGNED',
      'PICKED_UP',
      'IN_TRANSIT',
      'ARRIVED',
      'OTP_VERIFIED',
      'TRIAL_ACTIVE',
      'DECISIONS_LOCKED',
      'RETURN_PICKED',
      'RETURN_RECEIVED',
    ] as OrderState[]) {
      expect(visited.has(state), `missing ${state}`).toBe(true);
    }
    expect(received.events.some((event) => event.action === 'handover_photo')).toBe(true);
    expect(received.events.some((event) => event.action === 'return_scanned')).toBe(true);
  });
});
