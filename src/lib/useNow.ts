import { useEffect, useState } from 'react';
import { now } from './clock';

/**
 * Re-renders on a wall-clock interval, reading time from the app clock.
 * Rendering is not a business timer: no state mutation happens here.
 */
export function useNow(intervalMs = 1000): number {
  const [value, setValue] = useState(() => now());

  useEffect(() => {
    const id = window.setInterval(() => setValue(now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return value;
}
