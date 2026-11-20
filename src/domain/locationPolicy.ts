/**
 * Delivery-area rules. Checkout uses this to tell the buyer whether the
 * chosen address sits inside each shop's service radius (BUY-07, section 6.1).
 * The mock has real coordinates; a backend replaces this with the same call.
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Great-circle distance in kilometres, rounded to one decimal. */
export function distanceKm(a: Coordinates, b: Coordinates): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return Math.round(2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h)) * 10) / 10;
}

export interface ServiceArea {
  lat: number;
  lng: number;
  serviceRadiusKm: number;
}

export function insideServiceArea(address: Coordinates, shop: ServiceArea): boolean {
  return distanceKm(address, shop) <= shop.serviceRadiusKm;
}

/* ------------------------------------------------------------------ */
/* Location batching (RIDE-08)                                         */
/* ------------------------------------------------------------------ */

/** RIDE-08: fewer pings when idle, more only while actually in transit. */
export type RiderTripPhase = 'idle' | 'assigned' | 'in_transit';

/** RIDE-08: idle sends none, assigned one a minute, transit one every 15 s. */
export const PING_INTERVAL_MS: Record<RiderTripPhase, number | null> = {
  idle: null,
  assigned: 60_000,
  in_transit: 15_000,
};

export interface PingDecision {
  phase: RiderTripPhase;
  intervalMs: number | null;
  shouldPing: boolean;
  /** Milliseconds until the next ping; null when this phase never pings. */
  nextInMs: number | null;
}

/**
 * Pure batching decision for a trip phase. `lastPingAtMs` is null until the
 * first ping. The caller (a future location worker) does the actual upload.
 */
export function pingDecision(
  phase: RiderTripPhase,
  lastPingAtMs: number | null,
  atMs: number,
): PingDecision {
  const intervalMs = PING_INTERVAL_MS[phase];
  if (intervalMs === null) {
    return { phase, intervalMs: null, shouldPing: false, nextInMs: null };
  }
  if (lastPingAtMs === null) {
    return { phase, intervalMs, shouldPing: true, nextInMs: intervalMs };
  }
  const elapsed = Math.max(0, atMs - lastPingAtMs);
  return {
    phase,
    intervalMs,
    shouldPing: elapsed >= intervalMs,
    nextInMs: Math.max(0, intervalMs - elapsed),
  };
}

/** Maps an order state to the RIDE-08 ping phase. */
export function tripPhaseForOrderState(state: string): RiderTripPhase {
  if (state === 'IN_TRANSIT') return 'in_transit';
  if (['RIDER_ASSIGNED', 'PICKED_UP'].includes(state)) return 'assigned';
  return 'idle';
}
