/**
 * HTM Setup
 *
 * Creates the `html` tagged template literal by binding HTM to our h function.
 * Import this in components to use HTM syntax.
 */

import { h } from 'preact';
import htm from 'htm';

// Bind HTM to our h function
export const html = htm.bind(h);
