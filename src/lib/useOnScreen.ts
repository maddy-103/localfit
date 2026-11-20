import { useCallback, useEffect, useState } from 'react';

/**
 * Reports once when an element has actually been on screen. Checkout uses it
 * so the Pay button cannot be enabled before the trial terms are visible
 * (BUY-08). Browsers without IntersectionObserver (jsdom, older Android) fall
 * back to the mounted element being visible.
 */
export function useOnScreen<T extends HTMLElement>(): [(node: T | null) => void, boolean] {
  const [node, setNode] = useState<T | null>(null);
  const [seen, setSeen] = useState(false);
  const ref = useCallback((next: T | null) => setNode(next), []);

  useEffect(() => {
    if (!node || seen) return;
    if (typeof IntersectionObserver === 'undefined') {
      void Promise.resolve().then(() => setSeen(true));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      setSeen(true);
      observer.disconnect();
    });
    observer.observe(node);
    // Recreated in setup so React 18 StrictMode's double-invoke cannot leave
    // a disconnected observer behind.
    return () => observer.disconnect();
  }, [node, seen]);

  return [ref, seen];
}
