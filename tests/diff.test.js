/**
 * Tests for diff.js - Core Reconciler
 * @jest-environment jsdom
 */

import { jest } from '@jest/globals';
import { h, render, Fragment, createRef } from '../src/index.js';

describe('Element type changes', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  afterEach(() => {
    render(null, container);
  });

  test('replaces element when type changes', () => {
    render(h('div', null, 'content'), container);
    const div = container.firstChild;

    render(h('span', null, 'content'), container);
    const span = container.firstChild;

    expect(span).not.toBe(div);
    expect(span.tagName).toBe('SPAN');
  });

  test('replaces element when changing to component', () => {
    function Component() {
      return h('p', null, 'from component');
    }

    render(h('div', null, 'plain'), container);
    render(h(Component), container);

    expect(container.firstChild.tagName).toBe('P');
  });

  test('replaces component when changing to element', () => {
    function Component() {
      return h('p', null, 'from component');
    }

    render(h(Component), container);
    render(h('div', null, 'plain'), container);

    expect(container.firstChild.tagName).toBe('DIV');
  });

  test('replaces component when type changes', () => {
    function CompA() {
      return h('div', null, 'A');
    }
    function CompB() {
      return h('div', null, 'B');
    }

    render(h(CompA), container);
    expect(container.textContent).toBe('A');

    render(h(CompB), container);
    expect(container.textContent).toBe('B');
  });
});

describe('Refs', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  afterEach(() => {
    render(null, container);
  });

  test('object ref is set to DOM element', () => {
    const ref = createRef();
    render(h('div', { ref, id: 'test' }), container);

    expect(ref.current).toBe(container.firstChild);
    expect(ref.current.id).toBe('test');
  });

  test('callback ref is called with DOM element', () => {
    const callback = jest.fn();
    render(h('div', { ref: callback }), container);

    expect(callback).toHaveBeenCalledWith(container.firstChild);
  });

  test('ref is cleared on unmount', () => {
    const ref = createRef();
    render(h('div', { ref }), container);
    expect(ref.current).not.toBeNull();

    render(null, container);
    expect(ref.current).toBeNull();
  });

  test('callback ref is called with null on unmount', () => {
    const callback = jest.fn();
    render(h('div', { ref: callback }), container);
    callback.mockClear();

    render(null, container);
    expect(callback).toHaveBeenCalledWith(null);
  });

  test('ref updates when element changes', () => {
    const ref = createRef();
    render(h('div', { ref }), container);
    const div = ref.current;

    render(h('span', { ref }), container);
    expect(ref.current).not.toBe(div);
    expect(ref.current.tagName).toBe('SPAN');
  });
});

describe('Component lifecycle', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  afterEach(() => {
    render(null, container);
  });

  test('component receives props', () => {
    let receivedProps;
    function Component(props) {
      receivedProps = props;
      return h('div', null, props.name);
    }

    render(h(Component, { name: 'test', value: 42 }), container);
    expect(receivedProps.name).toBe('test');
    expect(receivedProps.value).toBe(42);
  });

  test('component receives updated props', () => {
    let receivedProps;
    function Component(props) {
      receivedProps = props;
      return h('div', null, props.name);
    }

    render(h(Component, { name: 'first' }), container);
    expect(receivedProps.name).toBe('first');

    render(h(Component, { name: 'second' }), container);
    expect(receivedProps.name).toBe('second');
  });

  test('component children are passed in props', () => {
    let receivedProps;
    function Parent(props) {
      receivedProps = props;
      return h('div', null, props.children);
    }

    render(
      h(Parent, null, h('span', null, 'child')),
      container
    );

    expect(receivedProps.children.type).toBe('span');
    expect(container.innerHTML).toBe('<div><span>child</span></div>');
  });
});

describe('Nested components', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  afterEach(() => {
    render(null, container);
  });

  test('renders nested components', () => {
    function Child({ name }) {
      return h('span', null, name);
    }

    function Parent() {
      return h('div', null, h(Child, { name: 'nested' }));
    }

    render(h(Parent), container);
    expect(container.innerHTML).toBe('<div><span>nested</span></div>');
  });

  test('updates nested components', () => {
    function Child({ count }) {
      return h('span', null, count);
    }

    function Parent({ count }) {
      return h('div', null, h(Child, { count }));
    }

    render(h(Parent, { count: 1 }), container);
    expect(container.textContent).toBe('1');

    render(h(Parent, { count: 2 }), container);
    expect(container.textContent).toBe('2');
  });

  test('handles deeply nested structure', () => {
    function Level3() {
      return h('span', null, 'deep');
    }

    function Level2() {
      return h('div', null, h(Level3));
    }

    function Level1() {
      return h('section', null, h(Level2));
    }

    render(h(Level1), container);
    expect(container.innerHTML).toBe(
      '<section><div><span>deep</span></div></section>'
    );
  });
});

describe('Text nodes', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  afterEach(() => {
    render(null, container);
  });

  test('renders text content', () => {
    render(h('div', null, 'Hello World'), container);
    expect(container.textContent).toBe('Hello World');
  });

  test('updates text content', () => {
    render(h('div', null, 'Before'), container);
    render(h('div', null, 'After'), container);
    expect(container.textContent).toBe('After');
  });

  test('renders numbers as text', () => {
    render(h('div', null, 42), container);
    expect(container.textContent).toBe('42');
  });

  test('renders mixed text and elements', () => {
    render(
      h('div', null,
        'Hello ',
        h('strong', null, 'World'),
        '!'
      ),
      container
    );
    expect(container.innerHTML).toBe('<div>Hello <strong>World</strong>!</div>');
  });
});

describe('Conditional rendering', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  afterEach(() => {
    render(null, container);
  });

  test('handles conditional children', () => {
    function Conditional({ show }) {
      return h('div', null, show ? h('span', null, 'visible') : null);
    }

    render(h(Conditional, { show: true }), container);
    expect(container.querySelector('span')).not.toBeNull();

    render(h(Conditional, { show: false }), container);
    expect(container.querySelector('span')).toBeNull();
  });

  test('handles && pattern', () => {
    function Component({ condition }) {
      return h('div', null, condition && h('span', null, 'shown'));
    }

    render(h(Component, { condition: true }), container);
    expect(container.textContent).toBe('shown');

    render(h(Component, { condition: false }), container);
    expect(container.textContent).toBe('');
  });

  test('handles ternary pattern', () => {
    function Component({ loading }) {
      return h('div', null,
        loading
          ? h('span', null, 'Loading...')
          : h('span', null, 'Loaded')
      );
    }

    render(h(Component, { loading: true }), container);
    expect(container.textContent).toBe('Loading...');

    render(h(Component, { loading: false }), container);
    expect(container.textContent).toBe('Loaded');
  });
});
