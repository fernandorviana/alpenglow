import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * The package build. One ES module per source module, so each keeps its own
 * `'use client'` and a bundler can drop what a consumer does not import. Every
 * CSS Module lands in one unlayered `styles.css`, which the consumer imports
 * once — into a layer of their choosing, if they use Tailwind. Declarations
 * come from `tsc -p tsconfig.lib.json`, finished by `scripts/finish-lib.ts`.
 */
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    copyPublicDir: false,
    cssCodeSplit: false,
    lib: { entry: 'src/index.ts', formats: ['es'] },
    rollupOptions: {
      external: [/^react($|\/)/, /^react-dom($|\/)/],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
        assetFileNames: 'styles.css',
      },
    },
  },
});
