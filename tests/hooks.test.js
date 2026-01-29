/**
 * Tests for hooks.js - All Hooks Implementation
 * @jest-environment jsdom
 */

import { jest } from '@jest/globals';
import { h, render, useState, useEffect, useRef, useMemo, useCallback, useReducer, useLayoutEffect } from '../src/index.js';

// Helper to wait for effects to run
const waitForEffects = () => new Promise(resolve => {
  requestAnimationFrame(() => {
    setTimeout(resolve, 0);
  });
});

// Helper to flush microtasks
const flushMicrotasks = () => new Promise(resolve => queueMicrotask(resolve));

describe('useState', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    render(null, container);
    document.body.removeChild(container);
  });

  test('returns initial state', () => {
    let state;
    function Component() {
      state = useState(42);
      return h('div', null, state[0]);
    }

    render(h(Component), container);
    expect(state[0]).toBe(42);
  });

  test('supports lazy initial state', () => {
    const initializer = jest.fn(() => 'lazy');
    let state;

    function Component() {
      state = useState(initializer);
      return h('div', null, state[0]);
    }

    render(h(Component), container);
    expect(state[0]).toBe('lazy');
    expect(initializer).toHaveBeenCalledTimes(1);

    // Re-render should not call initializer again
    render(h(Component), container);
    expect(initializer).toHaveBeenCalledTimes(1);
  });

  test('setState triggers re-render', async () => {
    let setState;
    function Counter() {
      const [count, setCount] = useState(0);
      setState = setCount;
      return h('span', null, count);
    }

    render(h(Counter), container);
    expect(container.textContent).toBe('0');

    setState(1);
    await flushMicrotasks();
    expect(container.textContent).toBe('1');
  });

  test('setState with updater function', async () => {
    let setState;
    function Counter() {
      const [count, setCount] = useState(0);
      setState = setCount;
      return h('span', null, count);
    }

    render(h(Counter), container);

    setState(c => c + 1);
    await flushMicrotasks();
    expect(container.textContent).toBe('1');

    setState(c => c + 10);
    await flushMicrotasks();
    expect(container.textContent).toBe('11');
  });

  test('setState with same value does not re-render', async () => {
    let renderCount = 0;
    let setState;

    function Counter() {
      renderCount++;
      const [count, setCount] = useState(0);
      setState = setCount;
      return h('span', null, count);
    }

    render(h(Counter), container);
    expect(renderCount).toBe(1);

    setState(0); // Same value
    await flushMicrotasks();
    expect(renderCount).toBe(1);
  });

  test('multiple useState calls', async () => {
    let setA, setB;
    function Multi() {
      const [a, _setA] = useState('A');
      const [b, _setB] = useState('B');
      setA = _setA;
      setB = _setB;
      return h('span', null, a + b);
    }

    render(h(Multi), container);
    expect(container.textContent).toBe('AB');

    setA('X');
    await flushMicrotasks();
    expect(container.textContent).toBe('XB');

    setB('Y');
    await flushMicrotasks();
    expect(container.textContent).toBe('XY');
  });
});

describe('useReducer', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    render(null, container);
    document.body.removeChild(container);
  });

  test('returns state and dispatch', () => {
    const reducer = (state, action) => {
      switch (action.type) {
        case 'increment': return { count: state.count + 1 };
        default: return state;
      }
    };

    let state, dispatch;
    function Component() {
      [state, dispatch] = useReducer(reducer, { count: 0 });
      return h('span', null, state.count);
    }

    render(h(Component), container);
    expect(state).toEqual({ count: 0 });
    expect(typeof dispatch).toBe('function');
  });

  test('dispatch updates state', async () => {
    const reducer = (state, action) => {
      switch (action.type) {
        case 'increment': return state + 1;
        case 'decrement': return state - 1;
        default: return state;
      }
    };

    let dispatch;
    function Counter() {
      const [count, _dispatch] = useReducer(reducer, 0);
      dispatch = _dispatch;
      return h('span', null, count);
    }

    render(h(Counter), container);
    expect(container.textContent).toBe('0');

    dispatch({ type: 'increment' });
    await flushMicrotasks();
    expect(container.textContent).toBe('1');

    dispatch({ type: 'decrement' });
    await flushMicrotasks();
    expect(container.textContent).toBe('0');
  });

  test('supports lazy initialization', () => {
    const init = (initial) => ({ count: initial * 2 });
    const reducer = (state, action) => state;

    let state;
    function Component() {
      [state] = useReducer(reducer, 5, init);
      return h('span', null, state.count);
    }

    render(h(Component), container);
    expect(state).toEqual({ count: 10 });
  });
});

