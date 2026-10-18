import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { host: 'localhost', port: 5173 },
  // MapLibre GL is about 1 MB. It sits in its own chunk that loads only on the GIS page.
  build: { chunkSizeWarningLimit: 1100 },
});
