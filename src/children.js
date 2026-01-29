/**
 * Child Reconciliation
 *
 * This module handles diffing arrays of children between renders.
 * The key reconciliation algorithm efficiently matches old and new
 * children to minimize DOM operations.
 *
 * Key features:
 * - Keyed children are matched by (key, type) pairs
 * - Unkeyed children are matched by position and type
 * - Minimizes DOM insertions/removals
 */

import { createVNode, INSERT_VNODE, MATCHED, Fragment } from './vnode.js';

/**
 * Diffs children of a parent element
 *
 * @param {Element} parentDom - Parent DOM element
 * @param {Array} renderResult - New children from render
 * @param {Object} newParentVNode - New parent vnode
 * @param {Object} oldParentVNode - Old parent vnode
 * @param {string|null} namespace - SVG namespace if applicable
 * @param {Array} commitQueue - Queue for effects
 * @param {Element|null} oldDom - First existing DOM child
 * @param {Array} refQueue - Queue for refs
 * @param {Function} diff - The diff function (passed to avoid circular imports)
 * @param {Function} unmount - The unmount function
 */
export function diffChildren(
  parentDom,
  renderResult,
  newParentVNode,
  oldParentVNode,
  namespace,
  commitQueue,
  oldDom,
  refQueue,
  diff,
  unmount
) {
  const oldChildren = (oldParentVNode && oldParentVNode._children) || [];
  const newChildren = [];

  // Normalize render result into array of vnodes
  normalizeChildren(renderResult, newChildren, newParentVNode);

  // Store processed children on parent vnode
  newParentVNode._children = newChildren;

  const oldChildrenLength = oldChildren.length;
  const newChildrenLength = newChildren.length;

  // If no new children, just unmount old ones
  if (newChildrenLength === 0) {
    for (let i = 0; i < oldChildrenLength; i++) {
      if (oldChildren[i]) {
        unmount(oldChildren[i], oldChildren[i], false);
      }
    }
    return;
  }

  // Phase 1: Match new children with old children
  const oldChildrenByKey = new Map();

  // Index keyed old children for fast lookup
  for (let i = 0; i < oldChildrenLength; i++) {
    const oldChild = oldChildren[i];
    if (oldChild && oldChild.key != null) {
      oldChildrenByKey.set(oldChild.key, i);
    }
  }

  // Track which old children have been matched
  const matched = new Array(oldChildrenLength).fill(false);
  const matchedOldChildren = new Array(newChildrenLength).fill(null);

  for (let i = 0; i < newChildrenLength; i++) {
    const newChild = newChildren[i];
    if (newChild === null) continue;

    let matchedIndex = -1;

    // Find matching old child
    if (newChild.key != null) {
      // Keyed - look up by key
      const keyIndex = oldChildrenByKey.get(newChild.key);
      if (keyIndex !== undefined && !matched[keyIndex]) {
        const candidate = oldChildren[keyIndex];
        if (candidate && candidate.type === newChild.type) {
          matchedIndex = keyIndex;
        }
      }
    } else {
      // Unkeyed - try to match by position and type first
      if (i < oldChildrenLength && !matched[i]) {
        const candidate = oldChildren[i];
        if (candidate && candidate.key == null && candidate.type === newChild.type) {
          matchedIndex = i;
        }
      }
      // If no match at position, search for any unkeyed match of same type
      if (matchedIndex === -1) {
        for (let j = 0; j < oldChildrenLength; j++) {
          if (!matched[j]) {
            const candidate = oldChildren[j];
            if (candidate && candidate.key == null && candidate.type === newChild.type) {
              matchedIndex = j;
              break;
            }
          }
        }
      }
    }

    if (matchedIndex !== -1) {
      matched[matchedIndex] = true;
      matchedOldChildren[i] = oldChildren[matchedIndex];
    }
  }

  // Collect vnodes to unmount (defer actual unmount to avoid invalidating references)
  const toUnmount = [];
  for (let i = 0; i < oldChildrenLength; i++) {
    if (!matched[i] && oldChildren[i]) {
      toUnmount.push(oldChildren[i]);
    }
  }

  // Phase 3: Diff and place each new child
  // Track our current position in the DOM
  let previousNewDom = null;

  for (let i = 0; i < newChildrenLength; i++) {
    const newChild = newChildren[i];
    if (newChild === null) continue;

    const oldChild = matchedOldChildren[i];

    // Set parent relationship
    newChild._parent = newParentVNode;
    newChild._depth = (newParentVNode._depth || 0) + 1;
    newChild._index = i;

    // Calculate the reference DOM node for this child
    // It should be inserted before this reference
    let refDom;
    if (previousNewDom) {
      // Insert after the previous sibling we placed
      refDom = previousNewDom.nextSibling;
    } else {
      // First child - use the original oldDom reference
      // But if oldDom is being unmounted, use null
      refDom = oldDom;
      // Check if oldDom belongs to a vnode being unmounted
      for (const u of toUnmount) {
        if (getFirstDom(u) === oldDom) {
          refDom = null;
          break;
        }
      }
    }

    // Diff this child (this will create/update DOM and insert if new)
    diff(
      parentDom,
      newChild,
      oldChild,
      namespace,
      commitQueue,
      refDom,
      refQueue
    );

    // Get the DOM node(s) for this child
    const firstDom = getFirstDom(newChild);
    const lastDom = getLastDom(newChild);

    if (firstDom) {
      // Check if we need to move this node
      // It needs moving if it's not already right after previousNewDom
      const needsMove = oldChild && previousNewDom &&
        firstDom.previousSibling !== previousNewDom;

      if (needsMove) {
        // Move all DOM nodes of this child to the correct position
        placeChild(parentDom, newChild, refDom);
      }

      // Update our tracking of where we've placed things
      previousNewDom = lastDom || firstDom;
    }
  }

  // Phase 4: Unmount old children that weren't matched
  for (const vnode of toUnmount) {
    unmount(vnode, vnode, false);
  }
}

