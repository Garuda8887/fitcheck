import fs from 'fs';
import os from 'os';
import path from 'path';
import { scanDirectory } from '../src/scanner';

function makeTmp(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fitcheck-'));
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(dir, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  }
  return dir;
}

describe('scanDirectory', () => {
  it('returns all files in a flat directory', () => {
    const dir = makeTmp({ 'a.ts': 'hello', 'b.ts': 'world' });
    const files = scanDirectory(dir);
    const names = files.map((f) => f.relativePath).sort();
    expect(names).toEqual(['a.ts', 'b.ts']);
    fs.rmSync(dir, { recursive: true });
  });

  it('excludes files matching .gitignore patterns', () => {
    const dir = makeTmp({
      '.gitignore': 'ignored.ts\n',
      'kept.ts': 'hello',
      'ignored.ts': 'nope',
    });
    const files = scanDirectory(dir);
    const names = files.map((f) => f.relativePath);
    expect(names).toContain('kept.ts');
    expect(names).not.toContain('ignored.ts');
    fs.rmSync(dir, { recursive: true });
  });

  it('excludes files matching .ctxignore patterns', () => {
    const dir = makeTmp({
      '.ctxignore': 'big-file.ts\n',
      'small.ts': 'hi',
      'big-file.ts': 'huge',
    });
    const files = scanDirectory(dir);
    const names = files.map((f) => f.relativePath);
    expect(names).toContain('small.ts');
    expect(names).not.toContain('big-file.ts');
    fs.rmSync(dir, { recursive: true });
  });

  it('always excludes .git directory', () => {
    const dir = makeTmp({
      '.git/HEAD': 'ref: refs/heads/main',
      'src/index.ts': 'export {}',
    });
    const files = scanDirectory(dir);
    const names = files.map((f) => f.relativePath);
    expect(names.some((n) => n.startsWith('.git'))).toBe(false);
    fs.rmSync(dir, { recursive: true });
  });

  it('skips files over 1MB', () => {
    const dir = makeTmp({ 'big.ts': 'x'.repeat(1_100_000) });
    const files = scanDirectory(dir);
    const names = files.map((f) => f.relativePath);
    expect(names).not.toContain('big.ts');
    fs.rmSync(dir, { recursive: true });
  });

  it('excludes entire directory when gitignore pattern has trailing slash', () => {
    const dir = makeTmp({
      '.gitignore': 'dist/\n',
      'dist/bundle.js': 'built code',
      'dist/index.js': 'built code',
      'src/main.ts': 'source',
    });
    const files = scanDirectory(dir);
    const names = files.map((f) => f.relativePath);
    expect(names).not.toContain('dist/bundle.js');
    expect(names).not.toContain('dist/index.js');
    expect(names).toContain('src/main.ts');
    fs.rmSync(dir, { recursive: true });
  });

  it('returns empty array if readdirSync throws', () => {
    jest.spyOn(fs, 'readdirSync').mockImplementationOnce(() => { throw new Error('EACCES'); });
    const files = scanDirectory('some-fake-dir');
    expect(files).toEqual([]);
    jest.restoreAllMocks();
  });

  it('skips file if statSync throws', () => {
    const dir = makeTmp({ 'bad.ts': 'x' });
    jest.spyOn(fs, 'statSync').mockImplementationOnce(() => { throw new Error('ENOENT'); });
    const files = scanDirectory(dir);
    expect(files).toEqual([]);
    jest.restoreAllMocks();
    fs.rmSync(dir, { recursive: true });
  });
});
