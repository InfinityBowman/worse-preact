/**
 * Counter Component
 *
 * Demonstrates: useState hook
 */

import { useState } from 'preact/hooks';

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div className="demo-section">
        <h2>Counter</h2>

        <div className="counter-display">{count}</div>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button onClick={() => setCount((c) => c - 10)}>-10</button>
          <button onClick={() => setCount((c) => c - 1)}>-1</button>
          <button className="secondary" onClick={() => setCount(0)}>
            Reset
          </button>
          <button onClick={() => setCount((c) => c + 1)}>+1</button>
          <button onClick={() => setCount((c) => c + 10)}>+10</button>
        </div>

        <p className="hint">💡 useState provides reactive state that triggers re-renders</p>
      </div>
    </>
  );
}
