import { describe, it, expect } from 'vitest';
import { slugify, uniqueSlug } from '../../src/utils/slugify';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Body Wave Bundle')).toBe('body-wave-bundle');
  });

  it('strips punctuation and collapses whitespace runs', () => {
    // Note: underscores are removed by the punctuation pass (not converted to a
    // separator), so "Deep_Wave" becomes "deepwave".
    expect(slugify('  20" Deep_Wave — Frontal!! ')).toBe('20-deepwave-frontal');
  });

  it('collapses runs of spaces and hyphens into a single hyphen', () => {
    expect(slugify('Lace   Front --- Wig')).toBe('lace-front-wig');
  });

  it('removes accents/diacritics', () => {
    expect(slugify('Bùfá Háirs')).toBe('bufa-hairs');
  });

  it('trims leading/trailing hyphens', () => {
    expect(slugify('---Curly---')).toBe('curly');
  });

  it('uniqueSlug keeps the base and appends a short suffix', () => {
    const s = uniqueSlug('Straight Wig');
    expect(s).toMatch(/^straight-wig-[a-z0-9]{1,5}$/);
    // Two calls should (practically) never collide.
    expect(uniqueSlug('Straight Wig')).not.toBe(s);
  });
});
