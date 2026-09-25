/**
 * What both audits share: which routes the build has, which of them `--only`
 * names, and what the exit code says. Kept apart from the Chrome driving so
 * it can be tested without a browser (routes.test.ts).
 */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

/** Every route the static export produced, from disk rather than a hand-kept list. Skips Next internals (_next, _not-found) and the 404 page. */
export function discoverRoutes(outDir) {
  const routes = [];
  const walk = (dir, prefix) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (entry.name.startsWith('_')) continue;
        walk(join(dir, entry.name), `${prefix}/${entry.name}`);
      } else if (entry.name === 'index.html') {
        routes.push(prefix || '/');
      }
    }
  };
  walk(outDir, '');
  return routes.filter((r) => r !== '/404').sort();
}

/**
 * A route as `--only` may write it — `/drawer/`, `drawer`, ` /drawer` — in
 * the form discovery gives: one leading slash, none trailing. The site is
 * exported with `trailingSlash: true`, so its URLs end in one, and a route
 * copied from the address bar has to match. Empty is null.
 */
export function normaliseRoute(route) {
  const bare = route.trim().replace(/^\/+|\/+$/g, '');
  if (bare === '' && route.trim() === '') return null;
  return `/${bare}`;
}

/**
 * The routes `--only` names, in discovery order, and the names that match
 * none. With no `--only`, every route. A name that matches nothing is an
 * error, not a filter that happens to be empty: an audit that audited nothing
 * must not pass.
 */
export function selectRoutes(all, only) {
  if (only === undefined || only === null) return { routes: all, unknown: [], asked: [] };
  const asked = [...new Set(only.split(',').map(normaliseRoute).filter((r) => r !== null))];
  return {
    routes: all.filter((r) => asked.includes(r)),
    unknown: asked.filter((r) => !all.includes(r)),
    asked,
  };
}

/**
 * 1 when any run found what fails the audit, or could not run at all: a
 * route that errored was not audited, and an exit of 0 would say it passed.
 */
export function exitCode({ failing, errors }) {
  return failing > 0 || errors > 0 ? 1 : 0;
}

/**
 * Settles `--only` for a script, or ends it: exit 2, a usage error, when it
 * names a route the build does not have or names none at all.
 */
export function routesOrExit(all, only) {
  const { routes, unknown, asked } = selectRoutes(all, only);
  if (unknown.length > 0) {
    console.error(`--only: no such route ${unknown.join(', ')} (routes come from out/**/index.html; run npm run build:docs if it is new)`);
    process.exit(2);
  }
  if (asked.length === 0 && only !== undefined && only !== null) {
    console.error('--only names no route');
    process.exit(2);
  }
  return routes;
}
