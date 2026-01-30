/**
 * Vite Plugin for Worse Preact HMR
 *
 * This plugin enables Fast Refresh by:
 * 1. Using Babel to detect components and hook signatures
 * 2. Injecting registration code for each component
 * 3. Setting up HMR accept handlers with signature comparison
 *
 * In production builds, this plugin does nothing - no HMR code is included.
 */

import { transformSync } from '@babel/core';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * @returns {import('vite').Plugin}
 */
export default function worsePreactHmr(options = {}) {
  let isProduction = false;
  let hmrDisabled = false;
  let hmrRuntimePath = '';

  return {
    name: 'worse-preact-hmr',

    configResolved(config) {
      isProduction = config.isProduction || config.command === 'build';
      hmrDisabled = config.server?.hmr === false;
      // Resolve path to HMR runtime
      hmrRuntimePath = resolve(__dirname, 'src/hmr-runtime.js');
    },

    transform(code, id) {
      // Skip in production or if HMR is disabled
      if (isProduction || hmrDisabled) return null;

      // Only process JSX/TSX/JS/TS files, not node_modules
      if (!/\.(c|m)?(t|j)sx?$/.test(id) || id.includes('node_modules')) {
        return null;
      }

      // Skip library source files to avoid circular imports
      if (id.includes('/src/') && id.includes('worse-preact')) {
        return null;
      }

      // Configure parser plugins based on file extension
      const parserPlugins = [
        'jsx',
        'classProperties',
        'classPrivateProperties',
        'classPrivateMethods',
        /\.tsx?$/.test(id) && 'typescript',
        ...((options && options.parserPlugins) || []),
      ].filter(Boolean);

      // Transform with Babel using prefresh plugin
      let result;
      try {
        result = transformSync(code, {
          plugins: [['@prefresh/babel-plugin', { skipEnvCheck: true }]],
          parserOpts: {
            plugins: parserPlugins,
          },
          ast: false,
          sourceMaps: true,
          filename: id,
          sourceFileName: id,
          configFile: false,
          babelrc: false,
        });
      } catch (err) {
        // If Babel fails, return original code
        console.warn(`[worse-preact-hmr] Babel transform failed for ${id}:`, err.message);
        return null;
      }

      if (!result || !result.code) return null;

      // Check if Babel generated refresh code
      const hasReg = /\$RefreshReg\$\(/.test(result.code);
      const hasSig = /\$RefreshSig\$\(/.test(result.code);

      // Skip if no components found
      if (!hasReg && !hasSig) return null;

      // Inject HMR runtime setup
      const prelude = `
import ${JSON.stringify(hmrRuntimePath)};

let prevRefreshReg;
let prevRefreshSig;

if (import.meta.hot) {
  prevRefreshReg = self.$RefreshReg$ || (() => {});
  prevRefreshSig = self.$RefreshSig$ || (() => (type) => type);

  self.$RefreshReg$ = (type, id) => {
    self.__WORSE_PREACT_HMR__.register(type, ${JSON.stringify(id)} + " " + id);
  };

  self.$RefreshSig$ = () => {
    let status = 'begin';
    let savedType;
    return (type, key, forceReset, getCustomHooks) => {
      if (!savedType) savedType = type;
      status = self.__WORSE_PREACT_HMR__.sign(type || savedType, key, forceReset, getCustomHooks, status);
      return type;
    };
  };
}
`;

      // Add HMR accept handler
      const outro = `
if (import.meta.hot) {
  self.$RefreshReg$ = prevRefreshReg;
  self.$RefreshSig$ = prevRefreshSig;
  import.meta.hot.accept(() => {
    try {
      self.__WORSE_PREACT_HMR__.flush();
    } catch (e) {
      console.error('[worse-preact-hmr] Failed to flush updates:', e);
      self.location.reload();
    }
  });
}
`;

      return {
        code: prelude + result.code + outro,
        map: result.map,
      };
    },
  };
}
