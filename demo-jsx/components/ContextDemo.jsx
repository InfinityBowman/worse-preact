/**
 * Context Demo Component
 *
 * Demonstrates: createContext, useContext, Provider pattern
 * Shows how context eliminates prop drilling
 */

import { useState, useContext, createContext, useMemo, useCallback } from 'worse-preact';

// Create a theme context with default value
const ThemeContext = createContext({
  name: 'default',
  primary: '#888',
  secondary: '#666',
  cardBg: 'rgba(128, 128, 128, 0.1)',
  text: '#ffffff',
});

// Themed button - uses context instead of props
function ThemedButton({ children, onClick }) {
  const theme = useContext(ThemeContext);

  const style = useMemo(
    () => ({
      background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
      color: theme.text,
      border: 'none',
      padding: '12px 24px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '14px',
      transition: 'transform 0.1s',
    }),
    [theme]
  );

  return (
    <button style={style} onClick={onClick}>
      {children}
    </button>
  );
}

// Themed card - uses context instead of props
function ThemedCard({ title, children }) {
  const theme = useContext(ThemeContext);

  return (
    <div
      style={{
        background: theme.cardBg,
        border: `2px solid ${theme.primary}`,
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '12px',
      }}
    >
      <h3 style={{ color: theme.primary, margin: '0 0 8px 0' }}>{title}</h3>
      <div style={{ color: theme.text }}>{children}</div>
    </div>
  );
}

// Deep nested component - still has access to theme via context!
function DeeplyNestedComponent() {
  const theme = useContext(ThemeContext);

  return (
    <div
      style={{
        padding: '8px',
        background: `${theme.primary}22`,
        borderRadius: '4px',
        fontSize: '12px',
      }}
    >
      I'm deeply nested but still get the theme: <strong>{theme.name}</strong>
    </div>
  );
}

// Middle component - doesn't need to know about theme at all!
function MiddleComponent() {
  return (
    <div style={{ padding: '8px' }}>
      <p style={{ margin: '0 0 8px 0', opacity: 0.7 }}>
        This component doesn't use theme props:
      </p>
      <DeeplyNestedComponent />
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
    text: '#ffffff',
  },
  sunset: {
    name: 'Sunset',
    primary: '#ff6b6b',
    secondary: '#ffa502',
    cardBg: 'rgba(255, 107, 107, 0.1)',
    text: '#ffffff',
  },
  forest: {
    name: 'Forest',
    primary: '#00b894',
    secondary: '#00cec9',
    cardBg: 'rgba(0, 184, 148, 0.1)',
    text: '#ffffff',
  },
  lavender: {
    name: 'Lavender',
    primary: '#a29bfe',
    secondary: '#6c5ce7',
    cardBg: 'rgba(162, 155, 254, 0.1)',
    text: '#ffffff',
  },
};

export function ContextDemo() {
  const [currentTheme, setCurrentTheme] = useState('ocean');
  const [clickCount, setClickCount] = useState(0);

  const theme = themes[currentTheme];

  const handleClick = useCallback(() => {
    setClickCount((c) => c + 1);
  }, []);

  return (
    <div className="demo-section">
      <h2>Context API</h2>

      <p>
        Context provides a way to pass data through the component tree without
        prop drilling. Components can access context values using{' '}
        <code>useContext()</code>.
      </p>

      {/* Theme switcher */}
      <div
        style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}
      >
        {Object.entries(themes).map(([key, t]) => (
          <button
            key={key}
            onClick={() => setCurrentTheme(key)}
            style={{
              background:
                currentTheme === key
                  ? `linear-gradient(135deg, ${t.primary}, ${t.secondary})`
                  : '#2d3748',
              border:
                currentTheme === key ? 'none' : `2px solid ${t.primary}`,
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Wrap everything in ThemeContext.Provider */}
      <ThemeContext.Provider value={theme}>
        <div className="grid">
          <ThemedCard title="Using Context">
            <p>No theme prop needed!</p>
            <ThemedButton onClick={handleClick}>
              Clicked {clickCount} times
            </ThemedButton>
          </ThemedCard>

          <ThemedCard title="No Prop Drilling">
            <MiddleComponent />
          </ThemedCard>
        </div>

        {/* Theme preview */}
        <div
          style={{
            marginTop: '16px',
            padding: '20px',
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${theme.primary}22, ${theme.secondary}22)`,
            border: `2px solid ${theme.primary}44`,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '20px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <strong style={{ color: theme.primary }}>Primary</strong>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  background: theme.primary,
                  borderRadius: '8px',
                  marginTop: '4px',
                }}
              />
            </div>
            <div>
              <strong style={{ color: theme.secondary }}>Secondary</strong>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  background: theme.secondary,
                  borderRadius: '8px',
                  marginTop: '4px',
                }}
              />
            </div>
          </div>
        </div>
      </ThemeContext.Provider>

      <p className="hint">
        Components use <code>useContext(ThemeContext)</code> - no props needed.
        MiddleComponent doesn't even know about themes!
      </p>
    </div>
  );
}
