# fitcheck — Design Spec
**Date:** 2026-06-05
**Status:** Approved

---

## Overview

**fitcheck** is a zero-install CLI tool that tells developers exactly how many tokens their codebase costs, which AI models it fits in, and what to cut to get it under the limit.

**Tagline:** *Know before you prompt.*

**Hero concept:** `.ctxignore` — like `.gitignore` but for AI context windows.

**Install / run:**
```
npx fitcheck .          # zero install
npm install -g fitcheck # global install
```

---

## Problem

Developers using AI coding tools (Claude Code, Cursor, Copilot Workspace) don't know how much of their codebase is being loaded into the context window. They hit limits silently — degraded responses, truncated context, cryptic errors. There's no standard tool to measure this, no standard way to exclude irrelevant files, and no standard way to budget token usage across different models.

---

## Commands

### `fitcheck [path]`
Main command. Analyzes a directory (defaults to `.`).

Output:
- Total token count
- Per-model fit status (pass/fail with ratio)
- Token breakdown by top-level folder (bar chart, descending)
- Top 5 files by token count
- Auto-detected bloat with per-pattern token savings and cumulative fix

### `fitcheck [path] --target <model>`
Same as above but trim advisor focuses exclusively on the named model. Used when you have a specific target (e.g. `--target claude-sonnet`).

### `fitcheck --diff`
Scans the current directory (same as `fitcheck .`) then counts tokens in current git changes on top. Shows current project total, tokens added/removed by the diff, and updated per-model fit status. Shells out to both `git diff` (unstaged) and `git diff --cached` (staged) to capture all pending changes.

### `fitcheck init`
Scans the current directory for detected bloat patterns and writes a `.ctxignore` seeded with those exclusions. Non-destructive — prompts before overwriting an existing file.

### `fitcheck [path] --json`
Outputs full analysis as JSON to stdout. For CI pipelines and scripting.

### `fitcheck [path] --no-chart`
Suppresses bar charts for very tight terminals or piped output. Default output includes charts.

---

## Architecture

```
fitcheck/
├── src/
│   ├── index.ts        # CLI entry point (commander.js)
│   ├── scanner.ts      # File system traversal + ignore logic
│   ├── tokenizer.ts    # tiktoken cl100k_base wrapper
│   ├── models.ts       # Model registry (name → context window)
│   ├── analyzer.ts     # Aggregates token counts by dir/file
│   ├── advisor.ts      # Bloat detection + savings calc + .ctxignore writer
│   ├── diff.ts         # git diff → token delta
│   └── renderer.ts     # Terminal output (chalk + inline bar charts)
├── models.json         # Community-maintained model list
├── package.json
├── tsconfig.json
└── README.md
```

**Data flow:**
```
scanner → tokenizer → analyzer → advisor → renderer
                                         ↗
                    diff (git) ─────────
```

No network calls. No telemetry. Fully offline.

---

## Token Counting

**Tokenizer:** tiktoken `cl100k_base` (same encoding used by GPT-4, accurate for OpenAI models, ~5% approximation for Claude — acceptable margin for budgeting purposes).

**File handling:**
- Files over 1MB: skip with a warning at the end of output
- Binary files (detected by extension + null byte sniff): skip silently
- Symlinks: follow once, skip circular
- Encoding: UTF-8 assumed; fallback to latin-1 on decode error

---

## Model Registry

Stored in `models.json` at the project root. Community-updatable via PR — this is intentional, it drives ongoing contributions.

```json
[
  { "id": "claude-opus-4",     "label": "Claude Opus 4",     "tokens": 200000 },
  { "id": "claude-sonnet-4",   "label": "Claude Sonnet 4",   "tokens": 200000 },
  { "id": "claude-haiku-4",    "label": "Claude Haiku 4",    "tokens": 200000 },
  { "id": "gpt-4o",            "label": "GPT-4o",            "tokens": 128000 },
  { "id": "gpt-4o-mini",       "label": "GPT-4o mini",       "tokens": 128000 },
  { "id": "gemini-1.5-pro",    "label": "Gemini 1.5 Pro",    "tokens": 1000000 },
  { "id": "gemini-2.0-flash",  "label": "Gemini 2.0 Flash",  "tokens": 1000000 },
  { "id": "deepseek-v3",       "label": "DeepSeek V3",       "tokens": 128000 },
  { "id": "llama-3.1-70b",     "label": "Llama 3.1 70B",     "tokens": 128000 }
]
```

