/**
 * Render Entry Point
 *
 * This module provides the main render() function that users call
 * to mount their application into a DOM container.
 */

import { diff, commitRoot } from './diff.js';
import { diffChildren } from './children.js';
import { unmount } from './diff.js';
import { options } from './options.js';
import { Fragment, createVNode } from './vnode.js';

/**
 * SVG namespace URI
 */
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

/**
 * Renders a virtual DOM tree into a container element
 *
 * @param {Object} vnode - Virtual DOM tree to render
 * @param {Element} container - DOM element to render into
 *
 * @example
 * // Mount an app
 * render(h(App), document.getElementById('root'));
 *
 * @example
 * // Update - just call render again
 * render(h(App, { page: 'about' }), document.getElementById('root'));
 *
 * @example
 * // Unmount
 * render(null, document.getElementById('root'));
 */
export function render(vnode, container) {
  // Get the old root vnode from the container
  const oldVNode = container._children;

  // Create a new root vnode wrapped in Fragment (like Preact does)
  // DevTools expects the root vnode to have type === Fragment
  const newVNode = createVNode(
    Fragment,
    { children: vnode },
    null,
    null
  );

  // Set _dom to container so scheduler can find parent DOM for re-renders
  newVNode._dom = container;

  // Store on container for next render
  container._children = newVNode;

  // Queues for post-diff processing
  const commitQueue = []; // Components with pending effects
  const refQueue = []; // Refs to apply

  // Detect SVG namespace from container
  // This handles the case where we're rendering inside an existing SVG
  const namespace =
    container.namespaceURI === SVG_NAMESPACE ? SVG_NAMESPACE : null;

  // Call _root hook (notifies DevTools of render target)
  if (options._root) {
    options._root(newVNode, container);
  }

  // Diff the new root against the old root
  diff(
    container,
    newVNode,
    oldVNode || {},
    namespace,
    commitQueue,
    container.firstChild,
    refQueue
  );

  // Apply refs and schedule effects
  commitRoot(commitQueue, newVNode, refQueue);

  // Call _commit hook (notifies DevTools that render is complete)
  if (options._commit) {
    options._commit(newVNode, commitQueue);
  }
}

/**
 * Hydrates a server-rendered DOM tree
 *
 * Similar to render(), but attempts to reuse existing DOM nodes
 * instead of creating new ones. Used for server-side rendering.
 *
 * @param {Object} vnode - Virtual DOM tree to hydrate
 * @param {Element} container - DOM element with server-rendered content
 */
export function hydrate(vnode, container) {
  // For now, hydrate is the same as render
  // A full implementation would walk the existing DOM and attach vnodes
  // without recreating elements
  render(vnode, container);
}
