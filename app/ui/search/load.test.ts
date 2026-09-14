import { describe, it, expect } from 'vitest';
import { loadIndex } from './load';

describe('loadIndex', () => {
  it('resolves under the test runner without the built artefact', async () => {
    // The real index is git-ignored and built by `build:search`; vitest.config
    // aliases it to an empty stand-in so a clone that has not built still runs
    // every suite. Tests that need entries mock this loader instead.
    expect(await loadIndex()).toEqual({ entries: [] });
  });
});
