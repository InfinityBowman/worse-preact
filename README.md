# Worse Preact

A minimal, readable Preact-compatible virtual DOM library. Built as a drop-in replacement for Preact, prioritizing **code clarity** and **simplicity** over micro-optimizations.

## Why?

**Zero dependencies. No build step required. Just copy and paste.**

This library was designed for environments where security and auditability matter:

- **Air-gapped systems** - Copy the `src/` folder directly into your project
- **Security-sensitive codebases** - Every line is readable and auditable
- **Compliance requirements** - Can easily be used without node_modules, no supply chain risk
- **Embedded systems** - Works in any ES6+ JavaScript environment

Preact is excellent, but its codebase is heavily optimized and can be difficult to understand for developers unfamiliar with virtual DOM internals. It is also in TypeScript and has complex build steps whereas this project has none. This project provides the same API with code that's easy to read, audit, and learn from. You can easily swap this out for Preact or React later on if desired.

## Features

- Full Preact API compatibility (h, render, Fragment, hooks)
- Works with [htm](https://github.com/developit/htm) for JSX-like syntax without a build step
- Keyed list reconciliation
- Event delegation
- SVG namespace support
- Hot Module Replacement (HMR) / Fast Refresh with custom vite plugin
- Preact DevTools support
- Comprehensive test suite
- See [Compatibility](#compatibility) for what it's missing

## Installation

### Option 1: Copy and Paste (Recommended for secure environments)

Copy the `src/` directory into your project. No npm, no node_modules, no build step required.

```
your-project/
├── lib/
│   └── worse-preact/    # Copy src/ contents here
│       ├── index.js
│       ├── vnode.js
│       ├── render.js
│       ├── diff.js
│       ├── children.js
│       ├── props.js
│       ├── hooks.js
│       ├── scheduler.js
│       └── options.js
├── app.js
└── index.html
```

### Option 2: npm (For development with tooling)

```bash
npm install
```

## Usage

### No Build Step Required

Works directly in any browser with ES6 module support:

```html
<!DOCTYPE html>
<html>
  <head>
    <script type="module">
      import { h, render, useState } from './lib/worse-preact/index.js';

      function Counter() {
        const [count, setCount] = useState(0);
        return h('div', null, h('p', null, 'Count: ', count), h('button', { onClick: () => setCount((c) => c + 1) }, '+1'));
      }

      render(h(Counter), document.getElementById('app'));
    </script>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>
```

No transpilation. No bundling. No node_modules. Just works.

### With htm (JSX-like syntax, no build step)

[htm](https://github.com/developit/htm) gives you JSX-like syntax using tagged template literals:

```html
<!DOCTYPE html>
<html>
  <head>
    <script type="module">
      import { h, render, useState } from './lib/worse-preact/index.js';
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
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>
```

For fully offline usage, download htm (~1KB) and include it locally.

### With JSX (requires a build step)

```jsx
import { h, render, useState } from 'worse-preact';

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

### With Vite

Configure `vite.config.js`:

```js
import { defineConfig } from 'vite';

export default defineConfig({
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    jsxInject: `import { h, Fragment } from './src/index.js'`,
  },
});
```

### Aliasing React or Preact Imports

You can alias `react`, `react-dom`, or `preact` to use this library instead, allowing you to use existing React/Preact code or libraries.

**Vite:**

```js
// vite.config.js
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      react: path.resolve(__dirname, './src/index.js'),
      'react-dom': path.resolve(__dirname, './src/index.js'),
      preact: path.resolve(__dirname, './src/index.js'),
      'preact/hooks': path.resolve(__dirname, './src/hooks.js'),
    },
  },
  // ...
});
```

**Webpack:**

```js
// webpack.config.js
module.exports = {
  resolve: {
    alias: {
      react: path.resolve(__dirname, './src/index.js'),
      'react-dom': path.resolve(__dirname, './src/index.js'),
      preact: path.resolve(__dirname, './src/index.js'),
      'preact/hooks': path.resolve(__dirname, './src/hooks.js'),
    },
  },
};
```

**esbuild:**

```js
esbuild.build({
  alias: {
    react: './src/index.js',
    'react-dom': './src/index.js',
  },
});
```

This allows code like `import { useState } from 'react'` to work seamlessly.

### DevTools Support

Import the devtools module to enable Preact DevTools:

```js
import 'worse-preact/src/devtools.js';
```

### HMR / Fast Refresh

Import the HMR runtime and use the included Vite plugin:

```js
// main.js
import 'worse-preact/src/hmr.js';
```

```js
// vite.config.js
import { defineConfig } from 'vite';
import worsePreactHMR from './vite-plugin-hmr.js';

