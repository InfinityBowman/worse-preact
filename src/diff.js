/**
 * Core Reconciler (Diff Algorithm)
 *
 * This module is the heart of the virtual DOM - it compares old and new
 * vnodes and makes the minimum necessary DOM changes to update the UI.
 *
 * Two main paths:
 * 1. Function components - call the function to get vnodes, then diff those
 * 2. DOM elements - create/update actual DOM nodes
 */

import { Fragment } from './vnode.js';
import { diffProps } from './props.js';
import { diffChildren } from './children.js';
import {
  setCurrentComponent,
  runPendingEffects,
  runPendingLayoutEffects,
  runCleanups,
  afterPaint,
} from './hooks.js';
import { setDiffFunction, setCommitFunction, setUnmountFunction } from './scheduler.js';
import { options } from './options.js';

/**
 * SVG namespace URI
 */
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

/**
 * Main diff function - reconciles a single vnode
 *
 * @param {Element} parentDom - Parent DOM element
 * @param {Object} newVNode - New vnode to render
 * @param {Object|null} oldVNode - Previous vnode (null on first render)
 * @param {string|null} namespace - SVG namespace if in SVG context
 * @param {Array} commitQueue - Components with pending effects
 * @param {Element|null} oldDom - Existing DOM node to reuse/replace
 * @param {Array} refQueue - Queue of refs to apply after commit
 */
export function diff(
  parentDom,
  newVNode,
  oldVNode,
  namespace,
  commitQueue,
  oldDom,
  refQueue
) {
  // Handle null/undefined vnodes (nothing to render)
  if (newVNode == null) {
    if (oldVNode) {
      unmount(oldVNode, oldVNode, false);
    }
    return;
  }

  // Call _diff hook (begin diff)
  if (options._diff) {
    options._diff(newVNode);
  }

  const newType = newVNode.type;

  // Text nodes (type === null means text content)
  if (newType === null) {
    diffTextNode(parentDom, newVNode, oldVNode, oldDom);
    return;
  }

  // Function components (including Fragments)
  if (typeof newType === 'function') {
    diffComponent(
      parentDom,
      newVNode,
      oldVNode,
      namespace,
      commitQueue,
      oldDom,
      refQueue
    );
    return;
  }

  // DOM elements (div, span, svg, etc.)
  if (typeof newType === 'string') {
    diffElementNode(
      parentDom,
      newVNode,
      oldVNode,
      namespace,
      commitQueue,
      oldDom,
      refQueue
    );
    return;
  }

  console.warn('Unknown vnode type:', newType);
}

/**
 * Diffs a text node
 *
 * @param {Element} parentDom - Parent DOM element
 * @param {Object} newVNode - New text vnode
 * @param {Object|null} oldVNode - Old text vnode
 * @param {Element|null} oldDom - Existing DOM node
 */
function diffTextNode(parentDom, newVNode, oldVNode, oldDom) {
  const newText = newVNode.props;

  // Reuse existing text node if possible
  if (oldVNode && oldVNode.type === null && oldVNode._dom) {
    // Update text content if changed
    if (oldVNode.props !== newText) {
      oldVNode._dom.nodeValue = newText;
    }
    newVNode._dom = oldVNode._dom;
  } else {
    // Create new text node
    newVNode._dom = document.createTextNode(newText);

    // Insert into DOM
    if (oldDom) {
      parentDom.insertBefore(newVNode._dom, oldDom);
    } else {
      parentDom.appendChild(newVNode._dom);
    }

    // Unmount old node if different type
    if (oldVNode && oldVNode._dom) {
      unmount(oldVNode, oldVNode, true);
    }
  }
}

/**
 * Diffs a function component
 *
 * @param {Element} parentDom - Parent DOM element
 * @param {Object} newVNode - New component vnode
 * @param {Object|null} oldVNode - Old component vnode
 * @param {string|null} namespace - SVG namespace
 * @param {Array} commitQueue - Components with pending effects
 * @param {Element|null} oldDom - Existing DOM reference
 * @param {Array} refQueue - Queue of refs
 */
function diffComponent(
  parentDom,
  newVNode,
  oldVNode,
  namespace,
  commitQueue,
  oldDom,
  refQueue
) {
  const newType = newVNode.type;

  // Get or create component instance
  let component;
  if (oldVNode && oldVNode._component && oldVNode.type === newType) {
    // Reuse existing component instance
    component = oldVNode._component;
  } else {
    // Create new component instance
    component = {
      props: null,
      __hooks: {
        _list: [],
        _pendingEffects: [],
      },
      _vnode: newVNode,
    };

    // If there was an old component of different type, unmount it
    if (oldVNode && oldVNode._component) {
      runCleanups(oldVNode._component);
    }
  }

  // Update component
  component.props = newVNode.props;
  component._vnode = newVNode;
  newVNode._component = component;

  // Set current component for hooks
  setCurrentComponent(component);

  // Call _render hook
  if (options._render) {
    options._render(newVNode);
  }

  // Call the function component to get rendered vnodes
  let rendered;
  try {
    rendered = newType(newVNode.props);
  } finally {
    // Clear current component after render
    setCurrentComponent(null);
  }

  // Handle Fragment specially - it just returns its children
  // Normalize rendered output to array
  const childArray = rendered == null ? [] : Array.isArray(rendered) ? rendered : [rendered];

  // Get old children for diffing
  const oldChildren = oldVNode ? oldVNode._children : null;

  // Diff the rendered children
  diffChildren(
    parentDom,
    childArray,
    newVNode,
    oldVNode || {},
    namespace,
    commitQueue,
    oldDom,
    refQueue,
    diff,
    unmount
  );

  // Queue component for effect processing
  if (component.__hooks._pendingEffects.length > 0 ||
      component.__hooks._pendingLayoutEffects) {
    commitQueue.push(component);
  }

  // Handle ref on the component
  if (newVNode.ref) {
    refQueue.push({
      ref: newVNode.ref,
      value: component,
      oldRef: oldVNode ? oldVNode.ref : null,
    });
  }

  // Call diffed hook
  if (options.diffed) {
    options.diffed(newVNode);
  }
}

