/**
 * Hot Module Replacement Runtime
 *
 * This module enables Fast Refresh - updating components without losing state.
 * It works by:
 * 1. Tracking all component instances as they render
 * 2. When a module hot-updates, replacing old components with new ones
 * 3. Preserving hook state across the replacement
 */

import { options } from './options.js';
import { enqueueRender } from './scheduler.js';

// Map of component function -> array of vnodes using that component
const vnodesForComponent = new Map();

// Map of old component -> new component (for type remapping)
const componentReplacements = new Map();

// Map of component ID -> component function
const componentRegistry = new Map();

// Pending updates to process
let pendingUpdates = [];

/**
 * Gets the current (possibly replaced) version of a component type
 */
function getCurrentType(type) {
  while (componentReplacements.has(type)) {
    type = componentReplacements.get(type);
  }
  return type;
}

/**
 * Hook into vnode creation to remap replaced component types
 */
const originalVnodeHook = options.vnode;
options.vnode = (vnode) => {
  if (vnode && typeof vnode.type === 'function') {
    const currentType = getCurrentType(vnode.type);
    if (currentType !== vnode.type) {
      vnode.type = currentType;
    }
  }
  if (originalVnodeHook) originalVnodeHook(vnode);
};

/**
 * Hook into diff to track component instances
 */
const originalDiffHook = options._diff;
options._diff = (vnode) => {
  if (vnode && typeof vnode.type === 'function') {
    const type = vnode.type;
    if (!vnodesForComponent.has(type)) {
      vnodesForComponent.set(type, []);
    }
    const vnodes = vnodesForComponent.get(type);
    if (!vnodes.includes(vnode)) {
      vnodes.push(vnode);
    }
  }
  if (originalDiffHook) originalDiffHook(vnode);
};

/**
 * Hook into unmount to clean up tracked vnodes
 */
const originalUnmountHook = options.unmount;
options.unmount = (vnode) => {
  if (vnode && typeof vnode.type === 'function') {
    const vnodes = vnodesForComponent.get(vnode.type);
    if (vnodes) {
      const index = vnodes.indexOf(vnode);
      if (index !== -1) {
        vnodes.splice(index, 1);
      }
    }
  }
  if (originalUnmountHook) originalUnmountHook(vnode);
};

/**
 * Register a component with the HMR system
 * Called by the Vite plugin for each exported component
 */
function register(type, id) {
  if (typeof type !== 'function') return;

  if (componentRegistry.has(id)) {
    const existingType = componentRegistry.get(id);
    if (existingType !== type) {
      // Component was updated - queue for replacement
      pendingUpdates.push([existingType, type]);
      componentRegistry.set(id, type);
    }
  } else {
    componentRegistry.set(id, type);
  }
}

/**
 * Replace an old component with a new one, preserving state
 */
function replaceComponent(oldType, newType, resetHooks = false) {
  const vnodes = vnodesForComponent.get(oldType);
  if (!vnodes || vnodes.length === 0) return;

  console.log(`[HMR] Replacing ${oldType.name || 'Component'} (${vnodes.length} instances)`);

  // Update the replacement mapping
  componentReplacements.set(oldType, newType);

  // Migrate vnode tracking to new type
  vnodesForComponent.delete(oldType);
  vnodesForComponent.set(newType, vnodes);

  // Update each instance
  vnodes.forEach((vnode) => {
    if (!vnode || !vnode._component) return;

    const component = vnode._component;

    // Update vnode type
    vnode.type = newType;

    if (resetHooks) {
      // Reset hook state (hooks changed)
      console.log('[HMR] Resetting hooks state');
      if (component.__hooks) {
        // Run cleanups before resetting
        component.__hooks._list.forEach((hookState) => {
          if (hookState._cleanup && typeof hookState._cleanup === 'function') {
            hookState._cleanup();
          }
        });
        component.__hooks._list = [];
        component.__hooks._pendingEffects = [];
      }
    } else {
      // Preserve hook state - just run effect cleanups so they re-run
      if (component.__hooks) {
        component.__hooks._list.forEach((hookState) => {
          if (hookState._cleanup && typeof hookState._cleanup === 'function') {
            hookState._cleanup();
            hookState._cleanup = undefined;
          }
          // Clear effect args to force re-run
          if (hookState._pendingArgs !== undefined) {
            hookState._args = undefined;
          }
        });
      }
    }

    // Trigger re-render
    enqueueRender(component);
  });
}

/**
 * Flush pending updates - called after module hot-update
 */
function flush() {
  const updates = [...pendingUpdates];
  pendingUpdates = [];

  if (updates.length === 0) return;

  console.log(`[HMR] Flushing ${updates.length} component update(s)`);

  updates.forEach(([oldType, newType]) => {
    // For now, always preserve state (don't reset hooks)
    // A more sophisticated implementation would check if hooks changed
    replaceComponent(oldType, newType, false);
  });
}

/**
 * Get pending updates (used by Vite plugin)
 */
function getPendingUpdates() {
  return pendingUpdates;
}

// Export the HMR API on the global object
if (typeof self !== 'undefined') {
  self.__WORSE_PREACT_HMR__ = {
    register,
    flush,
    getPendingUpdates,
    replaceComponent,
  };
}

export { register, flush, getPendingUpdates, replaceComponent };
