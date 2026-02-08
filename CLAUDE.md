# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Real Preact source code, restructured for easy copy-paste usage with no build step. The source is taken directly from Preact with one modification: all relative imports have `.js` extensions added for native ESM compatibility (Node.js, browsers without bundler).

The package is named `preact` in package.json so that cross-module imports (`import { options } from 'preact'`) resolve via Node.js self-referencing.

## Commands

```bash
# Run tests
node --experimental-vm-modules node_modules/jest/bin/jest.js --no-watchman

# Run a single test file
node --experimental-vm-modules node_modules/jest/bin/jest.js --no-watchman tests/smoke.test.js
```

No build step. No linter. Tests use Jest with jsdom and native ES modules (no transform).

## Module Structure

Uses standard Preact import paths:

| Import | Source |
|---|---|
| `preact` | `src/index.js` |
| `preact/hooks` | `hooks/src/index.js` |
| `preact/compat` | `compat/src/index.js` |
| `preact/compat/client` | `compat/client.js` |
| `preact/compat/scheduler` | `compat/scheduler.js` |
| `preact/debug` | `debug/src/index.js` |
| `preact/devtools` | `devtools/src/index.js` |
| `preact/jsx-runtime` | `jsx-runtime/src/index.js` |
| `preact/test-utils` | `test-utils/src/index.js` |

## Architecture

### Options-based plugin system

The core architecture hinges on `src/options.js` - an object with lifecycle hooks (`_diff`, `_render`, `diffed`, `_commit`, `unmount`, etc.). Hooks, debug, and devtools modules extend core behavior by patching these option hooks rather than modifying core code. When adding new cross-cutting behavior, follow this pattern.

### Cross-module imports

- Between modules: always package-qualified (`'preact'`, `'preact/hooks'`)
- Within a module: relative with `.js` extensions (`'./render.js'`, `'../constants.js'`)
- One exception: `hooks/src/index.js` imports `../../src/constants.js` directly

### Rendering pipeline

`render()` → `diff()` → `diffChildren()` → `commitRoot()` (refs → layout effects → schedule passive effects). State updates batch via `queueMicrotask()` and process in depth order (parents before children).

## Test Patterns

```js
// Wait for useEffect (runs after rAF + setTimeout)
const waitForEffects = () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));

// Wait for state update batching
const flushMicrotasks = () => new Promise(r => queueMicrotask(r));
```

Tests create a scratch `<div>`, render into it, and clean up with `render(null, scratch)` in afterEach.
