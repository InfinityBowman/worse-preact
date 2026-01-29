/**
 * Timer Component
 *
 * Demonstrates: useEffect with cleanup, useState
 */

import { useState, useEffect } from '../../src/index.js';

export function Timer() {
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState([]);

  // Effect with cleanup - interval is cleared when running changes or unmount
  useEffect(() => {
    if (!running) return;

    console.log('⏱️ Timer started');
    const id = setInterval(() => {
      setTime(t => t + 10); // Update every 10ms
    }, 10);

    return () => {
      console.log('⏱️ Timer stopped (cleanup)');
      clearInterval(id);
    };
  }, [running]);

  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };

  const handleLap = () => {
    setLaps([...laps, time]);
  };

  const handleReset = () => {
    setRunning(false);
    setTime(0);
    setLaps([]);
  };

  return (
    <div className="demo-section">
      <h2>Stopwatch</h2>

      <div style={{ textAlign: 'center' }}>
        <div className="timer-display">{formatTime(time)}</div>

        <div style={{ marginTop: '20px' }}>
          <button onClick={() => setRunning(!running)}>
            {running ? '⏸ Pause' : '▶ Start'}
          </button>
          <button className="secondary" onClick={handleLap} disabled={!running}>
            🏁 Lap
          </button>
          <button className="danger" onClick={handleReset}>
            ↺ Reset
          </button>
        </div>

        {laps.length > 0 && (
          <div className="result-box" style={{ marginTop: '20px', textAlign: 'left' }}>
            <strong>Laps:</strong>
            {laps.map((lap, i) => (
              <div key={i}>
                Lap {i + 1}: {formatTime(lap)}
                {i > 0 && ` (+${formatTime(lap - laps[i - 1])})`}
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="hint">
        💡 Check console to see useEffect cleanup logs
      </p>
    </div>
  );
}
