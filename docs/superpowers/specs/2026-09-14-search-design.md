# Documentation search — design

**Date:** 2026-09-14
**Status:** implemented the same day; the rail placement and the body length rule were added during the browser check

## What changes

The documentation site gains a search: a palette in the system's own Dialog,
opened from an item at the head of the rail, from ⌘K / Ctrl+K anywhere, and
from the first row of the open menu on a narrow screen. As the reader types, it lists
pages, sections, tokens and props that match, grouped by section, with the
typed prefix in bold — the shape of the Material 3 site's search, without its
inline completion. The index is generated at build time from the rendered
pages, so nothing has to be kept in step by hand.

## What is indexed

`scripts/build-search-index.ts` loads `app/ui/search/extract.tsx` through Vite
in SSR mode (Vite is already a dependency; it resolves the `@` and `@ui`
aliases and the CSS modules that `tsx` cannot) and renders every page in
`PAGES` with `renderToStaticMarkup`. `next/navigation` is aliased to a stub
whose `usePathname` returns the page's own route, as `pages.test.tsx` mocks
it. The markup is parsed with jsdom and walked into entries of four kinds:

| Kind | Source | Title | Body | Destination |
|---|---|---|---|---|
| `page` | everything in the article before its first `h2`, the `h1` excluded | the nav label from `contents.ts` | the lead and any intro paragraphs | `/button` |
| `section` | each `h2` that is a child of the article, with the id `DocPage` gave it | the heading text | the text up to the next `h2`, `h3`s included, text nodes joined by a space (`textContent` glued "DevelopersThe"), whitespace collapsed, the pager's `nav` skipped | `/button#states` |
| `token` | `src/tokens/theme.ts`, read directly, not from the page | the token name, `surface/raised` | the token's `use` note | `/colour#surface-raised` |
| `prop` | the rows of the first table after the `h2` "Props", first cell the name, second the type | the prop name | the type and the default | `/button#props` |

Every entry carries the section it belongs to (the `NavGroup` title, from
`sectionOf`) and the page's label, so a row can read "Components › Button ›
States". A page's own `Props` heading yields a section entry as well as the
prop entries; that is intended, "props" typed alone should land on the
heading.

The Colour page's token rows gain `id={slugOf(token)}` — `surface/raised` →
`surface-raised`, the same slug the headings use — so a token entry lands on
its row rather than on the group heading above it. That is the only page
edit.

The output is `app/ui/search/search-index.json`, git-ignored, ~130 KB of
text before compression (measured on 2026-09-14: 130 862 characters of page
text, 226 headings). It is written by `npm run build:search`, which
`build:docs` runs before `next build` and `predev` runs before `next dev`.
It is not committed: prose changes in nearly every commit under `app/`, and
a CI diff guard like the stylesheets' would fail on most of them for no
gain — the build regenerates it every time.

The palette loads it with a dynamic `import()` from `app/ui/search/load.ts`,
so the bundler splits it into its own chunk, fetched on the first open and
kept in module scope, and the site's `basePath` never enters the picture. An
ambient declaration, `app/ui/search/search-index.d.ts`, types the module for
`tsc` on a clone that has not built yet, and `vitest.config.ts` aliases the
import to the committed empty stand-in `search-index.empty.json` — Vite
refuses a dynamic import of a missing file at transform time, and every
suite that mounts the Nav goes through the loader (found by the review with
the file moved away; `load.test.ts` holds the alias). `npm run check` never
needs the file: the tests exercise the extractor and mock the loader.

The shape, exported from `app/ui/search/index.ts`:

```ts
type Kind = 'page' | 'section' | 'token' | 'prop';
type Entry = {
  kind: Kind;
  /** Where Enter goes: a route, with a hash for everything but a page. */
  href: string;
  /** What the row shows in its first line. */
  title: string;
  /** The section's title and the page's label, for the breadcrumb. */
  section: string;
  page: string;
  /** The lead, the section's text, the use note, or the type — searched at the lowest weight, excerpted for section hits. */
  body: string;
  /** Position in reading order, the tie-break. */
  order: number;
};
type Index = { entries: Entry[] };
```

