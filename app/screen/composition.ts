import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** The distinct package components the screen imports: the count on /screen. */
export function componentsUsed(root = 'app/screen'): string[] {
  const files = readdirSync(root, { recursive: true, encoding: 'utf8' })
    .filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f) && f !== 'composition.ts' && !f.startsWith('Frame') && f !== 'page.tsx');
  const names = files.flatMap((f) => [...readFileSync(join(root, f), 'utf8').matchAll(/from '@\/components\/([A-Z]\w+)'/g)].map((m) => m[1]!));
  return [...new Set(names)].sort();
}
