# Worse Preact HTM Demo

This demo showcases Worse Preact with [HTM](https://github.com/developit/htm) (Hyperscript Tagged Markup) - a JSX-like syntax using tagged template literals.

## Running the Demo

```bash
npm install
npm run dev
```

Then open http://localhost:3004

## Why HTM?

HTM provides JSX-like syntax without requiring a build step or transpiler:

- **No transpilation needed** - Works directly in the browser
- **Tiny footprint** - Only ~700 bytes gzipped
- **Familiar syntax** - Nearly identical to JSX
- **Perfect for auditing** - What you write is what runs

## Features Demonstrated

| Component | Hooks Used | Description |
|-----------|------------|-------------|
| Counter | `useState` | Basic state management |
| Timer | `useState`, `useEffect` | Side effects with cleanup |
| TodoList | `useState`, `useRef` | Array state, refs |
| Tabs | `useState` | Conditional rendering |
| MouseTracker | `useState`, `useEffect`, `useRef` | Event listeners |
| MemoDemo | `useState`, `useMemo`, `useCallback` | Performance optimization |
| ReducerDemo | `useReducer` | Complex state transitions |
| SVGDemo | `useState` | Dynamic SVG rendering |
| FormDemo | `useState` | Controlled form inputs |
| ThemeDemo | `useState`, `useMemo`, `useCallback` | Dynamic theming |

## How It Works

HTM uses tagged template literals to create virtual DOM nodes:

```javascript
import { h, useState } from 'worse-preact';
import htm from 'htm';

// Bind HTM to our h function
const html = htm.bind(h);

function Counter() {
  const [count, setCount] = useState(0);

  return html`
    <button onClick=${() => setCount(c => c + 1)}>
      Count: ${count}
    </button>
  `;
}
```

### HTM Syntax Notes

| JSX | HTM |
|-----|-----|
| `className="foo"` | `class="foo"` |
| `{value}` | `${value}` |
| `onClick={fn}` | `onClick=${fn}` |
| `<Comp />` | `<${Comp} />` |
| `<Comp>children</Comp>` | `<${Comp}>children<//>` |

## HMR Support

The demo includes Hot Module Replacement. Edit any component and see changes instantly without losing state.

## File Structure

```
demo-htm/
├── index.html          # Entry HTML
├── main.js             # App entry point
├── html.js             # HTM setup (binds htm to h)
├── styles.css          # Shared styles
├── README.md           # This file
└── components/
    ├── Counter.js
    ├── Timer.js
    ├── TodoList.js
    ├── Tabs.js
    ├── MouseTracker.js
    ├── MemoDemo.js
    ├── ReducerDemo.js
    ├── SVGDemo.js
    ├── FormDemo.js
    └── ThemeDemo.js
```

## Using HTM in Your Project

1. Import HTM from a CDN or npm:
   ```javascript
   import htm from 'https://esm.sh/htm@3.1.1';
   // or: import htm from 'htm';
   ```

2. Bind it to the `h` function:
   ```javascript
   import { h } from 'worse-preact';
   const html = htm.bind(h);
   ```

3. Write components:
   ```javascript
   function MyComponent({ name }) {
     return html`<div>Hello, ${name}!</div>`;
   }
   ```
