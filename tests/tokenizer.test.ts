import { countTokens, countFileTokens, isBinaryFile } from '../src/tokenizer';
import fs from 'fs';
import os from 'os';
import path from 'path';

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
  it('returns token count for text content', () => {
    expect(countFileTokens('hello world')).toBe(2);
  });
});

describe('isBinaryFile', () => {
  it('returns true for binary file', () => {
    const tmpFile = path.join(os.tmpdir(), 'test_binary.bin');
    fs.writeFileSync(tmpFile, Buffer.from([0x00, 0x01, 0x02]));
    expect(isBinaryFile(tmpFile)).toBe(true);
    fs.unlinkSync(tmpFile);
  });

  it('returns false for text file', () => {
    const tmpFile = path.join(os.tmpdir(), 'test_text.txt');
    fs.writeFileSync(tmpFile, 'hello world', 'utf8');
    expect(isBinaryFile(tmpFile)).toBe(false);
    fs.unlinkSync(tmpFile);
  });

  it('returns false if file open throws', () => {
    jest.spyOn(fs, 'openSync').mockImplementationOnce(() => { throw new Error('EACCES'); });
    expect(isBinaryFile('some-fake-path')).toBe(false);
    jest.restoreAllMocks();
  });
});
