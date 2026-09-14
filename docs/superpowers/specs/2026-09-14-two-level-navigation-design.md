# Two-level navigation — design

**Date:** 2026-09-14
**Status:** implemented the same day; revised the same evening after the first
cut was seen live — the toggle stood on end, the drawer's caption dropped, the
rail back to 80 and the breakpoints moved with it. This is the revised text;
the code on `main` is what it describes.

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

80px wide — the M3 rail's own width — sticky, the full height of the
viewport. One item per section: a 24px Carbon icon on a 56×32 pill and a
caption under it, the M3 rail's geometry. The pill takes
`interactive/selected` for the section the reader is in —
`aria-current="page"` on the section's own page, `aria-current="location"`
on any page inside it — and the wash on hover.

The theme toggle sits at the foot of the rail, where the M3 site keeps its
own, and stands on end to fit it: 48 wide by 84 tall, the sun above the moon,
a 32px knob that travels 36px down in dark (`translateY`, written in both
dark blocks as invariant 9 requires). The first cut kept the toggle
horizontal and widened the rail to 96 to hold it; standing it on end gives
the rail its reference width back.

Icons: Home (Start here), Code (Developers), Layers (Foundations), Cube
(Components).

## The drawer

232px wide — the old sidebar's width — sticky, on `surface/raised` like the
rail, with a hairline between the two and one at its outer edge. Its head
holds the brand and the theme name, as the old sidebar's did. Then a list:
**Overview** (the section's page) then the section's pages, the current one
on `interactive/selected`. No caption names the section above the list — the
rail beside it already does, with the section's pill filled, and a label
that restates it is noise; the list carries the section's name as its
`aria-label` so assistive technology still hears it. The narrow overlay does
not repeat "Overview": there, each group's title is the link to its page.

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

The rail adds 80px to the chrome, so the two wide breakpoints move by the
same amount and the arithmetic that set them still holds:

- the sections list crosses to the left at **1496**, not 1440: the rail, the
  drawer, twice the page padding, the 152 list, the 168 evidence column, the
  three 24 gaps and the 24 spacer come to 792, leaving the 704 the Table
  specimen needs (80 + 232 + 64 + 152 + 168 + 72 + 24 = 792; 1496 − 792 = 704);
- the sections and the gutter leave at **1160**, not 1080.

Below 760 nothing changes: the nav is the sticky bar and the fixed overlay of
invariant 19, listing every group and page. On a tall phone the open overlay
keeps its rows to their content (`align-content: start`); left to stretch,
the grid floated the sections a third of the way down the screen.

## Reading order

The pager walks the sections flat, section page first: the last page of
Start here leads to the Developers page, then Install. `PAGES` is the one
list; the drawer, the overlay and the pager read it.

## Tests

- `contents`: `sectionOf` finds a section from its page or its own route and
  nothing from a stranger; the pager crosses a group boundary through the
  section page.
- `Nav`: the rail marks the section, the drawer lists Overview first (found
  by the list's `aria-label`, since there is no caption) and marks the page,
  a route outside the list gets an empty drawer; the narrow overlay behaviour
  as before.
- Stylesheet: the wide breakpoint less the rail, the drawer, the page padding
  and the columns beside the prose is the 704 the Table specimen needs, read
  from the CSS rather than written twice.
- `ThemeToggle`: the toggle's width, height and the knob's travel are summed
  from the padding, the slot and the gap in the stylesheet, not typed.
- `pages.test.tsx` picks up the three new pages for axe by itself.
