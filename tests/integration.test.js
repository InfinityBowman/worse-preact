/**
 * Integration Tests - Real Component Patterns
 *
 * These tests verify Preact compatibility with common patterns.
 * @jest-environment jsdom
 */

import { jest } from '@jest/globals';
import { h, render, useState, useEffect, useRef, useMemo, useCallback, Fragment } from '../src/index.js';

// Helper to wait for effects to run
const waitForEffects = () => new Promise(resolve => {
  requestAnimationFrame(() => {
    setTimeout(resolve, 0);
  });
});

// Helper to flush microtasks
const flushMicrotasks = () => new Promise(resolve => queueMicrotask(resolve));

describe('Counter component', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    render(null, container);
    document.body.removeChild(container);
  });

  test('counter increments on click', async () => {
    function Counter() {
      const [count, setCount] = useState(0);
      return h('div', null,
        h('span', { 'data-testid': 'count' }, count),
        h('button', { onClick: () => setCount(c => c + 1) }, '+')
      );
    }

    render(h(Counter), container);
    expect(container.querySelector('[data-testid="count"]').textContent).toBe('0');

    container.querySelector('button').click();
    await flushMicrotasks();
    expect(container.querySelector('[data-testid="count"]').textContent).toBe('1');

    container.querySelector('button').click();
    await flushMicrotasks();
    expect(container.querySelector('[data-testid="count"]').textContent).toBe('2');
  });
});

describe('Timer component', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    render(null, container);
    document.body.removeChild(container);
  });

  test('timer with useEffect cleanup', async () => {
    const cleanup = jest.fn();
    let intervalId;

    function Timer() {
      const [seconds, setSeconds] = useState(0);

      useEffect(() => {
        intervalId = setInterval(() => {
          setSeconds(s => s + 1);
        }, 1000);

        return () => {
          cleanup();
          clearInterval(intervalId);
        };
      }, []);

      return h('div', null, `Time: ${seconds}s`);
    }

    render(h(Timer), container);
    await waitForEffects();

    expect(container.textContent).toBe('Time: 0s');
    expect(cleanup).not.toHaveBeenCalled();

    // Unmount
    render(null, container);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});

describe('TodoList component', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    render(null, container);
    document.body.removeChild(container);
  });

  test('todo list with keyed reconciliation', async () => {
    function TodoList() {
      const [todos, setTodos] = useState([
        { id: 1, text: 'Learn Preact' },
        { id: 2, text: 'Build something' },
      ]);

      const addTodo = () => {
        setTodos([...todos, { id: Date.now(), text: 'New todo' }]);
      };

      const removeTodo = (id) => {
        setTodos(todos.filter(t => t.id !== id));
      };

      return h('div', null,
        h('button', { onClick: addTodo, 'data-testid': 'add' }, 'Add'),
        h('ul', null,
          todos.map(todo =>
            h('li', { key: todo.id },
              todo.text,
              h('button', { onClick: () => removeTodo(todo.id) }, 'X')
            )
          )
        )
      );
    }

    render(h(TodoList), container);
    expect(container.querySelectorAll('li').length).toBe(2);

    // Add todo
    container.querySelector('[data-testid="add"]').click();
    await flushMicrotasks();
    expect(container.querySelectorAll('li').length).toBe(3);

    // Remove first todo
    container.querySelector('li button').click();
    await flushMicrotasks();
    expect(container.querySelectorAll('li').length).toBe(2);
  });

  test('reordering preserves DOM nodes', async () => {
    let setItems;

    function List() {
      const [items, _setItems] = useState(['a', 'b', 'c']);
      setItems = _setItems;
      return h('ul', null,
        items.map(item => h('li', { key: item }, item))
      );
    }

    render(h(List), container);
    const [liA, liB, liC] = container.querySelectorAll('li');

    // Reverse
    setItems(['c', 'b', 'a']);
    await flushMicrotasks();

    const newItems = container.querySelectorAll('li');
    expect(newItems[0]).toBe(liC);
    expect(newItems[1]).toBe(liB);
    expect(newItems[2]).toBe(liA);
  });
});

describe('Form component', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    render(null, container);
    document.body.removeChild(container);
  });

  test('controlled input', async () => {
    function Form() {
      const [value, setValue] = useState('');
      return h('div', null,
        h('input', {
          value,
          onInput: (e) => setValue(e.target.value),
          'data-testid': 'input'
        }),
        h('span', { 'data-testid': 'display' }, value)
      );
    }

    render(h(Form), container);
    const input = container.querySelector('[data-testid="input"]');
    const display = container.querySelector('[data-testid="display"]');

    expect(input.value).toBe('');
    expect(display.textContent).toBe('');

    // Simulate input
    input.value = 'Hello';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await flushMicrotasks();

    expect(display.textContent).toBe('Hello');
  });

  test('checkbox input', async () => {
    function Checkbox() {
      const [checked, setChecked] = useState(false);
      return h('div', null,
        h('input', {
          type: 'checkbox',
          checked,
          onChange: (e) => setChecked(e.target.checked),
          'data-testid': 'checkbox'
        }),
        h('span', { 'data-testid': 'status' }, checked ? 'ON' : 'OFF')
      );
    }

    render(h(Checkbox), container);
    const checkbox = container.querySelector('[data-testid="checkbox"]');
    const status = container.querySelector('[data-testid="status"]');

    expect(checkbox.checked).toBe(false);
    expect(status.textContent).toBe('OFF');

    checkbox.click();
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    await flushMicrotasks();

    expect(status.textContent).toBe('ON');
  });
});

