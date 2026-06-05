import chalk from 'chalk';
import type { ModelFit } from './models';
import type { Analysis } from './analyzer';
import type { Advice } from './advisor';

const BAR_WIDTH = 16;

export function bar(used: number, total: number, width = BAR_WIDTH): string {
  const ratio = total > 0 ? used / total : 0;
  const filled = Math.min(Math.round(ratio * width), width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

export function formatTokens(n: number): string {
  if (n >= 995_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function renderHeader(fileCount: string, tokenizer: string, version: string): string {
  return chalk.gray(`fitcheck v${version} · ${fileCount} files · ${tokenizer} tokenizer`);
}

export function renderModelFits(fits: ModelFit[], totalTokens: number): string {
  const labelWidth = Math.max(...fits.map((f) => f.model.label.length));
  const lines = fits.map((f) => {
    const icon = f.fits ? chalk.green('✓') : chalk.red('✗');
    const label = f.model.label.padEnd(labelWidth);
    const limit = formatTokens(f.model.tokens).padStart(6);
    const b = bar(totalTokens, f.model.tokens);
    const colored = f.fits ? chalk.green(b) : chalk.red(b);
    const ratio = f.fits
      ? chalk.gray(`${f.percentage}% used`)
      : chalk.red(`${(totalTokens / f.model.tokens).toFixed(1)}× over`);
    return `${icon} ${label}  ${limit}  ${colored}  ${ratio}`;
  });
  return lines.join('\n');
}

export function renderBreakdown(analysis: Analysis): string {
  const lines: string[] = [chalk.gray('breakdown')];
  for (const dir of analysis.byDirectory) {
    const name = dir.name.padEnd(12);
    const b = chalk.blue(bar(dir.tokens, analysis.totalTokens));
    const tokens = formatTokens(dir.tokens).padStart(6);
    const pct = `${dir.percentage}%`.padStart(4);
    lines.push(`${name}  ${b}  ${tokens}  ${pct}`);
  }
  return lines.join('\n');
}

export function renderBloat(advice: Advice, totalTokens: number): string {
  if (advice.bloat.length === 0) return '';

  const lines: string[] = [chalk.yellow('⚠ bloat detected')];
  for (const b of advice.bloat) {
    const pattern = b.pattern.padEnd(20);
    const tokens = formatTokens(b.tokens).padStart(6);
    const pct = chalk.green(`-${b.percentage}%`);
    lines.push(`${pattern}  ${tokens}  →  ${pct}`);
  }
  lines.push(chalk.gray('─'.repeat(45)));
  const after = formatTokens(advice.tokensAfterFix);
  const pctSaved = Math.round((advice.totalSavings / totalTokens) * 100);
  lines.push(`fix all → ${chalk.green(after + ' tokens')}  (save ${pctSaved}%)`);
  lines.push(chalk.gray('run `fitcheck init` to generate .ctxignore'));
  return lines.join('\n');
}

export function renderMain(
  version: string,
  analysis: Analysis,
  fits: ModelFit[],
  advice: Advice,
): void {
  console.log();
  console.log(renderHeader(analysis.fileCount.toLocaleString(), 'cl100k_base', version));
  console.log();
  console.log(chalk.bold(formatTokens(analysis.totalTokens) + ' tokens'));
  console.log();
  console.log(renderModelFits(fits, analysis.totalTokens));
  console.log();
  console.log(renderBreakdown(analysis));
  if (advice.bloat.length > 0) {
    console.log();
    console.log(renderBloat(advice, analysis.totalTokens));
  }
  console.log();
}
