/**
 * Smoke tests validating that all Preact modules load and work correctly
 * with the standard import paths (preact, preact/hooks, preact/compat, etc.)
 */

import { h, createElement, render, Component, Fragment, createRef, createContext, cloneElement, isValidElement, toChildArray, options } from 'preact';
import { useState, useReducer, useEffect, useLayoutEffect, useRef, useMemo, useCallback, useContext, useDebugValue, useErrorBoundary, useId } from 'preact/hooks';
import { setupRerender, act } from 'preact/test-utils';

const waitForEffects = () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));
const flushMicrotasks = () => new Promise(r => queueMicrotask(r));

describe('Core (preact)', () => {
	let scratch;

	beforeEach(() => {
		scratch = document.createElement('div');
		document.body.appendChild(scratch);
	});

	afterEach(() => {
		render(null, scratch);
		scratch.remove();
	});

	test('h/createElement creates vnodes', () => {
		const vnode = h('div', { id: 'test' }, 'hello');
		expect(vnode.type).toBe('div');
		expect(vnode.props.id).toBe('test');
		expect(vnode.props.children).toBe('hello');
	});

	test('render renders DOM elements', () => {
		render(h('div', { id: 'foo' }, 'bar'), scratch);
		expect(scratch.innerHTML).toBe('<div id="foo">bar</div>');
	});

	test('render renders nested elements', () => {
		render(
			h('div', null,
				h('span', null, 'a'),
				h('span', null, 'b')
			),
			scratch
		);
		expect(scratch.innerHTML).toBe('<div><span>a</span><span>b</span></div>');
	});

	test('Fragment renders children without wrapper', () => {
		render(h(Fragment, null, h('span', null, 'a'), h('span', null, 'b')), scratch);
		expect(scratch.innerHTML).toBe('<span>a</span><span>b</span>');
	});

	test('Component class renders', () => {
		class App extends Component {
			render() {
				return h('div', null, 'Hello ', this.props.name);
			}
		}
		render(h(App, { name: 'World' }), scratch);
		expect(scratch.innerHTML).toBe('<div>Hello World</div>');
	});

	test('createRef works', () => {
		const ref = createRef();
		render(h('div', { ref }), scratch);
		expect(ref.current).toBeInstanceOf(HTMLDivElement);
	});

	test('createContext provides and consumes values', () => {
		const Ctx = createContext('default');
		class Consumer extends Component {
			render() {
				return h(Ctx.Consumer, null, value => h('span', null, value));
			}
		}
		render(h(Ctx.Provider, { value: 'hello' }, h(Consumer)), scratch);
		expect(scratch.innerHTML).toBe('<span>hello</span>');
	});

	test('cloneElement clones vnodes', () => {
		const original = h('div', { id: 'a' }, 'text');
		const cloned = cloneElement(original, { id: 'b' });
		expect(cloned.props.id).toBe('b');
		expect(cloned.props.children).toBe('text');
	});

	test('isValidElement validates vnodes', () => {
		expect(isValidElement(h('div'))).toBe(true);
		expect(isValidElement('string')).toBe(false);
		expect(isValidElement(42)).toBe(false);
		expect(isValidElement(null)).toBe(false);
	});

	test('toChildArray flattens children', () => {
		const arr = toChildArray([h('a'), [h('b'), h('c')], null, 'text']);
		expect(arr).toHaveLength(4);
	});
});

