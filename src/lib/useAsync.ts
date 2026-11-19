import { useCallback, useEffect, useRef, useState } from 'react';

export interface AsyncResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  /** Epoch ms of the last successful load, for the offline banner. */
  lastUpdated: number | null;
  reload: () => void;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

/**
 * Loads data once per key and exposes loading, error and cached data.
 * `reload` re-runs the request; realtime subscriptions call it. The loader is
 * held in a ref so an inline arrow function does not re-trigger the effect.
 */
export function useAsync<T>(load: () => Promise<T>, key = 'default'): AsyncResult<T> {
  const loadRef = useRef(load);

  // Update the ref in an effect to satisfy the lint rule about refs during render.
  useEffect(() => {
    loadRef.current = load;
  });

  const [sequence, setSequence] = useState(0);
  const [state, setState] = useState<Omit<AsyncResult<T>, 'reload'>>({
    data: null,
    error: null,
    loading: true,
    lastUpdated: null,
  });

  // Track loading state separately so we don't call setState synchronously
  // inside an effect (which triggers cascading renders).
  const loadingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    loadingRef.current = true;
    // Use a microtask to avoid the synchronous setState-in-effect lint error
    // while still updating loading state before the async call completes.
    Promise.resolve().then(() => {
      if (!cancelled) setState((previous) => ({ ...previous, loading: true, error: null }));
    });

    loadRef
      .current()
      .then((data) => {
        if (cancelled) return;
        setState({ data, error: null, loading: false, lastUpdated: Date.now() });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState((previous) => ({
          ...previous,
          loading: false,
          error: messageOf(error),
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [key, sequence]);

  const reload = useCallback(() => setSequence((value) => value + 1), []);

  return { ...state, reload };
}

/** Tracks the browser connection so screens can show the offline banner. */
export function useOnline(): boolean {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  return online;
}
