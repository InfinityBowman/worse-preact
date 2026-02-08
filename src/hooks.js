/**
 * Hooks Implementation
 *
 * Hooks allow function components to have state and side effects.
 * They work by tracking the current component being rendered and
 * storing hook state in arrays indexed by call order.
 *
 * IMPORTANT: Hooks must be called in the same order every render.
 * Don't call hooks inside conditions, loops, or nested functions.
 */

import { enqueueRender } from './scheduler.js';
import { findProvider, subscribeToProvider, cleanupContextSubscriptions } from './context.js';

/**
 * The component currently being rendered
 * Set by diff.js before calling a function component
 * @type {Object|null}
 */
export let currentComponent = null;

/**
 * Index of the current hook being processed
 * Incremented each time a hook is called during render
 * @type {number}
 */
export let currentIndex = 0;

/**
 * Sets the current component for hook calls
 * Called by diff.js before rendering a function component
 *
 * @param {Object|null} component - The component instance
 */
export function setCurrentComponent(component) {
  currentComponent = component;
  currentIndex = 0;
}

/**
 * Gets or creates the hook state for the current hook index
 *
 * @param {number} index - The hook index
 * @returns {Object} The hook state object
 */
function getHookState(index) {
  const hooks = currentComponent.__hooks;

  // Create hook state if it doesn't exist
  if (index >= hooks._list.length) {
    hooks._list.push({});
  }

  return hooks._list[index];
}

/**
 * useState - Returns a stateful value and a function to update it
 *
 * @param {*} initialState - Initial state value, or a function that returns it
 * @returns {[*, Function]} Tuple of [currentState, setState]
 *
 * @example
 * const [count, setCount] = useState(0);
 * setCount(count + 1);        // Direct value
 * setCount(prev => prev + 1); // Updater function
 */
export function useState(initialState) {
  const hookState = getHookState(currentIndex++);

  // Initialize on first render
  if (!hookState._initialized) {
    hookState._initialized = true;
    // Support lazy initialization: useState(() => expensiveComputation())
    hookState._value = typeof initialState === 'function' ? initialState() : initialState;
    // Store reference to component for setState
    hookState._component = currentComponent;
  }

  // Create setState function (stable reference across renders)
  if (!hookState._setState) {
    hookState._setState = (update) => {
      // Calculate next value
      const nextValue = typeof update === 'function' ? update(hookState._value) : update;

      // Only re-render if value actually changed
      if (!Object.is(hookState._value, nextValue)) {
        hookState._value = nextValue;
        enqueueRender(hookState._component);
      }
    };
  }

  return [hookState._value, hookState._setState];
}

/**
 * useReducer - Alternative to useState for complex state logic
 *
 * @param {Function} reducer - Function (state, action) => newState
 * @param {*} initialArg - Initial state or arg for init function
 * @param {Function} [init] - Optional function to compute initial state
 * @returns {[*, Function]} Tuple of [currentState, dispatch]
 *
 * @example
 * const [state, dispatch] = useReducer(reducer, { count: 0 });
 * dispatch({ type: 'increment' });
 */
export function useReducer(reducer, initialArg, init) {
  const hookState = getHookState(currentIndex++);

  // Initialize on first render
  if (!hookState._initialized) {
    hookState._initialized = true;
    // Support lazy initialization
    hookState._value = init ? init(initialArg) : initialArg;
    hookState._component = currentComponent;
    hookState._reducer = reducer;
  }

  // Update reducer reference (it might change between renders)
  hookState._reducer = reducer;

  // Create dispatch function (stable reference across renders)
  if (!hookState._dispatch) {
    hookState._dispatch = (action) => {
      const nextValue = hookState._reducer(hookState._value, action);

      if (!Object.is(hookState._value, nextValue)) {
        hookState._value = nextValue;
        enqueueRender(hookState._component);
      }
    };
  }

  return [hookState._value, hookState._dispatch];
}

/**
 * useEffect - Runs side effects after render
 *
 * Effects run asynchronously after the browser has painted.
 * Return a cleanup function to run before the next effect or unmount.
 *
 * @param {Function} callback - Effect function, may return cleanup function
 * @param {Array} [deps] - Dependency array. Effect runs when deps change.
 *                         Omit to run after every render.
 *                         Pass [] to run only on mount/unmount.
 *
 * @example
 * // Run on every render
 * useEffect(() => { console.log('rendered'); });
 *
 * // Run only when count changes
 * useEffect(() => { document.title = count; }, [count]);
 *
 * // Run only on mount, cleanup on unmount
 * useEffect(() => {
 *   const id = setInterval(tick, 1000);
 *   return () => clearInterval(id);
 * }, []);
 */
