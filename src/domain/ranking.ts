/**
 * Pure ranking for occasion hubs (section 6.1): availability first, then fit,
 * then how quickly the item can arrive. Ties are broken by id so the order is
 * stable between renders and across tabs.
 */
export interface RankableItem {
  id: string;
  shopId: string;
  stockLeft: number;
  fitTags: readonly string[];
  rating?: number;
  /** Units available in the chosen size, when a size filter is active. */
  availableQty?: number;
}

export interface RankableShop {
  id: string;
  etaMin: readonly [number, number];
  distanceKm: number;
  rating?: number;
}

export interface RankingOptions {
  size?: string;
  fitTag?: string;
  maxDistanceKm?: number;
  maxEtaMin?: number;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function rankProducts<T extends RankableItem>(
  items: readonly T[],
  shops: readonly RankableShop[],
  options: RankingOptions = {},
): T[] {
  const byShop = new Map(shops.map((shop) => [shop.id, shop]));

  return items
    .filter((item) => {
      const shop = byShop.get(item.shopId);
      if (!shop) return false;
      if (options.maxDistanceKm !== undefined && shop.distanceKm > options.maxDistanceKm) {
        return false;
      }
      if (options.maxEtaMin !== undefined && shop.etaMin[0] > options.maxEtaMin) return false;
      return true;
    })
    .map((item) => {
      const shop = byShop.get(item.shopId)!;
      const units = item.availableQty ?? item.stockLeft;
      const availability = units <= 0 ? -1 : clamp01(units / 10);
      const fit = options.fitTag ? (item.fitTags.includes(options.fitTag) ? 1 : 0) : 0.5;
      const eta = clamp01((120 - shop.etaMin[0]) / 120);
      const rating = clamp01((item.rating ?? shop.rating ?? 0) / 5);
      const score = availability * 40 + fit * 30 + eta * 20 + rating * 10;
      return { item, score };
    })
    .sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id))
    .map((entry) => entry.item);
}
