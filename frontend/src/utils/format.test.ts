import { describe, it, expect } from 'vitest';
import { formatRelative, pluralPl, wordCount } from './format';

describe('pluralPl', () => {
  const forms: [string, string, string] = ['słowo', 'słowa', 'słów'];

  it('uses the singular form for 1', () => {
    expect(pluralPl(1, forms)).toBe('słowo');
  });

  it('uses the "few" form for 2-4 (outside the teens)', () => {
    expect(pluralPl(2, forms)).toBe('słowa');
    expect(pluralPl(23, forms)).toBe('słowa');
  });

  it('uses the "many" form for 0, 5+, and the teens', () => {
    expect(pluralPl(0, forms)).toBe('słów');
    expect(pluralPl(5, forms)).toBe('słów');
    expect(pluralPl(12, forms)).toBe('słów');
    expect(pluralPl(13, forms)).toBe('słów');
  });
});

describe('wordCount', () => {
  it('counts whitespace-separated words', () => {
    expect(wordCount('jeden dwa trzy')).toBe(3);
  });

  it('ignores surrounding and repeated whitespace', () => {
    expect(wordCount('  ala   ma kota  ')).toBe(3);
  });

  it('returns 0 for empty or blank strings', () => {
    expect(wordCount('')).toBe(0);
    expect(wordCount('   ')).toBe(0);
  });
});

describe('formatRelative', () => {
  it('returns "przed chwilą" for very recent times', () => {
    expect(formatRelative(new Date().toISOString())).toBe('przed chwilą');
  });

  it('formats minutes ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatRelative(fiveMinAgo)).toBe('5 min temu');
  });

  it('formats hours ago', () => {
    const threeHrsAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(formatRelative(threeHrsAgo)).toBe('3 godz. temu');
  });

  it('returns an empty string for invalid input', () => {
    expect(formatRelative('not-a-date')).toBe('');
  });
});
