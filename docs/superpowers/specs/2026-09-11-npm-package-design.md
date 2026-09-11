# npm package — design

The library becomes installable: `npm install alpenglow`, one stylesheet, types,
and a release path that ends with a maintainer's approval. The docs site gains a
Developers section that says how to use it.

## Why now

The component vocabulary settled with sizes and tone, and two throwaway spikes
measured how the CSS reaches a consumer (`MEMORY.md` → Open work → Packaging).
What those spikes established is a constraint here, not a question:

- The build is Vite library mode with `preserveModules`, which keeps each
  module's `'use client'`.
- Every CSS Module compiles into **one** `styles.css` that the consumer
  imports. Tokens shipped as a side-effect import inside the barrel were
  dropped silently under `sideEffects: ["*.css"]`.
- The source stays **unlayered**. A Tailwind consumer chooses the layer:
  `@import "alpenglow/styles.css" layer(components);` — verified in Vite and in
  Next, production builds.
- A prewrapped `styles.layer.css` for JavaScript imports is **not** shipped: its
  layer order depended on import order and on how the bundler merged chunks.
- Tailwind's `dark:` follows the tokens' rule through a `@custom-variant dark`
  — verified in all four combinations of attribute and system preference.

## Decisions taken with Fernando, 2026-09-11

- **Publishing:** the first version by hand, then GitHub Actions with npm
  trusted publishing, staged: a tag stages the version, Fernando approves it
  with 2FA before it goes public.
- **Documentation:** a Developers group on the site with three pages —
  Install, Tailwind, Dark mode — and a README that points to them.
- **No shadcn registry.** The package already serves shadcn projects (import
  with `layer(components)`, next-themes with `attribute={['class',
  'data-theme']}`). A registry would copy components whose value is the tests
  guarding them, and its CSS Modules could not be layered, so every Tailwind
  override would need `!`. It stays "only on request".

## Scope

**In.** The manifest, the library build and type emission, a `LICENSE`, the
Tailwind generator's dark variant, a package check in CI, the release
workflow, three docs pages and a code-block style, the README.

**Out, deliberately.**

- **A CommonJS build.** Every supported consumer bundles ESM, and Node 20+
  can `require()` ESM.
- **Per-component entry points.** One JavaScript entry plus three
  stylesheets; `sideEffects` lets bundlers drop what is not imported.
- **A shadcn registry, or a shadcn theme item.** See above.
- **Changelog tooling.** `0.x`, few releases; the tag message and the GitHub
  release carry the notes.
- **Reserving `eleonora` on npm.** npm's policy discourages packages published
  only to hold a name.

---

## 1. The package

Published from the repository root. The root `package.json` is also the docs
site's; that is harmless, because `files` limits the tarball and a consumer
never installs development dependencies.

```jsonc
{
  "name": "alpenglow",
  "version": "0.1.0",
  "description": "A design system for dense, data-heavy interfaces. Light and dark, measured for contrast.",
  "license": "MIT",
  "author": "Fernando R Viana",
  "homepage": "https://alpenglow-rose.vercel.app",
  "repository": { "type": "git", "url": "git+https://github.com/fernandorviana/alpenglow.git" },
  "bugs": "https://github.com/fernandorviana/alpenglow/issues",
  "keywords": ["design-system", "react", "components", "css-modules", "tokens", "accessibility", "dark-mode"],
  "type": "module",
  "sideEffects": ["*.css"],
  "files": ["dist"],
  "exports": {
    ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
    "./styles.css": "./dist/styles.css",
    "./tokens.css": "./dist/tokens.css",
    "./tailwind-theme.css": "./dist/tailwind-theme.css",
    "./package.json": "./package.json"
  },
  "peerDependencies": { "react": "^19.0.0", "react-dom": "^19.0.0" }
}
```

- `styles.css` — tokens and every component. What almost everyone imports.
- `tokens.css` — the custom properties alone, for a consumer who wants the
  palette without the components.
- `tailwind-theme.css` — the Tailwind v4 `@theme` over those properties, plus
  the dark variant (§3).
- `README.md` and `LICENSE` are included by npm without being listed.

A `LICENSE` file is added at the root (MIT, 2026, Fernando R Viana). The README
has said MIT without one.

## 2. The build

`npm run build:lib`:

1. `npm run build:css` — regenerates `src/styles/tokens.css` and
   `tailwind-theme.css`, as today.
