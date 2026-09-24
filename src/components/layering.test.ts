import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { readCss } from '@/test/css';

/**
 * Alpenglow ships no z-index tokens. What floats goes to the top layer; what
 * stacks inside a component is shut in its own `isolation: isolate`, so the
 * page's stack belongs to the product and a sticky bar at z-index 1 sits over
 * everything the package draws. /decisions says why.
 */
const modules = readdirSync('src/components', { recursive: true, encoding: 'utf8' })
  .filter((file) => file.endsWith('.module.css'))
  .map((file) => join('src/components', file))
  .sort();

describe('layering', () => {
  it('finds the modules', () => {
    expect(modules).toContain('src/components/Scheduler/Scheduler.module.css');
  });

  for (const path of modules) {
    const css = readCss(path);
    const values = [...css.matchAll(/z-index:\s*(-?\d+)/g)].map(([, n]) => Number(n));
    if (values.length === 0) continue;

    it(`${path} isolates the z-index it uses, and keeps it at 3 or under`, () => {
      expect(css).toMatch(/isolation:\s*isolate/);
      expect(Math.max(...values)).toBeLessThanOrEqual(3);
    });
  }
});
