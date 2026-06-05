import { parseDiff, getDiffTokens, type DiffResult } from '../src/diff';
import child_process from 'child_process';

jest.mock('child_process');

describe('parseDiff', () => {
  const sampleDiff = `diff --git a/src/index.ts b/src/index.ts
index abc..def 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -1,3 +1,4 @@
 const x = 1;
+const y = 2;
+const z = 3;
-const old = 0;
 export {};
`;

  it('counts added lines excluding diff headers', () => {
    const result = parseDiff(sampleDiff, (text) => text.split(' ').length);
    expect(result.linesAdded).toBe(2);
    expect(result.linesRemoved).toBe(1);
  });

  it('returns zero delta for empty diff', () => {
    const result = parseDiff('', (text) => text.length);
    expect(result.tokensAdded).toBe(0);
    expect(result.tokensRemoved).toBe(0);
    expect(result.netDelta).toBe(0);
  });

  it('calculates net delta as added minus removed', () => {
    const result = parseDiff(sampleDiff, (text) => text.length);
    expect(result.netDelta).toBe(result.tokensAdded - result.tokensRemoved);
  });
});

describe('getDiffTokens', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('calls execSync with correct arguments and parses output', () => {
    (child_process.execSync as jest.Mock).mockReturnValue('+added\n-removed');
    const result = getDiffTokens('.');
    expect(result.linesAdded).toBe(1);
    expect(result.linesRemoved).toBe(1);
  });

  it('throws "git not found" for ENOENT', () => {
    const err = new Error('ENOENT');
    (err as any).code = 'ENOENT';
    (child_process.execSync as jest.Mock).mockImplementation(() => { throw err; });
    expect(() => getDiffTokens('.')).toThrow('git not found in PATH.');
  });

  it('throws generic error for other execSync failures', () => {
    (child_process.execSync as jest.Mock).mockImplementation(() => { throw new Error('crash'); });
    expect(() => getDiffTokens('.')).toThrow('Not a git repository or git command failed.');
  });
});
