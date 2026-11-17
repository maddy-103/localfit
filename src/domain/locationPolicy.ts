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