/**
 * Places all DOM nodes of a vnode at the correct position
 */
function placeChild(parentDom, vnode, refDom) {
  if (vnode._dom) {
    // Single DOM node
    if (vnode._dom.parentNode === parentDom) {
      parentDom.insertBefore(vnode._dom, refDom);
    }
  } else if (vnode._children) {
    // Component/Fragment - place all children's DOM nodes
    for (let i = 0; i < vnode._children.length; i++) {
      const child = vnode._children[i];
      if (child) {
        placeChild(parentDom, child, refDom);
        // Update refDom for next child - should come after this one
        const childLastDom = getLastDom(child);
        if (childLastDom) {
          refDom = childLastDom.nextSibling;
        }
      }
    }
  }
}

/**
 * Normalizes render output into an array of vnodes
 *
 * Handles: null, strings, numbers, arrays, vnodes
 *
 * @param {*} children - Raw children from render
 * @param {Array} normalized - Output array
 * @param {Object} parentVNode - Parent vnode for setting relationships
 */
function normalizeChildren(children, normalized, parentVNode) {
  if (children == null || typeof children === 'boolean') {
    return;
  }

  if (Array.isArray(children)) {
    for (let i = 0; i < children.length; i++) {
      normalizeChildren(children[i], normalized, parentVNode);
    }
    return;
  }

  // Convert strings and numbers to text vnodes
  if (typeof children === 'string' || typeof children === 'number') {
    // Create a text vnode (null type indicates text node)
    normalized.push(
      createVNode(null, String(children), null, null)
    );
    return;
  }

  // It's a vnode - clone it to avoid mutating the original
  // (important if same vnode is used multiple times)
  if (children.type !== undefined) {
    const clone = createVNode(
      children.type,
      children.props,
      children.key,
      children.ref
    );
    normalized.push(clone);
    return;
  }

  // Unknown type - skip it
  console.warn('Unknown child type:', children);
}

/**
 * Gets the first DOM node for a vnode
 * For Fragments and components, this traverses into children
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

/**
 * Gets the last DOM node for a vnode
 * For Fragments and components, this traverses into children
 *
 * @param {Object} vnode - The vnode
 * @returns {Element|Text|null} The last DOM node
 */
function getLastDom(vnode) {
  if (!vnode) return null;

  // If this vnode has a direct DOM node, return it
  if (vnode._dom) {
    return vnode._dom;
  }

  // For Fragments and components, find the last child's DOM
  if (vnode._children) {
    for (let i = vnode._children.length - 1; i >= 0; i--) {
      const childDom = getLastDom(vnode._children[i]);
      if (childDom) {
        return childDom;
      }
    }
  }

  return null;
}
