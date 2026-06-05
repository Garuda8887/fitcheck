import { execSync } from 'child_process';
import { countTokens } from './tokenizer';

export interface DiffResult {
  tokensAdded: number;
  tokensRemoved: number;
  netDelta: number;
  linesAdded: number;
  linesRemoved: number;
}

export function parseDiff(diffText: string, counter: (text: string) => number): DiffResult {
  const addedLines: string[] = [];
  const removedLines: string[] = [];

  for (const line of diffText.split('\n')) {
    if (line.startsWith('+++ ') || line.startsWith('--- ')) continue;
    if (line.startsWith('+')) addedLines.push(line.slice(1));
    else if (line.startsWith('-')) removedLines.push(line.slice(1));
  }

  const tokensAdded = addedLines.reduce((sum, l) => sum + counter(l), 0);
  const tokensRemoved = removedLines.reduce((sum, l) => sum + counter(l), 0);

  return {
    tokensAdded,
    tokensRemoved,
    netDelta: tokensAdded - tokensRemoved,
    linesAdded: addedLines.length,
    linesRemoved: removedLines.length,
  };
}

export function getDiffTokens(cwd: string): DiffResult {
  let diffText = '';
  try {
    const unstaged = execSync('git diff', { cwd, encoding: 'utf8' });
    const staged = execSync('git diff --cached', { cwd, encoding: 'utf8' });
    diffText = unstaged + staged;
  } catch {
    throw new Error('Not a git repository. --diff requires git.');
  }
  return parseDiff(diffText, countTokens);
}
