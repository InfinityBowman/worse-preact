import { defineConfig } from 'vite';
import worsePreactHmr from 'worse-preact/vite-plugin';

export default defineConfig({
  plugins: [worsePreactHmr()],
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    jsxInject: `import { h, Fragment } from 'worse-preact'`,
  },
  server: {
    port: 3003,
  },
});
