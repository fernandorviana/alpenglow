# npm Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `alpenglow@0.1.0` publishable — one stylesheet, types that resolve under `bundler` and `node16`, a package check in CI, a staged trusted-publishing release workflow — and document it in a Developers section of the site.

**Architecture:** Vite library mode with `preserveModules` emits `dist/` beside the source layout, with every CSS Module in one `styles.css`; `tsc` emits declarations that `scripts/finish-lib.ts` makes resolvable and completes with the two generated stylesheets. `npm run check:package` runs `publint`, `attw` and `scripts/verify-package.ts` over the result. A tag-triggered workflow stages releases through npm OIDC.

**Tech Stack:** Vite 8 (Rolldown), TypeScript 5.7, `publint` 0.3.24, `@arethetypeswrong/cli` 0.18.5, Next.js 16 App Router (docs site), GitHub Actions, npm ≥ 11.5.1.

**Spec:** `docs/superpowers/specs/2026-09-11-npm-package-design.md`

## Global Constraints

- Package name `alpenglow`, version `0.1.0`, ESM only, published from the repository root with `files: ["dist"]`.
- Exports exactly: `.` (types + default), `./styles.css`, `./tokens.css`, `./tailwind-theme.css`, `./package.json`.
- `peerDependencies`: `react` and `react-dom` `^19.0.0`. No runtime dependencies.
- The component stylesheet ships **unlayered** (Fernando's ruling). Nothing in `src/` or the build adds `@layer`.
- No prewrapped `styles.layer.css`, no CommonJS build, no per-component entry points, no shadcn registry.
- Nothing is published by this plan. Fernando runs `npm login` and `npm publish` himself; credentials are never entered by an agent.
- Never hand-edit `src/styles/tokens.css` or `src/styles/tailwind-theme.css`; change the generator and run `npm run build:css`.
- Docs code examples must compile against the real API (`Field` takes `label`, `description`, `error`, `required`).
- `npm run check` passes at the end of every task; from Task 2 on, `npm run build:lib && npm run check:package` does too.
- Branch `feat/npm-package`; integrate by rebasing onto and fast-forwarding local `main` (other sessions move `main`). Push only when the user says so.
- Commit messages end with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

**Found while planning, and why the build has a finishing step.** A throwaway build showed `tsc` copies `import './styles/tokens.css'` from `src/index.ts` into `dist/index.d.ts`, where it resolves to nothing, and emits extensionless relative imports, which fail under `moduleResolution: node16`. `attw --profile esm-only` reported "Internal resolution error" for `node16` and `bundler`. Removing CSS imports from declarations and adding `.js` / `/index.js` to relative specifiers turned both green, and `publint --strict` passed. `attw` also reports CSS subpaths as "Resolution failed", which is correct for non-JavaScript files, so they are excluded from its entrypoints.

---

## File map

| File | Responsibility |
|---|---|
| `scripts/build-tailwind.ts` | emits `@custom-variant dark`; usage header shows the package imports |
| `src/styles/generated.test.ts` | the variant mirrors the tokens' dark rule |
| `vite.lib.config.ts` (new) | library build |
| `tsconfig.lib.json` (new) | declaration emit |
| `scripts/finish-lib.ts` (new) | copies `tokens.css` and `tailwind-theme.css` into `dist/`; makes declarations resolvable |
| `scripts/verify-package.ts` (new) | what the build must never lose, what the tarball must never carry |
| `package.json` | manifest, `build:lib`, `check:package`, `prepublishOnly`, two dev dependencies |
| `LICENSE` (new) | MIT |
| `src/index.ts` | comment on the tokens import |
| `.github/workflows/ci.yml` | package step |
| `.github/workflows/release.yml` (new) | staged trusted publishing |
| `app/docs.css` | code blocks |
| `app/ui/Nav.tsx` | Developers group |
| `app/install/page.tsx`, `app/tailwind/page.tsx`, `app/dark-mode/page.tsx` (new) | the three pages |
| `README.md` | Install section |
| `docs/superpowers/specs/2026-09-11-npm-package-design.md` | addendum for the finishing step |
| `MEMORY.md` | packaging done, owner steps, verification, a convention |

---

### Task 1: Tailwind's `dark:` follows the tokens

**Files:**
- Modify: `scripts/build-tailwind.ts` (the header `lines.push` block, and after `lines.push('}');`)
- Modify: `src/styles/generated.test.ts`
- Regenerate: `src/styles/tailwind-theme.css`

**Interfaces:**
- Consumes: `block(css: string, header: string): string` from `src/test/css.ts`.
- Produces: `src/styles/tailwind-theme.css` ending with a `@custom-variant dark { … }` block whose selectors are `[data-theme="dark"]` and, inside `@media (prefers-color-scheme: dark)`, `:root:not([data-theme="light"])` — the same strings `tokens.css` uses.

- [ ] **Step 1: Create the branch**

```bash
git switch -c feat/npm-package
```

- [ ] **Step 2: Write the failing test**

In `src/styles/generated.test.ts`, add `import { block } from '@/test/css';` to the imports, and append at the end of the file:

```ts
describe('tailwind-theme.css follows the tokens into dark', () => {
  it("gives Tailwind's dark: the rule the components follow", () => {
    // An explicit data-theme wins, otherwise the system preference. If the
    // variant and tokens.css disagree, a page shows `dark:` utilities in one
    // theme and the components in the other.
    const variant = block(tailwindCss, '@custom-variant dark');
    const system = block(variant, '@media (prefers-color-scheme: dark)');

    expect(tokensCss).toContain(':root[data-theme="dark"]');
    expect(variant).toContain('[data-theme="dark"]');
    expect(tokensCss).toContain(':root:not([data-theme="light"])');
    expect(system).toContain(':root:not([data-theme="light"])');
  });
});
```

- [ ] **Step 3: Run it to see it fail**

Run: `npx vitest run src/styles/generated.test.ts`
Expected: FAIL — `no block: @custom-variant dark`.

- [ ] **Step 4: Emit the variant**

In `scripts/build-tailwind.ts`, replace the usage lines of the header

```ts
lines.push(' * Usage:');
lines.push(' *   @import "tailwindcss";');
lines.push(' *   @import "alpenglow/styles/tokens.css";');
lines.push(' *   @import "alpenglow/styles/tailwind-theme.css";');
```

with

```ts
lines.push(' * Usage, after `npm install alpenglow`:');
lines.push(' *   @import "tailwindcss";');
lines.push(' *   @import "alpenglow/styles.css" layer(components);');
lines.push(' *   @import "alpenglow/tailwind-theme.css";');
```

and replace

```ts
lines.push('}');
lines.push('');

writeFileSync(
```

with

```ts
lines.push('}');
lines.push('');

// The tokens' own rule, in the same selectors tokens.css writes: an explicit
// data-theme wins, otherwise the system preference. Tailwind's default `dark:`
// reads only the media query, so a viewer who chose light on a dark system
// would get dark utilities over light components.
lines.push('@custom-variant dark {');
lines.push('  &:where([data-theme="dark"], [data-theme="dark"] *) {');
lines.push('    @slot;');
lines.push('  }');
lines.push('  @media (prefers-color-scheme: dark) {');
lines.push('    &:where(:root:not([data-theme="light"]), :root:not([data-theme="light"]) *) {');
lines.push('      @slot;');
lines.push('    }');
lines.push('  }');
lines.push('}');
lines.push('');

writeFileSync(
```

- [ ] **Step 5: Regenerate and run the test**

Run: `npm run build:css && npx vitest run src/styles/generated.test.ts`
Expected: PASS.

- [ ] **Step 6: Run the checks**

Run: `npm run check`
Expected: typecheck, lint and the suite pass.

- [ ] **Step 7: Commit**

```bash
git add scripts/build-tailwind.ts src/styles/generated.test.ts src/styles/tailwind-theme.css
git commit -m "Give Tailwind's dark: variant the tokens' rule, and point the theme's usage header at the package with a layer

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: The library build and its check

**Files:**
- Create: `scripts/verify-package.ts`, `scripts/finish-lib.ts`, `vite.lib.config.ts`, `tsconfig.lib.json`, `LICENSE`
- Modify: `package.json`, `src/index.ts:1`, `.github/workflows/ci.yml`, `docs/superpowers/specs/2026-09-11-npm-package-design.md`

**Interfaces:**
- Consumes: `src/styles/tailwind-theme.css` with `@custom-variant dark` (Task 1).
- Produces: `npm run build:lib` → `dist/` (`index.js`, `index.d.ts`, `styles.css`, `tokens.css`, `tailwind-theme.css`, one `.js` + `.d.ts` per source module); `npm run check:package` (exit 0 when the package is sound); `prepublishOnly`.

- [ ] **Step 1: Write the check first**

Create `scripts/verify-package.ts`:

```ts
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

  // 2. Every class a compiled CSS-module map hands out is in styles.css. A
  //    component whose class has no rule renders unstyled, silently.
  const styles = readFileSync('dist/styles.css', 'utf8');
  let classes = 0;
  for (const map of walk('dist').filter((file) => file.endsWith('.module.js'))) {
    for (const [, name] of readFileSync(map, 'utf8').matchAll(/=\s*"([^"\s]+)"/g)) {
      classes++;
      if (!styles.includes(`.${name}`)) fail(`${map}: .${name} is not in dist/styles.css`);
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
  if (!readFileSync('dist/tailwind-theme.css', 'utf8').includes('@custom-variant dark')) {
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
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx tsx scripts/verify-package.ts`
Expected: exit 1, `✗ dist/ is missing — run \`npm run build:lib\` first`.

- [ ] **Step 3: Add the build configuration**

Create `vite.lib.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * The package build. One ES module per source module, so each keeps its own
 * `'use client'` and a bundler can drop what a consumer does not import. Every
 * CSS Module lands in one unlayered `styles.css`, which the consumer imports
 * once — into a layer of their choosing, if they use Tailwind. Declarations
 * come from `tsc -p tsconfig.lib.json`, finished by `scripts/finish-lib.ts`.
 */
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    copyPublicDir: false,
    cssCodeSplit: false,
    lib: { entry: 'src/index.ts', formats: ['es'] },
    rollupOptions: {
      external: [/^react($|\/)/, /^react-dom($|\/)/],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
        assetFileNames: 'styles.css',
      },
    },
  },
});
```

Create `tsconfig.lib.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "declaration": true,
    "emitDeclarationOnly": true,
    "rootDir": "src",
    "outDir": "dist",
    "types": []
  },
  "include": ["src"],
  "exclude": ["src/**/*.test.ts", "src/**/*.test.tsx", "src/test"]
}
```

Create `scripts/finish-lib.ts`:

```ts
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
```

- [ ] **Step 4: Say why the tokens import stays**

In `src/index.ts`, replace line 1 (`import './styles/tokens.css';`) with:

```ts
// Puts the tokens at the top of the package's styles.css. The built JavaScript
// does not keep this import — the consumer's own `import 'alpenglow/styles.css'`
// loads the CSS — and scripts/verify-package.ts fails if the tokens go missing.
import './styles/tokens.css';
```

- [ ] **Step 5: The manifest, the licence, the dev dependencies**

Run: `npm install --save-dev --save-exact publint@0.3.24 @arethetypeswrong/cli@0.18.5`

Then edit `package.json` so that, apart from `devDependencies` (which `npm install` just updated), it reads:

```json
{
  "name": "alpenglow",
  "version": "0.1.0",
  "description": "A design system for dense, data-heavy interfaces. Light and dark, measured for contrast.",
  "license": "MIT",
  "author": "Fernando R Viana",
  "homepage": "https://alpenglow-rose.vercel.app",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/fernandorviana/alpenglow.git"
  },
  "bugs": "https://github.com/fernandorviana/alpenglow/issues",
  "keywords": ["design-system", "react", "components", "css-modules", "tokens", "accessibility", "dark-mode"],
  "type": "module",
  "sideEffects": ["*.css"],
  "files": ["dist"],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./styles.css": "./dist/styles.css",
    "./tokens.css": "./dist/tokens.css",
    "./tailwind-theme.css": "./dist/tailwind-theme.css",
    "./package.json": "./package.json"
  },
  "scripts": {
    "build:css": "tsx scripts/build-css.ts && tsx scripts/build-tailwind.ts",
    "build:lib": "npm run build:css && vite build --config vite.lib.config.ts && tsc -p tsconfig.lib.json && tsx scripts/finish-lib.ts",
    "check:package": "publint --strict && attw --pack . --profile esm-only --exclude-entrypoints ./styles.css ./tokens.css ./tailwind-theme.css && tsx scripts/verify-package.ts",
    "prepublishOnly": "npm run check && npm run build:lib && npm run check:package",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "lint": "eslint",
    "check": "npm run typecheck && npm run lint && npm test",
    "dev": "next dev",
    "build:docs": "npm run build:css && next build",
    "build:tailwind": "tsx scripts/build-tailwind.ts",
    "start": "next start"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

Create `LICENSE`:

```text
MIT License

Copyright (c) 2026 Fernando R Viana

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 6: Build and check**

Run: `npm run build:lib && npm run check:package`
Expected: `publint` "All good!", `attw` green for `node16 (from ESM)` and `bundler` on `"alpenglow"`, then `package ok`; exit 0.

If `publint --strict` raises a warning, fix the manifest rather than dropping `--strict`, and note what it was in the commit message.

- [ ] **Step 7: Prove each check can fail**

Each mutation is undone before the next; `npm run build:lib` restores `dist/`.

1. Client directive: `perl -0pi -e 's/"use client";\n//' dist/components/Calendar/Calendar.js` (first occurrence, wherever comments put it), confirm with `grep -c "use client" dist/components/Calendar/Calendar.js` → `0`, run `npx tsx scripts/verify-package.ts` → `✗ dist/components/Calendar/Calendar.js lost 'use client'`. Rebuild.
2. A class with no rule: `perl -pi -e 's/\._loading_/._gone_/g' dist/styles.css`, run → a `.._loading_… is not in dist/styles.css` line. Rebuild.
3. Tokens: in `src/index.ts` comment out the tokens import, `npm run build:lib`, run → `✗ dist/styles.css has no tokens`. Restore `src/index.ts` (`git checkout -- src/index.ts` would lose Step 4's comment — undo the comment-out by hand) and rebuild.
4. A layer: `printf '@layer x{}\n' >> dist/styles.css`, run → `✗ dist/styles.css declares a cascade layer`. Rebuild.
5. The dark variant: `perl -0pi -e 's/\@custom-variant dark/\@custom-variant darkish/' dist/tailwind-theme.css`, run → `✗ dist/tailwind-theme.css has no @custom-variant dark`. Rebuild.
6. The tarball: in `package.json` change `"files": ["dist"]` to `"files": ["dist", "scripts"]`, run → `✗ the tarball carries scripts/…`. Restore `["dist"]`.
7. Declarations: `perl -0pi -e "s/'\.\/components\/Button\/index\.js'/'.\/components\/Button\/index'/" dist/index.d.ts`, run `npx attw --pack . --profile esm-only --exclude-entrypoints ./styles.css ./tokens.css ./tailwind-theme.css` → "Internal resolution error" on `node16 (from ESM)`. Rebuild.

Final: `npm run build:lib && npm run check:package` → exit 0.

- [ ] **Step 8: Run the package check in CI**

In `.github/workflows/ci.yml`, after `- run: npm run build:docs`, add:

```yaml

      # The package as a consumer receives it: the manifest, the types, and
      # what the library build must never lose. `prepublishOnly` runs the same.
      - name: Package
        run: |
          npm run build:lib
          npm run check:package
```

- [ ] **Step 9: Record the finishing step in the spec**

In `docs/superpowers/specs/2026-09-11-npm-package-design.md`, §2 "The build", after item 4 (the copies), add:

```markdown
5. `tsx scripts/finish-lib.ts` — found during planning: `tsc` keeps
   `import './styles/tokens.css'` in `index.d.ts`, where it resolves to no
   types, and writes extensionless relative imports, which fail under
   `moduleResolution: node16`. The script removes CSS imports from the
   declarations and adds `.js` or `/index.js` to relative specifiers, and
   performs the copies of item 4. `attw` fails if either rewrite is lost.
```

and in §4, change the `attw` bullet to `**\`attw --pack . --profile esm-only --exclude-entrypoints ./styles.css ./tokens.css ./tailwind-theme.css\`**` with the added sentence `CSS subpaths are excluded: they are not JavaScript, and attw reports them as unresolvable.`, and add to the numbered list of `verify-package.ts`: `6. \`dist/styles.css\` lacks the tokens — the \`src/index.ts\` import that puts them there looks removable.`

- [ ] **Step 10: Run the checks**

Run: `npm run check && npm run build:lib && npm run check:package`
Expected: all pass.

- [ ] **Step 11: Commit**

```bash
git add scripts/verify-package.ts scripts/finish-lib.ts vite.lib.config.ts tsconfig.lib.json LICENSE package.json package-lock.json src/index.ts .github/workflows/ci.yml docs/superpowers/specs/2026-09-11-npm-package-design.md
git commit -m "Build alpenglow 0.1.0 as a package: one unlayered stylesheet, declarations that resolve under bundler and node16, and a check that fails on what the build must never lose

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: The release workflow

**Files:**
- Create: `.github/workflows/release.yml`

**Interfaces:**
- Consumes: `npm run check`, `npm run build:lib`, `npm run check:package` (Task 2); `version` in `package.json`.
- Produces: a workflow that, on a `v*` tag, stages the matching version with `npm stage publish` through OIDC.

- [ ] **Step 1: Write the workflow**

Create `.github/workflows/release.yml`:

```yaml
name: Release

# A version tag stages that version on npm. It goes public only when a
# maintainer approves it with 2FA on npmjs.com. No npm token lives in this
# repository: npm trusts this workflow through OIDC, configured in the
# package's settings as a trusted publisher.

on:
  push:
    tags: ['v*']

permissions:
  contents: read
  id-token: write

jobs:
  stage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm
          registry-url: https://registry.npmjs.org

      # Trusted publishing needs npm 11.5.1 or later; `npm stage` is newer
      # still. Pinned to the version it was checked against, rather than
      # whatever Node 24 happens to bundle.
      - run: npm install --global npm@11.19.0

      - run: npm ci

      - name: The tag names the version in package.json
        run: |
          version="v$(node -p "require('./package.json').version")"
          if [ "$GITHUB_REF_NAME" != "$version" ]; then
            echo "::error::Tag $GITHUB_REF_NAME does not match package.json ($version)."
            exit 1
          fi

      # The first version is published by hand, so its tag has nothing to do.
      - name: Skip a version npm already has
        id: published
        run: |
          if npm view "alpenglow@$(node -p "require('./package.json').version")" version >/dev/null 2>&1; then
            echo "::notice::This version is already on npm; nothing to stage."
            echo "skip=true" >> "$GITHUB_OUTPUT"
          fi

      - if: steps.published.outputs.skip != 'true'
        run: npm run check

      - if: steps.published.outputs.skip != 'true'
        run: |
          npm run build:lib
          npm run check:package

      - if: steps.published.outputs.skip != 'true'
        run: npm stage publish .
```

- [ ] **Step 2: Exercise the two guard scripts locally**

Run:

```bash
for ref in v0.1.0 v9.9.9; do
  GITHUB_REF_NAME=$ref bash -c 'version="v$(node -p "require(\"./package.json\").version")"; if [ "$GITHUB_REF_NAME" != "$version" ]; then echo "mismatch $GITHUB_REF_NAME"; else echo "match $GITHUB_REF_NAME"; fi'
done
```

Expected: `match v0.1.0`, `mismatch v9.9.9`.

Run: `npm view "alpenglow@0.1.0" version >/dev/null 2>&1 && echo published || echo "not published"`
Expected: `not published` (until Fernando publishes).

- [ ] **Step 3: Confirm the pinned npm has the staged command**

Run: `npx -y npm@11.19.0 stage publish --help | head -3`
Expected: the `npm stage publish <package-spec>` usage.

- [ ] **Step 3b: Record the skip in the spec**

In `docs/superpowers/specs/2026-09-11-npm-package-design.md`, §5, in the `release.yml` list, after the tag-equals-version item, add: `- a step that ends the job quietly when npm already has that version — the first one is published by hand, so its tag has nothing to stage;` and after the Node 24 item: `- npm pinned to 11.19.0, the version \`npm stage\` was checked against;`.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/release.yml docs/superpowers/specs/2026-09-11-npm-package-design.md
git commit -m "Stage releases from version tags through npm trusted publishing, skipping a version npm already has

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: The Developers section

**Files:**
- Modify: `app/docs.css` (after the `.prose code` rule), `app/ui/Nav.tsx` (the `NAV` array), `README.md`
- Create: `app/install/page.tsx`, `app/tailwind/page.tsx`, `app/dark-mode/page.tsx`

**Interfaces:**
- Consumes: `DocPage` (`@ui/DocPage`, props `children`, `evidence?`); `Link` from `next/link`; `tokenContrast` from `@/tokens/contrast`.
- Produces: routes `/install`, `/tailwind`, `/dark-mode`, listed under "Developers" after "Start here".

- [ ] **Step 1: Style code blocks**

In `app/docs.css`, after the `.prose code { … }` rule, add:

```css
/* A long line scrolls inside its block; the page body never scrolls sideways
   on a phone. */
.prose pre {
  margin: 0 0 var(--ap-spacing-200);
  padding: var(--ap-spacing-200);
  overflow-x: auto;
  border-radius: var(--ap-radius-lg);
  background: var(--ap-color-surface-sunken);
  font-family: var(--ap-font-mono);
  font-size: var(--ap-text-caption-md-size);
  line-height: var(--ap-text-caption-md-line-height);
}

.prose pre code {
  padding: 0;
  border-radius: 0;
  background: none;
  font-size: inherit;
}
```

- [ ] **Step 2: Add the group to the navigation**

In `app/ui/Nav.tsx`, in `NAV`, insert after the `Start here` group object:

```ts
  {
    title: 'Developers',
    items: [
      { href: '/install', label: 'Install' },
      { href: '/tailwind', label: 'Tailwind' },
      { href: '/dark-mode', label: 'Dark mode' },
    ],
  },
```

- [ ] **Step 3: The Install page**

Create `app/install/page.tsx`:

```tsx
import Link from 'next/link';
import { DocPage } from '@ui/DocPage';
import { tokenContrast } from '@/tokens/contrast';

export default function InstallPage() {
  const secondaryOnRaised = tokenContrast('text/secondary', 'surface/raised', 'dark').toFixed(2);

  return (
    <DocPage>
      <h1>Install</h1>
      <p className="lead">One package and one stylesheet. React 19 is all it asks of your app.</p>

      <pre>
        <code>npm install alpenglow</code>
      </pre>

      <h2>Import the stylesheet once</h2>
      <p>
        Every component is painted by <code>alpenglow/styles.css</code>, tokens included. Import it
        once, where the app starts: the root layout in Next.js, the entry file in Vite. The
        components inject nothing themselves, so without this import they render unstyled.
      </p>
      <pre>
        <code>{`// app/layout.tsx, or src/main.tsx
import 'alpenglow/styles.css';`}</code>
      </pre>
      <p>
        With Tailwind, import it into a layer instead. <Link href="/tailwind">Tailwind</Link> says
        why.
      </p>

      <h2>Use the components</h2>
      <pre>
        <code>{`import { Button, Field, Input } from 'alpenglow';

export function Invite() {
  return (
    <form>
      <Field label="Email" description="One message, sent today.">
        <Input type="email" name="email" />
      </Field>
      <Button type="submit">Send invite</Button>
    </form>
  );
}`}</code>
      </pre>

      <h2>Server Components</h2>
      <p>
        Every component that needs the browser says so with <code>&apos;use client&apos;</code>,
        and the package keeps the directive, so a server page can render any of them. What a
        server page cannot do is hand a component a function, because React cannot send one from
        the server. The props that take one — <code>DropdownMenu</code>&apos;s{' '}
        <code>trigger</code>, a <code>Table</code> column&apos;s <code>cell</code>, any{' '}
        <code>onSelect</code> or <code>onChange</code> — belong in a client component of your own.
      </p>
      <pre>
        <code>{`'use client';

import { useRouter } from 'next/navigation';
import { Button, DropdownMenu } from 'alpenglow';

export function RowActions({ id }: { id: string }) {
  const router = useRouter();
  return (
    <DropdownMenu
      trigger={(props) => (
        <Button variant="ghost" tone="neutral" {...props}>
          Actions
        </Button>
      )}
      items={[{ id: 'edit', label: 'Edit', onSelect: () => router.push(\`/rows/\${id}\`) }]}
    />
  );
}`}</code>
      </pre>

      <h2>Icons</h2>
      <p>
        Fifteen icons were drawn for this system and ship with it. Everything else is IBM Carbon,
        installed on its own so an app carries only the icons it uses.{' '}
        <Link href="/icons">Icons</Link> lists both, and the Carbon names that differ from the
        drawing.
      </p>
      <pre>
        <code>{`npm install @carbon/icons-react

import { AiSparkle } from 'alpenglow';
import { Search } from '@carbon/icons-react';`}</code>
      </pre>

      <h2>What the package holds</h2>
      <div className="tableScroll">
        <table className="tokens">
          <thead>
            <tr>
              <th>Import</th>
              <th>Holds</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>alpenglow</code></td>
              <td>The components, the drawn icons, and the tokens in TypeScript.</td>
            </tr>
            <tr>
              <td><code>alpenglow/styles.css</code></td>
              <td>The tokens and every component&apos;s styles. What almost every app imports.</td>
            </tr>
            <tr>
              <td><code>alpenglow/tokens.css</code></td>
              <td>The custom properties alone, for the palette without the components.</td>
            </tr>
            <tr>
              <td><code>alpenglow/tailwind-theme.css</code></td>
              <td>The tokens as Tailwind v4 utilities, and a <code>dark:</code> that follows them.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Tokens in TypeScript</h2>
      <p>
        The values the stylesheet uses are exported for code that computes with them — a chart
        choosing a label colour, a test asserting contrast.
      </p>
      <pre>
        <code>{`import { tokenContrast } from 'alpenglow';

tokenContrast('text/secondary', 'surface/raised', 'dark'); // ${secondaryOnRaised}`}</code>
      </pre>
    </DocPage>
  );
}
```

- [ ] **Step 4: The Tailwind page**

Create `app/tailwind/page.tsx`:

```tsx
import Link from 'next/link';
import { DocPage } from '@ui/DocPage';

export default function TailwindPage() {
  return (
    <DocPage>
      <h1>Tailwind</h1>
      <p className="lead">
        Import the stylesheet into a layer, and Tailwind&apos;s utilities can override any component.
      </p>

      <pre>
        <code>{`/* app/globals.css */
@import "tailwindcss";
@import "alpenglow/styles.css" layer(components);
@import "alpenglow/tailwind-theme.css";`}</code>
      </pre>

      <h2>Why a layer</h2>
      <p>
        Tailwind keeps its rules in cascade layers: its reset in <code>base</code>, utilities in{' '}
        <code>utilities</code>. A rule in no layer beats every layered rule, whatever its
        selector. Alpenglow&apos;s stylesheet ships in no layer on purpose, so that an app&apos;s
        global rules cannot unstyle a component — which, in a Tailwind app, also means{' '}
        <code>className=&quot;rounded-none&quot;</code> on a button does nothing.
      </p>
      <p>
        <code>layer(components)</code> puts the stylesheet between the two: above the reset, so
        preflight cannot strip a button, and below the utilities, so your classes win.
      </p>
      <pre>
        <code>{`<Button className="rounded-none mt-6">Save</Button>`}</code>
      </pre>

      <h2>What the layer costs</h2>
      <p>
        Once the components are in a layer, a rule of your own that is in none beats them too. A
        global <code>button {'{'} background: none {'}'}</code> would empty every Alpenglow button.
        Keep resets in <code>@layer base</code>, where Tailwind keeps its own.
      </p>

      <h2>Without the layer</h2>
      <p>
        Import <code>alpenglow/styles.css</code> plainly and everything still works. An override
        then needs Tailwind&apos;s important modifier: <code>rounded-none!</code>.
      </p>
      <p>
        Import it from CSS, not from JavaScript, either way. A layer chosen in CSS is fixed; the
        order of stylesheets imported from JavaScript is decided by the bundler.
      </p>

      <h2>The theme</h2>
      <p>
        <code>tailwind-theme.css</code> turns the tokens into utilities. They point at the same
        custom properties the components use, so they follow light and dark without a{' '}
        <code>dark:</code> of their own.
      </p>
      <pre>
        <code>{`<section className="rounded-lg bg-surface-raised p-300 text-text-primary">
  <p className="text-text-secondary">Due today</p>
</section>`}</code>
      </pre>
      <p>
        When something should differ in dark, <code>dark:</code> follows the components&apos;
        rule: <code>data-theme=&quot;dark&quot;</code>, or the system preference when no theme is
        set. <Link href="/dark-mode">Dark mode</Link> covers setting it.
      </p>
      <pre>
        <code>{`<img className="dark:opacity-80" src="/chart.png" alt="Bookings this week" />`}</code>
      </pre>
    </DocPage>
  );
}
```

- [ ] **Step 5: The Dark mode page**

Create `app/dark-mode/page.tsx`:

```tsx
import { DocPage } from '@ui/DocPage';

export default function DarkModePage() {
  return (
    <DocPage>
      <h1>Dark mode</h1>
      <p className="lead">One attribute on the root element. Without it, the system decides.</p>

      <pre>
        <code>{`<html data-theme="dark">`}</code>
      </pre>
      <p>
        Both themes are in <code>styles.css</code>. <code>data-theme=&quot;light&quot;</code> or{' '}
        <code>&quot;dark&quot;</code> wins; with no attribute, the viewer&apos;s system preference
        does. <code>color-scheme</code> follows the same rule, so scrollbars, native select popups
        and autofill match the page.
      </p>

      <h2>Switching</h2>
      <p>Write the attribute and store the choice. Remove both to hand the decision back to the system.</p>
      <pre>
        <code>{`function setTheme(theme: 'light' | 'dark' | null) {
  const root = document.documentElement;
  if (theme) root.setAttribute('data-theme', theme);
  else root.removeAttribute('data-theme');
  try {
    if (theme) localStorage.setItem('theme', theme);
    else localStorage.removeItem('theme');
  } catch {
    // Private windows and blocked site data throw. The page still switches.
  }
}`}</code>
      </pre>

      <h2>Before the first paint</h2>
      <p>
        A stored choice has to reach the root before the browser paints, or a viewer who chose
        dark sees one frame of light. A script in the document head runs while the HTML is
        parsed, which is early enough:
      </p>
      <pre>
        <code>{`<script>
  try {
    var theme = localStorage.getItem('theme');
    if (theme === 'light' || theme === 'dark') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  } catch (e) {}
</script>`}</code>
      </pre>
      <p>
        In Vite or plain HTML it goes in <code>index.html</code>. In the Next.js App Router, not{' '}
        <code>next/script</code> with <code>beforeInteractive</code>: that queues the code for the
        runtime, which runs after the first paint. This site renders the script from its root
        layout through a small client component, and{' '}
        <a href="https://github.com/fernandorviana/alpenglow/blob/main/app/ui/InlineScript.tsx">
          InlineScript.tsx
        </a>{' '}
        explains why it has to be one.
      </p>

      <h2>With next-themes</h2>
      <pre>
        <code>{`<ThemeProvider attribute="data-theme">{children}</ThemeProvider>`}</code>
      </pre>
      <p>
        Beside shadcn/ui, whose components read a <code>.dark</code> class, set both, and one
        switch drives the two systems:
      </p>
      <pre>
        <code>{`<ThemeProvider attribute={['class', 'data-theme']}>{children}</ThemeProvider>`}</code>
      </pre>
    </DocPage>
  );
}
```

- [ ] **Step 6: The README**

In `README.md`, after the line `**Theme:** Eleonora.` and its blank line, insert:

````markdown
## Install

```bash
npm install alpenglow
```

```tsx
import 'alpenglow/styles.css';
import { Button } from 'alpenglow';
```

With Tailwind v4, import the stylesheet into a layer so utilities can override
components:

```css
@import "tailwindcss";
@import "alpenglow/styles.css" layer(components);
@import "alpenglow/tailwind-theme.css";
```

More on the site: [Install](https://alpenglow-rose.vercel.app/install) ·
[Tailwind](https://alpenglow-rose.vercel.app/tailwind) ·
[Dark mode](https://alpenglow-rose.vercel.app/dark-mode).

````

- [ ] **Step 7: Run the checks**

Run: `npm run check`
Expected: pass. `app/ui/Ratio.test.tsx` discovers pages from `app/`, so it renders the three new pages too.

- [ ] **Step 8: Check the pages in a browser**

Run: `npm run build:docs` — the route list includes `/install`, `/tailwind`, `/dark-mode`.

Port 3000 may belong to another session. Add a temporary entry to `.claude/launch.json` — `{"name": "docs-static-check", "runtimeExecutable": "python3", "runtimeArgs": ["-m", "http.server", "3200", "--directory", "out"], "port": 3200}` — start it with `preview_start`, and on each of `/install/`, `/tailwind/`, `/dark-mode/`, in light and dark:
- the Developers group sits after Start here, with the current page marked;
- code blocks are on `surface/sunken`, monospaced, with no border and no clipped text;
- the Install page's `tokenContrast` comment shows a number, not `NaN`.

With `resize_window` at 375×812, confirm `document.documentElement.scrollWidth === 375` on all three (a long code line scrolls inside its block). Reset the viewport, stop the server, and `git checkout -- .claude/launch.json`.

- [ ] **Step 9: Commit**

```bash
git add app/docs.css app/ui/Nav.tsx app/install app/tailwind app/dark-mode README.md
git commit -m "Add a Developers section — Install, Tailwind, Dark mode — with code blocks, and an Install section in the README

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Verify as a consumer, record, integrate

**Files:**
- Modify: `MEMORY.md`
- Throwaway, outside the repository: two consumer apps in the session scratchpad.

**Interfaces:**
- Consumes: the tarball from `npm pack` after `npm run build:lib`.
- Produces: nothing in code.

- [ ] **Step 1: Pack**

Run: `npm run build:lib && npm run check:package && npm pack --pack-destination <scratchpad>`
Expected: `alpenglow-0.1.0.tgz`.

- [ ] **Step 2: A Next.js + Tailwind consumer**

In `<scratchpad>/next-app`, create a Next 16 app by hand — `package.json` (`next@16.3.4`, `react@19.2.8`, `react-dom@19.2.8`, `tailwindcss@4.3.3`, `@tailwindcss/postcss@4.3.3`, `typescript`, `@types/react`, the tarball), `postcss.config.mjs` with `@tailwindcss/postcss`, `next.config.ts` with `output: 'export'`, `app/globals.css` with the three imports from the Tailwind page, `app/layout.tsx` importing it.

`app/page.tsx` (a Server Component) renders `Button` (one with `className="rounded-none mt-6"` and `id="tw"`), `Badge tone="warning"`, `Checkbox defaultChecked`, `Field` + `Input`, and a client component `app/Interactive.tsx` (`'use client'`) with `DatePicker` and `DropdownMenu`.

Run `npm install && npx next build`. Expected: the build prerenders `/`.

- [ ] **Step 3: A Vite consumer without Tailwind**

In `<scratchpad>/vite-app`: `react`, `react-dom`, `vite@8.2.2`, `@vitejs/plugin-react`, the tarball; `src/main.tsx` imports `alpenglow/styles.css` and renders the same components. Run `npx vite build`.

Also run `npx tsc --noEmit` in both apps with `"moduleResolution": "bundler"`, and in the Vite app once more with `"module": "node16", "moduleResolution": "node16"` in a copy of its tsconfig, importing `{ Button, type ControlSize } from 'alpenglow'`. Expected: no errors from `alpenglow`.

- [ ] **Step 4: Check both in Chrome**

Serve each app's output statically through temporary `.claude/launch.json` entries (ports 3300 and 3400), then in light and dark (`data-theme`):
- Next: the button is the accent fill; `#tw` computes `border-radius: 0px` and `margin-top: 24px`; the checkbox is filled; `DropdownMenu` and `DatePicker` open; no console errors.
- Vite: the same components painted, the menu and date picker open.

Stop the servers, `git checkout -- .claude/launch.json`, and delete both apps and the tarball.

- [ ] **Step 5: The dry run**

Run: `npm publish --dry-run 2>&1 | tail -25`
Expected: `alpenglow@0.1.0`, the tarball contents limited to `dist/`, `LICENSE`, `README.md`, `package.json`, and `prepublishOnly` having run the gates. (Without a login npm may stop at authentication after listing contents; the file list is the point.)

- [ ] **Step 6: Record it in `MEMORY.md`**

1. Rename `### 2. Packaging — npm next` to `### 2. Packaging — built, not yet published`, and insert as its first paragraph:

```markdown
`alpenglow@0.1.0` is built and checked (2026-09-11): `npm run build:lib`
emits `dist/`, `npm run check:package` runs `publint --strict`, `attw
--profile esm-only` and `scripts/verify-package.ts`, CI runs both, and
`prepublishOnly` runs every gate before any publish. What is left needs
Fernando — see Needs the account owner. The spec is
`docs/superpowers/specs/2026-09-11-npm-package-design.md`.
```

2. In the same section, change the **Build** bullet's last sentence `Types still to generate.` to `Declarations come from \`tsc -p tsconfig.lib.json\`, finished by \`scripts/finish-lib.ts\`: tsc keeps the CSS import in \`index.d.ts\` and writes extensionless relative imports, and \`attw\` failed on both under \`node16\` and \`bundler\` until that script removed one and added \`.js\` to the other.`, and the dark-variant bullet's last clause `\`scripts/build-tailwind.ts\` does not emit it yet.` to `\`scripts/build-tailwind.ts\` emits it, and \`generated.test.ts\` holds it to \`tokens.css\`.`

3. Replace the body of `## Needs the account owner` with:

```markdown
**Publishing `alpenglow`.** Only Fernando can, and in this order:

1. `npm login`, then `npm publish` from the repository root. `prepublishOnly`
   runs the gates first. This creates the package, which npm requires before
   a trusted publisher can be configured.
2. On npmjs.com, the package's settings → Trusted publisher → GitHub Actions:
   repository `fernandorviana/alpenglow`, workflow `release.yml`. Leave it
   stage-only (the default for configurations created after 2026-09-03).
3. From then on: bump `version`, commit, push a matching `v*` tag. The Release
   workflow stages it; approve it with 2FA on npmjs.com to make it public. A
   tag for a version npm already has, such as `v0.1.0`, is skipped.

`eleonora` is not reserved: npm's policy discourages packages published only
to hold a name.
```

4. In `## Verification`, add below the `npm run build:docs` line:

```
npm run build:lib       # the package, in dist/
npm run check:package   # publint, attw, and what the build must never lose
```

and set the `npm test` comment to the numbers `npm test` reports now.

5. In `## Conventions`, append:

```markdown
- **No publish skips the gates.** `prepublishOnly` runs `check`, `build:lib`
  and `check:package`, so `npm publish` by hand and `npm stage publish` in the
  Release workflow go through the same checks as CI.
```

- [ ] **Step 7: Run everything once more**

Run: `npm run check && npm run build:lib && npm run check:package && npm run build:docs`
Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add MEMORY.md
git commit -m "Record the package as built and checked, and the three steps only the account owner can take to publish it

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

- [ ] **Step 9: Integrate**

```bash
git fetch origin
git rebase main
npm run check && npm run build:lib && npm run check:package
git switch main
git merge --ff-only feat/npm-package
git branch -d feat/npm-package
```

If the rebase conflicts on `MEMORY.md`'s test count, keep the number `npm test` reports after the rebase. Do not push; report to the user, with the three owner steps.
