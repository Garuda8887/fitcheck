# fitcheck

> Know before you prompt.

See exactly how many tokens your codebase costs, which LLM context windows it fits in, and what to cut to get under the limit.

```bash
npx fitcheck .
```

---

## What it does

![fitcheck terminal output](./test.png)

## Install

```bash
# Zero install — just run it
npx fitcheck .

# Or install globally
npm install -g fitcheck
```

## Commands

| Command | Description |
|---|---|
| `fitcheck .` | Analyze current directory |
| `fitcheck ./src` | Analyze a subfolder |
| `fitcheck . --target claude-sonnet-4` | Focus trim advice on one model |
| `fitcheck diff` | Token cost of current git changes |
| `fitcheck init` | Generate `.ctxignore` with smart defaults |
| `fitcheck . --json` | Machine-readable output |

## .ctxignore

Like `.gitignore` but for AI context windows. Run `fitcheck init` to generate one automatically, or create it manually with standard gitignore syntax.

```
# .ctxignore
dist/
package-lock.json
yarn.lock
coverage/
*.min.js
```

fitcheck respects both `.gitignore` and `.ctxignore` when scanning.

## Models

All major LLM context windows are checked automatically. The model list lives in [`models.json`](models.json) — PRs welcome to add new models.

Current models: Claude Opus/Sonnet/Haiku 4, GPT-4o, GPT-4o mini, Gemini 1.5 Pro, Gemini 2.0 Flash, DeepSeek V3, Llama 3.1 70B.

## License

MIT
