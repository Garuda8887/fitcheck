import { loadModels, checkFit } from '../src/models';

describe('loadModels', () => {
  it('returns a non-empty array', () => {
    const models = loadModels();
    expect(models.length).toBeGreaterThan(0);
  });

  it('each model has id, label, and positive token count', () => {
    const models = loadModels();
    for (const m of models) {
      expect(typeof m.id).toBe('string');
      expect(typeof m.label).toBe('string');
      expect(m.tokens).toBeGreaterThan(0);
    }
  });
});

describe('checkFit', () => {
  it('marks model as fitting when total is under limit', () => {
    const fits = checkFit(100000, [{ id: 'x', label: 'X', tokens: 200000 }]);
    expect(fits[0].fits).toBe(true);
    expect(fits[0].percentage).toBe(50);
  });

  it('marks model as over when total exceeds limit', () => {
    const fits = checkFit(300000, [{ id: 'x', label: 'X', tokens: 200000 }]);
    expect(fits[0].fits).toBe(false);
    expect(fits[0].ratio).toBeCloseTo(1.5);
  });

  it('handles zero tokens (empty project) — fits all models', () => {
    const fits = checkFit(0, [{ id: 'x', label: 'X', tokens: 200000 }]);
    expect(fits[0].fits).toBe(true);
    expect(fits[0].percentage).toBe(0);
  });

  it('marks model as fitting at exact limit', () => {
    const fits = checkFit(200000, [{ id: 'x', label: 'X', tokens: 200000 }]);
    expect(fits[0].fits).toBe(true);
  });

  it('returns empty array for empty models list', () => {
    expect(checkFit(100000, [])).toEqual([]);
  });

  it('throws for negative totalTokens', () => {
    expect(() => checkFit(-1, [{ id: 'x', label: 'X', tokens: 200000 }])).toThrow();
  });
});