## Matching

`search(index, query): Hit[]` in `app/ui/search/index.ts` is a pure function
with no DOM, so every rule below is a unit test.

- **Terms.** The query is NFKD-normalised, stripped of combining marks,
  lower-cased and split on whitespace. `/`, `-` and `.` stay inside a term,
  so `surface/raised` and `dark-mode` are one term each; the index's words
  are produced the same way, and additionally split on those characters, so
  `raised` alone also finds the token.
- **Every term must match** (AND), each somewhere in the entry — title,
  body, section or page label — by **prefix of a word**: `butt` finds
  `button`, `elev` finds `elevation`.
- **One typo.** A term of four or more characters that prefixes no word in
  the entry is retried at Damerau–Levenshtein distance 1 against the
  entry's words (`buton`, `dialgo`, `swtich`). Shorter terms are exact
  prefixes only; at three characters an edit matches too much.
- **Score.** For each term, the best field it matches in, weighted: title
  of a `page` 10; title of a `token` or `prop` 9; title of a `section` 6;
  section or page label 4; body 1. Multiplied by the match quality: a whole
  word 1, a prefix 0.7, a typo 0.4. The entry's score is the sum over
  terms. Position in the body does not matter; how much of the body the
  term is does: a body hit is multiplied by `(1 + 0.25 × min(mentions − 1,
  3)) / (1 + length / 2000)`, so four mentions in a short section beat one
  in a long one, and "Install the package" (207 characters) outranks the
  home's card that quotes the same install line (334). The factor is at
  most 1.75, under a label prefix's 2.8, so the body never outranks a
  label. Added on 2026-09-14 after the first browser check, where "npm"
  listed the home's card first by reading order alone.
