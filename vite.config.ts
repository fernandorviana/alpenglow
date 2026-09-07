import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * The documentation site. It imports the library from source rather than a
 * build, so the site and the tests always read the same tokens.
 */
export default defineConfig(({ command }) => ({
  root: 'docs',
  // GitHub Pages serves the repo from a subpath; the dev server serves from root.
  base: command === 'build' ? (process.env.DOCS_BASE ?? '/alpenglow/') : '/',
  plugins: [react()],
  build: { outDir: '../dist-docs', emptyOutDir: true },
}));
