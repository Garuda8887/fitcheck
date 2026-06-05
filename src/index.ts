#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { loadModels, checkFit } from './models';
import { scanDirectory } from './scanner';
import { countFileTokens } from './tokenizer';
import { analyze } from './analyzer';
import { detectBloat } from './advisor';
import { renderMain, renderModelFits } from './renderer';
import { getDiffTokens } from './diff';
import chalk from 'chalk';

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')) as { version: string };

const program = new Command();

program
  .name('fitcheck')
  .version(pkg.version)
  .description('Know before you prompt. Token budgets for AI-native developers.');

program
  .argument('[path]', 'directory to analyze', '.')
  .option('--target <model>', 'focus trim advice on a specific model ID')
  .option('--json', 'output results as JSON')
  .action((targetPath: string, options: { target?: string; json?: boolean }) => {
    const root = path.resolve(targetPath);

    if (!fs.existsSync(root)) {
      console.error(chalk.red(`Path not found: ${root}`));
      process.exit(1);
    }

    const files = scanDirectory(root);
    if (files.length === 0) {
      console.error(chalk.yellow('No readable files found.'));
      process.exit(0);
    }

    const tokenCounts = new Map<string, number>();
    let skipped = 0;

    for (const file of files) {
      try {
        const content = fs.readFileSync(file.absolutePath, 'utf8');
        const count = countFileTokens(content);
        if (count === null) { skipped++; continue; }
        tokenCounts.set(file.relativePath, count);
      } catch {
        skipped++;
      }
    }

    const analysis = analyze(files, tokenCounts);
    const models = loadModels();
    const fits = checkFit(analysis.totalTokens, models);
    const advice = detectBloat(files, tokenCounts, analysis.totalTokens);

    if (options.json) {
      console.log(JSON.stringify({ totalTokens: analysis.totalTokens, fileCount: analysis.fileCount, skipped, byDirectory: analysis.byDirectory, topFiles: analysis.topFiles, modelFits: fits, bloat: advice.bloat }, null, 2));
      return;
    }

    renderMain(pkg.version, analysis, fits, advice);

    if (skipped > 0) {
      console.log(chalk.gray(`  ${skipped} files skipped (binary or unreadable)`));
    }
  });

program
  .command('diff')
  .description('Show token cost of current git changes')
  .action(() => {
    const root = process.cwd();
    let diffResult: ReturnType<typeof getDiffTokens>;
    try {
      diffResult = getDiffTokens(root);
    } catch (err: unknown) {
      console.error(chalk.red((err as Error).message));
      process.exit(1);
    }

    const files = scanDirectory(root);
    const tokenCounts = new Map<string, number>();
    for (const file of files) {
      try {
        const content = fs.readFileSync(file.absolutePath, 'utf8');
        const count = countFileTokens(content);
        if (count !== null) tokenCounts.set(file.relativePath, count);
      } catch { /* skip */ }
    }

    const analysis = analyze(files, tokenCounts);
    const models = loadModels();
    const fits = checkFit(analysis.totalTokens + diffResult.netDelta, models);

    console.log();
    const sign = diffResult.netDelta >= 0 ? '+' : '';
    const deltaColor = diffResult.netDelta > 0 ? chalk.red : chalk.green;
    console.log(chalk.bold(`${analysis.totalTokens.toLocaleString()} tokens (current)`));
    console.log();
    console.log(deltaColor(`${sign}${diffResult.tokensAdded} tokens added`) + chalk.gray(` / -${diffResult.tokensRemoved} removed`));
    console.log(chalk.gray(`net: ${sign}${diffResult.netDelta} → ${(analysis.totalTokens + diffResult.netDelta).toLocaleString()} tokens after apply`));
    console.log();
    console.log(renderModelFits(fits, analysis.totalTokens + diffResult.netDelta));
    console.log();
  });

program
  .command('init')
  .description('Generate a .ctxignore with smart defaults for this project')
  .action(() => {
    const root = process.cwd();
    const { generateCtxignore, writeCtxignore } = require('./init') as typeof import('./init');
    const ctxignorePath = path.join(root, '.ctxignore');

    const patterns = generateCtxignore(root);

    if (patterns.length === 0) {
      console.log(chalk.green('✓ No bloat detected — project looks clean.'));
      return;
    }

    if (fs.existsSync(ctxignorePath)) {
      console.log(chalk.yellow('⚠ .ctxignore already exists. Delete it first to regenerate.'));
      return;
    }

    try {
      writeCtxignore(root, patterns);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(chalk.red(`✗ Could not write .ctxignore: ${msg}`));
      process.exit(1);
    }
    console.log(chalk.green(`✓ Written .ctxignore with ${patterns.length} exclusion patterns:`));
    for (const p of patterns) console.log(chalk.gray(`  ${p}`));
    console.log();
    console.log(chalk.gray('Run `fitcheck .` to see your new token count.'));
  });

program.parse();
