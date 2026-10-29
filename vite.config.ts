import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { host: true, port: 5173 },
  // The Firebase SDK (Firestore + Storage) is most of the guest bundle; ~240 kB gzipped is expected.
  build: { chunkSizeWarningLimit: 900 },
});
