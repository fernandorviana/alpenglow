# Fidelity, part 1 — what is broken — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every row marked **fix** in the audit's "Broken on the live site" table is gone from the production build at 320, 375, 768, 1024 and 1440, light and dark; every docs table gives way by column rank instead of scrolling sideways; the records stop saying false things about the drawing; and the audit becomes a command anyone can run.

**Architecture:** Three structural fixes carry most of the rows — the site's prose rules drop to zero specificity so a component always wins (Task 2), shared-module overrides become custom properties so chunk order cannot decide them (Task 3), and the docs' own tables become the package Table with ranks (Task 10). The rest are local CSS fixes, each pinned by a stylesheet or DOM test in the repo's existing style (`readCss`, `block`, Testing Library). A dependency-free headless-Chrome harness (Task 1) checks every route in the built `out/`.

**Tech Stack:** React 19, Next 16 App Router with `output: 'export'`, CSS Modules, Vitest + Testing Library + axe, Node 26 (global `WebSocket` and `fetch`), Google Chrome for the harness.

**Spec:** `docs/superpowers/specs/2026-09-24-fidelity-audit.md`

## Global Constraints

- The drawing is the default. No task in this plan changes a drawn value on taste; a fix restores what is drawn or removes a defect. Where a value must be read from Figma, read it (file key in the private notes, node ids in the spec) — never estimate from a render.
- Figma MCP calls are rate-limited per seat: batch reads into one `use_figma` returning many values.
- A global rule in `app/docs.css` never outranks a component's rule (Task 2's test enforces it).
- Every `--ap-` custom property read must exist in `tokens.css` (`src/components/custom-properties.test.ts`); no raw colour in a component module (`local-values.test.ts`); media queries only on the breakpoint scale in rem, range syntax (`src/styles/breakpoints.test.ts`).
- Surface against surface is measured in OKLCH lightness with the `SURFACE_STEP` floor .035 (MEMORY.md invariant 4); text and boundaries on the WCAG ratio.
- Nothing from the original product's name, anywhere. The Figma file key stays out of the repo.
- Work on branch `fidelity-part-1`. Commit per task on the branch, staged by path, never `git add -A`. Do not merge into `main` or push until Fernando asks.
- Before calling a task done: `npm run check`, then `npm run build:docs` and `npm run audit:responsive -- --only <routes the task touched>` on the built `out/`.

## Review Focus

