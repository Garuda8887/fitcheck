# Contributing to fitcheck 🚀

First off, thank you for considering contributing to `fitcheck`! We welcome contributions of all sizes—whether it's adding new LLM models, fixing a bug, or proposing a new feature.

## Development Setup

1. Fork and clone the repository.
2. Install the dependencies:
   ```bash
   npm install
   ```
3. You can run the CLI locally using the `dev` script:
   ```bash
   npm run dev -- .
   ```

## Testing

`fitcheck` is thoroughly tested using Jest. Before submitting a Pull Request, please ensure all tests pass cleanly:

```bash
npm run build
npm test
```

## Adding New Models (The easiest way to contribute!)

Because the AI landscape moves fast, the easiest and most helpful way to contribute is by adding new AI models to our local database! 

1. Open `models.json`.
2. Add a new JSON object to the array with the model's `id`, `name`, and `contextWindow` (in tokens).
3. Run `npm test` to ensure the JSON is valid and doesn't break the scanner.
4. Submit your PR!

## Pull Request Guidelines

- Try to keep PRs focused on a single feature or bug fix.
- Ensure your code follows the existing TypeScript style.
- If you are adding a new feature, please try to add a relevant test case in the `tests/` directory.

We actively monitor PRs and look forward to reviewing yours!
