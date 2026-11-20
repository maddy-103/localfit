/**
 * Pure rider console logic: task ordering, navigation targets, waiting
 * evidence and earnings. No React and no API calls live here.
 */

import type { Coordinates } from './locationPolicy';
import type { OrderKind, OrderState } from './orderMachine';

export type RiderTaskType = 'pickup' | 'drop' | 'return_pickup';

export interface RiderPlace extends Coordinates {
  name: string;
  line: string;
  area: string;
  phone?: string;
}

export interface RiderTaskSource {
  id: string;
  state: OrderState;
  kind: OrderKind;
  etaMin: [number, number];
  createdAt: string;
  pickupOtp?: string;
  handoverOtp?: string;
}

export interface RiderTask {
  id: string;
  orderId: string;
  type: RiderTaskType;
  sequence: number;
  shop: RiderPlace;
  buyer: RiderPlace;
  kind: OrderKind;
  state: OrderState;
  etaMin: [number, number];
  createdAt: string;
  pickupOtp?: string;
  handoverOtp?: string;
  /** NFR-04: an offline action for this order is waiting to sync. */
  pendingSync?: boolean;
}

export const TASK_PRIORITY: Record<RiderTaskType, number> = {
  pickup: 0,
  drop: 1,
  return_pickup: 2,
};

const PICKUP_STATES: OrderState[] = ['RIDER_ASSIGNED'];
const DROP_STATES: OrderState[] = [
  'PICKED_UP',
  'IN_TRANSIT',
  'ARRIVED',
  'OTP_VERIFIED',
  'TRIAL_ACTIVE',
  'DECISIONS_LOCKED',
];
const RETURN_STATES: OrderState[] = ['RETURN_REQUESTED', 'FAILED_DELIVERY', 'RETURN_PICKED'];

/** One main task per stage; pickup always comes before the matching drop. */
export function tasksForOrder(
  order: RiderTaskSource,
  shop: RiderPlace,
  buyer: RiderPlace,
): RiderTask[] {
  const types: RiderTaskType[] = [];
  if (PICKUP_STATES.includes(order.state)) types.push('pickup');
  if (DROP_STATES.includes(order.state)) types.push('drop');
  if (RETURN_STATES.includes(order.state)) types.push('return_pickup');

  return types.map((type, index) => ({
    id: `${order.id}:${type}`,
    orderId: order.id,
    type,
    sequence: index,
    shop,
    buyer,
    kind: order.kind,
    state: order.state,
    etaMin: order.etaMin,
    createdAt: order.createdAt,
    ...(order.pickupOtp ? { pickupOtp: order.pickupOtp } : {}),
    ...(order.handoverOtp ? { handoverOtp: order.handoverOtp } : {}),
  }));
}

export function sortRiderTasks(tasks: RiderTask[]): RiderTask[] {
  return [...tasks].sort(
    (a, b) =>
      TASK_PRIORITY[a.type] - TASK_PRIORITY[b.type] ||
      a.etaMin[0] - b.etaMin[0] ||
      a.createdAt.localeCompare(b.createdAt) ||
      a.id.localeCompare(b.id),
  );
}

/** Device maps link built from coordinates, never from a place name. */
export function mapsLinkForTask(task: RiderTask): string {
  const place = destinationForTask(task);
  const query = `${place.lat},${place.lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

export function destinationForTask(task: RiderTask): RiderPlace {
  return task.type === 'drop' ? task.buyer : task.shop;
}

export interface WaitingSessionSource {
  orderId: string;
  startedAt: string;
  arrivedAt?: string;
  gps?: Coordinates;
  otpAttempts?: number;
}

export interface WaitingEvidence {
  orderId: string;
  startedAt: string;
  arrivedAt?: string;
  checkedAt: string;
  elapsedMs: number;
  thresholdMs: number;
  due: boolean;
  gps?: Coordinates;
  otpAttempts: number;
}

/** SPEC 13: a claim always carries the timer that earned it. */
export function buildWaitingEvidence(
  session: WaitingSessionSource,
  atMs: number,
  thresholdMs: number,
): WaitingEvidence {
  const elapsedMs = Math.max(0, atMs - Date.parse(session.startedAt));
  return {
    orderId: session.orderId,
    startedAt: session.startedAt,
    ...(session.arrivedAt ? { arrivedAt: session.arrivedAt } : {}),
    checkedAt: new Date(atMs).toISOString(),
    elapsedMs,
    thresholdMs,
    due: elapsedMs >= thresholdMs,
    ...(session.gps ? { gps: session.gps } : {}),
    otpAttempts: session.otpAttempts ?? 0,
  };
}

export interface EarningsOrder {
  id: string;
  kind: OrderKind;
  state: OrderState;
  deliveryFeePaise: number;
  createdAt: string;
}

export interface EarningsClaim {
  orderId: string;
  amountPaise: number;
}

export interface EarningsConfig {
  tryAtDoorBonusPaise: number;
  lateNightBonusPaise: number;
  lateNightHour: number;
}

export interface EarningsTrip {
  orderId: string;
  basePaise: number;
  bonusesPaise: { tryAtDoor: number; lateNight: number; waiting: number };
  totalPaise: number;
  status: 'paid' | 'pending';
  date: string;
}

export interface RiderEarnings {
  trips: EarningsTrip[];
  totalPaise: number;
  pendingPaise: number;
  bonusesPaise: { tryAtDoor: number; lateNight: number; waiting: number };
  payoutDate: string;
}

const PAID_STATES: OrderState[] = ['DELIVERED', 'RETURN_RECEIVED', 'SETTLED'];

/** RIDE-06: every bonus line is visible, and money stays in integer paise. */
export function riderEarnings(
  orders: EarningsOrder[],
  claims: EarningsClaim[],
  config: EarningsConfig,
  atMs: number,
): RiderEarnings {
  const trips = orders.map((order) => {
    const waiting = claims
      .filter((claim) => claim.orderId === order.id)
      .reduce((sum, claim) => sum + claim.amountPaise, 0);
    const late = new Date(order.createdAt).getHours() >= config.lateNightHour;
    const bonuses = {
      tryAtDoor: order.kind === 'try_at_door' ? config.tryAtDoorBonusPaise : 0,
      lateNight: late ? config.lateNightBonusPaise : 0,
      waiting,
    };
    const bonusTotal = bonuses.tryAtDoor + bonuses.lateNight + bonuses.waiting;
    return {
      orderId: order.id,
      basePaise: order.deliveryFeePaise,
      bonusesPaise: bonuses,
      totalPaise: order.deliveryFeePaise + bonusTotal,
      status: (PAID_STATES.includes(order.state) ? 'paid' : 'pending') as 'paid' | 'pending',
      date: order.createdAt,
    };
  });

  const bonusesPaise = trips.reduce(
    (sum, trip) => ({
      tryAtDoor: sum.tryAtDoor + trip.bonusesPaise.tryAtDoor,
      lateNight: sum.lateNight + trip.bonusesPaise.lateNight,
      waiting: sum.waiting + trip.bonusesPaise.waiting,
    }),
    { tryAtDoor: 0, lateNight: 0, waiting: 0 },
  );

  return {
    trips,
    totalPaise: trips.reduce((sum, trip) => sum + trip.totalPaise, 0),
    pendingPaise: trips
      .filter((trip) => trip.status === 'pending')
      .reduce((sum, trip) => sum + trip.totalPaise, 0),
    bonusesPaise,
    payoutDate: new Date(atMs + 7 * 24 * 60 * 60_000).toISOString(),
  };
}
