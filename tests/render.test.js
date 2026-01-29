/**
 * Tests for render.js - Basic Rendering
 */

import { h, render, Fragment } from '../src/index.js';

describe('render()', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  afterEach(() => {
    render(null, container);
  });

  test('renders a simple element', () => {
    render(h('div', { id: 'test' }, 'Hello'), container);

    expect(container.innerHTML).toBe('<div id="test">Hello</div>');
  });

  test('renders nested elements', () => {
    render(
      h('div', { className: 'outer' },
        h('span', { className: 'inner' }, 'Text')
      ),
      container
    );

    expect(container.innerHTML).toBe(
      '<div class="outer"><span class="inner">Text</span></div>'
    );
  });

  test('renders multiple children', () => {
    render(
      h('ul', null,
        h('li', null, 'One'),
        h('li', null, 'Two'),
        h('li', null, 'Three')
      ),
      container
    );

    expect(container.querySelectorAll('li').length).toBe(3);
  });

  test('updates existing element', () => {
    render(h('div', null, 'Before'), container);
    expect(container.textContent).toBe('Before');

    render(h('div', null, 'After'), container);
    expect(container.textContent).toBe('After');
  });

  test('replaces element when type changes', () => {
    render(h('div', null, 'Div'), container);
    const divElement = container.firstChild;

    render(h('span', null, 'Span'), container);
    const spanElement = container.firstChild;

    expect(divElement).not.toBe(spanElement);
    expect(container.innerHTML).toBe('<span>Span</span>');
  });

  test('unmounts when rendering null', () => {
    render(h('div', null, 'Content'), container);
    expect(container.innerHTML).toBe('<div>Content</div>');

    render(null, container);
    expect(container.innerHTML).toBe('');
  });

  test('renders text nodes', () => {
    render(h('div', null, 'text', 123), container);
    expect(container.textContent).toBe('text123');
  });

  test('handles empty children', () => {
    render(h('div', null), container);
    expect(container.innerHTML).toBe('<div></div>');
  });
});

describe('Fragment rendering', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  afterEach(() => {
    render(null, container);
  });

  test('renders Fragment children without wrapper', () => {
    render(
      h(Fragment, null,
        h('span', null, 'A'),
        h('span', null, 'B')
      ),
      container
    );

    expect(container.innerHTML).toBe('<span>A</span><span>B</span>');
  });

  test('renders nested Fragments', () => {
    render(
      h('div', null,
        h(Fragment, null,
          h('span', null, '1'),
          h(Fragment, null,
            h('span', null, '2'),
            h('span', null, '3')
          )
        )
      ),
      container
    );

    expect(container.querySelectorAll('span').length).toBe(3);
  });
});

describe('Function components', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  afterEach(() => {
    render(null, container);
  });

  test('renders a function component', () => {
    function Greeting({ name }) {
      return h('div', null, `Hello, ${name}!`);
    }

    render(h(Greeting, { name: 'World' }), container);
    expect(container.textContent).toBe('Hello, World!');
  });

  test('re-renders component with new props', () => {
    function Counter({ count }) {
      return h('span', null, count);
    }

    render(h(Counter, { count: 0 }), container);
    expect(container.textContent).toBe('0');

    render(h(Counter, { count: 5 }), container);
    expect(container.textContent).toBe('5');
  });

  test('handles component returning null', () => {
    function Empty() {
      return null;
    }

    render(h(Empty), container);
    expect(container.innerHTML).toBe('');
  });

  test('handles component returning Fragment', () => {
    function Multi() {
      return h(Fragment, null,
        h('span', null, 'A'),
        h('span', null, 'B')
      );
    }

    render(h(Multi), container);
    expect(container.innerHTML).toBe('<span>A</span><span>B</span>');
  });
});
