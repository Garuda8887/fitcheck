import { countTokens, countFileTokens } from '../src/tokenizer';

describe('countTokens', () => {
  it('counts tokens in a simple string', () => {
    // "hello world" is 2 tokens in cl100k_base
    expect(countTokens('hello world')).toBe(2);
  });

  it('returns 0 for empty string', () => {
    expect(countTokens('')).toBe(0);
  });

  it('counts tokens in code', () => {
    const code = 'function hello() { return "world"; }';
    const count = countTokens(code);
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(20);
  });
});

describe('countFileTokens', () => {
  it('returns null for binary content (null byte)', () => {
    const binary = 'text\x00binary';
    expect(countFileTokens(binary)).toBeNull();
  });

  it('returns token count for text content', () => {
    expect(countFileTokens('hello world')).toBe(2);
  });
});
