import { defineConfig } from 'vite';

// The client lives in client/; build it to board/dist, which the Node server
// serves static. base: './' so it works behind any path.
export default defineConfig({
  root: 'client',
  base: './',
  build: { outDir: '../dist', emptyOutDir: true },
});
