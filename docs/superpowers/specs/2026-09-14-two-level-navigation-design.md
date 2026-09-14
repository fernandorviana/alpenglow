# Two-level navigation — design

**Date:** 2026-09-14
**Status:** implemented the same day

## What changes

The documentation site's one sidebar becomes two bars, in the shape of the
Material 3 site: a narrow **rail** holding the four sections, and beside it a
**drawer** holding the pages of the section the reader is in. Each section
gains a page of its own that presents the pages inside it.

## Sections

| Section | Route | Pages |
|---|---|---|
| Start here | `/` | Why Alpenglow, Accessibility, Decisions |
| Developers | `/develop` | Install, Tailwind, Dark mode |
| Foundations | `/foundations` | Colour, Elevation and states, Typography, Space and shape, Icons |
| Components | `/components` | the ten component pages |

The home page is the Start here section's page, as it was the first item of
that group before. Nothing else moves; no page route changes.

## The rail

96px wide, sticky, the full height of the viewport. One item per section: a
24px Carbon icon on a 56×32 pill and a caption under it, the M3 rail's
geometry. The pill takes `interactive/selected` for the section the reader is
in — `aria-current="page"` on the section's own page, `aria-current="location"`
on any page inside it — and the wash on hover. The theme toggle sits at the
foot of the rail, where the M3 site keeps its own; the rail is 96 rather than
80 because the toggle is 84 wide.

Icons: Home (Start here), Code (Developers), Layers (Foundations), Cube
(Components).

## The drawer

232px wide — the old sidebar's width — sticky, on `surface/raised` like the
rail, with a hairline between the two and one at its outer edge. Its head
holds the brand and the theme name, as the old sidebar's did. Under a
caption naming the section, a list: **Overview** (the section's page) then
the section's pages, the current one on `interactive/selected`. The narrow
overlay does not repeat "Overview": there, each group's title is the link to
its page.

On a route no section lists, the drawer is empty below the brand.

## Section pages

Each is a `DocPage`: an `h1`, a lead, a visual on the right of the hero, the
section's pages as cards, and a measurements gutter. The cards are the ones
the home page held, with their pictures, moved to the section they belong to.

- **Start here** (`/`): the hero as it was; three Start here cards; then
  three section cards — Developers, Foundations, Components — each with a
  picture and a description of what the section holds.
- **Developers**: the install lines as the hero's visual; the version and
  the entry-point count in the gutter, read from `package.json`.
- **Foundations**: the ten families as strips; primitives, theme tokens,
  text styles and spacing steps counted from the token files.
- **Components**: a small composed specimen; the page count, and the
  tone and size vocabularies counted from `vocabulary.ts`.

## Breakpoints

The rail adds 96px to the chrome, so the two wide breakpoints move by the
same amount and the arithmetic that set them still holds:

- the sections list crosses to the left at **1536**, not 1440
  (1536 − 96 − 232 − 80 = 1128, what 1440 left the page before);
- the sections and the gutter leave at **1176**, not 1080.

Below 760 nothing changes: the nav is the sticky bar and the fixed overlay of
invariant 19, listing every group and page.

## Reading order

The pager walks the sections flat, section page first: the last page of
Start here leads to the Developers page, then Install. `PAGES` is the one
list; the drawer, the overlay and the pager read it.

## Tests

- `contents`: `sectionOf` finds a section from its page or its own route and
  nothing from a stranger; the pager crosses a group boundary through the
  section page.
- `Nav`: the rail marks the section, the drawer lists Overview first and
  marks the page, a route outside the list gets an empty drawer; the narrow
  overlay behaviour as before.
- Stylesheet: the wide breakpoint is the rail, the drawer, the page padding
  and the 1128 the page needs, read from the CSS rather than written twice.
- `pages.test.tsx` picks up the three new pages for axe by itself.
