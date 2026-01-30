/**
 * Counter Component (HTM)
 *
 * Demonstrates: useState hook with HTM syntax
 */

import { useState } from 'worse-preact';
import { html } from '../html.js';

export function Counter() {
  const [count, setCount] = useState(0);

  return html`
    <div class="demo-section">
      <h2>Counter</h2>
      <div class="counter-display">${count}</div>
      <div style=${{ textAlign: 'center', marginTop: '20px' }}>
        <button onClick=${() => setCount(c => c - 10)}>-10</button>
        <button onClick=${() => setCount(c => c - 1)}>-1</button>
        <button class="secondary" onClick=${() => setCount(0)}>Reset</button>
        <button onClick=${() => setCount(c => c + 1)}>+1</button>
        <button onClick=${() => setCount(c => c + 10)}>+10</button>
      </div>
      <p class="hint">useState provides reactive state that triggers re-renders</p>
    </div>
  `;
}
