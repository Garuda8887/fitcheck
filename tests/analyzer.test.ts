import { analyze } from '../src/analyzer';
import type { ScannedFile } from '../src/scanner';

const mockFiles: ScannedFile[] = [
  { absolutePath: '/root/src/index.ts',   relativePath: 'src/index.ts' },
  { absolutePath: '/root/src/utils.ts',   relativePath: 'src/utils.ts' },
  { absolutePath: '/root/docs/README.md', relativePath: 'docs/README.md' },
  { absolutePath: '/root/package.json',   relativePath: 'package.json' },
];

const mockCounts: Map<string, number> = new Map([
  ['src/index.ts',   100],
  ['src/utils.ts',    50],
  ['docs/README.md',  30],
  ['package.json',    20],
]);

describe('analyze', () => {
  it('sums all tokens correctly', () => {
    const result = analyze(mockFiles, mockCounts);
    expect(result.totalTokens).toBe(200);
  });

  it('groups tokens by top-level directory', () => {
    const result = analyze(mockFiles, mockCounts);
    const src = result.byDirectory.find((d) => d.name === 'src');
    expect(src?.tokens).toBe(150);
    expect(src?.percentage).toBe(75);
  });

  it('includes root-level files under "."', () => {
    const result = analyze(mockFiles, mockCounts);
    const root = result.byDirectory.find((d) => d.name === '.');
    expect(root?.tokens).toBe(20);
  });

  it('returns byDirectory sorted descending by token count', () => {
    const result = analyze(mockFiles, mockCounts);
    const counts = result.byDirectory.map((d) => d.tokens);
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
  });

  it('returns top files sorted descending by token count', () => {
    const result = analyze(mockFiles, mockCounts);
    expect(result.topFiles[0].relativePath).toBe('src/index.ts');
    expect(result.topFiles[0].tokens).toBe(100);
  });

  it('reports file count', () => {
    const result = analyze(mockFiles, mockCounts);
    expect(result.fileCount).toBe(4);
  });
});
