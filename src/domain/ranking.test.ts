import { describe, expect, it } from 'vitest';
import { rankProducts, type RankableItem, type RankableShop } from './ranking';

const shop: RankableShop = { id: 'shop-a', etaMin: [45, 60], distanceKm: 2, rating: 4.5 };

function item(id: string, patch: Partial<RankableItem> = {}): RankableItem {
  return {
    id,
    shopId: 'shop-a',
    stockLeft: 5,
    fitTags: ['true to size'],
    rating: 4.5,
    ...patch,
  };
}

describe('ranking', () => {
  it('puts more available stock first', () => {
    const ranked = rankProducts(
      [item('low', { stockLeft: 1 }), item('high', { stockLeft: 9 })],
      [shop],
    );
    expect(ranked.map((entry) => entry.id)).toEqual(['high', 'low']);
  });

  it('prefers a fit match when a fit tag is requested', () => {
    const ranked = rankProducts(
      [
        item('other', { fitTags: ['runs small'] }),
        item('match', { fitTags: ['true to size'] }),
      ],
      [shop],
      { fitTag: 'true to size' },
    );
    expect(ranked.map((entry) => entry.id)).toEqual(['match', 'other']);
  });

  it('prefers the faster shop when stock and fit match', () => {
    const ranked = rankProducts(
      [item('slow', { shopId: 'shop-b' }), item('fast', { shopId: 'shop-a' })],
      [shop, { id: 'shop-b', etaMin: [70, 85], distanceKm: 5, rating: 4.5 }],
    );
    expect(ranked.map((entry) => entry.id)).toEqual(['fast', 'slow']);
  });

  it('drops shops outside the distance and ETA limits', () => {
    const ranked = rankProducts(
      [item('far', { shopId: 'shop-b' }), item('near')],
      [shop, { id: 'shop-b', etaMin: [90, 120], distanceKm: 12 }],
      { maxDistanceKm: 6, maxEtaMin: 60 },
    );
    expect(ranked.map((entry) => entry.id)).toEqual(['near']);
  });

  it('breaks ties by id so the order is stable', () => {
    const ranked = rankProducts([item('b'), item('a')], [shop]);
    expect(ranked.map((entry) => entry.id)).toEqual(['a', 'b']);
  });
});
