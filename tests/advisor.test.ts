import { detectBloat, BLOAT_PATTERNS } from '../src/advisor';
import type { ScannedFile } from '../src/scanner';

const makeFile = (rel: string, tokens: number): [ScannedFile, [string, number]] => [
  { absolutePath: `/root/${rel}`, relativePath: rel },
  [rel, tokens],
];

describe('detectBloat', () => {
  it('detects lock files as bloat', () => {
    const [file, entry] = makeFile('package-lock.json', 5000);
    const counts = new Map([entry]);
    const advice = detectBloat([file], counts, 5000);
    expect(advice.bloat.length).toBeGreaterThan(0);
    expect(advice.bloat[0].pattern).toContain('lock');
  });

  it('detects dist/ directory as bloat', () => {
    const [file, entry] = makeFile('dist/index.js', 8000);
    const counts = new Map([entry]);
    const advice = detectBloat([file], counts, 8000);
    expect(advice.bloat.some((b) => b.pattern.includes('dist'))).toBe(true);
  });

  it('calculates total savings correctly', () => {
    const files: ScannedFile[] = [
      { absolutePath: '/root/dist/a.js', relativePath: 'dist/a.js' },
      { absolutePath: '/root/src/main.ts', relativePath: 'src/main.ts' },
    ];
    const counts = new Map([['dist/a.js', 9000], ['src/main.ts', 1000]]);
    const advice = detectBloat(files, counts, 10000);
    expect(advice.totalSavings).toBe(9000);
    expect(advice.tokensAfterFix).toBe(1000);
  });

  it('returns empty bloat for a clean project', () => {
    const [file, entry] = makeFile('src/index.ts', 100);
    const counts = new Map([entry]);
    const advice = detectBloat([file], counts, 100);
    expect(advice.bloat).toHaveLength(0);
  });

  it('groups multiple files under the same pattern', () => {
    const files: ScannedFile[] = [
      { absolutePath: '/r/dist/a.js', relativePath: 'dist/a.js' },
      { absolutePath: '/r/dist/b.js', relativePath: 'dist/b.js' },
    ];
    const counts = new Map([['dist/a.js', 3000], ['dist/b.js', 4000]]);
    const advice = detectBloat(files, counts, 7000);
    const distEntry = advice.bloat.find((b) => b.pattern.includes('dist'));
    expect(distEntry?.tokens).toBe(7000);
  });
});

describe('BLOAT_PATTERNS', () => {
  it('exports a non-empty array', () => {
    expect(BLOAT_PATTERNS.length).toBeGreaterThan(0);
  });
});
