/**
 * Tests for vnode.js - VNode Creation
 */

import { h, createElement, Fragment, createRef, createVNode } from '../src/vnode.js';

describe('h() / createElement()', () => {
  test('creates a vnode with type and props', () => {
    const vnode = h('div', { id: 'test', className: 'container' });

    expect(vnode.type).toBe('div');
    expect(vnode.props.id).toBe('test');
    expect(vnode.props.className).toBe('container');
    expect(vnode.key).toBeNull();
    expect(vnode.ref).toBeNull();
  });

  test('handles null props', () => {
    const vnode = h('span', null);

    expect(vnode.type).toBe('span');
    expect(vnode.props).toEqual({});
  });

  test('extracts key from props', () => {
    const vnode = h('li', { key: 'item-1', className: 'item' });

    expect(vnode.key).toBe('item-1');
    expect(vnode.props.key).toBeUndefined();
    expect(vnode.props.className).toBe('item');
  });

  test('extracts ref from props', () => {
    const ref = createRef();
    const vnode = h('input', { ref, type: 'text' });

    expect(vnode.ref).toBe(ref);
    expect(vnode.props.ref).toBeUndefined();
    expect(vnode.props.type).toBe('text');
  });

  test('handles single child', () => {
    const vnode = h('p', null, 'Hello');

    expect(vnode.props.children).toBe('Hello');
  });

  test('handles multiple children', () => {
    const vnode = h('div', null, 'Hello', ' ', 'World');

    expect(vnode.props.children).toEqual(['Hello', ' ', 'World']);
  });

  test('handles nested children arrays', () => {
    const items = ['a', 'b', 'c'];
    const vnode = h('ul', null, items.map(item => h('li', { key: item }, item)));

    expect(Array.isArray(vnode.props.children)).toBe(true);
    expect(vnode.props.children.length).toBe(3);
    expect(vnode.props.children[0].type).toBe('li');
  });

  test('filters out null, undefined, and boolean children', () => {
    const vnode = h('div', null, 'text', null, undefined, true, false, 'more');

    expect(vnode.props.children).toEqual(['text', 'more']);
  });

  test('creates component vnodes', () => {
    function MyComponent(props) {
      return h('div', null, props.name);
    }

    const vnode = h(MyComponent, { name: 'Test' });

    expect(vnode.type).toBe(MyComponent);
    expect(vnode.props.name).toBe('Test');
  });

  test('createElement is an alias for h', () => {
    expect(createElement).toBe(h);
  });
});

describe('Fragment', () => {
  test('Fragment returns children', () => {
    const props = { children: [h('span', null, 'A'), h('span', null, 'B')] };
    const result = Fragment(props);

    expect(result).toBe(props.children);
  });

  test('Fragment with single child', () => {
    const child = h('div', null, 'content');
    const props = { children: child };
    const result = Fragment(props);

    expect(result).toBe(child);
  });
});

describe('createRef()', () => {
  test('creates a ref object with current: null', () => {
    const ref = createRef();

    expect(ref).toEqual({ current: null });
  });

  test('each call creates a new ref', () => {
    const ref1 = createRef();
    const ref2 = createRef();

    expect(ref1).not.toBe(ref2);
  });
});

describe('createVNode()', () => {
  test('creates a vnode with all internal fields', () => {
    const vnode = createVNode('div', { id: 'test' }, 'key-1', null);

    expect(vnode.type).toBe('div');
    expect(vnode.props).toEqual({ id: 'test' });
    expect(vnode.key).toBe('key-1');
    expect(vnode.ref).toBeNull();
    expect(vnode._children).toBeNull();
    expect(vnode._dom).toBeNull();
    expect(vnode._component).toBeNull();
    expect(vnode._parent).toBeNull();
    expect(vnode._depth).toBe(0);
    expect(vnode._flags).toBe(0);
  });
});