export default defineConfig({
  plugins: [worsePreactHMR()],
  // ...
});
```

> **Note:** The official `@preact/preset-vite` does not work with this library. Use the included `vite-plugin-hmr.js` instead.

## API Reference

### Core

| Export                        | Description                              |
| ----------------------------- | ---------------------------------------- |
| `h(type, props, ...children)` | Create a virtual DOM element             |
| `createElement`               | Alias for `h`                            |
| `render(vnode, container)`    | Render a vnode tree to the DOM           |
| `hydrate(vnode, container)`   | Hydrate server-rendered HTML             |
| `Fragment`                    | Group children without a wrapper element |
| `createRef()`                 | Create a ref object `{ current: null }`  |

### Hooks

| Hook                              | Description                              |
| --------------------------------- | ---------------------------------------- |
| `useState(initial)`               | State that triggers re-renders           |
| `useReducer(reducer, initial)`    | State with reducer pattern               |
| `useEffect(callback, deps)`       | Side effects after paint                 |
| `useLayoutEffect(callback, deps)` | Side effects before paint                |
| `useRef(initial)`                 | Mutable ref that persists across renders |
| `useMemo(factory, deps)`          | Memoized computed value                  |
| `useCallback(callback, deps)`     | Memoized callback function               |
| `useContext(context)`             | Read from a context                      |

## Project Structure

```
src/
  index.js       # Public API exports
  vnode.js       # h(), createElement, Fragment, createRef
  render.js      # render() entry point
  diff.js        # Core diffing algorithm
  children.js    # Child reconciliation with key support
  props.js       # DOM property handling, event delegation
  hooks.js       # All React-style hooks
  scheduler.js   # Batched re-render scheduling
  options.js     # Hook points for plugins
  devtools.js    # Preact DevTools integration
  hmr.js         # Hot Module Replacement runtime

demo/
  main.jsx       # Demo app entry point
  components/    # Example components

tests/
  *.test.js      # Jest test suite
```

## Running the Demo

```bash
npm run dev
```

Open http://localhost:3003 in your browser.

## Running Tests

```bash
npm test
```

## Architecture

### VNode Structure

```js
{
  type,        // 'div', MyComponent, or Fragment
  props,       // { className, onClick, children, ... }
  key,         // For list reconciliation
  ref,         // { current } or callback
  _children,   // Processed child vnodes
  _dom,        // Actual DOM element
  _component,  // Component instance (for hooks)
  _parent,     // Parent vnode
  _depth,      // Tree depth
  _flags,      // Reconciliation state
}
```

### Diffing Algorithm

1. **Component** (`typeof type === 'function'`): Call function, diff result
2. **Element** (`typeof type === 'string'`): Create/update DOM, diff children
3. **Text** (`type === null`): Create/update text node

### Child Reconciliation

Two-phase algorithm:

1. **Match phase**: Find matching old children by `(key, type)`
2. **Diff phase**: Recursively diff matched pairs, handle insertions/removals

### Event Delegation

Events use delegation with a single proxy per event type:

```js
dom._listeners[eventName] = handler;
dom.addEventListener(eventName, eventProxy);
```

### Hook State

Hooks store state on the component instance:

```js
component.__hooks = {
  _list: [], // Hook states by call order
  _pendingEffects: [], // Effects queued for after paint
};
```

## Compatibility

This library implements the core APIs needed for most applications:

| Feature                               | Status                                             |
| ------------------------------------- | -------------------------------------------------- |
| Function components                   | Supported                                          |
| All hooks (useState, useEffect, etc.) | Supported                                          |
| Fragments                             | Supported                                          |
| Refs (object and callback)            | Supported                                          |
| Keys                                  | Supported                                          |
| SVG                                   | Supported                                          |
| `Component` class                     | Not included (use function components)             |
| `createContext`                       | Not included (useContext works with plain objects) |
| `forwardRef`                          | Not included                                       |
| `memo`                                | Not included                                       |
| `lazy` / `Suspense`                   | Not included                                       |
| `cloneElement`                        | Not included                                       |
| `createPortal`                        | Not included                                       |

For most applications using modern function components and hooks, this library is a drop-in replacement. Code prioritizes readability over bundle size.

## License

MIT
