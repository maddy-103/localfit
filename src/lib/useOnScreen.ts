import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Reports once when an element has actually been on screen. Checkout uses it
 * so the Pay button cannot be enabled before the trial terms are visible
 * (BUY-08). Browsers without IntersectionObserver (jsdom, older Android) fall
 * back to the mounted element being visible.
 */
export function useOnScreen<T extends HTMLElement>(): [(node: T | null) => void, boolean] {
  const [seen, setSeen] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => () => observer.current?.disconnect(), []);

  const ref = useCallback((node: T | null) => {
    observer.current?.disconnect();
    observer.current = null;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      void Promise.resolve().then(() => setSeen(true));
      return;
    }

    const next = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      setSeen(true);
      next.disconnect();
      observer.current = null;
    });
    observer.current = next;
    next.observe(node);
  }, []);

  return [ref, seen];
}
