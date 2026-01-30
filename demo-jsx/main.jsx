/**
 * JSX Demo - Main Entry Point
 *
 * This demonstrates using Worse Preact with JSX syntax.
 * Vite transforms JSX into h() calls using our library.
 */

// Import DevTools integration (connects to Preact DevTools extension)
import 'worse-preact/devtools';

import { render } from 'worse-preact';

// Import all demo components
import { Counter } from './components/Counter.jsx';
import { Timer } from './components/Timer.jsx';
import { TodoList } from './components/TodoList.jsx';
import { Tabs } from './components/Tabs.jsx';
import { MouseTracker } from './components/MouseTracker.jsx';
import { MemoDemo } from './components/MemoDemo.jsx';
import { ReducerDemo } from './components/ReducerDemo.jsx';
import { SVGDemo } from './components/SVGDemo.jsx';
import { FormDemo } from './components/FormDemo.jsx';
import { ThemeDemo } from './components/ThemeDemo.jsx';

function App() {
  return (
    <div>
      <h1>Worse Preact + JSX</h1>
      <p className="subtitle">
        A minimal, readable Preact-compatible library with full JSX support
      </p>

      <Counter />
      <Timer />
      <TodoList />
      <Tabs />
      <MouseTracker />
      <MemoDemo />
      <ReducerDemo />
      <SVGDemo />
      <FormDemo />
      <ThemeDemo />
    </div>
  );
}

// Mount the app
render(<App />, document.getElementById('app'));

console.log('%c✨ Worse Preact JSX Demo Loaded!', 'color: #00d9ff; font-size: 16px; font-weight: bold;');