1. **A component inside `.prose` that sets nothing itself.** Zero-specificity prose rules must still style plain prose (`p`, `h2`, `a` with no class) exactly as before: margins, the measure, the accent link. Pinned in Task 2 by rendering a DocPage fragment and reading computed styles in the built page with the harness, and by the stylesheet test.
2. **RTL and the Drawer.** `inset-inline-start/end` and `max-inline-size` fixes must hold under `dir="rtl"`. Pinned in Task 6 by a DOM test with `dir="rtl"`.
3. **Exactly at 768 and 1024 on `/screen/full`.** At 768 the navigation is the sheet and the column must fill the width; at 1024 the rail is 80 and collapsed items are centred circles. Pinned in Task 8 by the harness at 768, 1023, 1024 and 1279.
4. **A docs table whose every column but the first leaves at 320.** The primary column must carry what the reader came for (the token's name and its value together where the value is the point). Pinned in Task 10 by giving each migrated table explicit ranks and checking the 320 capture.
5. **Dark mode after a light-only fix.** Every colour change is measured in both modes. Pinned in Task 12 by extending `contrast.test.ts`.

---

## File structure

| File | Responsibility |
|---|---|
| `scripts/audit/cdp.mjs` (create) | Launch headless Chrome, open pages, send CDP commands. No dependencies. |
| `scripts/audit/serve.mjs` (create) | Serve `out/` on a free port for the harness. |
| `scripts/audit/responsive.mjs` (create) | Capture and probe every route at five widths and two themes; summary and exit code. |
| `scripts/audit/css-order.mjs` (create) | Compare element boxes between two base URLs (dev against the built `out/`). |
| `package.json` | `audit:responsive`, `audit:css-order` scripts. |
| `.gitignore` | `.audit/` |
| `app/docs.css` | Prose rules to zero specificity; measure for text only; the local fixes of Tasks 10–14. |
| `app/ui/ProseScope.test.tsx` (create) | No descendant rule of `.prose` carries specificity. |
| `src/components/control.module.css`, `choice.module.css`, `Slider/Slider.module.css`, `Switch/Switch.module.css` | Overrides by custom property. |
| `src/components/Textarea/*` | The box. |
| `src/components/Dialog/Dialog.module.css`, `Drawer/Drawer.module.css`, `floating.module.css`, `Calendar/Calendar.module.css`, `SideNav/*`, `Scheduler/*` | Local fixes. |
| `app/screen/screen.module.css`, `app/scheduler/page.tsx`, the 9 pages with `className="tokens"` | Page fixes and table migration. |
| `docs/superpowers/specs/*`, `MEMORY.md`, page copy, `CHANGELOG.md` | Records. |

---

### Task 1: The audit is a command

**Files:**
- Create: `scripts/audit/cdp.mjs`, `scripts/audit/serve.mjs`, `scripts/audit/responsive.mjs`, `scripts/audit/css-order.mjs`
- Modify: `package.json` (scripts), `.gitignore`

**Interfaces:**
- Produces: `npm run audit:responsive [-- --base <url>] [--only /a,/b] [--widths 320,375] [--shots]` — with no `--base`, serves `out/` itself. Writes `.audit/responsive/probe.json` and, with `--shots`, `.audit/responsive/shots/<route>__<width>[d]__NN.png`. Prints one line per route × view that scrolls sideways, overflows unclipped, or clips content; exits 1 if any route scrolls sideways.
- Produces: `npm run audit:css-order -- --a <url> --b <url> [--only ...]` — prints elements whose box differs by more than 2px between the two, exits 1 if any.

The reference implementation is the audit's own harness (copy it from `/private/tmp/claude-501/-Users-fernandoviana-DEV-alpenglow/fe9fa3d8-23ea-4b70-ad77-de966a9b54d1/scratchpad/audit/capture.mjs` and `cssorder.mjs`), split into the four files above, with three changes: routes come from `out/**/index.html` (not a hard-coded list), Chrome's path comes from `CHROME` or the macOS default, and the profile directory is a temp dir removed on exit.

- [ ] **Step 1:** Write `scripts/audit/serve.mjs` — `export async function serve(dir) → { url, close }`, `node:http`, `index.html` for directory paths, correct `Content-Type` for `.html .css .js .json .svg .png .woff2 .txt`, port 0 (the OS picks).
- [ ] **Step 2:** Write `scripts/audit/cdp.mjs` — `export async function launch() → { open(): Promise<Page>, close() }`; `Page` has `send(method, params)`, `waitFor(event, ms)`, `eval(expr)`. Copy the class from the reference harness.
- [ ] **Step 3:** Write `responsive.mjs` from the reference `capture.mjs`: the five widths (320×700, 375×812, 768×1024, 1024×768, 1440×900), dark at 375 and 1440, touch emulation below 768, reduced motion, the same in-page probe. Screenshots only with `--shots`.
- [ ] **Step 4:** Write `css-order.mjs` from the reference `cssorder.mjs`, parameterised by `--a`/`--b`.
- [ ] **Step 5:** Add the scripts and `.audit/` to `.gitignore`. Run `npm run build:docs && npm run audit:responsive`. Expected today: exit 1, with `/slider` at every width and `/table` at 320 listed. Record the output in the task report.
- [ ] **Step 6:** `npm run lint` passes on the new files. Commit: `git add scripts/audit package.json .gitignore && git commit -m "The audit is a command: every route of the built site at five widths and both themes, and the CSS chunk order against dev"`

### Task 2: A prose rule never outranks a component

**Files:**
- Modify: `app/docs.css` (the `.prose` rules at ~329–339, ~621–690, and every other selector that starts with `.prose `)
- Create: `app/ui/ProseScope.test.tsx`

Today `.prose > * { max-width: 37.5rem }`, `.prose a`, `.prose h3`, `.prose p` and friends outrank or tie component classes, and `docs.css` loads last in production. Measured damage: the Drawer is 480 wide at 320/375 with its left edge off-screen and its Expand stops at 600; the CommandPalette is 600 wide on a phone; every SideNav link on /navigation is accent; docs card titles sit 32px down; `/colour` ramp names sit with the ramp above; code blocks stop at 600 with 250px empty beside them.

- [ ] **Step 1: Write the failing test** — `app/ui/ProseScope.test.tsx`, modelled on `app/ui/FocusRing.test.tsx`: parse `app/docs.css` (comments stripped by `readCss`), collect every selector that contains `.prose` followed by a descendant or child combinator, and assert that once `:where(...)` groups are removed nothing but whitespace remains — i.e. the selector's specificity is (0,0,0). Second assertion: the measure rule is `:where(.prose) > :where(p, h1, h2, h3, h4, ul, ol, dl, blockquote, figure, .lead)` or equivalent — it names text, not `*`.

```tsx
import { describe, it, expect } from 'vitest';
import { readCss } from '@/test/css';

describe('the prose rules', () => {
  const css = readCss('app/docs.css');
  const selectors = [...css.matchAll(/([^{}@]+)\{[^{}]*\}/g)]
    .flatMap(([, s]) => s!.split(','))
    .map((s) => s.trim())
    .filter((s) => /\.prose[\s>~+]/.test(s) || /:where\([^)]*\.prose/.test(s));
  const weighed = (s: string) => s.replace(/:where\((?:[^()]|\([^()]*\))*\)/g, '').replace(/[\s>~+*]/g, '');

  it('finds them', () => expect(selectors.length).toBeGreaterThan(10));

  it('reach inside with zero specificity, so any component rule wins', () => {
    for (const s of selectors) expect([s, weighed(s)]).toEqual([s, '']);
  });

  it('give the measure to text only', () => {
    expect(css).not.toMatch(/\.prose\)?\s*>\s*\*\s*\{[^}]*max-width/);
  });
});
```

- [ ] **Step 2:** Run `npx vitest run app/ui/ProseScope.test.tsx` — expect FAIL on the second and third tests.
- [ ] **Step 3: Rewrite the rules.** Every `.prose X` becomes `:where(.prose) :where(X)` (or `:where(.prose X)`), every `.prose > X` becomes `:where(.prose) > :where(X)`. Replace `.prose > * { max-width: 37.5rem }` and its exception list with the measure on text elements only: `:where(.prose) > :where(p, h1, h2, h3, h4, ul, ol, dl, blockquote, .lead, .note) { max-width: 37.5rem; }` — read the page components in `app/ui/DocPage.tsx` and the pages for any other text-bearing direct child class that needs the measure, and list it. Code blocks, tables, specimens, dialogs and popovers get no measure. `.prose` itself (`grid-row`, `min-width`) stays as it is — it is not a descendant rule.
- [ ] **Step 4: The docs' own classes that relied on beating prose.** With prose at zero, `.cardTitle`, `.cardDescription`, `.rampName`, `.pagerNext` and other docs classes win on their own. Check each rule that was written as `.prose .x` to outrank prose (e.g. `.prose .pagerLink { margin-inline: -12px }` cancels `.pagerNext { margin-inline-start: auto }`): rewrite the pair so the pager's Next sits at the end — `.pagerLink { margin-inline: -12px }` and `.pagerNext { margin-inline-start: auto }` cannot both set the start margin; give the offset to the pager's padding instead, or set `margin-inline-end: -12px` only on `.pagerNext`.
- [ ] **Step 5:** Run the test — PASS. Run `npm run check`.
- [ ] **Step 6: Verify in the built site.** `npm run build:docs && npm run audit:responsive -- --only /drawer,/command-palette,/navigation,/,/colour,/install --shots`. Then open the drawer and the palette at 375 in the harness (extend the command with a click or use the reviewer's `capture-overlays.mjs` approach) and confirm: Drawer panel `left >= 0` and `right <= 375`; Expand fills 1440; palette `width <= 343` at 375; SideNav rest items `color` is `text/primary`; home card title margin-top 0; pager Next's right edge at the pager's right edge; `/install` code blocks as wide as the content column.
- [ ] **Step 7:** Commit: `git add app/docs.css app/ui/ProseScope.test.tsx && git commit -m "The site's prose rules reach inside with zero specificity, and the measure belongs to text: a component on a docs page is the component"`

### Task 3: A shared module's value is overridden by property, not by order

**Files:**
- Modify: `src/components/control.module.css:24-30`, `src/components/Slider/Slider.module.css:316-321`, `src/components/choice.module.css:182-188`, `src/components/Switch/Switch.module.css:86-90`
- Test: `src/components/Slider/Slider.test.tsx`, `src/components/Switch/Switch.test.tsx` (extend)

The production build puts `control.module.css` after `Slider.module.css`, so `.control { width: 100% }` beats `.field { width: 64px }` (same specificity): the Slider's field is 802px and its track 0px on the live site. `choice.module.css .description { margin-left: 20px + gap }` beats `Switch.module.css .description { margin-left: 40px + gap }` the same way. In `next dev` both are right.

- [ ] **Step 1: Write the failing tests.** In `Slider.test.tsx`: read both stylesheets with `readCss`; assert `block(sliderCss, '.field')` does not declare `width:` and does declare `--control-width:`; assert `block(controlCss, '.control {')` has `width: var(--control-width, 100%)`. In `Switch.test.tsx`: assert Switch's stylesheet sets `--choice-indent` on its root class and declares no `margin-left` on `.description`; assert `choice.module.css .description` has `margin-left: calc(var(--choice-indent, 20px) + var(--ap-spacing-100))`.
- [ ] **Step 2:** Run them — FAIL.
- [ ] **Step 3: Implement.** `control.module.css`: `.control { width: var(--control-width, 100%); }`. `Slider.module.css`: `.field { flex: none; --control-width: var(--slider-field-width); }`. `choice.module.css`: `.description { margin-left: calc(var(--choice-indent, 20px) + var(--ap-spacing-100)); }`. `Switch.module.css`: remove the `.description` override; set `--choice-indent: 40px;` on the Switch's root class. The custom properties are local (no `--ap-` prefix), so `custom-properties.test.ts` does not apply; check it passes.
- [ ] **Step 4:** Tests PASS; `npm run check`.
- [ ] **Step 5: Verify.** `npm run build:docs`, serve `out/`, run `npm run dev` in another shell (use `preview_start` for the dev server, never Bash), then `npm run audit:css-order -- --a <dev url> --b <out url>` over all routes: expect **zero** differences (the audit found only these two). `npm run audit:responsive -- --only /slider,/choice,/scheduler`: `/slider` no longer scrolls sideways at any width.
- [ ] **Step 6:** Commit: `git add src/components/control.module.css src/components/choice.module.css src/components/Slider src/components/Switch && git commit -m "The Slider's field and the Switch's description override the shared modules by property, so the production chunk order cannot undo them"`

### Task 4: The Textarea has its box

**Files:**
- Modify: `src/components/Textarea/Textarea.tsx:33-43`, `src/components/Textarea/Textarea.module.css`
- Test: `src/components/Textarea/Textarea.test.tsx`

`Textarea.tsx` puts both `control.control` and `control.field` on the element; `.field` (later in the file: `background: none; border: none; padding: 0`) wins, so the live Textarea has no fill, no border, no padding and no focus border, and `invalid` shows nothing. Since cd5ff68. Drawn (`633:10780`, focus `701:13060`): the control's fill, radius 12, 144 tall, text inset 16, the control's focus border.

- [ ] **Step 1: Write the failing test.** Render `<Textarea aria-label="Notes" />`; assert the element's class list does not include `control.field`'s class (import the module and compare); render `<Textarea invalid aria-label="Notes" />` and assert it carries `control.invalid`. Stylesheet: assert `Textarea.module.css .textarea` declares `padding` (block and inline 16 inline, from the drawing — read `633:10780` for the block padding), `min-height` (144), `outline: none`, `resize: vertical`, and `font: inherit`.
- [ ] **Step 2:** Run — FAIL.
- [ ] **Step 3:** Drop `control.field` from the class list. Move what the textarea needed from `.field` (`outline: none`, `font: inherit`, `color: inherit`, `letter-spacing: inherit`, the placeholder colour) into `Textarea.module.css .textarea`, plus the drawn padding and height. Keep `control.control` for the box and its state matrix.
- [ ] **Step 4:** Tests PASS; `npm run check`.
- [ ] **Step 5: Verify** in the built `/input` at 375 and 1440, light and dark, with focus (the harness: focus via `shift+Tab`/`Tab` so `:focus-visible` matches) and with `invalid`: fill, 1px focus border, 16px inset, red border when invalid.
- [ ] **Step 6:** Commit: `git add src/components/Textarea && git commit -m "The Textarea draws its box again: the bare field class had been stripping its fill, border, padding and focus since cd5ff68"`

### Task 5: The Dialog at xs and at 320

**Files:**
- Modify: `src/components/Dialog/Dialog.module.css:80-86, 108-121, 180-197`
- Test: `src/components/Dialog/Dialog.test.tsx`

Measured: the xs footer's stacked buttons are 270×22 at every width (drawn: full-width 40px pills, 8 apart, `608:10569`) because `.actions > * { flex: 1 1 0 }` applies in a column. At 320 the title column is 112px and titles break inside words ("Reschedul/e/appointm/ent").

- [ ] **Step 1: Write the failing tests** (stylesheet): `block(css, '.xs .actions > *')` exists and sets `flex: none`; the title rule sets `overflow-wrap: normal` (words never break) and `hyphens: manual`; a container query on the dialog narrows the header's `column-gap` below `xs` (480) — assert `@container` with `(width < 30rem)` and `column-gap: var(--ap-spacing-100)`.
- [ ] **Step 2:** Run — FAIL.
- [ ] **Step 3:** Implement: `.xs .actions > * { flex: none; }` (the Button's own height, 40, and full width from `.xs .actions { align-items: stretch }`). Title `overflow-wrap: normal`. Make the dialog a size container (`container-type: inline-size` on `.dialog` — check it does not break the existing sizes) and under 30rem set the header gap to `--ap-spacing-100`, which gives the title 144px at 320: "Reschedule" (≈100px at 18/Semibold) fits whole.
- [ ] **Step 4:** Tests PASS; `npm run check`.
- [ ] **Step 5: Verify** every dialog on `/dialog` and the confirm on `/drawer` open at 320, 375, 768 and 1440 (extend the harness with a click on each trigger): xs buttons 40 tall and full width; no title line breaks inside a word (compare each line's text against the title's words).
- [ ] **Step 6:** Commit: `git add src/components/Dialog && git commit -m "The xs Dialog's stacked buttons keep their height, and a title breaks between words at 320"`

### Task 6: The Drawer beside the content, and the Popover's edge, on a phone

**Files:**
- Modify: `src/components/Drawer/Drawer.module.css:115-125, 160-170`, `src/components/floating.module.css:30-45`, `src/components/Popover/Popover.module.css:20-30`
- Test: `src/components/Drawer/Drawer.test.tsx`, `src/components/Popover/Popover.test.tsx`

Measured: the inline Drawer shrinks to 160 at 320 and 215 at 375, under its own 320 minimum, and `overflow-wrap: anywhere` sets its title one letter per line. The Popover at 320/375 touches the screen edge (its comment promises 8 each side).

- [ ] **Step 1: Failing tests.** Drawer stylesheet: the inline panel's title uses `overflow-wrap: break-word` (not `anywhere`); `.flow` has `min-inline-size: min(var(--drawer-min, 320px), 100%)`. Drawer DOM test with `dir="rtl"`: the layered panel's inline-start/end classes are applied from the logical side. Popover stylesheet: the panel's `max-inline-size` is `calc(100vw - 2 * var(--ap-spacing-100))` and its placement has a `position-try` fallback that aligns to the viewport's inline end (`position-try-fallbacks` with a named `@position-try` that sets `right: anchor(right)` → `inset-inline-end: 8px`), or whatever the codebase's existing popover positioning uses — read `floating.module.css` first and extend its pattern.
- [ ] **Step 2:** Run — FAIL.
- [ ] **Step 3:** Implement as the tests say. For the inline Drawer below its minimum, the panel keeps 320 or the full width of its row, whichever is smaller, and the content beside it scrolls; it does not squeeze.
- [ ] **Step 4:** PASS; `npm run check`.
- [ ] **Step 5: Verify** `/drawer` inline at 320 and 375 (title on at most two lines, words whole) and every popover on `/popover` open at 320 and 375: `left >= 8` and `right <= vw - 8`.
- [ ] **Step 6:** Commit: `git add src/components/Drawer src/components/floating.module.css src/components/Popover && git commit -m "The inline Drawer keeps its least width on a phone, and a Popover keeps 8px from the screen's edges"`

### Task 7: The Calendar's month arrows

**Files:**
- Modify: `src/components/Calendar/Calendar.module.css:76-111`
- Test: `src/components/Calendar/Calendar.test.tsx`

`.page` never resets the button's default padding, so the 40px svg is squeezed to 20 wide inside the 32px circle and the chevron draws at 2.3×4.7px. Drawn (`246:11091`, `622:10681`): a 32 circle with a chevron about 6×11 at 1.5 stroke.

- [ ] **Step 1:** Read the drawn chevron's box and stroke from Figma (`use_figma`, one call: the vector's `width`, `height`, `strokeWeight`, and its frame's size). Write the failing stylesheet test: `.page` sets `padding: 0`, and `.page svg` sets the drawn icon box (e.g. `width: 20px; height: 20px` if the chevron sits in a 20 box — use the measured value).
- [ ] **Step 2:** FAIL. **Step 3:** implement. **Step 4:** PASS; `npm run check`.
- [ ] **Step 5: Verify** the open DatePicker on `/date-picker` at 375 and 1440: the chevron's rendered box matches the drawn size ±1px (measure the svg path's `getBBox()` × scale in the harness).
- [ ] **Step 6:** Commit: `git add src/components/Calendar && git commit -m "The Calendar's month arrows are the drawn size: the button's default padding was halving them"`

### Task 8: The screen's shell at every width

**Files:**
- Modify: `app/screen/screen.module.css:7-24`, `src/components/SideNav/SideNav.module.css:20-75`, `src/components/SideNav/SideNav.tsx` (the Tooltip wrapping of collapsed items), `app/navigation/page.tsx` (the Try it specimen)
- Test: `app/screen/screen.test.tsx` (or the existing screen test file), `src/components/SideNav/SideNav.test.tsx`

Measured on `/screen/full`: from 768 to 1023 the grid is `754px 146px` — with the navigation a closed sheet, the column falls into the `auto` track and the `1fr` track stays empty. From 1024 to 1279 the collapsed rail's items are 24×40 slivers at its start edge (drawn: 48 circles centred in the 80 rail, `157:9589`), because the Tooltip's `inline-flex` wrapper shrinks the item. At 375×812 the sheet's content is 840 tall and its last item is cut. On `/navigation`, the Try it specimen clips the TopBar at 320 and 375.

- [ ] **Step 1: Failing tests.** Stylesheet: `.column` in `screen.module.css` has `grid-column: -2 / -1`. SideNav: a collapsed item's wrapper stretches (`.collapsed` sets the Tooltip wrapper's display through a class the SideNav passes, e.g. `className={styles.tipWrap}` with `display: flex; justify-content: center; inline-size: 100%`) and the collapsed `.item` is `inline-size: 48px; block-size: 48px; border-radius: var(--ap-radius-full)` — read `157:9589` for the drawn size and padding first. Sheet: `.sheet` content scrolls inside it (`overflow-y: auto` on the list) and `.sidenav` inside the sheet has no `min-block-size: 100%`.
- [ ] **Step 2:** FAIL. **Step 3:** implement. The Try it specimen on `/navigation` puts the TopBar in a region that scrolls sideways with a visible cue, or renders the narrow variant under 48rem — the latter if the TopBar already has one; read `TopBar.tsx`.
- [ ] **Step 4:** PASS; `npm run check`.
- [ ] **Step 5: Verify** with the harness `/screen/full/` at 768, 900, 1023, 1024, 1279 (column fills the viewport; collapsed items centred circles) and the sheet opened at 375×812 (last item fully visible, `getBoundingClientRect().bottom <= 812`).
- [ ] **Step 6:** Commit: `git add app/screen app/navigation src/components/SideNav && git commit -m "The screen's column fills the width when the navigation is a sheet, the collapsed rail draws its circles, and the sheet shows its last item"`

### Task 9: The Scheduler's heads, its all-day chip, and its page

**Files:**
- Modify: `src/components/Scheduler/Scheduler.module.css:71-76, 150-168, ~193-195, ~344`, `app/scheduler/page.tsx` (Try it layout, the View select's value)
- Test: `src/components/Scheduler/Scheduler.test.tsx`

Measured: in the by-person view the head tracks are 165px and the body tracks 144 (1440) / 128 (≤768), so heads drift off their columns — Léa Martin's cards sit under "Anthony Jackson". `.head` and `.body` are two grids each sized by `min-inline-size: max-content`, and the head's nowrap names widen its tracks. The all-day chip is 20px with a 10px title box for a 16px line (drawn row 28, `4914:35448`). On `/scheduler` the week gets 496px of 976 at 1440 and today sits at the scroll edge; below 768 the View select says Week while a day is shown.

- [ ] **Step 1: Failing tests.** Stylesheet: `.head, .body` set `min-inline-size: calc(var(--scheduler-hours-width) + var(--scheduler-columns) * var(--scheduler-column))` and not `max-content`. The all-day chip's block size fits its line: read the drawn chip in `4914:35448` and assert its height and padding. DOM: render the by-person view with five resources in a 900px container (jsdom cannot lay out — assert instead that head and body share the same `grid-template-columns` string and the same `min-inline-size`).
- [ ] **Step 2:** FAIL. **Step 3:** implement. On `/scheduler`, below the width where the week and the 280 side column fit side by side, the side column moves under the grid; the grid scrolls today into view on mount; the View select reads the view actually shown.
- [ ] **Step 4:** PASS; `npm run check`.
- [ ] **Step 5: Verify** with the harness: `/scheduler` at 320, 375, 768, 1024, 1440 — for each by-person head, `|head.left - column.left| <= 1`; the all-day chip's `scrollHeight <= clientHeight`; at 1440 the week's region is at least 780 wide.
- [ ] **Step 6:** Commit: `git add src/components/Scheduler app/scheduler && git commit -m "The Scheduler's heads stand over their columns, the all-day chip shows its words, and the page gives the week its room"`

### Task 10: Every docs table gives way by rank

**Files:**
- Modify: the 16 `<table className="tokens">` in `app/accessibility/page.tsx` (2), `app/badge/page.tsx` (1), `app/colour/page.tsx` (2), `app/dark-mode/page.tsx` (1), `app/data-vis/page.tsx` (1), `app/dropdown-menu/page.tsx` (1), `app/elevation/page.tsx` (5), `app/icons/page.tsx` (2), `app/install/page.tsx` (1); `app/docs.css` (`.tokens`, `.tableScroll`)
- Test: each page's existing test if it has one (`app/colour/page.test.tsx`, …), `app/pages.test.tsx`

Fernando's instruction: tables hide columns the way Asana's list does — the package Table's behaviour since 5c3c521. The docs' own `.tokens` tables still scroll sideways inside `.tableScroll`, with no cue, and on phones they show a name and half a hex (`/elevation`, `/dark-mode`, `/data-vis`, `/accessibility`).

- [ ] **Step 1:** Read `src/components/Table/Table.tsx` and `columns.ts` for the column API (`rank`, `minWidth`, `width`, `primary`) and one page that already uses the package Table in a docs specimen for the idiom.
- [ ] **Step 2: Failing test.** In `app/pages.test.tsx` (or a new `app/ui/DocTables.test.tsx`): render each of the 9 pages and assert there is no `table.tokens` and no `.tableScroll` left; `app/docs.css` has no `.tableScroll` rule.
- [ ] **Step 3: Migrate** each table to `<Table>` with explicit ranks: the column the reader came for is primary and never leaves; the value that makes the row worth reading ranks next; descriptions and secondary figures leave first. Swatches and `Ratio` cells keep their renderers. A token name in a cell keeps `white-space: nowrap` only when it is short; the 110-character use line on `/colour` (`interactive/wash-hover`) wraps. Remove `.tableScroll` and the `.tokens` table rules that the Table now owns.
- [ ] **Step 4:** PASS; `npm run check`.
- [ ] **Step 5: Verify** `npm run audit:responsive -- --only /accessibility,/badge,/colour,/dark-mode,/data-vis,/dropdown-menu,/elevation,/icons,/install --shots`: no `scrollers` entries from these tables at any width, and at 320 every table shows its primary column plus at least one value column (look at the 320 shots).
- [ ] **Step 6:** Commit: `git add app && git commit -m "Every docs table is the package Table with ranks: at a narrow width its columns leave, least important first, instead of scrolling sideways"`

### Task 11: The Foundations pages

**Files:**
- Modify: `app/docs.css` (~976–985 `.cardVisual`, ~1760–1767 `.chartRamp`, `.rampName`), `app/foundations/page.tsx:63-68`, `app/icons/page.tsx:57-63`
- Test: `app/foundations` test (create if absent, beside the page), `app/icons` test

Measured: the Foundations "Data visualisation" card's picture is a blank well at every width and in both modes (`.chartRamp` is a grid of empty spans inside `place-items: center`, so it shrinks to 0). On `/icons` at 1440 long labels squash their icons (`UserVerifiedOutline` at ~8px): the svg in the flex row has no `flex-shrink: 0`.

- [ ] **Step 1: Failing tests** (stylesheet): `.chartRamp` sets an explicit `inline-size` (e.g. `inline-size: 100%` with `max-inline-size` from the card) and `.cardVisual > .chartRamp` stretches; the icon cell's svg has `flex-shrink: 0`.
- [ ] **Step 2–4:** FAIL, implement, PASS, `npm run check`.
- [ ] **Step 5: Verify** the Foundations card in both modes at 375 and 1440 (the ramp's spans have non-zero width) and `/icons` at 1440 (every svg renders at its declared size).
- [ ] **Step 6:** Commit: `git add app/docs.css app/foundations app/icons && git commit -m "The Foundations data-visualisation card shows its ramp, and a long icon name no longer shrinks its icon"`

### Task 12: Parts that vanish in dark

**Files:**
- Modify: `app/docs.css` (the theme toggle's track ~461–500, inline `code` ~676), `src/components/segmented.module.css` (the thumb in dark)
- Test: `src/tokens/contrast.test.ts` (or the file that holds surface pairs), `app/ui/ThemeToggle.test.tsx`

Measured: in dark the theme toggle's track is the rail's colour (`rgb(18,20,44)`), so the pill disappears; the SegmentedControl's thumb (`surface/overlay`) is nearly invisible on its navy track; inline `code` loses its pill because `surface/sunken` is the canvas (invariant 4).

- [ ] **Step 1:** Read the toggle's drawing (`160:10078`, the vertical Light-Dark switch) for its dark track if drawn. For each of the three pairs pick the existing token that clears `SURFACE_STEP` (.035 OKLCH L) against its ground in dark and keeps light unchanged. Write the failing tests: the three pairs added to the surface-step assertions in `contrast.test.ts` in both modes; `ThemeToggle.test.tsx` still passes its two-halves check (invariant 9 — the dark rules are written twice).
- [ ] **Step 2–4:** FAIL, implement (dark rules only, written twice where the file already does that), PASS, `npm run check`.
- [ ] **Step 5: Verify** 1440d captures of `/`, `/segmented-control` and `/install`.
- [ ] **Step 6:** Commit: `git add app/docs.css src/components/segmented.module.css src/tokens app/ui/ThemeToggle.test.tsx && git commit -m "In dark the theme toggle's track, the segmented thumb and inline code each clear the surface step against their ground"`

### Task 13: A code block's copy button never covers code

**Files:**
- Modify: `app/ui/CodeBlock.tsx`, `app/docs.css:700-720` (`.codeBlock`, `.codeHeader`)
- Test: `app/ui/CodeBlock.test.tsx`

Measured: on `/tailwind` blocks 3 and 4 at every width, and `/install` blocks 2, 4 and 7 at 375, code runs under the 32px copy button: `padding-right` reserves room only at the end of the scroll, not beside the button on the first line.

- [ ] **Step 1: Failing test.** Every CodeBlock renders its header bar (file name or language, and the copy button) so the button never floats over code; assert `.codeHeader` is present when neither a file name nor a language is given, and the `:not(:has(.codeHeader)) pre` rule is gone.
- [ ] **Step 2–4:** FAIL, implement, PASS, `npm run check`.
- [ ] **Step 5: Verify** `/tailwind` and `/install` at 375 and 1440: the copy button's box intersects no code line's box.
- [ ] **Step 6:** Commit: `git add app/ui/CodeBlock.tsx app/ui/CodeBlock.test.tsx app/docs.css && git commit -m "Every code block has its bar, so the copy button sits on it and never over the code"`

### Task 14: What still breaks at a narrow width

**Files:**
- Modify: `app/ui/Layers.tsx` (the `/why` figure), `app/docs.css:938` (`.cards` grid), `src/components/Filters/Filters.module.css:15-39`, `src/components/Table/Table.module.css:479-514` (bulk bar), `app/button/page.tsx` (dialog-footer example), `src/components/Slider/Slider.module.css:130-144` (disabled), `app/table/page.tsx:167-171` + `app/docs.css:1310-1321` (the row action)
- Test: the matching test files

Measured: `/why`'s Layers figure is a fixed 640×360 viewBox scaled to 0.45 at 320 (labels 5–7px); three-card grids leave an orphan at 768 (`auto-fill minmax(232px,1fr)`); the Filters bar takes three rows at 375 and four at 320 with "Clear" alone; the Table's bulk bar wraps to four lines at 375 over 2.5 rows; `/button`'s dialog-footer example leaves "Confirm booking" alone at 375; the disabled Slider's fill is paler than its empty part (it reads reversed); the Table demo's "⋯" is a button that does nothing, while the page says a row's actions belong in a menu.

- [ ] **Step 1: Failing tests**, one per item: Layers renders a stacked (HTML, not SVG) variant under 30rem container width — assert both variants exist and the SVG is hidden by a container query; `.cards` uses `repeat(auto-fit, minmax(min(100%, 232px), 1fr))` with a 3-up rule from `md` that never leaves one orphan (assert the rule); Filters chips `flex: 0 1 auto` and "Clear" stays on the chips' last row; the bulk bar never wraps (`flex-wrap: nowrap`, its actions gathered into an overflow menu the same way the row actions are — reuse the Table's gathering from b31c046); the button example stacks the three actions full-width under `xs`; the disabled Slider's empty line is paler than its fill in both modes; the demo row action is the Table's `rowActions` (a real menu).
- [ ] **Step 2–4:** FAIL, implement, PASS, `npm run check`.
- [ ] **Step 5: Verify** each at 320, 375, 768 with the harness shots.
- [ ] **Step 6:** Commit per item or one commit: `git add <the files> && git commit -m "What still broke at a narrow width: the Layers figure, three-card grids, the Filters and bulk bars, the footer example, the disabled Slider, the demo's row action"`

### Task 15: The records say what is true

**Files:**
- Modify: `docs/superpowers/specs/2026-09-20-toast-design.md`, `2026-09-22-navigation-design.md`, `2026-09-09-table-design.md`, `2026-09-23-scheduler-design.md`, `2026-09-21-select-design.md`, `2026-09-22-slider-design.md`, `2026-09-20-pagination-design.md`, `2026-09-22-file-upload-design.md`; `MEMORY.md`; `app/avatar/page.tsx` (Loader copy), `app/navigation/page.tsx:322,325`, `app/screen/page.tsx:131`, `app/screen/screen.module.css:4-5`, `app/scheduler/page.tsx:237,503-504,543-544,583-585,602-603`, `app/input/page.tsx:96`, `app/foundations/page.tsx`, `app/ui/contents.ts:64`; `CHANGELOG.md`

- [ ] **Step 1:** For every false claim in the audit spec ("Why the rest drifted", point 2, and "Records to correct"), replace the claim with the fact and the node id, dated 2026-09-24, and add "(corrected 2026-09-24, fidelity audit)". Do not change any decision — where Fernando ruled on a false premise (the Toast), say so and mark it as reopened, pending Fernando's ruling.
- [ ] **Step 2:** `MEMORY.md`: add the audit to "Open work" at the top, with the rule from the spec; change the definition of done wherever MEMORY.md states one (production build, five widths, both themes, `npm run audit:responsive`); record the settled input-border fact (the drawing has no border at rest).
- [ ] **Step 3:** Counts: make every page state the same number for primitives, spacing steps and components, derived from the source where a page already derives one (search `app/` for the literal numbers).
- [ ] **Step 4:** `CHANGELOG.md` Unreleased: the fixes of Tasks 2–14 in the file's voice.
- [ ] **Step 5:** `npm run check` (vocabulary and search-index tests read page copy). Commit: `git add docs MEMORY.md app CHANGELOG.md && git commit -m "The records say what the drawing shows: false claims about it corrected, the audit and its rule in MEMORY.md"`

### Task 16: The whole site, built

- [ ] **Step 1:** `npm run check && npm run build:docs`.
- [ ] **Step 2:** `npm run audit:responsive -- --shots` over all routes: exit 0 (no route scrolls sideways anywhere). Review the `overflow` and `clipped` lists; anything left that is not intentional gets a task-sized fix and a test, or is reported.
- [ ] **Step 3:** `npm run audit:css-order` between the dev server and `out/`: zero differences.
- [ ] **Step 4:** Light and dark screenshots at 375 and 1440 of every route touched, compared against the audit's captures; report before/after pairs.