describe('SVG rendering', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    render(null, container);
    document.body.removeChild(container);
  });

  test('renders SVG elements with correct namespace', () => {
    function Icon() {
      return h('svg', { width: 100, height: 100, viewBox: '0 0 100 100' },
        h('circle', { cx: 50, cy: 50, r: 40, fill: 'red' }),
        h('rect', { x: 10, y: 10, width: 30, height: 30, fill: 'blue' })
      );
    }

    render(h(Icon), container);

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');

    const circle = container.querySelector('circle');
    expect(circle.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(circle.getAttribute('cx')).toBe('50');

    const rect = container.querySelector('rect');
    expect(rect.namespaceURI).toBe('http://www.w3.org/2000/svg');
  });

  test('SVG with dynamic attributes', async () => {
    let setRadius;

    function DynamicCircle() {
      const [radius, _setRadius] = useState(20);
      setRadius = _setRadius;
      return h('svg', { width: 100, height: 100 },
        h('circle', { cx: 50, cy: 50, r: radius, fill: 'green' })
      );
    }

    render(h(DynamicCircle), container);
    expect(container.querySelector('circle').getAttribute('r')).toBe('20');

    setRadius(40);
    await flushMicrotasks();
    expect(container.querySelector('circle').getAttribute('r')).toBe('40');
  });
});

describe('Refs with DOM', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    render(null, container);
    document.body.removeChild(container);
  });

  test('useRef to access DOM', async () => {
    function FocusInput() {
      const inputRef = useRef(null);

      useEffect(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, []);

      return h('input', { ref: inputRef, 'data-testid': 'input' });
    }

    render(h(FocusInput), container);
    await waitForEffects();

    const input = container.querySelector('[data-testid="input"]');
    expect(document.activeElement).toBe(input);
  });
});

describe('Memoization patterns', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    render(null, container);
    document.body.removeChild(container);
  });

  test('useMemo prevents recalculation', async () => {
    const expensiveCalc = jest.fn((items) => items.reduce((a, b) => a + b, 0));
    let setOther;

    function Sum() {
      const [items] = useState([1, 2, 3, 4, 5]);
      const [other, _setOther] = useState(0);
      setOther = _setOther;

      const sum = useMemo(() => expensiveCalc(items), [items]);

      return h('div', null,
        h('span', { 'data-testid': 'sum' }, sum),
        h('span', { 'data-testid': 'other' }, other)
      );
    }

    render(h(Sum), container);
    expect(expensiveCalc).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-testid="sum"]').textContent).toBe('15');

    // Change unrelated state
    setOther(1);
    await flushMicrotasks();
    expect(expensiveCalc).toHaveBeenCalledTimes(1); // Not called again
  });

  test('useCallback provides stable reference', async () => {
    const callbacks = [];
    let setCount;

    function Parent() {
      const [count, _setCount] = useState(0);
      setCount = _setCount;

      const handleClick = useCallback(() => {
        console.log('clicked');
      }, []);

      callbacks.push(handleClick);

      return h('button', { onClick: handleClick }, count);
    }

    render(h(Parent), container);
    setCount(1);
    await flushMicrotasks();
    setCount(2);
    await flushMicrotasks();

    // All callbacks should be the same reference
    expect(callbacks[0]).toBe(callbacks[1]);
    expect(callbacks[1]).toBe(callbacks[2]);
  });
});

describe('Complex composition', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    render(null, container);
    document.body.removeChild(container);
  });

  test('parent-child state flow', async () => {
    function Child({ value, onChange }) {
      return h('button', { onClick: () => onChange(value + 1) }, value);
    }

    function Parent() {
      const [count, setCount] = useState(0);
      return h('div', null,
        h('span', { 'data-testid': 'display' }, count),
        h(Child, { value: count, onChange: setCount })
      );
    }

    render(h(Parent), container);
    expect(container.querySelector('[data-testid="display"]').textContent).toBe('0');

    container.querySelector('button').click();
    await flushMicrotasks();
    expect(container.querySelector('[data-testid="display"]').textContent).toBe('1');
  });

  test('multiple instances maintain separate state', async () => {
    function Counter({ id }) {
      const [count, setCount] = useState(0);
      return h('div', { 'data-testid': `counter-${id}` },
        h('span', { 'data-testid': `count-${id}` }, count),
        h('button', { 'data-testid': `btn-${id}`, onClick: () => setCount(c => c + 1) }, '+')
      );
    }

    function App() {
      return h('div', null,
        h(Counter, { id: 'a' }),
        h(Counter, { id: 'b' })
      );
    }

    render(h(App), container);

    // Click counter A twice
    container.querySelector('[data-testid="btn-a"]').click();
    await flushMicrotasks();
    container.querySelector('[data-testid="btn-a"]').click();
    await flushMicrotasks();

    // Click counter B once
    container.querySelector('[data-testid="btn-b"]').click();
    await flushMicrotasks();

    expect(container.querySelector('[data-testid="count-a"]').textContent).toBe('2');
    expect(container.querySelector('[data-testid="count-b"]').textContent).toBe('1');
  });
});
