/**
 * Tests for portal.js - Portal Implementation
 */

import { h, render, createPortal, useState } from '../src/index.js';

describe('createPortal', () => {
  let container, portalRoot;

  beforeEach(() => {
    container = document.createElement('div');
    portalRoot = document.createElement('div');
    portalRoot.id = 'portal-root';
    document.body.appendChild(container);
    document.body.appendChild(portalRoot);
  });

  afterEach(() => {
    render(null, container);
    document.body.removeChild(container);
    document.body.removeChild(portalRoot);
  });

  test('renders children into different container', () => {
    function App() {
      return h('div', { id: 'app' },
        h('span', null, 'App'),
        createPortal(
          h('span', { id: 'portal-content' }, 'Portal'),
          portalRoot
        )
      );
    }

    render(h(App), container);

    // App content in container
    expect(container.querySelector('#app')).toBeTruthy();
    expect(container.querySelector('#app').textContent).toBe('App');
    expect(container.querySelector('#portal-content')).toBeNull();

    // Portal content in portalRoot
    expect(portalRoot.querySelector('#portal-content')).toBeTruthy();
    expect(portalRoot.querySelector('#portal-content').textContent).toBe('Portal');
  });

  test('renders multiple children in portal', () => {
    function App() {
      return createPortal(
        [
          h('span', { key: 1 }, 'One'),
          h('span', { key: 2 }, 'Two'),
          h('span', { key: 3 }, 'Three')
        ],
        portalRoot
      );
    }

    render(h(App), container);
    expect(portalRoot.querySelectorAll('span').length).toBe(3);
    expect(portalRoot.textContent).toBe('OneTwoThree');
  });

  test('updates portal content on re-render', async () => {
    let setState;
    function App() {
      const [text, setTextState] = useState('Initial');
      setState = setTextState;
      return createPortal(h('span', null, text), portalRoot);
    }

    render(h(App), container);
    expect(portalRoot.textContent).toBe('Initial');

    setState('Updated');
    await new Promise(resolve => queueMicrotask(resolve));
    expect(portalRoot.textContent).toBe('Updated');
  });

  test('removes portal content on unmount', () => {
    function App({ show }) {
      return show ? createPortal(h('span', null, 'Portal'), portalRoot) : null;
    }

    render(h(App, { show: true }), container);
    expect(portalRoot.textContent).toBe('Portal');

    render(h(App, { show: false }), container);
    expect(portalRoot.textContent).toBe('');
  });

  test('cleans up portal when parent unmounts', () => {
    function App() {
      return h('div', null,
        createPortal(h('span', null, 'Portal Content'), portalRoot)
      );
    }

    render(h(App), container);
    expect(portalRoot.textContent).toBe('Portal Content');

    // Unmount entire app
    render(null, container);
    expect(portalRoot.textContent).toBe('');
  });

  test('supports dynamic container changes', async () => {
    const container2 = document.createElement('div');
    document.body.appendChild(container2);

    let setState;
    function App() {
      const [useSecond, setUseSecond] = useState(false);
      setState = setUseSecond;
      const target = useSecond ? container2 : portalRoot;
      return createPortal(h('span', null, 'Content'), target);
    }

    render(h(App), container);
    expect(portalRoot.textContent).toBe('Content');
    expect(container2.textContent).toBe('');

    setState(true);
    await new Promise(resolve => queueMicrotask(resolve));
    expect(portalRoot.textContent).toBe('');
    expect(container2.textContent).toBe('Content');

    document.body.removeChild(container2);
  });

  test('supports nested portals', () => {
    const portal2 = document.createElement('div');
    document.body.appendChild(portal2);

    function App() {
      return createPortal(
        h('div', null,
          h('span', null, 'Level 1'),
          createPortal(h('span', null, 'Level 2'), portal2)
        ),
        portalRoot
      );
    }

    render(h(App), container);

    expect(portalRoot.textContent).toContain('Level 1');
    expect(portal2.textContent).toBe('Level 2');

    document.body.removeChild(portal2);
  });

  test('portal renders null children correctly', () => {
    function App() {
      return createPortal(null, portalRoot);
    }

    render(h(App), container);
    expect(portalRoot.innerHTML).toBe('');
  });

  test('portal with component children', async () => {
    let setCount;
    function Counter() {
      const [count, setCountState] = useState(0);
      setCount = setCountState;
      return h('span', null, `Count: ${count}`);
    }

    function App() {
      return createPortal(h(Counter), portalRoot);
    }

    render(h(App), container);
    expect(portalRoot.textContent).toBe('Count: 0');

    setCount(5);
    await new Promise(resolve => queueMicrotask(resolve));
    expect(portalRoot.textContent).toBe('Count: 5');
  });

  test('portal preserves DOM nodes on update', () => {
    function App({ text }) {
      return createPortal(h('div', { id: 'stable' }, text), portalRoot);
    }

    render(h(App, { text: 'First' }), container);
    const firstDiv = portalRoot.querySelector('#stable');

    render(h(App, { text: 'Second' }), container);
    const secondDiv = portalRoot.querySelector('#stable');

    expect(firstDiv).toBe(secondDiv);
    expect(secondDiv.textContent).toBe('Second');
  });

  test('multiple portals to same container', () => {
    function App() {
      return h('div', null,
        createPortal(h('span', { key: 'a' }, 'A'), portalRoot),
        createPortal(h('span', { key: 'b' }, 'B'), portalRoot)
      );
    }

    render(h(App), container);
    expect(portalRoot.querySelectorAll('span').length).toBe(2);
  });

  test('portal with reordering siblings', async () => {
    let setState;
    function App() {
      const [order, setOrder] = useState(['before', 'portal', 'after']);
      setState = setOrder;

      return h('div', null,
        order.map(item => {
          if (item === 'portal') {
            return createPortal(h('span', { key: 'portal' }, 'Portal'), portalRoot);
          }
          return h('span', { key: item }, item);
        })
      );
    }

    render(h(App), container);
    expect(container.querySelector('div').textContent).toBe('beforeafter');
    expect(portalRoot.textContent).toBe('Portal');

    // Reorder: move portal to beginning
    setState(['portal', 'before', 'after']);
    await new Promise(resolve => queueMicrotask(resolve));

    // Portal content should still be in portal container
    expect(portalRoot.textContent).toBe('Portal');
    // Regular children should still be in main container
    expect(container.querySelector('div').textContent).toBe('beforeafter');
  });

  test('portal between siblings does not affect sibling DOM', () => {
    function App() {
      return h('div', null,
        h('span', { id: 'first' }, 'First'),
        createPortal(h('div', null, 'Portal Content'), portalRoot),
        h('span', { id: 'second' }, 'Second')
      );
    }

    render(h(App), container);

    // Check main container has correct structure
    const div = container.querySelector('div');
    expect(div.children.length).toBe(2);
    expect(div.children[0].id).toBe('first');
    expect(div.children[1].id).toBe('second');

    // Check portal has its content
    expect(portalRoot.textContent).toBe('Portal Content');
  });
});
