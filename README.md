# Preact (Copy-Paste Edition)

Real Preact source, restructured for easy copy-paste usage. **No build step required.** Just drop it into your project.

## Why?

Preact is excellent, but its build system (microbundle, property mangling, multiple output formats) makes it hard to just grab the source and use it directly. This project takes the real, battle-tested Preact source and makes one change: `.js` extensions on all relative imports so it works as native ES modules without a bundler.

This is useful for:

- **Air-gapped systems** - Copy the source directly into your project
- **Security-sensitive codebases** - Auditable source, no supply chain risk
- **Prototyping** - No setup, just import and go
- **Learning** - Read the actual Preact source without build artifacts in the way

This is **real Preact** - not a reimplementation. You get the same proven diffing algorithm, the same hooks, the same compat layer.

## What's Included

| Module      | Import               | Description                                                                                        |
| ----------- | -------------------- | -------------------------------------------------------------------------------------------------- |
| Core        | `preact`             | h, render, Component, Fragment, createContext, cloneElement                                        |
| Hooks       | `preact/hooks`       | useState, useEffect, useReducer, useRef, useMemo, useCallback, useContext, useId, useErrorBoundary |
| Compat      | `preact/compat`      | React compatibility: memo, forwardRef, Suspense, lazy, PureComponent, createPortal, Children       |
| Debug       | `preact/debug`       | Development warnings and component stack traces                                                    |
| DevTools    | `preact/devtools`    | Preact DevTools browser extension support                                                          |
| JSX Runtime | `preact/jsx-runtime` | Automatic JSX transform (Babel/esbuild)                                                            |
| Test Utils  | `preact/test-utils`  | act() and setupRerender() for testing                                                              |

## Installation

### Option 1: Copy and Paste

Copy these directories into your project:

```
your-project/
├── lib/preact/
│   ├── src/              # Core
│   ├── hooks/src/        # Hooks
│   ├── compat/src/       # Compat (optional)
│   ├── debug/src/        # Debug (optional)
│   ├── devtools/src/     # DevTools (optional)
│   ├── jsx-runtime/src/  # JSX Runtime (optional)
│   └── test-utils/src/   # Test Utils (optional)
├── app.js
└── index.html
```

### Option 2: Clone this repo

```bash
git clone <repo-url>
npm install  # only needed for running tests
```

## Usage

### With htm (no build step)

```html
<script type="module">
  import { h, render } from './lib/preact/src/index.js';
  import { useState } from './lib/preact/hooks/src/index.js';
  import htm from 'https://esm.sh/htm';

  const html = htm.bind(h);

  function Counter() {
    const [count, setCount] = useState(0);
    return html`
      <div>
        <p>Count: ${count}</p>
        <button onClick=${() => setCount((c) => c + 1)}>+1</button>
      </div>
    `;
  }

  render(html`<${Counter} />`, document.getElementById('app'));
</script>
```

### With JSX + Vite

```js
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    jsxInject: "import { h, Fragment } from 'preact'",
  },
});
```

```jsx
import { render } from 'preact';
import { useState } from 'preact/hooks';

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>+1</button>
    </div>
  );
}

render(<Counter />, document.getElementById('app'));
```

### DevTools

```js
import 'preact/devtools';
```

### Debug Mode

```js
import 'preact/debug'; // adds development warnings
```

## Running Tests

```bash
npm test
```

## Project Structure

```
src/                      # Core (h, render, Component, Fragment, etc.)
  diff/                   # Reconciliation algorithm
hooks/src/                # Hooks (useState, useEffect, etc.)
compat/src/               # React compatibility layer
debug/src/                # Development warnings
devtools/src/             # DevTools integration
jsx-runtime/src/          # Automatic JSX transform
test-utils/src/           # Testing utilities
tests/                    # Jest test suite
demo-jsx/                 # JSX demo app (Vite)
demo-htm/                 # htm demo app (Vite)
```

## What Changed from Stock Preact

1. **Added `.js` extensions** to all relative imports for native ESM
2. **Removed build system** (microbundle, babel, property mangling)
3. **Removed `.d.ts` type definitions**
4. **Package.json exports** point directly to source files

The JavaScript source is otherwise unmodified.

## License

MIT
