/**
 * Reducer Demo Component
 *
 * Demonstrates: useReducer for complex state logic
 */

import { useReducer } from 'preact/hooks';

const initialState = {
  count: 0,
  step: 1,
  history: [],
  undoStack: []
};

function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return {
        ...state,
        count: state.count + state.step,
        history: [...state.history, { action: `+${state.step}`, value: state.count + state.step }],
        undoStack: [...state.undoStack, state.count]
      };

    case 'decrement':
      return {
        ...state,
        count: state.count - state.step,
        history: [...state.history, { action: `-${state.step}`, value: state.count - state.step }],
        undoStack: [...state.undoStack, state.count]
      };

    case 'multiply':
      return {
        ...state,
        count: state.count * 2,
        history: [...state.history, { action: '×2', value: state.count * 2 }],
        undoStack: [...state.undoStack, state.count]
      };

    case 'setStep':
      return { ...state, step: action.payload };

    case 'undo':
      if (state.undoStack.length === 0) return state;
      const newStack = [...state.undoStack];
      const previousValue = newStack.pop();
      return {
        ...state,
        count: previousValue,
        history: [...state.history, { action: 'undo', value: previousValue }],
        undoStack: newStack
      };

    case 'reset':
      return initialState;

    default:
      return state;
  }
}

export function ReducerDemo() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <div className="demo-section">
      <h2>useReducer</h2>

      <div style={{ textAlign: 'center' }}>
        <div className="counter-display">{state.count}</div>

        <div style={{ marginTop: '20px' }}>
          <button onClick={() => dispatch({ type: 'decrement' })}>
            -{state.step}
          </button>
          <button onClick={() => dispatch({ type: 'multiply' })}>
            ×2
          </button>
          <button onClick={() => dispatch({ type: 'increment' })}>
            +{state.step}
          </button>
        </div>

        <div style={{ marginTop: '12px' }}>
          <button
            className="secondary"
            onClick={() => dispatch({ type: 'undo' })}
            disabled={state.undoStack.length === 0}
          >
            ↩ Undo
          </button>
          <button className="danger" onClick={() => dispatch({ type: 'reset' })}>
            Reset
          </button>
        </div>

        {/* Step selector */}
        <div className="step-buttons">
          {[1, 5, 10, 25].map(step => (
            <button
              key={step}
              className={state.step === step ? '' : 'secondary'}
              onClick={() => dispatch({ type: 'setStep', payload: step })}
            >
              Step: {step}
            </button>
          ))}
        </div>

        {/* History */}
        {state.history.length > 0 && (
          <div className="result-box" style={{ textAlign: 'left', marginTop: '16px' }}>
            <strong>History:</strong>
            <div style={{ maxHeight: '80px', overflow: 'auto' }}>
              {state.history.slice(-10).map((entry, i) => (
                <span key={i} style={{ marginRight: '8px' }}>
                  {entry.action} → {entry.value}
                  {i < state.history.slice(-10).length - 1 && ' |'}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="hint">
        💡 useReducer is great for complex state with multiple actions
      </p>
    </div>
  );
}
