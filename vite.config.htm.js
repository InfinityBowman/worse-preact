import { defineConfig } from 'vite';
import customPreactHmr from './vite-plugin-hmr.js';

export default defineConfig({
  plugins: [
    customPreactHmr(),
  ],
  root: 'demo-htm',
  server: {
    port: 3004
  }
});
