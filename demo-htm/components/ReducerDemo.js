/**
 * ReducerDemo Component (HTM)
 *
 * Demonstrates: useReducer for complex state
 */

import { useReducer } from 'worse-preact';
import { html } from '../html.js';

const initialState = { count: 0, history: [] };

function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return {
        count: state.count + 1,
        history: [...state.history, `+1 → ${state.count + 1}`]
      };
    case 'decrement':
      return {
        count: state.count - 1,
        history: [...state.history, `-1 → ${state.count - 1}`]
      };
    case 'double':
      return {
        count: state.count * 2,
        history: [...state.history, `×2 → ${state.count * 2}`]
      };
    case 'reset':
      return { count: 0, history: [] };
    default:
      return state;
  }
}

export function ReducerDemo() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return html`
    <div class="demo-section">
      <h2>useReducer Demo</h2>
      <div class="counter-display">${state.count}</div>
      <div style=${{ textAlign: 'center', marginTop: '20px' }}>
        <button onClick=${() => dispatch({ type: 'decrement' })}>-1</button>
        <button onClick=${() => dispatch({ type: 'increment' })}>+1</button>
        <button onClick=${() => dispatch({ type: 'double' })}>×2</button>
        <button class="secondary" onClick=${() => dispatch({ type: 'reset' })}>Reset</button>
      </div>
      ${state.history.length > 0 && html`
        <div class="history">
          <strong>History:</strong> ${state.history.slice(-5).join(' → ')}
        </div>
      `}
      <p class="hint">useReducer manages complex state transitions</p>
    </div>
  `;
}