export function useEffect(callback, deps) {
  const hookState = getHookState(currentIndex++);

  // Check if dependencies changed
  if (argsChanged(hookState._args, deps)) {
    hookState._value = callback;
    hookState._pendingArgs = deps;

    // Queue this effect to run after paint
    currentComponent.__hooks._pendingEffects.push(hookState);
  }
}

/**
 * useLayoutEffect - Like useEffect but runs synchronously after DOM mutations
 *
 * Use this for DOM measurements or to prevent visual flicker.
 * Runs synchronously before browser paint, blocking visual updates.
 *
 * @param {Function} callback - Effect function
 * @param {Array} [deps] - Dependency array
 */
export function useLayoutEffect(callback, deps) {
  const hookState = getHookState(currentIndex++);

  if (argsChanged(hookState._args, deps)) {
    hookState._value = callback;
    hookState._pendingArgs = deps;

    // Queue for synchronous execution (handled in commitRoot)
    currentComponent.__hooks._pendingLayoutEffects = currentComponent.__hooks._pendingLayoutEffects || [];
    currentComponent.__hooks._pendingLayoutEffects.push(hookState);
  }
}

/**
 * useRef - Returns a mutable ref object
 *
 * The ref object persists across renders. Changing .current doesn't
 * cause a re-render (unlike useState).
 *
 * @param {*} initialValue - Initial value for ref.current
 * @returns {{ current: * }} Ref object
 *
 * @example
 * const inputRef = useRef(null);
 * // Later: inputRef.current.focus()
 */
export function useRef(initialValue) {
  // Implemented using useMemo - the ref object is memoized with empty deps
  return useMemo(() => ({ current: initialValue }), []);
}

/**
 * useMemo - Memoizes a computed value
 *
 * Only recomputes when dependencies change. Use for expensive calculations.
 *
 * @param {Function} factory - Function that returns the memoized value
 * @param {Array} deps - Dependency array
 * @returns {*} The memoized value
 *
 * @example
 * const sortedItems = useMemo(() => items.sort(), [items]);
 */
export function useMemo(factory, deps) {
  const hookState = getHookState(currentIndex++);

  // Recompute if dependencies changed
  if (argsChanged(hookState._args, deps)) {
    hookState._value = factory();
    hookState._args = deps;
  }

  return hookState._value;
}

/**
 * useCallback - Memoizes a callback function
 *
 * Returns the same function reference unless dependencies change.
 * Useful for passing callbacks to optimized child components.
 *
 * @param {Function} callback - The callback to memoize
 * @param {Array} deps - Dependency array
 * @returns {Function} The memoized callback
 *
 * @example
 * const handleClick = useCallback(() => setCount(c => c + 1), []);
 */
export function useCallback(callback, deps) {
  // useCallback(fn, deps) is equivalent to useMemo(() => fn, deps)
  return useMemo(() => callback, deps);
}

/**
 * useSyncExternalStore - Subscribes to an external store
 *
 * @param {Function} subscribe - Function (callback) => unsubscribe
 * @param {Function} getSnapshot - Returns the current store value
 * @param {Function} [getServerSnapshot] - Unused (SSR), accepted for API compat
 * @returns {*} The current snapshot value
 *
 * @example
 * const state = useSyncExternalStore(store.subscribe, store.getState);
 */
export function useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
  const [snapshot, setSnapshot] = useState(() => getSnapshot());

  // Re-subscribe whenever subscribe identity changes
  useEffect(() => {
    // Check for a missed update between render and subscribe
    const currentSnapshot = getSnapshot();
    if (!Object.is(snapshot, currentSnapshot)) {
      setSnapshot(() => currentSnapshot);
    }

    return subscribe(() => {
      setSnapshot(() => getSnapshot());
    });
  }, [subscribe]);

  return snapshot;
}

/**
 * useDebugValue - Display a label in React DevTools
 *
 * No-op in worse-preact. Accepted for API compatibility.
 *
 * @param {*} _value - Debug value (ignored)
 * @param {Function} [_formatter] - Optional formatter (ignored)
 */
export function useDebugValue(_value, _formatter) {}

