import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'WorsePreact',
      fileName: (format) => `worse-preact.${format}.js`,
      formats: ['es', 'umd'],
    },
    outDir: 'dist',
    minify: 'esbuild',
    sourcemap: true,
  },
});
