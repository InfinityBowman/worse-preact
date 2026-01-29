/**
 * Minimal Preact-Compatible Library
 *
 * A drop-in Preact replacement prioritizing readability over micro-optimizations.
 * Designed to be auditable by developers unfamiliar with vdom internals.
 *
 * Features:
 * - Full key support for list reconciliation
 * - Event delegation (single proxy per event type)
 * - useEffect runs after paint (async via requestAnimationFrame)
 * - SVG namespace support
 */

// VNode creation
export { h, createElement, Fragment, createRef, createVNode } from './vnode.js';

// Rendering
export { render, hydrate } from './render.js';

// Options (for plugins like HMR and DevTools)
export { options } from './options.js';

// Hooks
export {
  useState,
  useReducer,
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
  useCallback,
  useContext,
} from './hooks.js';

// For compatibility with Preact's named imports pattern
import { h, createElement, Fragment, createRef } from './vnode.js';
import { render, hydrate } from './render.js';
import {
  useState,
  useReducer,
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
  useCallback,
  useContext,
} from './hooks.js';

// Default export matching Preact's structure
export default {
  h,
  createElement,
  Fragment,
  createRef,
  render,
  hydrate,
  useState,
  useReducer,
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
  useCallback,
  useContext,
};