/**
 * useContext - Reads a context value from the nearest Provider
 *
 * Traverses up the component tree to find the nearest Provider for this context.
 * Subscribes the component to the Provider so it re-renders when value changes.
 *
 * @param {Object} context - Context object from createContext()
 * @returns {*} Current context value or default value
 *
 * @example
 * const ThemeContext = createContext('light');
 *
 * function Button() {
 *   const theme = useContext(ThemeContext);
 *   return h('button', { className: theme }, 'Click me');
 * }
 */
export function useContext(context) {
  const component = currentComponent;
  if (!component) {
    throw new Error('useContext must be called during render');
  }

  const vnode = component._vnode;
  if (!vnode) {
    return context._defaultValue;
  }

  // Find nearest provider in tree (start from parent)
  const providerVNode = findProvider(context, vnode._parent);

  if (providerVNode) {
    // Subscribe component to provider for updates
    subscribeToProvider(providerVNode, component);

    // Return provider's current value
    return providerVNode._contextValue;
  }

  // No provider found - use default value
  return context._defaultValue;
}

/**
 * Checks if hook dependencies have changed
 *
 * @param {Array|undefined} oldArgs - Previous dependencies
 * @param {Array|undefined} newArgs - New dependencies
 * @returns {boolean} True if changed (or first run)
 */
function argsChanged(oldArgs, newArgs) {
  // First run - always "changed"
  if (oldArgs === undefined) {
    return true;
  }

  // If no deps array provided, always run
  if (newArgs === undefined) {
    return true;
  }

  // Different lengths means changed
  if (oldArgs.length !== newArgs.length) {
    return true;
  }

  // Check each dependency
  for (let i = 0; i < newArgs.length; i++) {
    if (!Object.is(oldArgs[i], newArgs[i])) {
      return true;
    }
  }

  return false;
}

/**
 * Runs pending effects for a component after paint
 *
 * @param {Object} component - Component with pending effects
 */
export function runPendingEffects(component) {
  const hooks = component.__hooks;
  if (!hooks || !hooks._pendingEffects.length) return;

  // Run cleanup for previous effects, then run new effects
  hooks._pendingEffects.forEach((hookState) => {
    // Run cleanup from previous effect
    if (hookState._cleanup) {
      hookState._cleanup();
    }

    // Run the effect and store cleanup function
    const cleanup = hookState._value();
    hookState._cleanup = typeof cleanup === 'function' ? cleanup : undefined;

    // Update args after effect runs
    hookState._args = hookState._pendingArgs;
  });

  // Clear pending effects
  hooks._pendingEffects = [];
}

/**
 * Runs pending layout effects synchronously
 *
 * @param {Object} component - Component with pending layout effects
 */
export function runPendingLayoutEffects(component) {
  const hooks = component.__hooks;
  if (!hooks || !hooks._pendingLayoutEffects) return;

  hooks._pendingLayoutEffects.forEach((hookState) => {
    // Run cleanup from previous effect
    if (hookState._cleanup) {
      hookState._cleanup();
    }

    // Run the effect and store cleanup function
    const cleanup = hookState._value();
    hookState._cleanup = typeof cleanup === 'function' ? cleanup : undefined;

    // Update args after effect runs
    hookState._args = hookState._pendingArgs;
  });

  // Clear pending layout effects
  hooks._pendingLayoutEffects = [];
}

/**
 * Runs all effect cleanups for a component (called on unmount)
 *
 * @param {Object} component - Component being unmounted
 */
export function runCleanups(component) {
  const hooks = component.__hooks;
  if (!hooks) return;

  // Run cleanup for all effects
  hooks._list.forEach((hookState) => {
    if (hookState._cleanup) {
      hookState._cleanup();
      hookState._cleanup = undefined;
    }
  });

  // Cleanup context subscriptions
  cleanupContextSubscriptions(component);
}

/**
 * Schedules effect callbacks to run after browser paint
 * Uses requestAnimationFrame + setTimeout for reliable timing
 *
 * @param {Function} callback - Function to run after paint
 */
export function afterPaint(callback) {
  // Use rAF to wait for next frame, then setTimeout to ensure paint completed
  const done = () => {
    clearTimeout(timeout);
    cancelAnimationFrame(raf);
    setTimeout(callback);
  };

  // Timeout fallback in case rAF doesn't fire (e.g., hidden tab)
  const timeout = setTimeout(done, 35);
  const raf = requestAnimationFrame(done);
}
