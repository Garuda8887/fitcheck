import path from 'path';
import fs from 'fs';
import { scanDirectory } from '../src/scanner';
import { countFileTokens } from '../src/tokenizer';
import { analyze } from '../src/analyzer';
import { detectBloat } from '../src/advisor';
import { loadModels, checkFit } from '../src/models';

const FIXTURE = path.join(__dirname, '..', 'fixtures', 'sample-project');

describe('integration: sample-project (no ignore files)', () => {
  it('scans all files including dist/ and lock file', () => {
    const files = scanDirectory(FIXTURE);
    const names = files.map((f) => f.relativePath);
    expect(names).toContain('dist/bundle.js');
    expect(names).toContain('package-lock.json');
    expect(names).toContain('src/main.ts');
  });

  it('produces a positive total token count', () => {
    const files = scanDirectory(FIXTURE);
    const counts = new Map<string, number>();
    for (const f of files) {
      const content = fs.readFileSync(f.absolutePath, 'utf8');
      const n = countFileTokens(content);
      if (n !== null) counts.set(f.relativePath, n);
    }
    const analysis = analyze(files, counts);
    expect(analysis.totalTokens).toBeGreaterThan(0);
  });

  it('detects dist/ and package-lock.json as bloat', () => {
    const files = scanDirectory(FIXTURE);
    const counts = new Map<string, number>();
    for (const f of files) {
      const content = fs.readFileSync(f.absolutePath, 'utf8');
      const n = countFileTokens(content);
      if (n !== null) counts.set(f.relativePath, n);
    }
    const analysis = analyze(files, counts);
    const advice = detectBloat(files, counts, analysis.totalTokens);
    const patterns = advice.bloat.map((b) => b.pattern);
    expect(patterns.some((p) => p.includes('dist'))).toBe(true);
    expect(patterns.some((p) => p.includes('lock'))).toBe(true);
  });

  it('fits in all model context windows (fixture is tiny)', () => {
    const files = scanDirectory(FIXTURE);
    const counts = new Map<string, number>();
    for (const f of files) {
      const content = fs.readFileSync(f.absolutePath, 'utf8');
      const n = countFileTokens(content);
      if (n !== null) counts.set(f.relativePath, n);
    }
    const analysis = analyze(files, counts);
    const fits = checkFit(analysis.totalTokens, loadModels());
    expect(fits.every((f) => f.fits)).toBe(true);
  });
});
