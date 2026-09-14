import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      { find: '@ui', replacement: fileURLToPath(new URL('./app/ui', import.meta.url)) },
      // The search index is a build artefact, git-ignored; on a clone that
      // has not built, Vite refuses the loader's `import()` of it and every
      // suite that mounts the Nav fails. Under the runner it is this empty
      // stand-in — no test reads the real one; the palette's tests mock the
      // loader. `load.test.ts` holds this in place.
      {
        // The whole specifier: the alias plugin replaces only what the
        // pattern matched, so a suffix match would leave the leading `./`.
        find: /^\.\/search-index\.json$/,
        replacement: fileURLToPath(new URL('./app/ui/search/search-index.empty.json', import.meta.url)),
      },
    ],
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
