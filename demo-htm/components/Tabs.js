/**
 * Tabs Component (HTM)
 *
 * Demonstrates: Conditional rendering, complex state
 */

import { useState } from 'worse-preact';
import { html } from '../html.js';

const tabData = [
  {
    id: 'about',
    label: 'About',
    content: 'Worse Preact is a minimal, readable Preact-compatible library. It prioritizes code clarity over micro-optimizations.'
  },
  {
    id: 'features',
    label: 'Features',
    content: 'Zero dependencies, full hooks support, SVG rendering, key reconciliation, and complete Preact API compatibility.'
  },
  {
    id: 'usage',
    label: 'Usage',
    content: 'Copy the source directly into your project. No npm install needed. Perfect for air-gapped or security-sensitive environments.'
  }
];

export function Tabs() {
  const [activeTab, setActiveTab] = useState('about');
  const activeContent = tabData.find(t => t.id === activeTab)?.content;

  return html`
    <div class="demo-section">
      <h2>Tabs</h2>
      <div class="tabs">
        ${tabData.map(tab => html`
          <div
            key=${tab.id}
            class=${`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick=${() => setActiveTab(tab.id)}
          >
            ${tab.label}
          </div>
        `)}
      </div>
      <div class="tab-content">
        ${activeContent}
      </div>
      <p class="hint">Conditional rendering with state-driven UI</p>
    </div>
  `;
}
