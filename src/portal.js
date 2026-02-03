/**
 * Portal Implementation
 *
 * Portals render children into a different DOM container than the parent component.
 * This is useful for modals, tooltips, and overlays that need to break out of
 * the parent DOM hierarchy while maintaining the React component hierarchy.
 */

import { createVNode } from './vnode.js';

/**
 * Symbol to identify portal vnodes in the diff algorithm
 */
export const PORTAL_TYPE = Symbol.for('worsepreact.portal');

/**
 * Creates a portal that renders children into a different DOM container
 *
 * @param {*} children - Children to render into the portal
 * @param {Element} container - DOM element to render children into
 * @returns {Object} Portal vnode
 *
 * @example
 * function Modal({ children }) {
 *   return createPortal(
 *     h('div', { className: 'modal' }, children),
 *     document.getElementById('modal-root')
 *   );
 * }
 */
export function createPortal(children, container) {
  return createVNode(
    PORTAL_TYPE,
    { children, _container: container },
    null,
    null
  );
}
