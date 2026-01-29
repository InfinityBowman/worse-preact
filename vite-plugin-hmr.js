/**
 * Vite Plugin for Worse Preact HMR
 *
 * This plugin enables Fast Refresh by:
 * 1. Detecting exported components in JSX/JS files
 * 2. Injecting registration code for each component
 * 3. Setting up HMR accept handlers
 */

/**
 * Detects if a name looks like a component (PascalCase)
 */
function isComponentName(name) {
  return /^[A-Z][a-zA-Z0-9]*$/.test(name);
}

/**
 * Extract exported function/const components from code
 * Returns array of { name, isDefault }
 */
function findExportedComponents(code) {
  const components = [];

  // Match: export function ComponentName
  const exportFuncRegex = /export\s+function\s+([A-Z][a-zA-Z0-9]*)\s*\(/g;
  let match;
  while ((match = exportFuncRegex.exec(code)) !== null) {
    components.push({ name: match[1], isDefault: false });
  }

  // Match: export const ComponentName =
  const exportConstRegex = /export\s+const\s+([A-Z][a-zA-Z0-9]*)\s*=/g;
  while ((match = exportConstRegex.exec(code)) !== null) {
    components.push({ name: match[1], isDefault: false });
  }

  // Match: export default function ComponentName
  const exportDefaultFuncRegex = /export\s+default\s+function\s+([A-Z][a-zA-Z0-9]*)\s*\(/g;
  while ((match = exportDefaultFuncRegex.exec(code)) !== null) {
    components.push({ name: match[1], isDefault: true });
  }

  // Match: function ComponentName ... export default ComponentName
  const funcRegex = /function\s+([A-Z][a-zA-Z0-9]*)\s*\(/g;
  const defaultExportRegex = /export\s+default\s+([A-Z][a-zA-Z0-9]*)\s*[;\n]/g;
  const funcNames = new Set();
  while ((match = funcRegex.exec(code)) !== null) {
    funcNames.add(match[1]);
  }
  while ((match = defaultExportRegex.exec(code)) !== null) {
    if (funcNames.has(match[1]) && !components.find(c => c.name === match[1])) {
      components.push({ name: match[1], isDefault: true });
    }
  }

  return components;
}

/**
 * @returns {import('vite').Plugin}
 */
export default function worsePreactHmr() {
  let isProduction = false;
  let hmrDisabled = false;

  return {
    name: 'worse-preact-hmr',

    configResolved(config) {
      isProduction = config.isProduction || config.command === 'build';
      hmrDisabled = config.server?.hmr === false;
    },

    transform(code, id) {
      // Skip in production or if HMR is disabled
      if (isProduction || hmrDisabled) return null;

      // Only process JSX/TSX/JS files, not node_modules
      if (!/\.[jt]sx?$/.test(id) || id.includes('node_modules')) {
        return null;
      }

      // Find exported components
      const components = findExportedComponents(code);

      // Skip if no components found
      if (components.length === 0) return null;

      // Generate registration code
      const registrations = components
        .map((c) => `self.__WORSE_PREACT_HMR__?.register(${c.name}, ${JSON.stringify(id + ':' + c.name)});`)
        .join('\n');

      // Generate HMR accept handler
      const hmrCode = `
if (import.meta.hot) {
  // Register components
  ${registrations}

  // Accept updates and flush
  import.meta.hot.accept(() => {
    self.__WORSE_PREACT_HMR__?.flush();
  });
}
`;

      return {
        code: code + '\n' + hmrCode,
        map: null, // TODO: proper source maps
      };
    },
  };
}
