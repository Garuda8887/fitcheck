import { bar, formatTokens, renderHeader, renderModelFits, renderBreakdown, renderBloat, renderMain } from '../src/renderer';
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

describe('renderBreakdown', () => {
  it('renders directory names and percentages', () => {
    const analysis: Analysis = {
      totalTokens: 200,
      byDirectory: [
        { name: 'src', tokens: 150, percentage: 75 },
        { name: '.', tokens: 50, percentage: 25 },
      ],
      topFiles: [],
      fileCount: 3,
    };
    const out = renderBreakdown(analysis);
    expect(out).toContain('src');
    expect(out).toContain('75%');
    expect(out).toContain('.');
  });
});

describe('renderBloat', () => {
  it('returns empty string when no bloat', () => {
    const advice: Advice = { bloat: [], totalSavings: 0, tokensAfterFix: 1000 };
    expect(renderBloat(advice, 1000)).toBe('');
  });

  it('renders bloat patterns with savings', () => {
    const advice: Advice = {
      bloat: [{ pattern: 'dist/', tokens: 9000, percentage: 90 }],
      totalSavings: 9000,
      tokensAfterFix: 1000,
    };
    const out = renderBloat(advice, 10000);
    expect(out).toContain('dist/');
    expect(out).toContain('1.0k');
  });
});

describe('renderMain', () => {
  it('calls console.log with expected output', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    const analysis: Analysis = { totalTokens: 10, byDirectory: [], topFiles: [], fileCount: 1 };
    const advice: Advice = { bloat: [{ pattern: 'dist/', tokens: 5, percentage: 50 }], totalSavings: 5, tokensAfterFix: 5 };
    renderMain('1.0', analysis, [], advice);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('renders without bloat correctly', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    const analysis: Analysis = { totalTokens: 10, byDirectory: [], topFiles: [], fileCount: 1 };
    const advice: Advice = { bloat: [], totalSavings: 0, tokensAfterFix: 10 };
    renderMain('1.0', analysis, [], advice);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
