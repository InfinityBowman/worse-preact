/**
 * Timer Component (HTM)
 *
 * Demonstrates: useEffect with cleanup
 */

import { useState, useEffect } from '../../src/index.js';
import { html } from '../html.js';

export function Timer() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return html`
    <div class="demo-section">
      <h2>Timer</h2>
      <div class="timer-display">${formatTime(seconds)}</div>
      <div style=${{ textAlign: 'center', marginTop: '20px' }}>
        <button onClick=${() => setIsRunning(!isRunning)}>
          ${isRunning ? 'Pause' : 'Start'}
        </button>
        <button class="secondary" onClick=${() => { setIsRunning(false); setSeconds(0); }}>
          Reset
        </button>
      </div>
      <p class="hint">useEffect handles side effects with automatic cleanup</p>
    </div>
  `;
}
