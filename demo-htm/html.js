/**
 * HTM Setup
 *
 * Creates the `html` tagged template literal by binding HTM to our h function.
 * Import this in components to use HTM syntax.
 */

import { h } from '../src/index.js';
import htm from 'https://esm.sh/htm@3.1.1';

// Bind HTM to our h function
export const html = htm.bind(h);