/**
 * Diffs a DOM element node
 *
 * @param {Element} parentDom - Parent DOM element
 * @param {Object} newVNode - New element vnode
 * @param {Object|null} oldVNode - Old element vnode
 * @param {string|null} namespace - SVG namespace
 * @param {Array} commitQueue - Components with pending effects
 * @param {Element|null} oldDom - Existing DOM reference
 * @param {Array} refQueue - Queue of refs
 */
function diffElementNode(
  parentDom,
  newVNode,
  oldVNode,
  namespace,
  commitQueue,
  oldDom,
  refQueue
) {
  const newType = newVNode.type;
  let dom;

  // Update namespace for SVG elements
  if (newType === 'svg') {
    namespace = SVG_NAMESPACE;
  }

  // Reuse existing DOM node if same type
  if (oldVNode && oldVNode.type === newType && oldVNode._dom) {
    dom = oldVNode._dom;
  } else {
    // Create new DOM element
    if (namespace) {
      dom = document.createElementNS(namespace, newType);
    } else {
      dom = document.createElement(newType);
    }

    // Insert into DOM
    if (oldDom) {
      parentDom.insertBefore(dom, oldDom);
    } else {
      parentDom.appendChild(dom);
    }

    // Unmount old node if different type
    if (oldVNode && oldVNode._dom) {
      unmount(oldVNode, oldVNode, false);
    }
  }

  // Store DOM reference
  newVNode._dom = dom;

  // Diff properties
  const newProps = newVNode.props || {};
  const oldProps = (oldVNode && oldVNode.props) || {};
  diffProps(dom, newProps, oldProps, namespace);

  // Diff children
  const newChildren = newProps.children;
  const childArray = newChildren == null
    ? []
    : Array.isArray(newChildren)
    ? newChildren
    : [newChildren];

  diffChildren(
    dom,
    childArray,
    newVNode,
    oldVNode || {},
    namespace,
    commitQueue,
    dom.firstChild,
    refQueue,
    diff,
    unmount
  );

  // Handle ref
  if (newVNode.ref) {
    refQueue.push({
      ref: newVNode.ref,
      value: dom,
      oldRef: oldVNode ? oldVNode.ref : null,
    });
  }

  // Call diffed hook
  if (options.diffed) {
    options.diffed(newVNode);
  }
}

/**
 * Unmounts a vnode, cleaning up DOM and running effect cleanups
 *
 * @param {Object} vnode - VNode to unmount
 * @param {Object} ancestorVNode - Ancestor for finding DOM to remove
 * @param {boolean} skipRemove - If true, don't remove DOM (parent handles it)
 */
export function unmount(vnode, ancestorVNode, skipRemove) {
  if (!vnode) return;

  // Call unmount hook
  if (options.unmount) {
    options.unmount(vnode);
  }

  // Run effect cleanups for components
  if (vnode._component) {
    runCleanups(vnode._component);
  }

  // Clear ref
  if (vnode.ref) {
    applyRef(vnode.ref, null);
  }

  // Remove DOM node
  if (!skipRemove && vnode._dom) {
    vnode._dom.remove();
  }

  // Recursively unmount children
  // If this vnode has a DOM node that was removed, skip removing children's DOM
  // Otherwise (for components/fragments), children need to remove their own DOM
  const skipChildRemove = skipRemove || !!vnode._dom;

  if (vnode._children) {
    for (let i = 0; i < vnode._children.length; i++) {
      if (vnode._children[i]) {
        unmount(vnode._children[i], ancestorVNode, skipChildRemove);
      }
    }
  }

  // Clear references
  vnode._dom = null;
  vnode._component = null;
  vnode._children = null;
}

/**
 * Commits all pending refs and schedules effects
 *
 * @param {Array} commitQueue - Components with pending effects
 * @param {Object} rootVNode - Root vnode of the render
 * @param {Array} refQueue - Queue of refs to apply
 */
export function commitRoot(commitQueue, rootVNode, refQueue) {
  // Apply refs synchronously
  for (let i = 0; i < refQueue.length; i++) {
    const { ref, value, oldRef } = refQueue[i];

    // Clear old ref if different
    if (oldRef && oldRef !== ref) {
      applyRef(oldRef, null);
    }

    // Set new ref
    applyRef(ref, value);
  }

  // Run layout effects synchronously (before paint)
  for (let i = 0; i < commitQueue.length; i++) {
    runPendingLayoutEffects(commitQueue[i]);
  }

  // Schedule regular effects to run after paint
  if (commitQueue.length > 0) {
    afterPaint(() => {
      for (let i = 0; i < commitQueue.length; i++) {
        runPendingEffects(commitQueue[i]);
      }
    });
  }
}

/**
 * Applies a ref (either callback or object style)
 *
 * @param {Function|Object} ref - Ref to apply
 * @param {*} value - Value to set
 */
function applyRef(ref, value) {
  if (!ref) return;

  if (typeof ref === 'function') {
    ref(value);
  } else {
    ref.current = value;
  }
}

// Initialize scheduler with diff, commit, and unmount functions
setDiffFunction(diff);
setCommitFunction(commitRoot);
setUnmountFunction(unmount);
