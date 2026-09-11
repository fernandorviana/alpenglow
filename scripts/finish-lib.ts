/**
 * Finishes dist/ after Vite and tsc.
 *
 * - Copies the two generated stylesheets that ship on their own.
 * - Removes side-effect CSS imports from the declarations. tsc keeps
 *   `import './styles/tokens.css'` from src/index.ts in index.d.ts, where it
 *   resolves to no types under any module resolution.
 * - Gives relative imports in the declarations a `.js` specifier. TypeScript
 *   under `moduleResolution: node16` requires one and tsc does not add it; the
 *   JavaScript Vite emits already has them.
 *
 * `attw --profile esm-only` in `check:package` fails if either rewrite is lost.
 */

import { copyFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

for (const sheet of ['tokens.css', 'tailwind-theme.css']) {
  copyFileSync(join('src/styles', sheet), join('dist', sheet));
}

for (const file of readdirSync('dist', { recursive: true, encoding: 'utf8' })) {
  if (!file.endsWith('.d.ts')) continue;
  const path = join('dist', file);
  const source = readFileSync(path, 'utf8');
  const finished = source
    .replace(/^import '[^']+\.css';\n/gm, '')
    .replace(/(from |import\()'(\.{1,2}\/[^']+)'/g, (match, lead: string, specifier: string) => {
      const target = join(dirname(path), specifier);
      if (existsSync(`${target}.d.ts`)) return `${lead}'${specifier}.js'`;
      if (existsSync(join(target, 'index.d.ts'))) return `${lead}'${specifier}/index.js'`;
      return match;
    });
  if (finished !== source) writeFileSync(path, finished);
}
