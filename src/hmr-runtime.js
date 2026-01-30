/**
 * Hot Module Replacement Runtime
 *
 * This module enables Fast Refresh - updating components without losing state.
 * Based on prefresh patterns but adapted for worse-preact's internal structure.
 *
 * Features:
 * 1. WeakMap tracking for vnodes (prevents memory leaks)
 * 2. Signature system for detecting hook changes
 * 3. Intelligent state reset vs preservation
 */

import { options } from './options.js';
import {
  VNODE_COMPONENT,
  COMPONENT_HOOKS,
  HOOKS_LIST,
  EFFECTS_LIST,
  HOOK_CLEANUP,
  HOOK_ARGS,
  HOOK_PENDING_ARGS,
  NAMESPACE,
} from './hmr-constants.js';

// WeakMap tracking (prevents memory leaks from unmounted components)
const vnodesForComponent = new WeakMap();
const mappedVNodes = new WeakMap();
const signaturesForType = new WeakMap();

// Strong references needed for ID-based lookups
const typesById = new Map();
let pendingUpdates = [];

// Built-in component names to skip
const BUILT_IN_COMPONENTS = ['Fragment', 'Suspense', 'SuspenseList'];

const isBuiltIn = (type) => BUILT_IN_COMPONENTS.includes(type.name);

/**
 * Recursively get the latest mapped type for a component
 * Uses a Set to prevent infinite loops from circular mappings
 */
function getMappedType(type, seen = new Set()) {
  if (seen.has(type)) {
    console.warn('[HMR] Circular mapping detected, returning original type');
    return type;
  }
  if (mappedVNodes.has(type)) {
    seen.add(type);
    return getMappedType(mappedVNodes.get(type), seen);
  }
  return type;
}

/**
 * Compute signature key including nested custom hooks
 * Based on prefresh's computeKey function
 */
function computeKey(signature) {
  if (!signature) return '';

  let fullKey = signature.key || '';
  let hooks;

  try {
    hooks = signature.getCustomHooks ? signature.getCustomHooks() : [];
  } catch (err) {
    signature.forceReset = true;
    return fullKey;
  }

  for (let i = 0; i < hooks.length; i++) {
    const hook = hooks[i];
    if (typeof hook !== 'function') {
      signature.forceReset = true;
      return fullKey;
    }

    const nestedSignature = signaturesForType.get(hook);
    if (nestedSignature === undefined) continue;

    const nestedKey = computeKey(nestedSignature);
    if (nestedSignature.forceReset) signature.forceReset = true;

    fullKey += '\n---\n' + nestedKey;
  }

  return fullKey;
}

/**
 * Compare signatures to decide if state should reset
 */
function compareSignatures(prev, next) {
  const prevSignature = signaturesForType.get(prev) || {};
  const nextSignature = signaturesForType.get(next) || {};

  // Reset if key changed, computed key changed, or forceReset flag set
  if (
    prevSignature.key !== nextSignature.key ||
    computeKey(prevSignature) !== computeKey(nextSignature) ||
    nextSignature.forceReset
  ) {
    return true; // Reset hooks
  }

  return false; // Preserve state
}

// ============================================================
// Options Hooks - Track vnodes through the component lifecycle
// ============================================================

/**
 * Hook into vnode creation to remap replaced component types
 */
const oldVnodeHook = options.vnode;
options.vnode = (vnode) => {
  if (vnode && typeof vnode.type === 'function' && !isBuiltIn(vnode.type)) {
    const foundType = getMappedType(vnode.type);
    if (foundType !== vnode.type) {
      vnode.type = foundType;
      // Update constructor reference if component exists
      if (vnode[VNODE_COMPONENT] && 'prototype' in vnode.type && vnode.type.prototype.render) {
        vnode[VNODE_COMPONENT].constructor = vnode.type;
      }
    }
  }

  if (oldVnodeHook) oldVnodeHook(vnode);
};

/**
 * Hook into diff to track component instances (before diff)
 */
const oldDiffHook = options._diff;
options._diff = (vnode) => {
  if (vnode && typeof vnode.type === 'function' && !isBuiltIn(vnode.type)) {
    const vnodes = vnodesForComponent.get(vnode.type);
    if (!vnodes) {
      vnodesForComponent.set(vnode.type, [vnode]);
    } else if (!vnodes.includes(vnode)) {
      vnodes.push(vnode);
    }
  }

  if (oldDiffHook) oldDiffHook(vnode);
};

/**
 * Hook into diffed to deduplicate vnodes (after diff)
 * This handles cases where the same component instance is re-diffed
 */
const oldDiffedHook = options.diffed;
options.diffed = (vnode) => {
  if (vnode && typeof vnode.type === 'function' && !isBuiltIn(vnode.type)) {
    const vnodes = vnodesForComponent.get(vnode.type);
    if (vnodes) {
      // Remove duplicates with same component instance
      const matchingComponent = vnodes.filter((v) => v[VNODE_COMPONENT] === vnode[VNODE_COMPONENT]);
      if (matchingComponent.length > 1) {
        const i = vnodes.indexOf(matchingComponent[0]);
        if (i !== -1) vnodes.splice(i, 1);
      }
    }
  }

  if (oldDiffedHook) oldDiffedHook(vnode);
};

/**
 * Hook into unmount to clean up tracked vnodes
 */
