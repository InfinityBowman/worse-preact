/**
 * Theme Demo Component
 *
 * Demonstrates: Prop drilling, component composition, dynamic styling
 */

import { useState, useMemo, useCallback } from '../../src/index.js';

// Themed button component
function ThemedButton({ theme, children, onClick }) {
  const style = useMemo(() => ({
    background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
    color: theme.text,
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
    transition: 'transform 0.1s'
  }), [theme]);

  return (
    <button style={style} onClick={onClick}>
      {children}
    </button>
  );
}

// Themed card component
function ThemedCard({ theme, title, children }) {
  return (
    <div style={{
      background: theme.cardBg,
      border: `2px solid ${theme.primary}`,
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '12px'
    }}>
      <h3 style={{ color: theme.primary, margin: '0 0 8px 0' }}>{title}</h3>
      <div style={{ color: theme.text }}>{children}</div>
    </div>
  );
}

// Theme presets
const themes = {
  ocean: {
    name: 'Ocean',
    primary: '#00d9ff',
    secondary: '#0077ff',
    cardBg: 'rgba(0, 217, 255, 0.1)',
    text: '#ffffff'
  },
  sunset: {
    name: 'Sunset',
    primary: '#ff6b6b',
    secondary: '#ffa502',
    cardBg: 'rgba(255, 107, 107, 0.1)',
    text: '#ffffff'
  },
  forest: {
    name: 'Forest',
    primary: '#00b894',
    secondary: '#00cec9',
    cardBg: 'rgba(0, 184, 148, 0.1)',
    text: '#ffffff'
  },
  lavender: {
    name: 'Lavender',
    primary: '#a29bfe',
    secondary: '#6c5ce7',
    cardBg: 'rgba(162, 155, 254, 0.1)',
    text: '#ffffff'
  }
};

export function ThemeDemo() {
  const [currentTheme, setCurrentTheme] = useState('ocean');
  const [clickCount, setClickCount] = useState(0);

  const theme = themes[currentTheme];

  const handleClick = useCallback(() => {
    setClickCount(c => c + 1);
  }, []);

  return (
    <div className="demo-section">
      <h2>Theme System</h2>

      {/* Theme switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {Object.entries(themes).map(([key, t]) => (
          <button
            key={key}
            onClick={() => setCurrentTheme(key)}
            style={{
              background: currentTheme === key
                ? `linear-gradient(135deg, ${t.primary}, ${t.secondary})`
                : '#2d3748',
              border: currentTheme === key ? 'none' : `2px solid ${t.primary}`,
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Themed components */}
      <div className="grid">
        <ThemedCard theme={theme} title="Welcome">
          <p>This card uses the current theme!</p>
          <ThemedButton theme={theme} onClick={handleClick}>
            Clicked {clickCount} times
          </ThemedButton>
        </ThemedCard>

        <ThemedCard theme={theme} title="Features">
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>Dynamic theming</li>
            <li>Prop passing</li>
            <li>useMemo for styles</li>
          </ul>
        </ThemedCard>
      </div>

      {/* Theme preview */}
      <div style={{
        marginTop: '16px',
        padding: '20px',
        borderRadius: '12px',
        background: `linear-gradient(135deg, ${theme.primary}22, ${theme.secondary}22)`,
        border: `2px solid ${theme.primary}44`
      }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <strong style={{ color: theme.primary }}>Primary</strong>
            <div style={{
              width: '60px',
              height: '60px',
              background: theme.primary,
              borderRadius: '8px',
              marginTop: '4px'
            }} />
          </div>
          <div>
            <strong style={{ color: theme.secondary }}>Secondary</strong>
            <div style={{
              width: '60px',
              height: '60px',
              background: theme.secondary,
              borderRadius: '8px',
              marginTop: '4px'
            }} />
          </div>
          <div style={{ flex: 1 }}>
            <strong style={{ color: theme.primary }}>Current Theme</strong>
            <div className="result-box" style={{ marginTop: '4px' }}>
              {JSON.stringify(theme, null, 2)}
            </div>
          </div>
        </div>
      </div>

      <p className="hint">
        💡 Components receive theme via props - useMemo optimizes style objects
      </p>
    </div>
  );
}
