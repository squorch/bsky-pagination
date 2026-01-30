import { defineConfig } from 'vite';

export default defineConfig({
  base: '/bsky-pagination/',
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
  },
});
