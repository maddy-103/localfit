import { describe, expect, it } from 'vitest';
import { addresses, admins, buyers, products, riders, shops } from './seed';

describe('seed data', () => {
  it('has the required counts', () => {
    expect(shops).toHaveLength(5);
    expect(products).toHaveLength(8);
    expect(riders).toHaveLength(3);
    expect(buyers).toHaveLength(2);
    expect(admins).toHaveLength(5);
  });

  it('has exactly three try-at-door products', () => {
    expect(products.filter((product) => product.tryAtDoorEligible)).toHaveLength(3);
  });

  it('covers every admin permission role once', () => {
    expect(admins.map((admin) => admin.role).sort()).toEqual([
      'dispute_lead',
      'finance',
      'super_admin',
      'support_agent',
      'verifier',
    ]);
  });

  it('uses realistic Indian names and Bengaluru shops', () => {
    for (const shop of shops) expect(shop.city).toBe('Bengaluru');
    for (const rider of riders) expect(rider.name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
    for (const buyer of buyers) expect(buyer.name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
  });

  it('keeps money in integer paise and stock in whole units', () => {
    for (const product of products) {
      expect(Number.isInteger(product.stockLeft)).toBe(true);
      for (const variant of product.variants) {
        expect(Number.isInteger(variant.pricePaise)).toBe(true);
        expect(Number.isInteger(variant.mrpPaise)).toBe(true);
        expect(variant.pricePaise).toBeLessThanOrEqual(variant.mrpPaise);
        expect(variant.quantity).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('keeps every product image in the API placeholder shape', () => {
    for (const product of products) {
      expect(product.images.length).toBeGreaterThan(0);
      for (const image of product.images) {
        expect(image).toEqual({
          url: null,
          alt: expect.any(String),
          tone: expect.stringMatching(/^(sand|rose|sage|sky|lilac|grey)$/),
          width: expect.any(Number),
          height: expect.any(Number),
        });
      }
    }
  });

  it('links each product to a seeded shop and each address to a buyer', () => {
    const shopIds = new Set(shops.map((shop) => shop.id));
    const buyerIds = new Set(buyers.map((buyer) => buyer.id));
    for (const product of products) expect(shopIds.has(product.shopId)).toBe(true);
    for (const address of addresses) expect(buyerIds.has(address.buyerId)).toBe(true);
  });
});
