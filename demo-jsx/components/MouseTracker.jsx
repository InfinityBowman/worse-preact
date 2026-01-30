/**
 * Mouse Tracker Component
 *
 * Demonstrates: useCallback, useRef, event handling, dynamic styles
 */

import { useState, useCallback, useRef } from 'worse-preact';

export function MouseTracker() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [trail, setTrail] = useState([]);
  const [isInside, setIsInside] = useState(false);
  const containerRef = useRef(null);

  // useCallback ensures stable function reference
  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPosition({ x, y });

    // Add to trail (keep last 10 positions)
    setTrail(prev => [...prev.slice(-9), { x, y, id: Date.now() }]);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsInside(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsInside(false);
    setTrail([]);
  }, []);

  return (
    <div className="demo-section">
      <h2>Mouse Tracker</h2>

      <div
        ref={containerRef}
        className="mouse-tracker"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Trail dots */}
        {trail.map((pos, i) => (
          <div
            key={pos.id}
            className="mouse-trail"
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              opacity: (i + 1) / trail.length * 0.5,
              transform: `translate(-50%, -50%) scale(${(i + 1) / trail.length})`
            }}
          />
        ))}

        {/* Main cursor dot */}
        {isInside && (
          <div
            className="mouse-dot"
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`
            }}
          />
        )}

        {/* Center text when not hovering */}
        {!isInside && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#667',
            fontSize: '18px'
          }}>
            Move mouse here
          </div>
        )}
      </div>

      <div className="result-box" style={{ marginTop: '12px' }}>
        Position: ({Math.round(position.x)}, {Math.round(position.y)})
        {isInside && <span className="badge">Active</span>}
      </div>

      <p className="hint">
        💡 useCallback prevents unnecessary re-renders of child components
      </p>
    </div>
  );
}
