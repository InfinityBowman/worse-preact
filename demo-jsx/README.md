# Worse Preact JSX Demo

This demo showcases Worse Preact with JSX syntax, using Vite for development.

## Running the Demo

```bash
npm run dev:jsx
```

Then open http://localhost:3003

## Features Demonstrated

| Component | Hooks Used | Description |
|-----------|------------|-------------|
| Counter | `useState` | Basic state management with increment/decrement |
| Timer | `useState`, `useEffect` | Side effects with cleanup (interval) |
| TodoList | `useState`, `useRef` | Array state, refs for DOM access |
| Tabs | `useState` | Conditional rendering |
| MouseTracker | `useState`, `useEffect`, `useRef` | Event listeners with cleanup |
| MemoDemo | `useState`, `useMemo`, `useCallback` | Performance optimization |
| ReducerDemo | `useReducer` | Complex state transitions |
| SVGDemo | `useState` | Dynamic SVG rendering |
| FormDemo | `useState` | Controlled form inputs |
| ThemeDemo | `useState`, `useMemo`, `useCallback` | Dynamic theming, prop drilling |

## How It Works

Vite transforms JSX syntax into `h()` function calls using esbuild:

```jsx
// You write:
<button onClick={() => setCount(c => c + 1)}>
  Count: {count}
</button>

// Becomes:
h('button', { onClick: () => setCount(c => c + 1) },
  'Count: ', count
)
```

The config in `vite.config.jsx.js` sets up:
- `jsxFactory: 'h'` - Use our `h` function for elements
- `jsxFragment: 'Fragment'` - Use our `Fragment` for `<>...</>`
- `jsxInject` - Auto-import `h` and `Fragment` in every file

## HMR Support

The demo includes Hot Module Replacement via the custom Vite plugin. Edit any component and see changes instantly without losing state.

## File Structure

```
demo-jsx/
├── index.html          # Entry HTML
├── main.jsx            # App entry point
├── styles.css          # Shared styles
├── README.md           # This file
└── components/
    ├── Counter.jsx
    ├── Timer.jsx
    ├── TodoList.jsx
    ├── Tabs.jsx
    ├── MouseTracker.jsx
    ├── MemoDemo.jsx
    ├── ReducerDemo.jsx
    ├── SVGDemo.jsx
    ├── FormDemo.jsx
    └── ThemeDemo.jsx
```
