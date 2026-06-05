import type { ScannedFile } from './scanner';

export interface FileToken {
  relativePath: string;
  tokens: number;
}

export interface DirectoryToken {
  name: string;
  tokens: number;
  percentage: number;
}

export interface Analysis {
  totalTokens: number;
  byDirectory: DirectoryToken[];
  topFiles: FileToken[];
  fileCount: number;
}

export function analyze(files: ScannedFile[], tokenCounts: Map<string, number>): Analysis {
  const dirMap = new Map<string, number>();
  const fileTokens: FileToken[] = [];

  for (const file of files) {
    const count = tokenCounts.get(file.relativePath) ?? 0;
    fileTokens.push({ relativePath: file.relativePath, tokens: count });

    const parts = file.relativePath.split('/');
    const topDir = parts.length > 1 ? parts[0] : '.';
    dirMap.set(topDir, (dirMap.get(topDir) ?? 0) + count);
  }

  const totalTokens = fileTokens.reduce((sum, f) => sum + f.tokens, 0);

  const byDirectory: DirectoryToken[] = Array.from(dirMap.entries())
    .map(([name, tokens]) => ({
      name,
      tokens,
      percentage: totalTokens > 0 ? Math.round((tokens / totalTokens) * 100) : 0,
    }))
    .sort((a, b) => b.tokens - a.tokens);

  const topFiles = [...fileTokens]
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, 10);

  return { totalTokens, byDirectory, topFiles, fileCount: files.length };
}
