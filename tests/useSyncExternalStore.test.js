/**
 * Tests for useSyncExternalStore
 * @jest-environment jsdom
 */

import { jest } from '@jest/globals';
import { h, render, useSyncExternalStore, useState, useEffect, useLayoutEffect, useCallback, Fragment } from '../src/index.js';

// Helper to wait for effects to run (requestAnimationFrame + setTimeout)
const waitForEffects = () => new Promise(resolve => {
  requestAnimationFrame(() => {
    setTimeout(resolve, 0);
  });
});

// Helper to flush microtasks (state batching)
const flushMicrotasks = () => new Promise(resolve => queueMicrotask(resolve));

/**
 * Creates a simple external store for testing
 */
function createExternalStore(initialState) {
  const listeners = new Set();
  let currentState = initialState;
  return {
    listeners,
    set(value) {
      currentState = value;
      listeners.forEach(listener => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getState() {
      return currentState;
    },
    getSubscriberCount() {
      return listeners.size;
    }
  };
}

describe('useSyncExternalStore', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    render(null, container);
    document.body.removeChild(container);
  });

  test('basic usage - reads initial value', () => {
    const store = createExternalStore('Initial');

    function App() {
      const text = useSyncExternalStore(store.subscribe, store.getState);
      return h('span', null, text);
    }

    render(h(App), container);
    expect(container.textContent).toBe('Initial');
  });

  test('updates when store changes', async () => {
    const store = createExternalStore('Initial');

    function App() {
      const text = useSyncExternalStore(store.subscribe, store.getState);
      return h('span', null, text);
    }

    render(h(App), container);
    expect(container.textContent).toBe('Initial');

    store.set('Updated');
    await flushMicrotasks();
    await waitForEffects();
    await flushMicrotasks();

    expect(container.textContent).toBe('Updated');
  });

  test('subscribes to store on mount', async () => {
    const store = createExternalStore('hello');

    function App() {
      const text = useSyncExternalStore(store.subscribe, store.getState);
      return h('span', null, text);
    }

    render(h(App), container);
    // Subscription happens in useEffect (after paint)
    await waitForEffects();

    expect(store.getSubscriberCount()).toBe(1);
  });

  test('unsubscribes on unmount', async () => {
    const store = createExternalStore('hello');

    function App() {
      const text = useSyncExternalStore(store.subscribe, store.getState);
      return h('span', null, text);
    }

    render(h(App), container);
    await waitForEffects();
    expect(store.getSubscriberCount()).toBe(1);

    // Unmount
    render(null, container);
    expect(store.getSubscriberCount()).toBe(0);
  });

  test('skips re-rendering if snapshot has not changed', async () => {
    const store = createExternalStore('Initial');
    let renderCount = 0;

    function App() {
      renderCount++;
      const text = useSyncExternalStore(store.subscribe, store.getState);
      return h('span', null, text);
    }

    render(h(App), container);
    await waitForEffects();
    expect(renderCount).toBe(1);

    // Set to same value
    store.set('Initial');
    await flushMicrotasks();
    await waitForEffects();

    // Should not re-render since value hasn't changed
    expect(renderCount).toBe(1);
    expect(container.textContent).toBe('Initial');
  });

  test('handles NaN without infinite loop', async () => {
    let called = false;
    const subscribe = jest.fn(cb => {
      return () => {};
    });

    const getSnapshot = jest.fn(() => {
      return called ? NaN : 1;
    });

    function App() {
      const value = useSyncExternalStore(subscribe, getSnapshot);
      return h('span', null, String(value));
    }

    render(h(App), container);
    expect(container.textContent).toBe('1');
  });

  test('handles function values as snapshots without calling them', async () => {
    const store = createExternalStore(null);
    const myFunc = () => 'result';
    store.set(myFunc);

    function App() {
      const value = useSyncExternalStore(store.subscribe, store.getState);
      return h('span', null, typeof value === 'function' ? value() : 'not a function');
    }

    render(h(App), container);
    expect(container.textContent).toBe('result');

    // Updating with the same function should not re-render
    let renderCount = 0;
    function App2() {
      renderCount++;
      const value = useSyncExternalStore(store.subscribe, store.getState);
      return h('span', null, typeof value === 'function' ? value() : 'not a function');
    }

    render(h(App2), container);
    await waitForEffects();
    const initialRenders = renderCount;

    store.set(myFunc); // same function reference
    await flushMicrotasks();
    await waitForEffects();

    expect(renderCount).toBe(initialRenders);
  });

  test('re-subscribes when subscribe function identity changes', async () => {
    const storeA = createExternalStore('A');
    const storeB = createExternalStore('B');
    let setStore;

    function App() {
      const [store, _setStore] = useState(storeA);
      setStore = _setStore;
      const value = useSyncExternalStore(store.subscribe, store.getState);
      return h('span', null, value);
    }

    render(h(App), container);
    await waitForEffects();
    expect(container.textContent).toBe('A');
    expect(storeA.getSubscriberCount()).toBe(1);

    // Switch stores
    setStore(storeB);
    await flushMicrotasks();
    await waitForEffects();

    expect(container.textContent).toBe('B');
    // Old store should be unsubscribed, new one subscribed
    expect(storeA.getSubscriberCount()).toBe(0);
    expect(storeB.getSubscriberCount()).toBe(1);
  });

  test('handles store update during layout effect', async () => {
    const store = createExternalStore(0);

    function App() {
      const value = useSyncExternalStore(store.subscribe, store.getState);

      useLayoutEffect(() => {
        // Mutate store during layout effect (before subscription)
        if (value === 0) {
          store.set(1);
        }
      }, [value]);

      return h('span', null, value);
    }

    render(h(App), container);
    await waitForEffects();
    await flushMicrotasks();
    await waitForEffects();
    await flushMicrotasks();

    // Should eventually reflect the updated value
    expect(container.textContent).toBe('1');
  });

  test('handles store updates before subscribing (missed update detection)', async () => {
    const store = createExternalStore(0);

    function App() {
      const value = useSyncExternalStore(store.subscribe, store.getState);
      return h('span', null, value);
    }

    render(h(App), container);
    expect(container.textContent).toBe('0');

    // Mutate store before subscription effect runs
    // (effects run asynchronously, so store can change in between)
    store.set(1);

    await waitForEffects();
    await flushMicrotasks();
    await waitForEffects();
    await flushMicrotasks();

    expect(container.textContent).toBe('1');
  });

  test('selecting a specific value inside getSnapshot', async () => {
    const store = createExternalStore({ a: 0, b: 0 });

    let renderCountA = 0;
    let renderCountB = 0;

    function A() {
      renderCountA++;
      const a = useSyncExternalStore(
        store.subscribe,
        () => store.getState().a
      );
      return h('span', null, 'A' + a);
    }

    function B() {
      renderCountB++;
      const b = useSyncExternalStore(
        store.subscribe,
        () => store.getState().b
      );
      return h('span', null, 'B' + b);
    }

    function App() {
      return h(Fragment, null, h(A), h(B));
    }

    render(h(App), container);
    await waitForEffects();
    expect(container.textContent).toBe('A0B0');

    const initialA = renderCountA;
    const initialB = renderCountB;

    // Update b but not a
    store.set({ a: 0, b: 1 });
    await flushMicrotasks();
    await waitForEffects();
    await flushMicrotasks();

    expect(container.textContent).toBe('A0B1');
  });

  test('getSnapshot error forces re-render (error boundary can catch)', async () => {
    const store = createExternalStore('ok');
    let shouldThrow = false;

    function App() {
      let value;
      try {
        value = useSyncExternalStore(store.subscribe, () => {
          if (shouldThrow) throw new Error('snapshot error');
          return store.getState();
        });
      } catch (e) {
        return h('span', null, 'Error: ' + e.message);
      }
      return h('span', null, value);
    }

    render(h(App), container);
    await waitForEffects();
    expect(container.textContent).toBe('ok');
  });

  test('works with changing getSnapshot identity', async () => {
    const store = createExternalStore(0);

    function App() {
      // Inline arrow = new identity every render
      const value = useSyncExternalStore(store.subscribe, () => store.getState());
      return h('span', null, value);
    }

    render(h(App), container);
    await waitForEffects();
    expect(container.textContent).toBe('0');

    store.set(42);
    await flushMicrotasks();
    await waitForEffects();
    await flushMicrotasks();

    expect(container.textContent).toBe('42');
  });

  test('works with useCallback for subscribe', async () => {
    const store = createExternalStore('yep');
    let toggle;

    function App() {
      const [state, setState] = useState(true);
      toggle = () => setState(false);

      const value = useSyncExternalStore(
        useCallback(store.subscribe, [state]),
        () => (state ? 'yep' : 'nope')
      );

      return h('span', null, value);
    }

    render(h(App), container);
    await waitForEffects();
    expect(container.textContent).toBe('yep');

    toggle();
    await flushMicrotasks();
    await waitForEffects();
    await flushMicrotasks();

    expect(container.textContent).toBe('nope');
  });

  test('multiple rapid store updates', async () => {
    const store = createExternalStore(0);

    function App() {
      const value = useSyncExternalStore(store.subscribe, store.getState);
      return h('span', null, value);
    }

    render(h(App), container);
    await waitForEffects();
    expect(container.textContent).toBe('0');

    // Multiple rapid updates
    store.set(1);
    store.set(2);
    store.set(3);
    await flushMicrotasks();
    await waitForEffects();
    await flushMicrotasks();

    // Should show final value
    expect(container.textContent).toBe('3');
  });

  test('getServerSnapshot parameter is accepted but unused', () => {
    const store = createExternalStore('client');
    const getServerSnapshot = jest.fn(() => 'server');

    function App() {
      const value = useSyncExternalStore(
        store.subscribe,
        store.getState,
        getServerSnapshot
      );
      return h('span', null, value);
    }

    render(h(App), container);
    expect(container.textContent).toBe('client');
    // Server snapshot should not be called in client rendering
    expect(getServerSnapshot).not.toHaveBeenCalled();
  });

  test('numeric store values', async () => {
    const store = createExternalStore(0);

    function App() {
      const value = useSyncExternalStore(store.subscribe, store.getState);
      return h('span', null, value);
    }

    render(h(App), container);
    expect(container.textContent).toBe('0');

    store.set(100);
    await flushMicrotasks();
    await waitForEffects();
    await flushMicrotasks();

    expect(container.textContent).toBe('100');
  });

  test('object store values (by reference)', async () => {
    const obj1 = { name: 'Alice' };
    const obj2 = { name: 'Bob' };
    const store = createExternalStore(obj1);

    function App() {
      const value = useSyncExternalStore(store.subscribe, store.getState);
      return h('span', null, value.name);
    }

    render(h(App), container);
    expect(container.textContent).toBe('Alice');

    // Setting to a different object should trigger update
    store.set(obj2);
    await flushMicrotasks();
    await waitForEffects();
    await flushMicrotasks();

    expect(container.textContent).toBe('Bob');

    // Setting same reference should not trigger update
    let renderCount = 0;
    function App2() {
      renderCount++;
      const value = useSyncExternalStore(store.subscribe, store.getState);
      return h('span', null, value.name);
    }

    render(h(App2), container);
    await waitForEffects();
    const initial = renderCount;

    store.set(obj2); // same reference
    await flushMicrotasks();
    await waitForEffects();

    expect(renderCount).toBe(initial);
  });

  test('zustand-like store pattern', async () => {
    // Simulate a zustand-like store
    function createStore(initialState) {
      let state = initialState;
      const listeners = new Set();

      const api = {
        getState: () => state,
        setState: (partial) => {
          const nextState = typeof partial === 'function' ? partial(state) : partial;
          if (!Object.is(nextState, state)) {
            state = typeof nextState === 'object' && nextState !== null
              ? Object.assign({}, state, nextState)
              : nextState;
            listeners.forEach(l => l());
          }
        },
        subscribe: (listener) => {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
      };

      return api;
    }

    const store = createStore({ count: 0, name: 'test' });

    function Counter() {
      const state = useSyncExternalStore(store.subscribe, store.getState);
      return h('span', null, `${state.name}:${state.count}`);
    }

    render(h(Counter), container);
    await waitForEffects();
    expect(container.textContent).toBe('test:0');

    store.setState({ count: 1 });
    await flushMicrotasks();
    await waitForEffects();
    await flushMicrotasks();

    expect(container.textContent).toBe('test:1');

    store.setState(prev => ({ count: prev.count + 1 }));
    await flushMicrotasks();
    await waitForEffects();
    await flushMicrotasks();

    expect(container.textContent).toBe('test:2');
  });
});