describe('useEffect', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    render(null, container);
    document.body.removeChild(container);
  });

  test('runs effect after render', async () => {
    const effect = jest.fn();

    function Component() {
      useEffect(effect);
      return h('div');
    }

    render(h(Component), container);
    expect(effect).not.toHaveBeenCalled();

    await waitForEffects();
    expect(effect).toHaveBeenCalledTimes(1);
  });

  test('runs cleanup on unmount', async () => {
    const cleanup = jest.fn();
    const effect = jest.fn(() => cleanup);

    function Component() {
      useEffect(effect);
      return h('div');
    }

    render(h(Component), container);
    await waitForEffects();

    render(null, container);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  test('deps array controls when effect runs', async () => {
    const effect = jest.fn();
    let setState;

    function Component() {
      const [count, setCount] = useState(0);
      const [other, setOther] = useState(0);
      setState = { setCount, setOther };
      useEffect(effect, [count]);
      return h('div', null, count);
    }

    render(h(Component), container);
    await waitForEffects();
    expect(effect).toHaveBeenCalledTimes(1);

    // Change other (not in deps) - effect should not run
    setState.setOther(1);
    await flushMicrotasks();
    await waitForEffects();
    expect(effect).toHaveBeenCalledTimes(1);

    // Change count (in deps) - effect should run
    setState.setCount(1);
    await flushMicrotasks();
    await waitForEffects();
    expect(effect).toHaveBeenCalledTimes(2);
  });

  test('empty deps array runs only on mount', async () => {
    const effect = jest.fn();
    let setState;

    function Component() {
      const [count, setCount] = useState(0);
      setState = setCount;
      useEffect(effect, []);
      return h('div', null, count);
    }

    render(h(Component), container);
    await waitForEffects();
    expect(effect).toHaveBeenCalledTimes(1);

    setState(1);
    await flushMicrotasks();
    await waitForEffects();
    expect(effect).toHaveBeenCalledTimes(1);
  });

  test('cleanup runs before next effect', async () => {
    const calls = [];
    let setState;

    function Component() {
      const [count, setCount] = useState(0);
      setState = setCount;
      useEffect(() => {
        calls.push(`effect:${count}`);
        return () => calls.push(`cleanup:${count}`);
      }, [count]);
      return h('div');
    }

    render(h(Component), container);
    await waitForEffects();
    expect(calls).toEqual(['effect:0']);

    setState(1);
    await flushMicrotasks();
    await waitForEffects();
    expect(calls).toEqual(['effect:0', 'cleanup:0', 'effect:1']);
  });
});

describe('useRef', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  afterEach(() => {
    render(null, container);
  });

  test('returns ref object', () => {
    let ref;
    function Component() {
      ref = useRef(42);
      return h('div');
    }

    render(h(Component), container);
    expect(ref).toEqual({ current: 42 });
  });

  test('ref persists across renders', async () => {
    let ref, setState;

    function Component() {
      const [count, setCount] = useState(0);
      setState = setCount;
      ref = useRef('initial');
      return h('div', null, count);
    }

    render(h(Component), container);
    const firstRef = ref;

    setState(1);
    await flushMicrotasks();

    expect(ref).toBe(firstRef);
    expect(ref.current).toBe('initial');
  });

  test('ref.current can be mutated', () => {
    let ref;
    function Component() {
      ref = useRef(0);
      ref.current++;
      return h('div', null, ref.current);
    }

    render(h(Component), container);
    expect(ref.current).toBe(1);

    render(h(Component), container);
    expect(ref.current).toBe(2);
  });
});

