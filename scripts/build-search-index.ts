/**
 * Generates app/ui/search/search-index.json from the rendered pages.
 *
 * The pages are React with CSS modules and the `@`/`@ui` aliases, which
 * `tsx` cannot load, so Vite does: a server in middleware mode whose only
 * job is `ssrLoadModule`. The renderer itself is `app/ui/search/extract.tsx`,
 * the same module `extract.test.tsx` runs under vitest.
 *
 * The file is a build artefact, git-ignored: `build:docs` and `predev`
 * regenerate it, and the tests never read it.
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { ComponentType } from 'react';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = `${root}app/ui/search/search-index.json`;

const server = await createServer({
  root,
  configFile: false,
  appType: 'custom',
  logLevel: 'error',
  plugins: [react()],
  resolve: {
    alias: {
      '@': `${root}src`,
      '@ui': `${root}app/ui`,
      // The pages' Pager reads the route; the stub hands it the page being rendered.
      'next/navigation': `${root}app/ui/search/navigation-stub.ts`,
    },
  },
  server: { middlewareMode: true, hmr: false, watch: null },
  optimizeDeps: { noDiscovery: true, include: [] },
});

try {
  const { buildIndex } = (await server.ssrLoadModule('/app/ui/search/extract.tsx')) as typeof import('../app/ui/search/extract');
  const index = await buildIndex((file) => server.ssrLoadModule(`/${file}`) as Promise<{ default: ComponentType }>);
  writeFileSync(out, JSON.stringify(index));
  console.log(`${index.entries.length} entries → app/ui/search/search-index.json`);
} finally {
  await server.close();
}
