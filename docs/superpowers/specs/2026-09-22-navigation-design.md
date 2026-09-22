# SideNav, SideNavSecondary and TopBar — design

2026-09-22. First pieces of the roadmap's third wave. The roadmap has them
"graduated from `app/ui/Nav`"; what is graduated is the pattern, two bars on
a wide screen and one over the page on a narrow one, not the site's shape,
which is the Material 3 site's rail with captions. The package takes the
product's drawings.

## What is drawn

| Piece | Drawn |
|---|---|
| Side Navigation | 200 open, 80 closed with icons only; `surface/raised`, a `border/subtle` hairline at the inner edge; items 40 tall in a capsule (radius 24), icon 24, label 14 Semibold, 16 in and 20 out, gap 16; the current one on `surface/base` in `text/accent`; a bottom group for Settings, 40 above it; a collapse button drawn beside, not in the frame |
| Second Level Navigation | 240 open, 24 closed as a strip with the collapse button; `surface/base`, a hairline at the inner edge; sections with a caption in caption/sm uppercase with a chevron to fold them, items 40 tall at radius md with icon 24 and label 14 Semibold; the current one on `surface/raised` in `text/accent` |
| Top Bar | 64 tall on `surface/raised` with a hairline under; at the start the menu icon and the logo; at the end "Create" as a neutral button, three icon buttons of 40 and the Avatar |

## Decisions (Fernando took A and the design, 2026-09-22)

1. **Two levels, two components.** `SideNav` is the primary navigation and
   `SideNavSecondary` the second level; their anatomy and the way they
   collapse differ, and one API with a `level` would carry props that serve
   one of them.
2. **The control that collapses the primary nav is the TopBar's menu
   button**, as drawn; the caller holds `collapsed` and `open`. The SideNav
   has no button of its own; the secondary has the drawn one on its strip.
3. **On a narrow screen the SideNav is a modal `<dialog>`**: the Dialog's
   mechanics, top layer, scrim, inert page, Esc and focus return from the
   platform, sliding from the start side. `narrow` is a media query, 760px
   unless told, until breakpoints are tokens. The site's full-screen
   non-modal overlay does not come to the package.
4. **Collapsed, a primary item keeps its name in a Tooltip** with
   `purpose="label"`; the label is hidden and the icon is centred.
5. **A section of the secondary nav is a `<details>`**, as the Accordion:
   folding is the platform's. Its caption is `text/tertiary`, not the drawn
   `text/disabled`: it is information and has to read.
6. **The TopBar owns nothing but its zones**: the menu button (with `onMenu`)
   and `brand` at the start, `children` in the middle, `actions` at the end.
   Create, the icon buttons and the Avatar are the system's, put there by
   the caller.
7. Links go through `renderLink`, as the Breadcrumb's; `aria-current="page"`
   is the caller's `current`.

## Shape

```
SideNav
  nav.sidenav[.collapsed][aria-label]        wide
    ul.list > li > a.item[aria-current] > span.icon + span.label
    ul.list.foot …                            footer
  dialog.sheet > button.close + nav.sidenav   narrow, while open (showModal)

SideNavSecondary
  nav.secondary[.collapsed][aria-label]
    button.fold[aria-expanded]                the drawn collapse button
    details.section[open] > summary.caption (svg.chevron, span) + ul.list > li > a.item

TopBar
  header.topbar > div.start (button.menu, brand) + div.middle (children) + div.end (actions)
```

The collapsed label is hidden through `--sidenav-label`, set on the root and
read by the label; the chevron turns through `--sidenav-turn`. No part is
reached by descent.

## API

SideNav: `items: { href, label, icon, current? }[]`, `footer?: item[]`,
`renderLink?`, `aria-label` ("Main"), `collapsed?`, `open?`, `onClose?`,
`narrow?` (query), `closeLabel?`, `className?`.

SideNavSecondary: `sections: { label, items, defaultOpen? }[]`,
`renderLink?`, `aria-label` ("Section"), `collapsed?`, `onCollapsedChange?`,
`collapseLabel?`, `expandLabel?`, `className?`.

TopBar: `brand?`, `onMenu?`, `menuLabel?` ("Menu"), `menuExpanded?`,
`children?`, `actions?`, `className?`.

## Contrast

The current item's accent label on `surface/base` and on `surface/raised`,
AA; its icon, 3:1; the caption in `text/tertiary` on `surface/base`, AA.

## From the browser and the review

- A section's `open` was written on every render, so a folded section
  reopened when the current page changed, the Accordion's own lesson; each
  section reads its default once. Sections are keyed by index and caption,
  since two captions can match.
- A press on a link in the drawer does not close it; the caller closes on
  navigation, and the type and the page say so.
- No phone version of the top bar's actions or of the second level is drawn
  or built; the page says what a caller does there.
- Seen in Chromium: the collapse to 80 and to 24, the drawer over the page
  with its scrim, light and dark, a phone width; the collapsed tooltip is
  covered by the test, not by eye (a synthetic hover does not open it).

## Not here

Nested items beyond two levels; a search in the nav; badges on items (the
caller's `label` can hold one); the site's rail; breakpoint tokens.

## Tests

SideNav: a nav named; a link per item with `aria-current` from `current`;
`renderLink`; the footer list; collapsed class and a tooltip naming each
item; narrow (matchMedia stubbed): a dialog that opens with `open`,
`cancel` calls `onClose`, the close button too; stylesheet: widths, the
label through the custom property, box-sizing; axe open and closed.
SideNavSecondary: sections as details with the caption as summary; a closed
section by `defaultOpen={false}`; the fold button's name and `aria-expanded`;
collapsed hides the sections; axe. TopBar: a banner; the menu button only
with `onMenu`, its name and `aria-expanded`; the three zones; axe.
