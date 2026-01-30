/**
 * Memo Demo Component
 *
 * Demonstrates: useMemo for expensive computations
 */

import { useState, useMemo } from 'worse-preact';

// Simulated expensive computation
function expensiveCalculation(n) {
  console.log(`Computing primes up to ${n}...`);
  const primes = [];
  for (let num = 2; num <= n; num++) {
    let isPrime = true;
    for (let i = 2; i <= Math.sqrt(num); i++) {
      if (num % i === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) primes.push(num);
  }
  return primes;
}

export function MemoDemo() {
  const [limit, setLimit] = useState(50);
  const [darkMode, setDarkMode] = useState(false);

  // useMemo - only recomputes when 'limit' changes
  const primes = useMemo(() => {
    return expensiveCalculation(limit);
  }, [limit]);

  // This calculation runs on every render (for comparison)
  const renderTime = new Date().toLocaleTimeString();

  return (
    <div className="demo-section" style={darkMode ? { background: '#0a0a1a' } : {}}>
      <h2>useMemo Demo</h2>

      <div className="form-row">
        <div className="form-group">
          <label>Find primes up to:</label>
          <input
            type="number"
            value={limit}
            min={10}
            max={1000}
            onChange={(e) => setLimit(parseInt(e.target.value) || 10)}
            style={{ width: '100px' }}
          />
        </div>
        <div className="form-group">
          <label>Toggle (doesn't recompute):</label>
          <button onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </div>

      <div className="result-box">
        <div style={{ marginBottom: '8px' }}>
          <strong>Found {primes.length} primes:</strong>
        </div>
        <div style={{ maxHeight: '100px', overflow: 'auto' }}>
          {primes.join(', ')}
        </div>
      </div>

      <div style={{ marginTop: '12px', color: '#888', fontSize: '14px' }}>
        Last render: {renderTime}
      </div>

      <p className="hint">
        💡 Check console: primes only recompute when limit changes, not when toggling dark mode
      </p>
    </div>
  );
}
