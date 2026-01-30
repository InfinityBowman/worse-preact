/**
 * MemoDemo Component (HTM)
 *
 * Demonstrates: useMemo and useCallback
 */

import { useState, useMemo, useCallback } from 'worse-preact';
import { html } from '../html.js';

function ExpensiveCalculation({ value }) {
  const computed = useMemo(() => {
    let result = 0;
    for (let i = 0; i < value * 1000; i++) {
      result += Math.sqrt(i);
    }
    return result.toFixed(2);
  }, [value]);

  return html`<span>Computed: ${computed}</span>`;
}

export function MemoDemo() {
  const [value, setValue] = useState(10);
  const [otherState, setOtherState] = useState(0);

  const handleClick = useCallback(() => {
    setOtherState(s => s + 1);
  }, []);

  return html`
    <div class="demo-section">
      <h2>useMemo & useCallback</h2>
      <div style=${{ marginBottom: '15px' }}>
        <label>
          Computation size: ${value}
          <input
            type="range"
            min="1"
            max="100"
            value=${value}
            onInput=${(e) => setValue(Number(e.target.value))}
            style=${{ width: '200px', marginLeft: '10px' }}
          />
        </label>
      </div>
      <${ExpensiveCalculation} value=${value} />
      <div style=${{ marginTop: '15px' }}>
        <button onClick=${handleClick}>
          Other state: ${otherState} (doesn't recompute)
        </button>
      </div>
      <p class="hint">useMemo caches expensive calculations</p>
    </div>
  `;
}
