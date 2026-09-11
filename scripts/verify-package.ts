/**
 * Checks the package as a consumer receives it, after `npm run build:lib`:
 * what the library build must never lose, and what the tarball must never
 * carry. `publint` and `attw` cover the manifest and the types; this covers
 * what is particular to this system.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import process from 'node:process';

const failures: string[] = [];
const fail = (message: string) => failures.push(message);

const walk = (root: string) =>
  readdirSync(root, { recursive: true, encoding: 'utf8' }).map((file) => join(root, file));

/** A directive may follow comments, never code. */
const opensWithUseClient = (source: string) =>
  /^(?:\s*\/\/[^\n]*\n|\s*\/\*[\s\S]*?\*\/)*\s*["']use client["'];?/.test(source);

if (!existsSync('dist/index.js')) {
  fail('dist/ is missing — run `npm run build:lib` first');
} else {
  // 1. A client module stays one. Without the directive, a consumer's Server
  //    Component page that renders it fails to prerender.
  const modules = walk('src').filter(
    (file) => /\.tsx?$/.test(file) && !/\.(test|d)\.tsx?$/.test(file) && !file.startsWith(join('src', 'test')),
  );
  for (const source of modules) {
    if (!opensWithUseClient(readFileSync(source, 'utf8'))) continue;
    const built = join('dist', relative('src', source)).replace(/\.tsx?$/, '.js');
    if (!existsSync(built)) fail(`${built} is missing, and ${source} is a client module`);
    else if (!opensWithUseClient(readFileSync(built, 'utf8'))) fail(`${built} lost 'use client'`);
  }

  // 2. Every name a compiled CSS-module map hands out is in styles.css. A
  //    component whose class has no rule renders unstyled, silently. The map
  //    carries keyframes too, which are defined by name rather than as a class.
  const styles = readFileSync('dist/styles.css', 'utf8');
  let classes = 0;
  for (const map of walk('dist').filter((file) => file.endsWith('.module.js'))) {
    for (const [, name] of readFileSync(map, 'utf8').matchAll(/=\s*"([^"\s]+)"/g)) {
      classes++;
      if (!styles.includes(`.${name}`) && !styles.includes(`@keyframes ${name}`)) {
        fail(`${map}: ${name} is not in dist/styles.css`);
      }
    }
  }
  if (classes === 0) fail('no class names found in dist/**/*.module.js — the map format changed');

  // 3. The tokens are in styles.css. src/index.ts's CSS import is what puts
  //    them there; it looks removable, and without it every colour is unset.
  if (!styles.includes('--ap-color-surface-base:')) fail('dist/styles.css has no tokens');

  // 4. The stylesheet ships unlayered. The consumer chooses a layer on import;
  //    one baked in would hand every unlayered app rule the win.
  if (/@layer\b/.test(styles)) fail('dist/styles.css declares a cascade layer');

  // 5. Tailwind's dark: follows the tokens.
  if (!/@custom-variant dark\s*\{/.test(readFileSync('dist/tailwind-theme.css', 'utf8'))) {
    fail('dist/tailwind-theme.css has no @custom-variant dark');
  }

  // 6. The tarball carries the build and nothing else.
  const [pack] = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json'], { encoding: 'utf8' })) as [
    { files: { path: string }[] },
  ];
  for (const { path } of pack.files) {
    if (!/^(dist\/|package\.json$|README\.md$|LICENSE$)/.test(path)) fail(`the tarball carries ${path}`);
  }
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `✗ ${failure}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log('package ok');
}
