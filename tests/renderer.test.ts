import { bar, formatTokens, renderHeader, renderModelFits, renderBreakdown, renderBloat } from '../src/renderer';
import type { ModelFit } from '../src/models';
import type { Analysis } from '../src/analyzer';
import type { Advice } from '../src/advisor';

describe('bar', () => {
  it('fills full bar when ratio >= 1', () => {
    expect(bar(200, 100, 10)).toBe('██████████');
  });

  it('fills half bar at 50%', () => {
    expect(bar(50, 100, 10)).toBe('█████░░░░░');
  });

  it('fills empty bar at 0', () => {
    expect(bar(0, 100, 10)).toBe('░░░░░░░░░░');
  });
});

describe('formatTokens', () => {
  it('formats thousands with k suffix', () => {
    expect(formatTokens(412847)).toBe('412.8k');
  });

  it('formats millions with M suffix', () => {
    expect(formatTokens(1500000)).toBe('1.5M');
  });

  it('formats small numbers as-is', () => {
    expect(formatTokens(500)).toBe('500');
  });
});

describe('renderHeader', () => {
  it('returns a string containing the version', () => {
    const out = renderHeader('2,847', 'cl100k_base', '1.2.3');
    expect(out).toContain('1.2.3');
    expect(out).toContain('2,847');
  });
});

describe('renderModelFits', () => {
  const fits: ModelFit[] = [
    { model: { id: 'x', label: 'TestModel', tokens: 200000 }, fits: true, ratio: 0.5, percentage: 50 },
    { model: { id: 'y', label: 'SmallModel', tokens: 100000 }, fits: false, ratio: 2.0, percentage: 200 },
  ];

  it('returns a string with ✓ for fitting models', () => {
    const out = renderModelFits(fits, 100000);
    expect(out).toContain('✓');
    expect(out).toContain('TestModel');
  });

  it('returns a string with ✗ for over-limit models', () => {
    const out = renderModelFits(fits, 100000);
    expect(out).toContain('✗');
    expect(out).toContain('SmallModel');
  });
});
