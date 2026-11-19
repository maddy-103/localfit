/** Safe return paths for sign-in redirects (BUY-16). */

interface FromState {
  from?: { pathname?: string; search?: string };
  returnTo?: string;
}

/**
 * Accepts either the `from` location set by RoleGuard, an explicit `returnTo`
 * from a wishlist action, or a `?returnTo=` query parameter. Only local paths
 * are allowed, so an external URL can never become a redirect target.
 */
export function getReturnPath(state: unknown, search = ''): string {
  const value = (state ?? {}) as FromState;
  const from = value.from?.pathname
    ? `${value.from.pathname}${value.from.search ?? ''}`
    : undefined;
  const query = new URLSearchParams(search).get('returnTo');
  const candidate = value.returnTo ?? from ?? query ?? '/';
  return candidate.startsWith('/') && !candidate.startsWith('//') ? candidate : '/';
}

/** Keeps a return path out of the query string when router state is available. */
export function withReturnPath(path: string, returnTo: string): string {
  if (returnTo === '/') return path;
  return `${path}?returnTo=${encodeURIComponent(returnTo)}`;
}
