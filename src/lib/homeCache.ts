import { del, get, set } from 'idb-keyval';
import type { Product, Shop } from '@/api/types';
import { nowIso } from './clock';

/** Last successful home snapshot, used when the API is unavailable (BUY-15). */
export interface HomeCache {
  products: Product[];
  shops: Shop[];
  /** ISO 8601 timestamp of the last successful load. */
  updatedAt: string;
}

const KEY = 'lf:home-cache-v1';
let memory: HomeCache | null = null;

export async function loadHomeCache(): Promise<HomeCache | null> {
  try {
    const stored = await get<HomeCache>(KEY);
    if (stored && Array.isArray(stored.products) && Array.isArray(stored.shops)) {
      memory = stored;
      return stored;
    }
  } catch {
    // IndexedDB is unavailable in private mode and some test environments.
  }
  return memory;
}

export async function saveHomeCache(
  snapshot: Omit<HomeCache, 'updatedAt'> & { updatedAt?: string },
): Promise<void> {
  const next: HomeCache = {
    products: snapshot.products,
    shops: snapshot.shops,
    updatedAt: snapshot.updatedAt ?? nowIso(),
  };
  memory = next;
  try {
    await set(KEY, next);
  } catch {
    // The in-memory copy still covers this tab.
  }
}

export async function clearHomeCache(): Promise<void> {
  memory = null;
  try {
    await del(KEY);
  } catch {
    // Nothing to clear.
  }
}
