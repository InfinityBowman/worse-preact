/**
 * Options - Hook points for plugins like DevTools and HMR
 *
 * This allows external code to hook into the rendering lifecycle
 * without modifying the core library.
 *
 * Hook naming follows Preact conventions:
 * - Public hooks use full names (vnode, diffed, unmount)
 * - Internal hooks use underscore prefix (_diff, _render, _commit)
 *
 * IMPORTANT: This object starts mostly empty. Plugins like DevTools
 * will add their own hooks by setting properties on this object.
 */

/**
 * @type {import('./internal').Options}
 */
export const options = {};
