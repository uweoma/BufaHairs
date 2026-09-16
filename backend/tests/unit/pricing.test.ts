import { describe, it, expect } from 'vitest';
import { effectiveUnitPrice, availableStock, variantLabel } from '../../src/utils/pricing';

// The helpers only read a few fields; cast minimal fixtures to the param types.
const product = { price: 500000, stock: 8 } as any;

describe('pricing', () => {
  it('uses the product base price when no variant is selected', () => {
    expect(effectiveUnitPrice(product)).toBe(500000);
    expect(effectiveUnitPrice(product, null)).toBe(500000);
  });

  it('prefers a variant price override when present', () => {
    expect(effectiveUnitPrice(product, { priceOverride: 620000, stock: 3 } as any)).toBe(620000);
  });

  it('falls back to the base price when the override is null', () => {
    expect(effectiveUnitPrice(product, { priceOverride: null, stock: 3 } as any)).toBe(500000);
  });

  it('returns variant stock when a variant is selected, else product stock', () => {
    expect(availableStock(product)).toBe(8);
    expect(availableStock(product, { priceOverride: null, stock: 3 } as any)).toBe(3);
  });

  it('builds a human variant label from the present attributes', () => {
    expect(
      variantLabel({ length: 20, color: 'Natural Black', density: '180%', capSize: null } as any),
    ).toBe('20" · Natural Black · 180%');
  });

  it('returns null for no variant or an empty variant', () => {
    expect(variantLabel(null)).toBeNull();
    expect(
      variantLabel({ length: null, color: null, density: null, capSize: null } as any),
    ).toBeNull();
  });
});