describe('useMemo', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    render(null, container);
    document.body.removeChild(container);
  });

  test('memoizes value', () => {
    const factory = jest.fn(() => ({ computed: true }));
    let value;

    function Component() {
      value = useMemo(factory, []);
      return h('div');
    }

    render(h(Component), container);
    const firstValue = value;
    expect(factory).toHaveBeenCalledTimes(1);

    render(h(Component), container);
    expect(factory).toHaveBeenCalledTimes(1);
    expect(value).toBe(firstValue);
  });

  test('recomputes when deps change', async () => {
    const factory = jest.fn((x) => x * 2);
    let setState;

    function Component() {
      const [count, setCount] = useState(1);
      setState = setCount;
      const doubled = useMemo(() => factory(count), [count]);
      return h('div', null, doubled);
    }

    render(h(Component), container);
    expect(factory).toHaveBeenCalledTimes(1);
    expect(container.textContent).toBe('2');

    setState(5);
    await flushMicrotasks();
    expect(factory).toHaveBeenCalledTimes(2);
    expect(container.textContent).toBe('10');
  });

  test('does not recompute when unrelated state changes', async () => {
    const factory = jest.fn((x) => x * 2);
    let setLimit, setOther;

    function Component() {
      const [limit, _setLimit] = useState(10);
      const [other, _setOther] = useState(0);
      setLimit = _setLimit;
      setOther = _setOther;
      const memoized = useMemo(() => factory(limit), [limit]);
      return h('div', null, `${memoized}-${other}`);
    }

    render(h(Component), container);
    expect(factory).toHaveBeenCalledTimes(1);
    expect(container.textContent).toBe('20-0');

    // Change unrelated state - should NOT recompute
    setOther(1);
    await flushMicrotasks();
    expect(factory).toHaveBeenCalledTimes(1); // Should still be 1!
    expect(container.textContent).toBe('20-1');

    // Change the dependency - should recompute
    setLimit(20);
    await flushMicrotasks();
    expect(factory).toHaveBeenCalledTimes(2);
    expect(container.textContent).toBe('40-1');
  });
});

describe('useCallback', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    render(null, container);
    document.body.removeChild(container);
  });

  test('returns memoized callback', () => {
    let callback;
    const fn = () => {};

    function Component() {
      callback = useCallback(fn, []);
      return h('div');
    }

    render(h(Component), container);
    const firstCallback = callback;

    render(h(Component), container);
    expect(callback).toBe(firstCallback);
  });

  test('updates callback when deps change', async () => {
    let callback, setState;

    function Component() {
      const [count, setCount] = useState(0);
      setState = setCount;
      callback = useCallback(() => count, [count]);
      return h('div');
    }

    render(h(Component), container);
    const firstCallback = callback;
    expect(callback()).toBe(0);

    setState(5);
    await flushMicrotasks();
    expect(callback).not.toBe(firstCallback);
    expect(callback()).toBe(5);
  });
});

describe('useLayoutEffect', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    render(null, container);
    document.body.removeChild(container);
  });

  test('runs synchronously after DOM mutations', () => {
    let effectRan = false;
    let domContent = null;

    function Component() {
      useLayoutEffect(() => {
        effectRan = true;
        domContent = container.textContent;
      });
      return h('div', null, 'Hello');
    }

    render(h(Component), container);

    // Should have run synchronously
    expect(effectRan).toBe(true);
    expect(domContent).toBe('Hello');
  });
});
