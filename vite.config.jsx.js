import { defineConfig } from 'vite';
import customPreactHmr from './vite-plugin-hmr.js';

export default defineConfig({
  plugins: [
    customPreactHmr(),
  ],
  root: 'demo-jsx',
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    jsxInject: `import { h, Fragment } from '../src/index.js'`
  },
  server: {
    port: 3003
  }
});