const oldUnmountHook = options.unmount;
options.unmount = (vnode) => {
  const type = (vnode || {}).type;
  if (typeof type === 'function' && vnodesForComponent.has(type)) {
    const vnodes = vnodesForComponent.get(type);
    if (vnodes) {
      const index = vnodes.indexOf(vnode);
      if (index !== -1) {
        vnodes.splice(index, 1);
      }
    }
  }

  if (oldUnmountHook) oldUnmountHook(vnode);
};

// ============================================================
// Registration API - Called by Babel-transformed code
// ============================================================

/**
 * Register a component with the HMR system
 * Called by $RefreshReg$ for each component
 */
function register(type, id) {
  if (typeof type !== 'function') return;

  if (typesById.has(id)) {
    const existingType = typesById.get(id);
    if (existingType !== type) {
      // Component was updated - queue for replacement
      pendingUpdates.push([existingType, type]);
      typesById.set(id, type);
    }
  } else {
    typesById.set(id, type);
  }

  // Initialize signature if not present
  if (!signaturesForType.has(type)) {
    signaturesForType.set(type, {
      getCustomHooks: () => [],
      type,
    });
  }
}

/**
 * Sign a component with hook signature information
 * Called by $RefreshSig$ wrapper for hook tracking
 */
function sign(type, key, forceReset, getCustomHooks, status) {
  if (!type) return status;

  if (status === 'begin') {
    signaturesForType.set(type, {
      type,
      key,
      forceReset,
      getCustomHooks: getCustomHooks || (() => []),
    });
    return 'needsHooks';
  } else if (status === 'needsHooks') {
    const signature = signaturesForType.get(type);
    if (signature) {
      signature.fullKey = computeKey(signature);
    }
  }

  return status;
}

/**
 * Get signature for a type
 */
function getSignature(type) {
  return signaturesForType.get(type);
}

// ============================================================
// Component Replacement
// ============================================================

/**
 * Run cleanup for a hook state, with error handling
 */
function runHookCleanup(hookState) {
  if (hookState[HOOK_CLEANUP] && typeof hookState[HOOK_CLEANUP] === 'function') {
    try {
      hookState[HOOK_CLEANUP]();
    } catch (e) {
      console.error('[HMR] Cleanup error:', e);
    }
  }
}

/**
 * Replace an old component with a new one
 */
async function replaceComponent(OldType, NewType, resetHookState) {
  const vnodes = vnodesForComponent.get(OldType);
  if (!vnodes || vnodes.length === 0) return;

  console.log(
    `[HMR] Replacing ${OldType.name || 'Component'} (${vnodes.length} instances)` +
      (resetHookState ? ' - resetting state' : ' - preserving state')
  );

  // Migrate vnode tracking to new type
  vnodesForComponent.delete(OldType);
  vnodesForComponent.set(NewType, vnodes);

  // Map old type to new type for future vnode creation
  mappedVNodes.set(OldType, NewType);

  // Remove from pending updates if queued
  pendingUpdates = pendingUpdates.filter((p) => p[0] !== OldType);

  // Import scheduler once before processing vnodes to avoid race conditions
  let enqueueRender;
  try {
    const scheduler = await import('./scheduler.js');
    enqueueRender = scheduler.enqueueRender;
  } catch (err) {
    console.error('[HMR] Failed to import scheduler:', err);
    console.warn('[HMR] Forcing page reload');
    self.location.reload();
    return;
  }

  // Collect components to re-render
  const componentsToRender = [];

  // Process each vnode instance
  vnodes.forEach((vnode) => {
    if (!vnode || !vnode[VNODE_COMPONENT]) return;

    const component = vnode[VNODE_COMPONENT];

    // Skip if component is not mounted
    if (!component._vnode) return;

    // Update vnode type
    vnode.type = NewType;

    // Handle hooks
    const hooks = component[COMPONENT_HOOKS];
    if (hooks && hooks[HOOKS_LIST]) {
      if (resetHookState) {
        // Reset hook state - run cleanups first
        console.log('[HMR] Resetting hooks state');
        hooks[HOOKS_LIST].forEach(runHookCleanup);
        hooks[HOOKS_LIST] = [];
        hooks[EFFECTS_LIST] = [];
      } else {
        // Preserve state - just run effect cleanups so they re-run
        hooks[HOOKS_LIST].forEach((hookState) => {
          runHookCleanup(hookState);
          hookState[HOOK_CLEANUP] = undefined;
          // Clear effect args to force re-run
          if (hookState[HOOK_PENDING_ARGS] !== undefined) {
            hookState[HOOK_ARGS] = undefined;
          }
        });
      }
    }

    componentsToRender.push(component);
  });

  // Trigger re-renders synchronously after all vnodes are processed
  componentsToRender.forEach((component) => {
    enqueueRender(component);
  });
}

/**
 * Flush pending updates with signature comparison
 */
function flush() {
  const updates = [...pendingUpdates];
  pendingUpdates = [];

  if (updates.length === 0) return;

  console.log(`[HMR] Flushing ${updates.length} component update(s)`);

  updates.forEach(([oldType, newType]) => {
    const shouldReset = compareSignatures(oldType, newType);
    replaceComponent(oldType, newType, shouldReset);
  });
}

/**
 * Get pending updates (for debugging)
 */
function getPendingUpdates() {
  return pendingUpdates;
}

// ============================================================
// Export Global API
// ============================================================

if (typeof self !== 'undefined') {
  self[NAMESPACE] = {
    register,
    sign,
    flush,
    getSignature,
    getPendingUpdates,
    replaceComponent,
    computeKey,
  };
}

export { register, sign, flush, getSignature, getPendingUpdates, replaceComponent, computeKey };
