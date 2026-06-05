import fs from 'fs';
import os from 'os';
import path from 'path';
import { generateCtxignore } from '../src/init';

function makeTmp(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fitcheck-init-'));
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(dir, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  }
  return dir;
}

describe('generateCtxignore', () => {
  it('detects lock files and adds them to patterns', () => {
    const dir = makeTmp({ 'package-lock.json': '{}', 'src/index.ts': 'hi' });
    const patterns = generateCtxignore(dir);
    expect(patterns.some((p) => p.includes('lock'))).toBe(true);
    fs.rmSync(dir, { recursive: true });
  });

  it('detects dist/ and adds it to patterns', () => {
    const dir = makeTmp({ 'dist/index.js': 'bundled', 'src/index.ts': 'hi' });
    const patterns = generateCtxignore(dir);
    expect(patterns).toContain('dist/');
    fs.rmSync(dir, { recursive: true });
  });

  it('does not include patterns already in .gitignore', () => {
    const dir = makeTmp({
      '.gitignore': 'dist/\n',
      'dist/index.js': 'bundled',
      'src/index.ts': 'hi',
    });
    const patterns = generateCtxignore(dir);
    expect(patterns).not.toContain('dist/');
    fs.rmSync(dir, { recursive: true });
  });

  it('returns empty array for clean project', () => {
    const dir = makeTmp({ 'src/index.ts': 'hi' });
    const patterns = generateCtxignore(dir);
    expect(patterns).toHaveLength(0);
    fs.rmSync(dir, { recursive: true });
  });
});
