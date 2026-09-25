import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, it, expect } from 'vitest';
import { discoverRoutes, exitCode, normaliseRoute, selectRoutes } from './routes.mjs';

/**
 * The audits' route selection and verdict, without Chrome. An audit that
 * audited nothing — a typo in `--only`, a trailing slash copied from the
 * address bar, every run erroring — exited 0, which reads as a pass.
 */
describe('the audits’ routes', () => {
  const out = mkdtempSync(join(tmpdir(), 'audit-routes-'));
  for (const dir of ['', 'drawer', 'screen', 'screen/full', '_next/static', '_not-found', '404']) {
    mkdirSync(join(out, dir), { recursive: true });
    writeFileSync(join(out, dir, 'index.html'), '');
  }
  afterAll(() => rmSync(out, { recursive: true, force: true }));

  it('come from the build, without Next’s own folders or the 404', () => {
    expect(discoverRoutes(out)).toEqual(['/', '/drawer', '/screen', '/screen/full']);
  });

  it('are named in --only with or without their slashes', () => {
    expect(normaliseRoute('/drawer/')).toBe('/drawer');
    expect(normaliseRoute('drawer')).toBe('/drawer');
    expect(normaliseRoute(' /screen/full/ ')).toBe('/screen/full');
    expect(normaliseRoute('/')).toBe('/');
    expect(normaliseRoute('')).toBeNull();
  });

  it('are every route with no --only, and those it names with one', () => {
    const all = discoverRoutes(out);
    expect(selectRoutes(all, undefined)).toMatchObject({ routes: all, unknown: [] });
    expect(selectRoutes(all, '/drawer/,screen/full')).toMatchObject({ routes: ['/drawer', '/screen/full'], unknown: [] });
  });

  it('say which names in --only match no route, so the script can refuse them', () => {
    const all = discoverRoutes(out);
    expect(selectRoutes(all, '/drawer,/drawr')).toMatchObject({ routes: ['/drawer'], unknown: ['/drawr'] });
    expect(selectRoutes(all, ',')).toMatchObject({ routes: [], unknown: [], asked: [] });
  });
});

describe('the audits’ exit code', () => {
  it('is 0 only when every run ran and none failed', () => {
    expect(exitCode({ failing: 0, errors: 0 })).toBe(0);
    expect(exitCode({ failing: 2, errors: 0 })).toBe(1);
  });

  it('is 1 when a run errored: a route that could not be audited did not pass', () => {
    expect(exitCode({ failing: 0, errors: 1 })).toBe(1);
  });
});
