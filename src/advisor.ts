import type { ScannedFile } from './scanner';

export interface BloatEntry {
  pattern: string;
  tokens: number;
  percentage: number;
}

export interface Advice {
  bloat: BloatEntry[];
  totalSavings: number;
  tokensAfterFix: number;
}

interface BloatRule {
  pattern: string;
  match: (rel: string) => boolean;
}

export const BLOAT_PATTERNS: BloatRule[] = [
  { pattern: 'node_modules/', match: (r) => r.startsWith('node_modules/') || r.includes('/node_modules/') },
  { pattern: '*.lock files',  match: (r) => /\.(lock)$/.test(r) || r === 'package-lock.json' || r === 'yarn.lock' || r === 'pnpm-lock.yaml' || r === 'Cargo.lock' || r === 'poetry.lock' },
  { pattern: 'dist/',         match: (r) => r.startsWith('dist/') },
  { pattern: 'build/',        match: (r) => r.startsWith('build/') },
  { pattern: 'out/',          match: (r) => r.startsWith('out/') },
  { pattern: '.next/',        match: (r) => r.startsWith('.next/') },
  { pattern: '.nuxt/',        match: (r) => r.startsWith('.nuxt/') },
  { pattern: '__pycache__/',  match: (r) => r.includes('__pycache__/') },
  { pattern: '*.pyc',         match: (r) => r.endsWith('.pyc') },
  { pattern: '*.min.js',      match: (r) => r.endsWith('.min.js') },
  { pattern: '*.min.css',     match: (r) => r.endsWith('.min.css') },
  { pattern: '*.map',         match: (r) => r.endsWith('.map') },
  { pattern: 'coverage/',     match: (r) => r.startsWith('coverage/') || r.startsWith('.nyc_output/') },
];

export function detectBloat(
  files: ScannedFile[],
  tokenCounts: Map<string, number>,
  totalTokens: number,
): Advice {
  const patternTotals = new Map<string, number>();

  for (const file of files) {
    const tokens = tokenCounts.get(file.relativePath) ?? 0;
    for (const rule of BLOAT_PATTERNS) {
      if (rule.match(file.relativePath)) {
        patternTotals.set(rule.pattern, (patternTotals.get(rule.pattern) ?? 0) + tokens);
        break;
      }
    }
  }

  const bloat: BloatEntry[] = Array.from(patternTotals.entries())
    .filter(([, tokens]) => tokens > 0)
    .map(([pattern, tokens]) => ({
      pattern,
      tokens,
      percentage: totalTokens > 0 ? Math.round((tokens / totalTokens) * 100) : 0,
    }))
    .sort((a, b) => b.tokens - a.tokens);

  const totalSavings = bloat.reduce((sum, b) => sum + b.tokens, 0);

  return {
    bloat,
    totalSavings,
    tokensAfterFix: totalTokens - totalSavings,
  };
}
