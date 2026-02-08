/**
 * SVG Demo Component
 *
 * Demonstrates: SVG namespace handling, animations with useEffect
 */

import { useState, useEffect } from 'preact/hooks';

export function SVGDemo() {
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [hue, setHue] = useState(0);

  // Animate hue
  useEffect(() => {
    const id = setInterval(() => {
      setHue(h => (h + 2) % 360);
    }, 50);
    return () => clearInterval(id);
  }, []);

  // Pulse animation
  useEffect(() => {
    const id = setInterval(() => {
      setScale(s => 0.8 + Math.sin(Date.now() / 500) * 0.2);
    }, 16);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="demo-section">
      <h2>SVG Graphics</h2>

      <div className="svg-container">
        <svg width="300" height="300" viewBox="0 0 300 300">
          {/* Background */}
          <rect x="0" y="0" width="300" height="300" fill="#0f0f23" rx="12" />

          {/* Animated circles */}
          <g transform={`translate(150, 150) scale(${scale})`}>
            {[0, 60, 120, 180, 240, 300].map((angle, i) => (
              <circle
                key={i}
                cx={Math.cos((angle + rotation) * Math.PI / 180) * 80}
                cy={Math.sin((angle + rotation) * Math.PI / 180) * 80}
                r="20"
                fill={`hsl(${(hue + i * 60) % 360}, 70%, 60%)`}
                opacity="0.8"
              />
            ))}
          </g>

          {/* Center circle */}
          <circle
            cx="150"
            cy="150"
            r="40"
            fill={`hsl(${hue}, 80%, 50%)`}
            stroke={`hsl(${(hue + 180) % 360}, 80%, 60%)`}
            strokeWidth="4"
          />

          {/* Text */}
          <text
            x="150"
            y="155"
            textAnchor="middle"
            fill="white"
            fontSize="16"
            fontWeight="bold"
          >
            SVG
          </text>

          {/* Corner decorations */}
          <polygon points="20,20 50,20 20,50" fill="#667eea" opacity="0.5" />
          <polygon points="280,20 280,50 250,20" fill="#764ba2" opacity="0.5" />
          <polygon points="20,280 50,280 20,250" fill="#764ba2" opacity="0.5" />
          <polygon points="280,280 280,250 250,280" fill="#667eea" opacity="0.5" />
        </svg>
      </div>

      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <button onClick={() => setRotation(r => r - 30)}>↺ Rotate Left</button>
        <button onClick={() => setRotation(r => r + 30)}>Rotate Right ↻</button>
      </div>

      <p className="hint">
        💡 SVG elements are created with the correct namespace automatically
      </p>
    </div>
  );
}
