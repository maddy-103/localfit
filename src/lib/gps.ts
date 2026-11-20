import type { GpsPoint } from '@/domain/orderMachine';

/** Demo coordinates for the mock; a real device replaces these at the API layer. */
export const DEMO_GPS: GpsPoint = { lat: 12.9784, lng: 77.6408 };

/** Best-effort device location, falling back to the demo point in mock mode. */
export function currentGps(): Promise<GpsPoint> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.resolve(DEMO_GPS);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => resolve(DEMO_GPS),
      { enableHighAccuracy: false, timeout: 3000 },
    );
  });
}
