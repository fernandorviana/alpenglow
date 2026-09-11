import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { describe, it, expect } from 'vitest';

/**
 * A module a Server Component imports runs on React's server build, which has
 * no state, effects, refs or context. Unless the module opens with
 * `'use client'`, a bundler evaluates it there, and the first `useRef` is not a
 * function: the page fails to prerender. The docs pages are all client
 * components, so the site never shows it — a consumer's server page does.
 *
 * What the server build lacks is read from React itself, not listed here, so
 * the rule follows React when it changes.
 */
describe("'use client'", () => {
  // The file the `react-server` export condition points at, required directly:
  // the subpath itself is not exported, so it is found beside package.json.
  const require = createRequire(import.meta.url);
  const serverReact = new Set(
    Object.keys(require(join(dirname(require.resolve('react/package.json')), 'react.react-server.js'))),
  );

  const modules = readdirSync('src/components', { recursive: true, encoding: 'utf8' })
    .filter((file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file))
    .map((file) => join('src/components', file));

  it('opens every module that needs React’s client build', () => {
    const missing = modules.filter((path) => {
      const source = readFileSync(path, 'utf8');
      if (/^'use client';/.test(source)) return false;
      const named = [...source.matchAll(/^import \{([^}]*)\} from 'react';/gm)]
        .flatMap(([, names]) => names!.split(','))
        .map((name) => name.trim())
        .filter((name) => name && !name.startsWith('type '));
      return named.some((name) => !serverReact.has(name));
    });

    expect(missing).toEqual([]);
  });
});