describe('Hooks (preact/hooks)', () => {
	let scratch;

	beforeEach(() => {
		scratch = document.createElement('div');
		document.body.appendChild(scratch);
	});

	afterEach(() => {
		render(null, scratch);
		scratch.remove();
	});

	test('useState manages state', async () => {
		let setState;
		function App() {
			const [count, setCount] = useState(0);
			setState = setCount;
			return h('div', null, String(count));
		}
		render(h(App), scratch);
		expect(scratch.innerHTML).toBe('<div>0</div>');

		setState(1);
		await flushMicrotasks();
		expect(scratch.innerHTML).toBe('<div>1</div>');
	});

	test('useReducer manages state with reducer', async () => {
		let dispatch;
		function App() {
			const [count, d] = useReducer((s, a) => s + a, 0);
			dispatch = d;
			return h('div', null, String(count));
		}
		render(h(App), scratch);
		expect(scratch.innerHTML).toBe('<div>0</div>');

		dispatch(5);
		await flushMicrotasks();
		expect(scratch.innerHTML).toBe('<div>5</div>');
	});

	test('useRef persists values across renders', async () => {
		let setState;
		const values = [];
		function App() {
			const ref = useRef(0);
			const [, s] = useState(0);
			setState = s;
			ref.current++;
			values.push(ref.current);
			return h('div', null, String(ref.current));
		}
		render(h(App), scratch);
		setState(1);
		await flushMicrotasks();
		// ref.current should persist and increment each render
		expect(values).toEqual([1, 2]);
	});

	test('useMemo memoizes values', async () => {
		let setState;
		let computeCount = 0;
		function App() {
			const [count, s] = useState(0);
			const [other, setOther] = useState(0);
			setState = setOther;
			const doubled = useMemo(() => {
				computeCount++;
				return count * 2;
			}, [count]);
			return h('div', null, String(doubled));
		}
		render(h(App), scratch);
		expect(computeCount).toBe(1);

		// Re-render without changing `count` dep
		setState(1);
		await flushMicrotasks();
		expect(computeCount).toBe(1); // should not recompute
	});

	test('useCallback memoizes callbacks', () => {
		const callbacks = [];
		function App() {
			const cb = useCallback(() => {}, []);
			callbacks.push(cb);
			return h('div');
		}
		render(h(App), scratch);
		render(h(App), scratch);
		expect(callbacks[0]).toBe(callbacks[1]);
	});

	test('useEffect runs after render', async () => {
		const calls = [];
		function App() {
			useEffect(() => { calls.push('effect'); }, []);
			return h('div', null, 'test');
		}
		render(h(App), scratch);
		expect(calls).toEqual([]);
		await waitForEffects();
		expect(calls).toEqual(['effect']);
	});

	test('useLayoutEffect runs synchronously', () => {
		const calls = [];
		function App() {
			useLayoutEffect(() => { calls.push('layout'); }, []);
			return h('div', null, 'test');
		}
		render(h(App), scratch);
		// useLayoutEffect should have fired synchronously during commit
		expect(calls).toEqual(['layout']);
	});

	test('useContext reads context value', () => {
		const Ctx = createContext('default');
		let value;
		function App() {
			value = useContext(Ctx);
			return h('div', null, value);
		}
		render(h(Ctx.Provider, { value: 'provided' }, h(App)), scratch);
		expect(value).toBe('provided');
	});

	test('useId returns stable id', async () => {
		let id1, id2, setState;
		function App() {
			id1 = useId();
			const [, s] = useState(0);
			setState = s;
			return h('div', null, id1);
		}
		render(h(App), scratch);
		const firstId = id1;

		setState(1);
		await flushMicrotasks();
		expect(id1).toBe(firstId); // stable across re-renders
	});
});

describe('Compat (preact/compat)', () => {
	let scratch;

	beforeEach(() => {
		scratch = document.createElement('div');
		document.body.appendChild(scratch);
	});

	afterEach(() => {
		render(null, scratch);
		scratch.remove();
	});

	test('memo prevents unnecessary re-renders', async () => {
		const { memo } = await import('preact/compat');
		let renderCount = 0;
		const Child = memo(function Child({ value }) {
			renderCount++;
			return h('span', null, value);
		});

		let setState;
		function App() {
			const [, s] = useState(0);
			setState = s;
			return h(Child, { value: 'fixed' });
		}

		render(h(App), scratch);
		expect(renderCount).toBe(1);

		setState(1);
		await flushMicrotasks();
		expect(renderCount).toBe(1); // should not re-render
	});

	test('forwardRef forwards refs', async () => {
		const { forwardRef } = await import('preact/compat');
		expect(typeof forwardRef).toBe('function');
	});

	test('compat exports React-compatible API', async () => {
		const compat = await import('preact/compat');
		expect(typeof compat.memo).toBe('function');
		expect(typeof compat.forwardRef).toBe('function');
		expect(typeof compat.lazy).toBe('function');
		expect(typeof compat.Suspense).toBe('function');
		expect(typeof compat.PureComponent).toBe('function');
		expect(typeof compat.createPortal).toBe('function');
		expect(typeof compat.Children).toBe('object');
		expect(typeof compat.useState).toBe('function');
		expect(typeof compat.useEffect).toBe('function');
	});
});

describe('Test Utils (preact/test-utils)', () => {
	test('act wraps updates', async () => {
		const scratch = document.createElement('div');
		document.body.appendChild(scratch);

		let setState;
		function App() {
			const [count, s] = useState(0);
			setState = s;
			return h('div', null, String(count));
		}

		await act(() => {
			render(h(App), scratch);
		});
		expect(scratch.innerHTML).toBe('<div>0</div>');

		await act(() => {
			setState(1);
		});
		expect(scratch.innerHTML).toBe('<div>1</div>');

		render(null, scratch);
		scratch.remove();
	});
});
