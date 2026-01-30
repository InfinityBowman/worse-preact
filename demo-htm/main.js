/**
 * HTM Demo - Main Entry Point
 *
 * This demonstrates using Worse Preact with HTM (Hyperscript Tagged Markup).
 * HTM lets you write JSX-like syntax using tagged template literals - no build step required!
 */

// Import HMR runtime first (sets up hooks before any components load)
import 'worse-preact/hmr';

// Import DevTools integration (connects to Preact DevTools extension)
import 'worse-preact/devtools';

import { render } from 'worse-preact';
import { html } from './html.js';

// Import all demo components
import { Counter } from './components/Counter.js';
import { Timer } from './components/Timer.js';
import { TodoList } from './components/TodoList.js';
import { Tabs } from './components/Tabs.js';
import { MouseTracker } from './components/MouseTracker.js';
import { MemoDemo } from './components/MemoDemo.js';
import { ReducerDemo } from './components/ReducerDemo.js';
import { SVGDemo } from './components/SVGDemo.js';
import { FormDemo } from './components/FormDemo.js';
import { ThemeDemo } from './components/ThemeDemo.js';

function App() {
  return html`
    <div>
      <h1>Worse Preact + HTM</h1>
      <p class="subtitle">
        Tagged template literals - no JSX transpiler needed!
      </p>

      <${Counter} />
      <${Timer} />
      <${TodoList} />
      <${Tabs} />
      <${MouseTracker} />
      <${MemoDemo} />
      <${ReducerDemo} />
      <${SVGDemo} />
      <${FormDemo} />
      <${ThemeDemo} />
    </div>
  `;
}

// Mount the app
render(html`<${App} />`, document.getElementById('app'));

console.log('%c✨ Worse Preact HTM Demo Loaded!', 'color: #00d9ff; font-size: 16px; font-weight: bold;');
