import fs from 'fs';
import path from 'path';
import ignore from 'ignore';

const MAX_FILE_SIZE = 1_000_000; // 1MB

export interface ScannedFile {
  absolutePath: string;
  relativePath: string;
}

export function scanDirectory(root: string): ScannedFile[] {
  const ig = ignore();
  ig.add('.git');

  const gitignorePath = path.join(root, '.gitignore');
  const ctxignorePath = path.join(root, '.ctxignore');

  if (fs.existsSync(gitignorePath)) {
    ig.add(fs.readFileSync(gitignorePath, 'utf8'));
  }
  if (fs.existsSync(ctxignorePath)) {
    ig.add(fs.readFileSync(ctxignorePath, 'utf8'));
  }

  return walk(root, root, ig);
}

function walk(dir: string, root: string, ig: ReturnType<typeof ignore>): ScannedFile[] {
  const results: ScannedFile[] = [];
  let entries: fs.Dirent[];

  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    const absolutePath = path.join(dir, entry.name);
    const relativePath = path.relative(root, absolutePath).split(path.sep).join('/');

    if (ig.ignores(relativePath)) continue;

    if (entry.isDirectory()) {
      results.push(...walk(absolutePath, root, ig));
    } else if (entry.isFile()) {
      try {
        const stat = fs.statSync(absolutePath);
        if (stat.size > MAX_FILE_SIZE) continue;
        results.push({ absolutePath, relativePath });
      } catch {
        continue;
      }
    }
  }

  return results;
}
