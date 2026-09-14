/**
 * The generated index (git-ignored; `npm run build:search` writes it). Typed
 * here so `tsc` and the tests pass on a clone that has not built yet; when
 * the file exists, the real one resolves first and `load.ts` casts it.
 */
declare module '*/search-index.json' {
  const index: unknown;
  export default index;
}