---

## Smart Bloat Detection

`advisor.ts` flags these patterns automatically. Each pattern includes a human-readable reason shown in output.

| Pattern | Reason |
|---|---|
| `node_modules/` | Dependency source, never needed in context |
| `.git/` | Version control internals |
| `*.lock` (package-lock.json, yarn.lock, pnpm-lock.yaml, Cargo.lock, poetry.lock) | Machine-generated, unreadable by LLMs |
| `dist/`, `build/`, `out/`, `.next/`, `.nuxt/` | Build artifacts |
| `__pycache__/`, `*.pyc` | Python bytecode |
| `*.min.js`, `*.min.css` | Minified, unreadable |
| `*.map` | Source maps |
| `coverage/`, `.nyc_output/` | Test coverage reports |
| Files >50k tokens containing `@generated` or `Code generated by` | Generated source |

Detection runs against the file tree regardless of whether patterns are already in `.gitignore`. If a pattern is already excluded, it's not re-flagged.

---

## .ctxignore

Same syntax as `.gitignore`. Applied on top of `.gitignore` — both are respected by default when scanning.

`fitcheck init` generates a `.ctxignore` containing every detected bloat pattern found in the current repo. If a `.ctxignore` already exists, prompts before overwriting.

Example generated `.ctxignore`:
```
# Generated by fitcheck init
# Remove lines you want to include in context

node_modules/
dist/
build/
*.lock
coverage/
*.min.js
*.map
__pycache__/
```

---

## Output Format (compact, default)

```
fitcheck v1.0.0 · 2,847 files · cl100k tokenizer

412,847 tokens

✗ Claude Sonnet  200k  ████████████░░░░  2.1× over
✗ GPT-4o         128k  ████████████░░░░  3.2× over
✓ Gemini 1.5 Pro   1M  ██░░░░░░░░░░░░░░  41% used

breakdown
src/     ██████████████░░  310k  75%
docs/    ████░░░░░░░░░░░░   62k  15%
tests/   ██░░░░░░░░░░░░░░   28k   7%

⚠ bloat detected
node_modules/  95k → -23%
dist/          62k → -15%
*.lock         28k  → -7%
─────────────────────────────────────────
fix all → 226k tokens  ✓ fits Claude Sonnet with 90k to spare

run `fitcheck init` to generate .ctxignore
```

---

## `--diff` Output

```
fitcheck --diff

185,564 tokens (current)  ·  staged + unstaged changes  ·  cl100k tokenizer

+ 1,842 tokens added   (src/api/auth.ts +1.2k, src/schema.ts +642)
- 203 tokens removed
net: +1,639 tokens  →  187,203 tokens after apply

✗ Claude Sonnet  187,203 / 200,000  ████████████████████  94% — 12,797 to spare
✓ GPT-4o          68,103 / 128,000  ██████████░░░░░░░░░░  53% — 59,897 to spare
```

---

## Error Handling

| Scenario | Behavior |
|---|---|
| No files found | "No readable files found in `<path>`." |
| Not a git repo (--diff) | "Not a git repository. `--diff` requires git." |
| Over 100k files | Warning: "Large repo detected. Consider scoping: `fitcheck ./src`" — continues |
| All files binary/skipped | "No tokenizable files found." with list of skipped extensions |
| Unreadable file | Skip silently, count in "X files skipped" summary line |

---

## Testing

- **Unit — tokenizer:** Known strings → expected token counts (regression guard against tiktoken version bumps)
- **Unit — bloat detection:** Each pattern fires correctly on matching filenames, does not fire on non-matches
- **Unit — advisor savings:** Given a fake file tree with known token counts, assert savings calculation
- **Integration:** Scan `fixtures/sample-project/` (committed test fixture), assert total tokens and breakdown shape
- **Snapshot:** `renderer.ts` output for a fixed input stays stable across refactors

---

## Distribution & Virality Plan

1. **README animated GIF** — demo of `npx fitcheck .` on a real project hitting the bloat detection moment. Non-negotiable for GitHub stars.
2. **`npm publish fitcheck`** — `npx fitcheck .` works day one, no global install needed.
3. **`.ctxignore` as the shareable concept** — shows up in PRs, people ask "what's that?", organic spread.
4. **`models.json` as community contribution target** — easy PRs to add new models, drives regular activity and GitHub traffic.
5. **`fitcheck --diff` as daily-use hook** — reason to keep it installed permanently, not just a one-time audit.
