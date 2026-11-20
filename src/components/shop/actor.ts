import type { OrderActor } from '@/domain/orderMachine';

/** The signed-in shop account in mock mode; the backend supplies the real id. */
export const SHOP_ACTOR: OrderActor = { id: 'shop-kiran', role: 'shop' };
