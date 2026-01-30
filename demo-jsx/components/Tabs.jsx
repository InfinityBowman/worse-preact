/**
 * Tabs Component
 *
 * Demonstrates: Conditional rendering, component composition, Fragments
 */

import { useState } from 'worse-preact';

// Individual tab content components
function HomeTab() {
  return (
    <>
      <h3>Welcome Home!</h3>
      <p>This is the home tab content rendered with a Fragment.</p>
      <div className="grid">
        <div className="card">
          <h3>Feature 1</h3>
          <p>Virtual DOM diffing</p>
        </div>
        <div className="card">
          <h3>Feature 2</h3>
          <p>Hooks support</p>
        </div>
        <div className="card">
          <h3>Feature 3</h3>
          <p>JSX syntax</p>
        </div>
      </div>
    </>
  );
}

function AboutTab() {
  return (
    <>
      <h3>About This Library</h3>
      <p>
        A minimal Preact-compatible library built for readability.
        It includes full support for:
      </p>
      <ul>
        <li>Function components with hooks</li>
        <li>Keyed list reconciliation</li>
        <li>Event delegation</li>
        <li>SVG namespace handling</li>
        <li>Refs (object and callback)</li>
      </ul>
    </>
  );
}

function CodeTab() {
  const codeExample = `
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>
        Increment
      </button>
    </div>
  );
}`;

  return (
    <>
      <h3>Code Example</h3>
      <pre className="result-box" style={{ whiteSpace: 'pre-wrap' }}>
        {codeExample.trim()}
      </pre>
    </>
  );
}

export function Tabs() {
  const [activeTab, setActiveTab] = useState('home');

  const tabs = [
    { id: 'home', label: '🏠 Home', Component: HomeTab },
    { id: 'about', label: 'ℹ️ About', Component: AboutTab },
    { id: 'code', label: '💻 Code', Component: CodeTab },
  ];

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.Component;

  return (
    <div className="demo-section">
      <h2>Tabs</h2>

      <div className="tabs">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </div>
        ))}
      </div>

      <div className="tab-content">
        {ActiveComponent && <ActiveComponent />}
      </div>

      <p className="hint">
        💡 Conditional rendering with && and component switching
      </p>
    </div>
  );
}
