import type { OrderActor } from '@/domain/orderMachine';

/** The signed-in rider in mock mode; the backend supplies the real id. */
export const RIDER_ACTOR: OrderActor = { id: 'rider-arjun', role: 'rider' };

/** Mock proof ids: a real camera/upload step replaces these with file ids. */
export const MOCK_PICKUP_PHOTO = 'photo-pickup-mock';
export const MOCK_HANDOVER_PHOTO = 'photo-handover-mock';
