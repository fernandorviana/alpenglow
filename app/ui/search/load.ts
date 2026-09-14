import type { Index } from './index';

let pending: Promise<Index> | undefined;

/**
 * The index, imported once on the first call and shared after. A dynamic
 * import, so the bundler splits the JSON into its own chunk fetched when the
 * palette first opens, and the site's base path never comes into it. A
 * rejection is forgotten, so the next open tries again.
 */
export function loadIndex(): Promise<Index> {
  pending ??= import('./search-index.json').then(
    (m) => m.default as Index,
    (error: unknown) => {
      pending = undefined;
      throw error;
    },
  );
  return pending;
}
