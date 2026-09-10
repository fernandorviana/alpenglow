import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // Claude Code creates git worktrees under .claude/worktrees/ (git-ignored).
    // Their test files read fixtures relative to the repo root and fail from here.
    exclude: [...configDefaults.exclude, '.claude/**'],
  },
});