2. `vite build --config vite.lib.config.ts` — library mode, ES format, entry
   `src/index.ts`, `preserveModules` with `src` as the root, `react`,
   `react-dom` and their subpaths external, `cssCodeSplit: false`, the one CSS
   asset named `styles.css`. Output in `dist/`.
3. `tsc -p tsconfig.lib.json` — declarations only, `rootDir: src`,
   `outDir: dist`, excluding `*.test.*` and `src/test/`, so each `.d.ts` sits
   beside the `.js` it describes.
4. Copies `src/styles/tokens.css` and `src/styles/tailwind-theme.css` into
   `dist/`.
5. `tsx scripts/finish-lib.ts` — found during planning: `tsc` keeps
   `import './styles/tokens.css'` in `index.d.ts`, where it resolves to no
   types, and writes extensionless relative imports, which fail under
   `moduleResolution: node16`. The script removes CSS imports from the
   declarations and adds `.js` or `/index.js` to relative specifiers, and
   performs the copies of item 4. `attw` fails if either rewrite is lost.

`src/index.ts` keeps `import './styles/tokens.css'`. In the library build that
import is what puts the tokens at the top of `styles.css`; the emitted
JavaScript no longer carries it, which is the point — the consumer's own
import is the one that loads the CSS. A comment there says so, so it is not
"cleaned up".

`prepublishOnly` runs `npm run check && npm run build:lib && npm run
check:package`, so no publish — by hand or from CI — can skip a gate.

`dist/` is already gitignored.

## 3. The Tailwind theme's dark variant

`scripts/build-tailwind.ts` appends:

```css
@custom-variant dark {
  &:where([data-theme='dark'], [data-theme='dark'] *) {
    @slot;
  }
  @media (prefers-color-scheme: dark) {
    &:where(:root:not([data-theme='light']), :root:not([data-theme='light']) *) {
      @slot;
    }
  }
}
```

It is the same rule the tokens follow: an explicit `data-theme` wins, otherwise
the system preference. The generated header's usage block changes to the
package paths and shows the `layer()` import:

```css
@import "tailwindcss";
@import "alpenglow/styles.css" layer(components);
@import "alpenglow/tailwind-theme.css";
```

`src/styles/generated.test.ts` gains a test that the variant is present with
both halves, and that its selectors are the ones `tokens.css` uses for dark.
**The break it catches:** the two rules drifting, so `dark:` utilities and the
components disagree about which theme is on.

## 4. The package check

`npm run check:package`, run in CI after the docs build, and by
`prepublishOnly`:

- **`publint`** — manifest errors: an export pointing at a missing file, a
  wrong `types` condition order.
- **`attw --pack . --profile esm-only --exclude-entrypoints ./styles.css
  ./tokens.css ./tailwind-theme.css`** (`@arethetypeswrong/cli`) — whether
  TypeScript resolves the types a consumer would get. CSS subpaths are
  excluded: they are not JavaScript, and attw reports them as unresolvable.
- **`scripts/verify-package.ts`**, which reads `dist/` and the output of
  `npm pack --dry-run --json`, and fails when:
  1. a module whose source opens with `'use client'` has lost it in `dist/`;
  2. a class name that a compiled CSS-module map in `dist/` hands out is not
     defined in `dist/styles.css`;
  3. `dist/styles.css` contains `@layer` — the source is unlayered by ruling;
  4. `dist/tailwind-theme.css` has no `@custom-variant dark`;
  5. the tarball holds anything but `dist/**`, `package.json`, `README.md` and
     `LICENSE`;
  6. `dist/styles.css` lacks the tokens — the `src/index.ts` import that puts
     them there looks removable.

  Found during implementation: a CSS-module map also hands out `@keyframes`
  names, so check 2 accepts a name defined as a class or as keyframes; and
  check 4 matches `@custom-variant dark {`, because a bare substring passed
  `@custom-variant darkish` when that mutation was tried.

Each check is proven by breaking the thing it guards once, during
implementation.

`publint` and `@arethetypeswrong/cli` become dev dependencies, pinned.

## 5. Release

**First version, by hand (Fernando):**

```bash
npm login
npm publish
```

`prepublishOnly` builds and checks first. This creates the package, which npm
requires before a trusted publisher can be configured.

