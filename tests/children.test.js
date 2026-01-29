/**
 * Tests for children.js - Child Reconciliation with Keys
 */

import { h, render } from '../src/index.js';

describe('Keyed child reconciliation', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  afterEach(() => {
    render(null, container);
  });

  test('preserves DOM nodes for keyed items', () => {
    render(
      h('ul', null,
        h('li', { key: 'a' }, 'A'),
        h('li', { key: 'b' }, 'B'),
        h('li', { key: 'c' }, 'C')
      ),
      container
    );

    const [liA, liB, liC] = container.querySelectorAll('li');

    // Reverse order
    render(
      h('ul', null,
        h('li', { key: 'c' }, 'C'),
        h('li', { key: 'b' }, 'B'),
        h('li', { key: 'a' }, 'A')
      ),
      container
    );

    const items = container.querySelectorAll('li');
    expect(items[0]).toBe(liC);
    expect(items[1]).toBe(liB);
    expect(items[2]).toBe(liA);
  });

  test('removes keyed items not in new list', () => {
    render(
      h('ul', null,
        h('li', { key: 'a' }, 'A'),
        h('li', { key: 'b' }, 'B'),
        h('li', { key: 'c' }, 'C')
      ),
      container
    );

    render(
      h('ul', null,
        h('li', { key: 'a' }, 'A'),
        h('li', { key: 'c' }, 'C')
      ),
      container
    );

    expect(container.querySelectorAll('li').length).toBe(2);
    expect(container.textContent).toBe('AC');
  });

  test('adds new keyed items', () => {
    render(
      h('ul', null,
        h('li', { key: 'a' }, 'A'),
        h('li', { key: 'c' }, 'C')
      ),
      container
    );

    render(
      h('ul', null,
        h('li', { key: 'a' }, 'A'),
        h('li', { key: 'b' }, 'B'),
        h('li', { key: 'c' }, 'C')
      ),
      container
    );

    expect(container.querySelectorAll('li').length).toBe(3);
    expect(container.textContent).toBe('ABC');
  });

  test('handles complete list replacement', () => {
    render(
      h('ul', null,
        h('li', { key: 'a' }, 'A'),
        h('li', { key: 'b' }, 'B')
      ),
      container
    );

    render(
      h('ul', null,
        h('li', { key: 'x' }, 'X'),
        h('li', { key: 'y' }, 'Y')
      ),
      container
    );

    expect(container.textContent).toBe('XY');
  });

  test('handles shuffle', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    render(
      h('ul', null, items.map(i => h('li', { key: i }, i))),
      container
    );

    const originalNodes = [...container.querySelectorAll('li')];

    // Shuffle: e, c, a, d, b
    const shuffled = ['e', 'c', 'a', 'd', 'b'];
    render(
      h('ul', null, shuffled.map(i => h('li', { key: i }, i))),
      container
    );

    const newNodes = [...container.querySelectorAll('li')];

    // Verify content is correct
    expect(newNodes.map(n => n.textContent).join('')).toBe('ecadb');

    // Verify DOM nodes were reused
    expect(newNodes[0]).toBe(originalNodes[4]); // e
    expect(newNodes[1]).toBe(originalNodes[2]); // c
    expect(newNodes[2]).toBe(originalNodes[0]); // a
    expect(newNodes[3]).toBe(originalNodes[3]); // d
    expect(newNodes[4]).toBe(originalNodes[1]); // b
  });
});

describe('Unkeyed child reconciliation', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  afterEach(() => {
    render(null, container);
  });

  test('matches unkeyed children by position and type', () => {
    render(
      h('div', null,
        h('span', null, 'A'),
        h('span', null, 'B')
      ),
      container
    );

    const [span1, span2] = container.querySelectorAll('span');

    render(
      h('div', null,
        h('span', null, 'X'),
        h('span', null, 'Y')
      ),
      container
    );

    const newSpans = container.querySelectorAll('span');
    // Should reuse the same DOM nodes
    expect(newSpans[0]).toBe(span1);
    expect(newSpans[1]).toBe(span2);
    expect(newSpans[0].textContent).toBe('X');
    expect(newSpans[1].textContent).toBe('Y');
  });

  test('handles adding children', () => {
    render(
      h('div', null,
        h('span', null, 'A')
      ),
      container
    );

    render(
      h('div', null,
        h('span', null, 'A'),
        h('span', null, 'B'),
        h('span', null, 'C')
      ),
      container
    );

    expect(container.querySelectorAll('span').length).toBe(3);
  });

  test('handles removing children', () => {
    render(
      h('div', null,
        h('span', null, 'A'),
        h('span', null, 'B'),
        h('span', null, 'C')
      ),
      container
    );

    render(
      h('div', null,
        h('span', null, 'A')
      ),
      container
    );

    expect(container.querySelectorAll('span').length).toBe(1);
  });

  test('replaces child when type changes', () => {
    render(
      h('div', null,
        h('span', null, 'Text')
      ),
      container
    );

    const span = container.querySelector('span');

    render(
      h('div', null,
        h('div', null, 'Text')
      ),
      container
    );

    expect(container.querySelector('span')).toBeNull();
    expect(container.querySelector('div > div')).not.toBeNull();
  });
});

describe('Mixed keyed and unkeyed children', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  afterEach(() => {
    render(null, container);
  });

  test('handles mix of keyed and unkeyed', () => {
    render(
      h('div', null,
        h('span', null, 'Unkeyed'),
        h('span', { key: 'k1' }, 'Keyed 1'),
        h('span', { key: 'k2' }, 'Keyed 2')
      ),
      container
    );

    expect(container.querySelectorAll('span').length).toBe(3);

    // Reorder keyed items
    render(
      h('div', null,
        h('span', null, 'Unkeyed'),
        h('span', { key: 'k2' }, 'Keyed 2'),
        h('span', { key: 'k1' }, 'Keyed 1')
      ),
      container
    );

    const spans = container.querySelectorAll('span');
    expect(spans[0].textContent).toBe('Unkeyed');
    expect(spans[1].textContent).toBe('Keyed 2');
    expect(spans[2].textContent).toBe('Keyed 1');
  });
});

describe('Edge cases', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  afterEach(() => {
    render(null, container);
  });

  test('handles empty to non-empty', () => {
    render(h('div', null), container);
    expect(container.firstChild.childNodes.length).toBe(0);

    render(h('div', null, h('span', null, 'Added')), container);
    expect(container.firstChild.childNodes.length).toBe(1);
  });

  test('handles non-empty to empty', () => {
    render(h('div', null, h('span', null, 'Remove me')), container);
    expect(container.firstChild.childNodes.length).toBe(1);

    render(h('div', null), container);
    expect(container.firstChild.childNodes.length).toBe(0);
  });

  test('handles null children in array', () => {
    render(
      h('div', null,
        h('span', null, 'A'),
        null,
        h('span', null, 'B')
      ),
      container
    );

    expect(container.querySelectorAll('span').length).toBe(2);
  });

  test('handles deeply nested arrays', () => {
    const items = [
      ['a', 'b'],
      ['c', ['d', 'e']]
    ];

    render(
      h('div', null,
        items.map((group, i) =>
          h('div', { key: i },
            group.flat().map(item =>
              h('span', { key: item }, item)
            )
          )
        )
      ),
      container
    );

    expect(container.querySelectorAll('span').length).toBe(5);
  });
});