- **Order.** By score, then by `order` (reading order in `PAGES`, tokens in
  `theme.ts` order after the Colour page's sections, props in table order
  after their page's sections). Deterministic: the same query always gives
  the same list.
- **Cap.** The first eight hits. Then they are grouped by section for
  display, groups in the order of their best hit, hits inside a group in
  score order. Grouping never changes which eight are shown.
- **Excerpt.** A hit whose only match is in the body carries a window of up
  to 100 characters around the first matching word, on word boundaries,
  with an ellipsis at each cut end. A title hit carries no excerpt; the
  breadcrumb is enough.
- **Highlight.** The characters of the title that the terms matched are
  marked, prefix only — `butt` in "Button". A typo match marks the whole
  word. Excerpts mark the same way.

No synonym list. The pages are prose — the Dialog page says "modal", the
Install page says "npm" — and the body index finds them. If a query is
found to miss, an alias field on the entry is the extension, not a second
list.

## Where it lives

One UI, three entrances:

1. **The rail.** At its head, above the four sections, where the M3 site
   keeps its own: a rail item — the 56×32 pill around a 24px magnifier and
   the caption "Search" — made a button. Fernando moved it here from the
   drawer on 2026-09-14, while the first version was being checked in a
   browser: the search belongs to the outer bar, not to the section's
   panel. The shortcut is a `title` ("Search — ⌘K" on Apple platforms,
   "Search — Ctrl K" elsewhere) and `aria-keyshortcuts`; the caption has
   one line and the M3 rail says "Search" alone. The title reads
   `navigator.platform`, so it is set only once hydrated (`useHydrated`,
   invariant 17). It is a button, not an input: the rail is 80px wide, and
   a live field would still need a second container on a narrow screen.
2. **The keyboard.** `⌘K` and `Ctrl+K` open the palette from any page,
   whichever platform; both are accepted everywhere so a reader on a Mac
   with a PC keyboard is not stranded. The listener is on `document`, added
   by the palette component mounted in the nav, and removed with it.
3. **The narrow screen.** The same button, at the head of the open menu
   above the sections, its pill and caption side by side. Not in the bar:
   `docs.css` records that at 320px the bar holds the brand and the page's
   name with 2px to spare, which is why the theme toggle already lives
   inside the open menu. The rail takes `display: contents` below 760px, so
   the button is one element in both layouts, placed by a `search` row in
   the bar's grid areas and hidden with the sections while the menu is
   closed — the pattern the brand and the toggle follow. There the row's
   breadcrumb goes under its title: at 320 it took the row and the title
   truncated to "Choos…".

The drawer gets nothing. The first version had a field-shaped button under
the brand there; it lasted a few hours.

## The palette

The system's `Dialog`, size `md` (640px), title "Search", `initialFocus` on
the field, its own close button and Esc. The Dialog is centred by the
platform; the palette's `className` moves it to 12vh from the top so the
list grows downward without the box jumping as results change. The
`DialogProps.className` prop already exists for this.

Inside, top to bottom:

- **The field.** The system's `Input`, size `lg`, `iconStart` a magnifier,
  `role="combobox"`, `aria-autocomplete="list"`, `aria-expanded` when the
  list has rows, `aria-controls` the listbox, `aria-activedescendant` the
  active option, `autoComplete="off"`, `spellCheck={false}`. The `Input`
  spreads its rest props onto the element, so no package change is needed.
- **The list.** `ul role="listbox"` with `aria-label="Results"`; a `ul
  role="group"` per section with `aria-label` the section's title and a
  visible caption; `li role="option"` per hit with an id and
  `aria-selected`. A row is: the title (monospace for a token or a prop)
  with the matched prefix in `<mark>` (styled as bold in `text/primary`,
  no background — the wash and the selected fill are the only fills a row
  takes), the breadcrumb "Components › Button" in `text/secondary`, and the
  excerpt when there is one, in `text/tertiary` on the overlay surface,
  where it holds AA (invariant 21). Rows take the wash on hover and
  `interactive/selected` when active, the DropdownMenu's geometry.
- **Keyboard.** An IME's committing Enter (`isComposing`) is left alone.
  Escape closes through the Dialog's own `cancel` and is stopped in the
  field, so the Nav's document listener does not close the narrow-screen
  menu under it. ArrowDown and ArrowUp move the active option and wrap;
  Home and End go to the ends; Enter follows the active option, or the
  first when none is active; Tab leaves the field as usual. The pointer
  moves the active option on hover, as the DropdownMenu's does. The field
  keeps focus throughout; the list is never focused.
- **Enter.** `router.push(href)`, the dialog closes, the destination is
  recorded as recent. A hash on a static page lands on the `h2` id that
  `DocPage` wrote into the HTML, so no scroll code is needed.
- **Empty.** With nothing typed: "Recent", the last five destinations
  chosen through the palette (`localStorage['alpenglow-search-recent']`,
  `{ href, title, page }[]`, read and written inside `try`/`catch`, absent
  when storage refuses); then "Suggested", five pages named in
  `contents.ts` as `SUGGESTED` (Install, Button, Colour, Decisions, Dark
  mode). Both are listbox groups, so the keyboard reaches them the same
  way. Recent is omitted when empty.
- **Nothing found.** One line, "Nothing mentions “xyz”.", then the
  Suggested group. `aria-expanded` stays true: the suggestions are rows.
- **Loading.** The index is imported on the first open (`loadIndex()` in
  `load.ts`, a dynamic `import()` memoised in module scope). While it loads
  the field is usable and the list shows "Loading the index…" in
  `text/tertiary`; if the import rejects the list says "The index did not
  load." and the empty state stays; closing forgets the failure, so the
  next open tries again. Typing before it arrives runs the search when it
  does.
- **Closing.** Closing clears nothing: reopening shows the last query and
  its results, so a reader who chose the wrong row can pick the next
  without retyping. Following a row clears the query.

A `⌘K` while the palette is open does nothing.

## Files

```
app/ui/slug.ts                    slug (moved out of DocPage) and tokenId
app/ui/search/index.ts            types, terms, words, fuzzy, search, group, excerpt — pure
app/ui/search/extract.tsx         the page renderer and the walk, imported by the script and the tests
app/ui/search/navigation-stub.ts  usePathname for the renderer, aliased in for next/navigation
app/ui/search/load.ts             loadIndex(): the memoised dynamic import
app/ui/search/search-index.d.ts   the ambient module for the git-ignored JSON
app/ui/search/recent.ts           the localStorage list, try/catch'd
app/ui/search/Search.tsx          the rail item, the shortcut, the palette
app/ui/search/search.test.ts      every rule under "Matching"
app/ui/search/extract.test.tsx
app/ui/search/recent.test.ts
app/ui/search/Search.test.tsx
scripts/build-search-index.ts     the Vite SSR runner that writes app/ui/search/search-index.json
app/docs.css                      the rail item as a button, its narrow-screen row, the palette
app/ui/contents.ts                SUGGESTED
app/ui/Nav.tsx                    mounts <Search /> at the head of the rail
app/colour/page.tsx               ids on the token rows
package.json                      build:search, predev, build:docs
.gitignore                        app/ui/search/search-index.json
```

## Tests, before the code

- `search.test.ts`: terms keep `/`, `-` and `.`; accents fold; AND across
  terms; prefix matches; a typo matches at four characters and not at
  three; page title beats token beats section beats label beats body; a
  whole word beats a prefix beats a typo; ties fall to reading order; eight
  results; groups in best-hit order and never change the eight; the
  excerpt window, its bounds and its ellipses; highlight ranges.
- `extract.test.tsx`: for every page in `PAGES`, one `page` entry whose
  title is the nav label; one `section` entry per article-level `h2`, with
  the same id `DocPage` assigns; the 54 theme tokens, each with an `href`
  whose hash is an id on the Colour page; a `prop` entry for every row of
  every Props table on the component pages; `order` strictly increasing;
  no entry with an empty title. Also: the whole index serialises under 200
  KB, so a specimen that starts dumping data into the page is noticed.
- `Search.test.tsx`: the combobox's roles and states; ArrowDown/Up wrap;
  Home/End; Enter pushes the active href and closes; Enter with no active
  row takes the first; the pointer moves the active row; ⌘K and Ctrl+K
  open, and do nothing while open; the button opens; the recent list is written on Enter, read on open, capped at five,
  newest first, deduplicated, and survives a storage that throws;
  Suggested resolves every href to a page in `PAGES`; the loading and the
  failed states; axe with the dialog open, both empty and with results —
  `pages.test.tsx` only sees it closed.
- `Nav.test.tsx`: the search button heads the rail, above the sections, as
  a rail item; the narrow block of the stylesheet gives it the `search`
  grid row and hides it while the menu is closed, as it does the sections.
- The existing sweeps cover the new stylesheet rules on their own:
  `custom-properties.test.ts` (every `var(--ap-…)` exists),
  `motion.test.ts` (no written duration), `box-sizing.test.ts`,
  `Ratio.test.tsx` (renders every page).

## Decisions, for the Decisions page and MEMORY.md

- **The index is built, not written.** Generated from the rendered pages
  at build time, git-ignored; a page is searchable the day it exists.
- **The match is a prefix with one typo, not a full-text engine.** 23
  pages and ~250 entries do not need BM25; the rules above are readable and
  each is a test. `search()` is pure so an engine can replace it later
  without touching the palette.
- **No inline completion.** The M3 site fills the field with its first
  suggestion. Editing the field's value under the reader's fingers is the
  class of bug the date mask fought (IME, Android's `Unidentified`, paste);
  the list gives the same answer without it. `aria-autocomplete="list"`.
- **No popularity.** The site is static and has no analytics at runtime.
  Suggested is a list in `contents.ts`, five pages, chosen by hand.
- **One UI, in the system's own Dialog.** The palette is the Dialog and
  the Input the site documents, which is the point of a portfolio piece.
  A live field was refused for width and for needing a second container
  on a narrow screen; the entrance is the rail's, as on the M3 site.

## Out of scope

A results page (the M3 site's `/search.html`), search analytics, a synonym
list, indexing the Decisions page's entries as their own kind (they are
`h2`s and arrive as sections), and a `/` shortcut.