**Then, once, on npmjs.com:** package settings → Trusted publisher → GitHub
Actions, repository `fernandorviana/alpenglow`, workflow `release.yml`.
Configurations created after 2026-09-03 allow `npm stage publish` by default;
direct `npm publish` stays off.

**`.github/workflows/release.yml`:**

- on `push` of tags matching `v*`;
- `permissions: { id-token: write, contents: read }`, no npm token in secrets;
- Node 24 (bundled npm ≥ 11.5.1, the trusted-publishing floor);
- npm pinned to 11.19.0, the version `npm stage` was checked against;
- `npm ci`;
- a step that fails unless the tag equals `v` + `package.json`'s `version`;
- a step that ends the job quietly when npm already has that version — the
  first one is published by hand, so its tag has nothing to stage;
- `npm stage publish .` — `prepublishOnly` runs the gates; provenance is
  attached automatically.

The staged version appears on npmjs.com and goes public only when Fernando
approves it with 2FA.

## 6. Documentation

### 6.1 Navigation

A **Developers** group after Start here, in `app/ui/Nav.tsx`:

| Page | Route | For |
|---|---|---|
| Install | `/install` | anyone using the package |
| Tailwind | `/tailwind` | a Tailwind v4 project |
| Dark mode | `/dark-mode` | anyone switching themes |

### 6.2 Install

- `npm install alpenglow`; React 19 as a peer.
- Import `alpenglow/styles.css` once, at the root of the app.
- Using components; the drawn icons export beside them; Carbon installed
  separately for everything else.
- **Server Components:** every component that needs the client is marked, so a
  server page can render them. What a server page cannot do is pass a
  function — `DropdownMenu`'s `trigger`, any `onSelect` or `onChange`, a
  `Table` column's `cell` — so those call sites live in a client component of
  the app's own.
- The tokens in TypeScript (`theme`, `contrast`, `tokenContrast`) for
  consumers who compute with them.

### 6.3 Tailwind

- The three imports, and why `layer(components)`: the components' stylesheet
  is unlayered on purpose; importing it into `components` puts it below
  utilities, so `className="rounded-none"` wins, and above preflight, so the
  reset does not strip it.
- The trade, said plainly: inside that layer, any rule of the app's own that is
  *not* in a layer — a global `button { background: none }` — now beats the
  components too. Resets belong in `@layer base`, where Tailwind's are.
- Without `layer()`: everything works; an override needs `!`
  (`rounded-none!`).
- Token utilities (`bg-surface-raised`, `text-text-secondary`) and `dark:`,
  which follows `data-theme` and the system preference.

### 6.4 Dark mode

- `data-theme="light" | "dark"` on `<html>`; no attribute follows the system.
- The no-flash script: set the stored choice before first paint. The page
  shows the pattern the site itself uses, including why it is a client-rendered
  `<script>` and not `next/script`.
- With next-themes: `attribute="data-theme"`, or
  `attribute={['class', 'data-theme']}` beside shadcn, which reads `.dark`.
- `color-scheme` follows the chosen theme, so native controls and scrollbars
  match.

### 6.5 Code blocks

The site has never shown code. `.prose pre` gets a style from the tokens —
`surface/sunken` ground, `font-mono`, the scale's padding and radius,
horizontal scroll inside the block — so the page body never scrolls sideways
on a phone.

### 6.6 README

Install, the stylesheet import, the Tailwind import with `layer()`, and links
to the three pages. The rest of the README stays.

## 7. `MEMORY.md`

- Open work → Packaging: done, with what shipped and the release steps that
  need Fernando.
- Needs the account owner: `npm login` and the first `npm publish`, then the
  trusted publisher; `eleonora` is dropped, with the policy reason.
- Verification: `npm run build:lib` and `npm run check:package`; the test count.
- A convention: a publish never skips the gates — `prepublishOnly` runs them.

## 8. Verification

- `npm run check`, `npm run build:lib`, `npm run check:package` green.
- Each `verify-package.ts` check watched failing once against a deliberately
  broken `dist/`.
- The packed tarball installed into two throwaway apps, deleted afterwards:
  Next 16 with Tailwind v4 importing with `layer(components)`, rendering from a
  Server Component page; and Vite without Tailwind. Checked in Chrome, light and
  dark: components painted, a Tailwind override winning in Next, a menu and a
  date picker opening.
- The three docs pages checked in a browser, light and dark, and at 375px for
  the code blocks.
- `npm publish --dry-run` shows the expected file list and `0.1.0`.
