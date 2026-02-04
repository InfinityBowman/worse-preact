/**
 * Context API Implementation
 *
 * Provides React-compatible context for passing data through the component tree
 * without manually passing props at every level.
 *
 * Architecture:
 * - Providers store their value directly on their vnode (_contextValue)
 * - useContext traverses up the vnode tree to find the nearest provider
 * - Providers maintain a Set of subscribed components for efficient updates
 * - When provider value changes, all subscribed components re-render
 */

import { enqueueRender } from './scheduler.js';

/**
 * Symbol to identify context provider components
 */
export const CONTEXT_PROVIDER = Symbol.for('worsepreact.contextProvider');

/**
 * Creates a new context object
 *
 * @param {*} defaultValue - Default value when no Provider is found
 * @returns {Object} Context object with Provider component
 *
 * @example
 * const ThemeContext = createContext('light');
 *
 * function App() {
 *   return h(ThemeContext.Provider, { value: 'dark' },
 *     h(ThemedButton)
 *   );
 * }
 *
 * function ThemedButton() {
 *   const theme = useContext(ThemeContext);
 *   return h('button', null, `Theme: ${theme}`);
 * }
 */
export function createContext(defaultValue) {
  // Create unique identifier for this context
  const contextId = Symbol('context-instance');

  /**
   * Provider component - passes value down to descendants
   *
   * Provider is a function component that stores the context value
   * on its vnode. The actual value storage and subscription management
   * is handled by diffComponent in diff.js.
   */
  function Provider(props) {
    // Provider just renders its children
    // Value storage and change detection happens in diff.js
    return props.children;
  }

  // Mark Provider so we can identify it during diff and traversal
  Provider._contextId = contextId;
  Provider._isContextProvider = CONTEXT_PROVIDER;

  // Context object returned to user
  const context = {
    _id: contextId,
    _defaultValue: defaultValue,
    Provider: Provider,
  };

  // Link Provider back to context
  Provider._context = context;

  return context;
}

/**
 * Finds the nearest Provider for a context in the vnode tree
 *
 * Traverses up from startVNode through _parent chain looking for a
 * component vnode whose type is the Provider for this context.
 *
 * @param {Object} context - Context object from createContext()
 * @param {Object|null} startVNode - VNode to start searching from
 * @returns {Object|null} Provider vnode or null if not found
 */
export function findProvider(context, startVNode) {
  let current = startVNode;

  while (current) {
    // Check if this vnode is a Provider for our context
    if (
      current.type &&
      current.type._isContextProvider === CONTEXT_PROVIDER &&
      current.type._contextId === context._id
    ) {
      return current;
    }

    // Move up the tree
    current = current._parent;
  }

  return null;
}

/**
 * Subscribes a component to a provider for re-render on value changes
 *
 * @param {Object} providerVNode - Provider vnode
 * @param {Object} component - Component instance to subscribe
 */
export function subscribeToProvider(providerVNode, component) {
  // Initialize subscriptions Set on provider vnode if not exists
  if (!providerVNode._contextSubscriptions) {
    providerVNode._contextSubscriptions = new Set();
  }

  // Add component to subscription set
  providerVNode._contextSubscriptions.add(component);

  // Track subscription on component for cleanup
  if (!component._contextSubscriptions) {
    component._contextSubscriptions = new Set();
  }
  component._contextSubscriptions.add(providerVNode);
}

/**
 * Notifies all subscribed components when provider value changes
 *
 * @param {Object} providerVNode - Provider vnode whose value changed
 */
export function notifyContextSubscribers(providerVNode) {
  if (!providerVNode._contextSubscriptions) return;

  // Re-render all subscribed components
  for (const component of providerVNode._contextSubscriptions) {
    if (component._vnode) {
      enqueueRender(component);
    } else {
      // Component was unmounted - remove it to prevent memory leak
      providerVNode._contextSubscriptions.delete(component);
    }
  }
}

/**
 * Cleans up context subscriptions when a component unmounts
 *
 * @param {Object} component - Component being unmounted
 */
export function cleanupContextSubscriptions(component) {
  if (!component._contextSubscriptions) return;

  // Remove component from all provider subscription sets
  for (const providerVNode of component._contextSubscriptions) {
    if (providerVNode._contextSubscriptions) {
      providerVNode._contextSubscriptions.delete(component);
    }
  }

  // Clear component's subscription tracking
  component._contextSubscriptions.clear();
}
