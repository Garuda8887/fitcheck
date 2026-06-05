import { getEncoding } from 'js-tiktoken';
import fs from 'fs';

const enc = getEncoding('cl100k_base');

export function countTokens(text: string): number {
  return enc.encode(text).length;
}

export function isBinaryFile(filePath: string): boolean {
  const buffer = Buffer.alloc(512);
  let fd;
  try {
    fd = fs.openSync(filePath, 'r');
    const bytesRead = fs.readSync(fd, buffer, 0, 512, 0);
    for (let i = 0; i < bytesRead; i++) {
      if (buffer[i] === 0) return true;
    }
  } catch {
    return false;
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
  return false;
}

export function countFileTokens(content: string): number {
  return countTokens(content);
}
