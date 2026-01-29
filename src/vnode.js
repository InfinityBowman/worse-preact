/**
 * VNode Creation
 *
 * This module handles creating virtual DOM nodes (vnodes) which represent
 * the desired UI structure. These are plain JavaScript objects that describe
 * what the DOM should look like.
 */

import { options } from './options.js';

/**
 * Bit flags for vnode state during reconciliation
 */
export const INSERT_VNODE = 1 << 0; // Node needs to be inserted into DOM
export const MATCHED = 1 << 1; // Node was matched during child reconciliation

/**
 * Fragment component - renders children without a wrapper element
 */
export function Fragment(props) {
  return props.children;
}

/**
 * Creates a ref object that can be attached to elements or components
 * @returns {{ current: null }}
 */
export function createRef() {
  return { current: null };
}

/**
 * Internal function to create a vnode with all fields
 * @param {string|Function} type - Element tag name or component function
 * @param {Object} props - Properties including children
 * @param {*} key - Key for list reconciliation
 * @param {Object|Function} ref - Ref object or callback
 * @returns {Object} VNode object
 */
export function createVNode(type, props, key, ref) {
  return {
    type,
    props,
    key,
    ref,
    _children: null, // Processed child vnodes (set during diff)
    _dom: null, // Actual DOM element (set during diff)
    _component: null, // Component instance for hooks (set during diff)
    _parent: null, // Parent vnode (set during diff)
    _depth: 0, // Depth in tree (set during diff)
    _flags: 0, // Bit flags for reconciliation state
  };
}

/**
 * Creates a virtual DOM element
 *
 * @param {string|Function} type - HTML tag name ('div') or component function
 * @param {Object|null} props - Properties/attributes for the element
 * @param {...*} children - Child elements (can be vnodes, strings, numbers, arrays)
 * @returns {Object} VNode representing the element
 *
 * @example
 * // Create a div with a class and text content
 * h('div', { className: 'container' }, 'Hello')
 *
 * @example
 * // Create a component
 * h(MyComponent, { name: 'World' })
 *
 * @example
 * // JSX compiles to this:
 * // <div id="app"><span>Hi</span></div>
 * h('div', { id: 'app' }, h('span', null, 'Hi'))
 */
export function h(type, props, ...children) {
  // Normalize props - ensure it's always an object
  const normalizedProps = props || {};

  // Extract key and ref from props (they're special, not passed to components)
  const key = normalizedProps.key !== undefined ? normalizedProps.key : null;
  const ref = normalizedProps.ref !== undefined ? normalizedProps.ref : null;

  // Build the final props object without key/ref
  const finalProps = {};

  for (const propName in normalizedProps) {
    if (propName !== 'key' && propName !== 'ref') {
      finalProps[propName] = normalizedProps[propName];
    }
  }

  // Flatten and normalize children
  // - Nested arrays are flattened
  // - null/undefined/boolean are filtered out
  // - Numbers are converted to strings
  const flatChildren = flattenChildren(children);

  // Only add children to props if there are any
  if (flatChildren.length > 0) {
    // If single child, don't wrap in array (matches Preact behavior)
    finalProps.children =
      flatChildren.length === 1 ? flatChildren[0] : flatChildren;
  }

  const vnode = createVNode(type, finalProps, key, ref);

  // Call options hook if defined (used by DevTools, HMR, etc.)
  if (options.vnode) {
    options.vnode(vnode);
  }

  return vnode;
}

/**
 * Flattens nested arrays and normalizes child values
 * @param {Array} children - Array of children (may contain nested arrays)
 * @returns {Array} Flattened array of valid children
 */
function flattenChildren(children) {
  const result = [];

  for (let i = 0; i < children.length; i++) {
    const child = children[i];

    // Skip null, undefined, and booleans (common JSX pattern: {condition && <Element />})
    if (child == null || typeof child === 'boolean') {
      continue;
    }

    // Recursively flatten arrays
    if (Array.isArray(child)) {
      const nested = flattenChildren(child);
      for (let j = 0; j < nested.length; j++) {
        result.push(nested[j]);
      }
    } else {
      result.push(child);
    }
  }

  return result;
}

/**
 * Alias for h() - matches React's createElement API
 */
export const createElement = h;
