import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  // This site ships plain CSS; skip the parent project's PostCSS/Tailwind config.
  css: { postcss: { plugins: [] } },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020'
  }
});
