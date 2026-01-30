/**
 * HMR Constants
 *
 * Centralized property names for worse-preact internal structures.
 * Makes the HMR runtime more maintainable and less error-prone.
 */

// Vnode properties
export const VNODE_COMPONENT = '_component';
export const VNODE_DOM = '_dom';
export const VNODE_CHILDREN = '_children';

// Component properties
export const COMPONENT_HOOKS = '__hooks';
export const HOOKS_LIST = '_list';
export const EFFECTS_LIST = '_pendingEffects';
export const LAYOUT_EFFECTS_LIST = '_pendingLayoutEffects';

// Hook state properties
export const HOOK_VALUE = '_value';
export const HOOK_ARGS = '_args';
export const HOOK_CLEANUP = '_cleanup';
export const HOOK_PENDING_ARGS = '_pendingArgs';
export const HOOK_INITIALIZED = '_initialized';

// HMR global namespace
export const NAMESPACE = '__WORSE_PREACT_HMR__';
