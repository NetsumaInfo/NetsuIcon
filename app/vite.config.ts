import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(here, 'src') },
  },
  clearScreen: false,
  server: {
    // 1420 is NetsuRush and NetsuDotto, 1430 is NetsuFlow.
    port: 1440,
    strictPort: true,
    // The icons and their changes come from the local server (server/src/main.ts).
    proxy: { '/api': 'http://127.0.0.1:6210' },
  },
});
