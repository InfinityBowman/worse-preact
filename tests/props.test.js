/**
 * Tests for props.js - DOM Property Handling
 * @jest-environment jsdom
 */

import { jest } from '@jest/globals';
import { h, render } from '../src/index.js';

describe('DOM properties', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  afterEach(() => {
    render(null, container);
  });

  test('sets id attribute', () => {
    render(h('div', { id: 'test-id' }), container);
    expect(container.firstChild.id).toBe('test-id');
  });

  test('sets className as class attribute', () => {
    render(h('div', { className: 'my-class' }), container);
    expect(container.firstChild.className).toBe('my-class');
  });

  test('updates attributes', () => {
    render(h('div', { id: 'old' }), container);
    render(h('div', { id: 'new' }), container);
    expect(container.firstChild.id).toBe('new');
  });

  test('removes attributes when set to null', () => {
    render(h('div', { id: 'test' }), container);
    render(h('div', { id: null }), container);
    expect(container.firstChild.hasAttribute('id')).toBe(false);
  });

  test('handles boolean attributes', () => {
    render(h('input', { disabled: true }), container);
    expect(container.firstChild.disabled).toBe(true);

    render(h('input', { disabled: false }), container);
    expect(container.firstChild.disabled).toBe(false);
  });
});

describe('Style handling', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  afterEach(() => {
    render(null, container);
  });

  test('sets style from object', () => {
    render(h('div', { style: { color: 'red', fontSize: '16px' } }), container);
    const el = container.firstChild;
    expect(el.style.color).toBe('red');
    expect(el.style.fontSize).toBe('16px');
  });

  test('sets style from string', () => {
    render(h('div', { style: 'color: blue; font-size: 14px' }), container);
    const el = container.firstChild;
    expect(el.style.color).toBe('blue');
  });

  test('updates style object', () => {
    render(h('div', { style: { color: 'red' } }), container);
    render(h('div', { style: { color: 'blue' } }), container);
    expect(container.firstChild.style.color).toBe('blue');
  });

  test('removes old style properties', () => {
    render(h('div', { style: { color: 'red', margin: '10px' } }), container);
    render(h('div', { style: { color: 'blue' } }), container);
    expect(container.firstChild.style.color).toBe('blue');
    expect(container.firstChild.style.margin).toBe('');
  });

  test('adds px to numeric style values', () => {
    render(h('div', { style: { width: 100, height: 50 } }), container);
    const el = container.firstChild;
    expect(el.style.width).toBe('100px');
    expect(el.style.height).toBe('50px');
  });

  test('does not add px to unitless properties', () => {
    render(h('div', { style: { opacity: 0.5, zIndex: 10 } }), container);
    const el = container.firstChild;
    expect(el.style.opacity).toBe('0.5');
    expect(el.style.zIndex).toBe('10');
  });
});

describe('Event handling', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    render(null, container);
    document.body.removeChild(container);
  });

  test('attaches click handler', () => {
    const handleClick = jest.fn();
    render(h('button', { onClick: handleClick }, 'Click'), container);

    container.firstChild.click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('updates event handler', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();

    render(h('button', { onClick: handler1 }), container);
    render(h('button', { onClick: handler2 }), container);

    container.firstChild.click();
    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  test('removes event handler when set to null', () => {
    const handler = jest.fn();

    render(h('button', { onClick: handler }), container);
    render(h('button', { onClick: null }), container);

    container.firstChild.click();
    expect(handler).not.toHaveBeenCalled();
  });

  test('handles input events', () => {
    const handleInput = jest.fn();
    render(h('input', { onInput: handleInput }), container);

    const event = new Event('input', { bubbles: true });
    container.firstChild.dispatchEvent(event);

    expect(handleInput).toHaveBeenCalledTimes(1);
  });

  test('event handler receives event object', () => {
    let receivedEvent = null;
    const handleClick = (e) => { receivedEvent = e; };

    render(h('button', { onClick: handleClick }), container);
    container.firstChild.click();

    expect(receivedEvent).toBeInstanceOf(Event);
    expect(receivedEvent.type).toBe('click');
  });
});

describe('Form element handling', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  afterEach(() => {
    render(null, container);
  });

  test('sets input value', () => {
    render(h('input', { value: 'test value' }), container);
    expect(container.firstChild.value).toBe('test value');
  });

  test('sets checkbox checked', () => {
    render(h('input', { type: 'checkbox', checked: true }), container);
    expect(container.firstChild.checked).toBe(true);
  });

  test('updates input value', () => {
    render(h('input', { value: 'old' }), container);
    render(h('input', { value: 'new' }), container);
    expect(container.firstChild.value).toBe('new');
  });
});

describe('dangerouslySetInnerHTML', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  afterEach(() => {
    render(null, container);
  });

  test('sets innerHTML', () => {
    render(
      h('div', { dangerouslySetInnerHTML: { __html: '<strong>Bold</strong>' } }),
      container
    );
    expect(container.firstChild.innerHTML).toBe('<strong>Bold</strong>');
  });
});
