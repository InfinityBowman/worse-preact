/**
 * Preact DevTools Integration
 *
 * This module enables compatibility with the Preact DevTools browser extension.
 * Import this module in your app to connect to DevTools.
 *
 * Usage:
 * 1. Install the Preact DevTools browser extension
 * 2. Import this module: import 'worse-preact/devtools'
 * 3. Open DevTools and look for the "Components" tab
 */

import { options } from './options.js';
import { Fragment } from './vnode.js';

// Version we report to DevTools (pretend to be Preact 10.x for compatibility)
const VERSION = '10.24.0';

let connected = false;

/**
 * Try to connect to DevTools
 */
function tryConnect() {
  if (connected) return true;

  // Check multiple global contexts
  const globalObj =
    typeof globalThis !== 'undefined'
      ? globalThis
      : typeof window !== 'undefined'
        ? window
        : typeof self !== 'undefined'
          ? self
          : undefined;

  if (!globalObj) {
    console.log('[DevTools] No global object found');
    return false;
  }

  // Check if DevTools hook is available
  const hook = globalObj.__PREACT_DEVTOOLS__;
  console.log('[DevTools] Checking for hook:', !!hook, hook ? Object.keys(hook) : 'N/A');

  if (hook && hook.attachPreact) {
    console.log('[DevTools] Calling attachPreact with version:', VERSION);
    // DevTools is ready - attach
    const id = hook.attachPreact(VERSION, options, {
      Fragment,
      // We don't have a Component class, but that's optional
    });

    console.log('[DevTools] attachPreact returned:', id);

    if (id !== -1) {
      console.log('[DevTools] Connected to Preact DevTools');
      connected = true;
      return true;
    }
  }

  return false;
}

/**
 * Initialize DevTools connection with retry
 */
export function initDevTools() {
  // Try immediately
  if (tryConnect()) return;

  // Retry after a short delay (extension might not be injected yet)
  setTimeout(() => {
    if (tryConnect()) return;

    // Try again after DOMContentLoaded
    if (typeof document !== 'undefined' && document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => tryConnect());
    }
  }, 100);
}

// Initialize when module loads
initDevTools();
