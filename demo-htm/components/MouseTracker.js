/**
 * MouseTracker Component (HTM)
 *
 * Demonstrates: useEffect with event listeners
 */

import { useState, useEffect, useRef } from 'worse-preact';
import { html } from '../html.js';

export function MouseTracker() {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isTracking, setIsTracking] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isTracking) return;

    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      setPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    };

    container.addEventListener('mousemove', handleMouseMove);
    return () => container.removeEventListener('mousemove', handleMouseMove);
  }, [isTracking]);

  return html`
    <div class="demo-section">
      <h2>Mouse Tracker</h2>
      <div class="mouse-tracker" ref=${containerRef}>
        <div
          class="mouse-dot"
          style=${{
            left: position.x + 'px',
            top: position.y + 'px'
          }}
        />
      </div>
      <div style=${{ textAlign: 'center', marginTop: '15px' }}>
        <button onClick=${() => setIsTracking(!isTracking)}>
          ${isTracking ? 'Pause Tracking' : 'Resume Tracking'}
        </button>
        <span style=${{ marginLeft: '15px', color: '#888' }}>
          Position: (${Math.round(position.x)}, ${Math.round(position.y)})
        </span>
      </div>
      <p class="hint">useEffect manages event listener lifecycle</p>
    </div>
  `;
}
