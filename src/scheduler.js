/**
 * Component Re-render Scheduler
 *
 * This module handles batching and scheduling component re-renders.
 * When state changes, we don't immediately re-render - instead we
 * queue the component and process all queued renders in a microtask.
 * This batches multiple state updates into a single render pass.
 */

import { diffChildren } from './children.js';
import {
  setCurrentComponent,
  runPendingEffects,
  runPendingLayoutEffects,
  afterPaint,
} from './hooks.js';

/**
 * Queue of components that need to be re-rendered
 * @type {Array}
 */
let renderQueue = [];

/**
 * Whether we've already scheduled a microtask to process the queue
 * @type {boolean}
 */
let scheduled = false;

/**
 * Reference to the diff function - set via setDiffFunction to avoid circular imports
 * @type {Function|null}
 */
let diffFunction = null;

/**
 * Reference to commitRoot - set via setCommitFunction to avoid circular imports
 * @type {Function|null}
 */
let commitFunction = null;

/**
 * Reference to unmount - set via setUnmountFunction
 * @type {Function|null}
 */
let unmountFunction = null;

/**
 * Sets the diff function reference (called from diff.js to avoid circular imports)
 * @param {Function} fn - The diff function
 */
export function setDiffFunction(fn) {
  diffFunction = fn;
}

/**
 * Sets the commit function reference (called from diff.js to avoid circular imports)
 * @param {Function} fn - The commitRoot function
 */
export function setCommitFunction(fn) {
  commitFunction = fn;
}

/**
 * Sets the unmount function reference
 * @param {Function} fn - The unmount function
 */
export function setUnmountFunction(fn) {
  unmountFunction = fn;
}

/**
 * Queues a component for re-rendering
 *
 * Multiple calls with the same component before the microtask runs
 * will only result in one re-render.
 *
 * @param {Object} component - The component instance to re-render
 */
export function enqueueRender(component) {
  // Don't add duplicates
  if (!renderQueue.includes(component)) {
    renderQueue.push(component);

    // Schedule processing if not already scheduled
    if (!scheduled) {
      scheduled = true;
      queueMicrotask(processRenderQueue);
    }
  }
}

/**
 * Removes a component from the render queue
 *
 * Called when a component is rendered via the tree diff (not via scheduler)
 * to prevent double-rendering.
 *
 * @param {Object} component - The component instance to remove
 */
export function dequeueRender(component) {
  const index = renderQueue.indexOf(component);
  if (index !== -1) {
    renderQueue.splice(index, 1);
  }
}

/**
 * Processes all queued component re-renders
 *
 * Components are sorted by depth (parents before children) to avoid
 * redundant renders - if a parent re-renders, it will re-render its
 * children anyway.
 */
function processRenderQueue() {
  // Reset scheduled flag
  scheduled = false;

  // Sort by depth - render parents before children
  // This prevents double-renders when a parent's render would
  // cause the child to re-render anyway
  renderQueue.sort((a, b) => {
    const depthA = a._vnode ? a._vnode._depth : 0;
    const depthB = b._vnode ? b._vnode._depth : 0;
    return depthA - depthB;
  });

  // Process each component
  let component;
  while ((component = renderQueue.shift())) {
    // Skip if component was unmounted
    if (!component._vnode) {
      continue;
    }

    renderComponent(component);
  }
}

/**
 * Re-renders a single component
 *
 * @param {Object} component - The component instance to re-render
 */
function renderComponent(component) {
  if (!diffFunction || !commitFunction) {
    console.error('Scheduler not initialized - diff/commit functions not set');
    return;
  }

  const vnode = component._vnode;
  if (!vnode) return;

  // Get parent DOM node
  const parentDom = getParentDom(vnode);
  if (!parentDom) return;

  // Create queues for this render
  const commitQueue = [];
  const refQueue = [];

  // Get the namespace from the parent
  const namespace = parentDom.namespaceURI === 'http://www.w3.org/2000/svg'
    ? 'http://www.w3.org/2000/svg'
    : null;

  // Set current component for hooks
  setCurrentComponent(component);

  // Call the function component to get rendered vnodes
  let rendered;
  try {
    rendered = vnode.type(component.props);
  } finally {
    // Clear current component after render
    setCurrentComponent(null);
  }

  // Normalize rendered output to array
  const childArray = rendered == null ? [] : Array.isArray(rendered) ? rendered : [rendered];

  // Get the first DOM node of the old children for positioning
  const oldDom = getFirstDom(vnode);

  // Diff the rendered children
  diffChildren(
    parentDom,
    childArray,
    vnode,
    vnode, // Pass same vnode as old - children are stored on it
    namespace,
    commitQueue,
    oldDom,
    refQueue,
    diffFunction,
    unmountFunction
  );

  // Queue component for effect processing
  if (component.__hooks._pendingEffects.length > 0 ||
      component.__hooks._pendingLayoutEffects) {
    commitQueue.push(component);
  }

  // Commit refs and effects
  commitFunction(commitQueue, vnode, refQueue);
}

/**
 * Finds the parent DOM node for a vnode
 *
 * @param {Object} vnode - The vnode to find the parent for
 * @returns {Element|null} The parent DOM element
 */
function getParentDom(vnode) {
  let parent = vnode._parent;

  while (parent) {
    // If parent has a DOM node, that's the parent DOM
    if (parent._dom) {
      return parent._dom;
    }
    // Otherwise keep going up (through Fragments and function components)
    parent = parent._parent;
  }

  return null;
}

/**
 * Gets the first DOM node for a vnode
 *
 * @param {Object} vnode - The vnode
 * @returns {Element|Text|null} The DOM node
 */
function getFirstDom(vnode) {
  if (!vnode) return null;

  // If this vnode has a direct DOM node, return it
  if (vnode._dom) {
    return vnode._dom;
  }

  // For Fragments and components, find the first child's DOM
  if (vnode._children) {
    for (let i = 0; i < vnode._children.length; i++) {
      const childDom = getFirstDom(vnode._children[i]);
      if (childDom) {
        return childDom;
      }
    }
  }

  return null;
}
