import { defineConfig } from 'vite';
import worsePreactHmr from 'worse-preact/vite-plugin';

export default defineConfig({
  plugins: [worsePreactHmr()],
  server: {
    port: 3004,
  },
});
