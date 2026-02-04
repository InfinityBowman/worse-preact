/**
 * Tests for context.js - Context API Implementation
 */

import { h, render, createContext, useContext, useState } from '../src/index.js';

describe('createContext', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  afterEach(() => {
    render(null, container);
  });

  test('createContext returns object with Provider', () => {
    const Context = createContext('default');

    expect(Context).toBeDefined();
    expect(Context.Provider).toBeDefined();
    expect(typeof Context.Provider).toBe('function');
    expect(Context._defaultValue).toBe('default');
  });

  test('useContext returns default value when no Provider', () => {
    const Context = createContext('default-value');
    let receivedValue;

    function Consumer() {
      receivedValue = useContext(Context);
      return h('span', null, receivedValue);
    }

    render(h(Consumer), container);

    expect(receivedValue).toBe('default-value');
    expect(container.textContent).toBe('default-value');
  });

  test('useContext reads from Provider', () => {
    const Context = createContext('default');
    let receivedValue;

    function Consumer() {
      receivedValue = useContext(Context);
      return h('span', null, receivedValue);
    }

    function App() {
      return h(Context.Provider, { value: 'provided-value' },
        h(Consumer)
      );
    }

    render(h(App), container);

    expect(receivedValue).toBe('provided-value');
    expect(container.textContent).toBe('provided-value');
  });

  test('nested providers - closest wins', () => {
    const Context = createContext('default');
    let innerValue, outerValue;

    function InnerConsumer() {
      innerValue = useContext(Context);
      return h('span', { id: 'inner' }, innerValue);
    }

    function OuterConsumer() {
      outerValue = useContext(Context);
      return h('span', { id: 'outer' }, outerValue);
    }

    function App() {
      return h(Context.Provider, { value: 'outer' },
        h(OuterConsumer),
        h(Context.Provider, { value: 'inner' },
          h(InnerConsumer)
        )
      );
    }

    render(h(App), container);

    expect(outerValue).toBe('outer');
    expect(innerValue).toBe('inner');
  });

  test('value changes trigger consumer re-renders', async () => {
    const Context = createContext('initial');
    let renderCount = 0;
    let setValue;

    function Consumer() {
      const value = useContext(Context);
      renderCount++;
      return h('span', null, value);
    }

    function App() {
      const [value, setValueState] = useState('initial');
      setValue = setValueState;

      return h(Context.Provider, { value },
        h(Consumer)
      );
    }

    render(h(App), container);
    expect(container.textContent).toBe('initial');
    expect(renderCount).toBe(1);

    setValue('updated');
    await new Promise(resolve => queueMicrotask(resolve));

    expect(container.textContent).toBe('updated');
    expect(renderCount).toBe(2);
  });

  test('multiple consumers all update', async () => {
    const Context = createContext(0);
    let setValue;

    function Consumer({ id }) {
      const value = useContext(Context);
      return h('span', { id }, `Value: ${value}`);
    }

    function App() {
      const [count, setCount] = useState(0);
      setValue = setCount;

      return h(Context.Provider, { value: count },
        h(Consumer, { id: 'a' }),
        h(Consumer, { id: 'b' }),
        h(Consumer, { id: 'c' })
      );
    }

    render(h(App), container);
    expect(container.querySelector('#a').textContent).toBe('Value: 0');
    expect(container.querySelector('#b').textContent).toBe('Value: 0');
    expect(container.querySelector('#c').textContent).toBe('Value: 0');

    setValue(5);
    await new Promise(resolve => queueMicrotask(resolve));

    expect(container.querySelector('#a').textContent).toBe('Value: 5');
    expect(container.querySelector('#b').textContent).toBe('Value: 5');
    expect(container.querySelector('#c').textContent).toBe('Value: 5');
  });

  test('multiple contexts are independent', () => {
    const ThemeContext = createContext('light');
    const UserContext = createContext('anonymous');

    let theme, user;

    function Consumer() {
      theme = useContext(ThemeContext);
      user = useContext(UserContext);
      return h('span', null, `${theme}-${user}`);
    }

    function App() {
      return h(ThemeContext.Provider, { value: 'dark' },
        h(UserContext.Provider, { value: 'alice' },
          h(Consumer)
        )
      );
    }

    render(h(App), container);

    expect(theme).toBe('dark');
    expect(user).toBe('alice');
    expect(container.textContent).toBe('dark-alice');
  });

  test('components unsubscribe on unmount', async () => {
    const Context = createContext('default');
    let setValue;

    function Consumer() {
      const value = useContext(Context);
      return h('span', { id: 'consumer' }, value);
    }

    function App() {
      const [show, setShow] = useState(true);
      const [value, setValueState] = useState('initial');
      setValue = setValueState;

      return h(Context.Provider, { value },
        show ? h(Consumer) : null,
        h('button', { onClick: () => setShow(false) }, 'Hide')
      );
    }

    render(h(App), container);
    expect(container.querySelector('#consumer').textContent).toBe('initial');

    // Unmount the consumer
    container.querySelector('button').click();
    await new Promise(resolve => queueMicrotask(resolve));

    expect(container.querySelector('#consumer')).toBeNull();

    // Update context - should not throw (consumer is unsubscribed)
    setValue('updated');
    await new Promise(resolve => queueMicrotask(resolve));

    // App should still work
    expect(container.querySelector('button')).toBeTruthy();
  });

  test('Provider with undefined value', () => {
    const Context = createContext('default');
    let receivedValue;

    function Consumer() {
      receivedValue = useContext(Context);
      return h('span', null, String(receivedValue));
    }

    function App() {
      return h(Context.Provider, { value: undefined },
        h(Consumer)
      );
    }

    render(h(App), container);

    expect(receivedValue).toBe(undefined);
  });

  test('Provider with null value', () => {
    const Context = createContext('default');
    let receivedValue;

    function Consumer() {
      receivedValue = useContext(Context);
      return h('span', null, String(receivedValue));
    }

    function App() {
      return h(Context.Provider, { value: null },
        h(Consumer)
      );
    }

    render(h(App), container);

    expect(receivedValue).toBe(null);
  });

  test('deeply nested consumer finds provider', () => {
    const Context = createContext('default');
    let receivedValue;

    function DeepChild() {
      receivedValue = useContext(Context);
      return h('span', null, receivedValue);
    }

    function Middle() {
      return h('div', null, h(DeepChild));
    }

    function App() {
      return h(Context.Provider, { value: 'deep-value' },
        h('div', null,
          h('div', null,
            h(Middle)
          )
        )
      );
    }

    render(h(App), container);

    expect(receivedValue).toBe('deep-value');
  });

  test('same value does not trigger re-render', async () => {
    const Context = createContext('initial');
    let renderCount = 0;
    let setValue;

    function Consumer() {
      const value = useContext(Context);
      renderCount++;
      return h('span', null, value);
    }

    function App() {
      const [value, setValueState] = useState('same');
      setValue = setValueState;

      return h(Context.Provider, { value },
        h(Consumer)
      );
    }

    render(h(App), container);
    expect(renderCount).toBe(1);

    // Set to same value
    setValue('same');
    await new Promise(resolve => queueMicrotask(resolve));

    // Consumer should not re-render (Object.is check)
    expect(renderCount).toBe(1);
  });

  test('object value - reference change triggers update', async () => {
    const Context = createContext({ theme: 'light' });
    let renderCount = 0;
    let setValue;

    function Consumer() {
      const value = useContext(Context);
      renderCount++;
      return h('span', null, value.theme);
    }

    function App() {
      const [value, setValueState] = useState({ theme: 'dark' });
      setValue = setValueState;

      return h(Context.Provider, { value },
        h(Consumer)
      );
    }

    render(h(App), container);
    expect(renderCount).toBe(1);
    expect(container.textContent).toBe('dark');

    // New object with same content - should trigger update (different reference)
    setValue({ theme: 'dark' });
    await new Promise(resolve => queueMicrotask(resolve));

    expect(renderCount).toBe(2);
  });
});
