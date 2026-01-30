/**
 * SVGDemo Component (HTM)
 *
 * Demonstrates: Dynamic SVG rendering
 */

import { useState } from 'worse-preact';
import { html } from '../html.js';

export function SVGDemo() {
  const [hue, setHue] = useState(200);
  const [size, setSize] = useState(50);

  return html`
    <div class="demo-section">
      <h2>SVG Rendering</h2>
      <div style=${{ textAlign: 'center' }}>
        <svg width="200" height="200" viewBox="0 0 200 200">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style=${{ stopColor: `hsl(${hue}, 80%, 60%)` }} />
              <stop offset="100%" style=${{ stopColor: `hsl(${(hue + 60) % 360}, 80%, 40%)` }} />
            </linearGradient>
          </defs>
          <circle
            cx="100"
            cy="100"
            r=${size}
            fill="url(#grad1)"
            stroke=${'hsl(' + ((hue + 180) % 360) + ', 70%, 50%)'}
            stroke-width="3"
          />
          <circle
            cx="100"
            cy="100"
            r=${size * 0.6}
            fill="none"
            stroke=${'hsl(' + hue + ', 90%, 70%)'}
            stroke-width="2"
            stroke-dasharray="5,5"
          />
        </svg>
      </div>
      <div style=${{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '15px' }}>
        <label>
          Hue: ${hue}°
          <input
            type="range"
            min="0"
            max="360"
            value=${hue}
            onInput=${(e) => setHue(Number(e.target.value))}
          />
        </label>
        <label>
          Size: ${size}
          <input
            type="range"
            min="20"
            max="90"
            value=${size}
            onInput=${(e) => setSize(Number(e.target.value))}
          />
        </label>
      </div>
      <p class="hint">Full SVG support with dynamic attributes</p>
    </div>
  `;
}
