# Skeleton — design

2026-09-21. Seventh piece of the roadmap's second wave. **Not drawn**: nothing
by that name is published.

## Decisions

- **Primitives, not moulds.** One `Skeleton` with `variant`: `text` (the height
  of the line it stands in, `lines`, the last one shorter), `circle` (an
  Avatar) and `rect` (media, a button). No `SkeletonCard`, no `SkeletonTable`:
  the page shows a card and a table row composed from the three.
- **A shimmer per shape, 1.8s** (Fernando, 2026-09-21). Shown a pulse and a
  sweep, he asked the sweep's speed and whether one band could cross every
  shape at once; shown that too — a viewport-wide gradient with
  `background-attachment: fixed` — with a control for the pace, he took a
  sweep for each shape, at 1.8s. The single band is not built: it animates
  `background-position`, which is paint, and falls apart inside a transformed
  ancestor and on iOS.
- The loop keeps its own timing and is not a motion token, as the Loader's.
- **Reduced motion does not freeze it** (invariant 6): a still grey bar is
  content, not loading. What is dropped is the travel: the band stays where it
  is and breathes, at half the pace.
- **The fill is the wash, not a surface.** `surface/sunken` is `surface/base`
  in dark, so on the page it would be nothing and on a card a hole. The pressed
  wash is a state layer that composites over whatever is under it, in both
  modes; the band is the same wash again, so it is a denser passage and needs
  no colour of its own.
- The shapes are `aria-hidden` spans, so they can stand inside a paragraph or
  a heading. The region that is loading is the caller's and says
  `aria-busy`; the page shows the pattern.
- A transparent hairline, which forced colours paint: the fill is the shape's
  only edge, as the Card's and the Tag's reviews found.
- Under `dir="rtl"` the sweep runs the other way.

## API

`variant` (`'text'`), `lines` (text only, 1), `width`, `height`, `size` (circle:
both), `className`, `style`.

## Tests

`aria-hidden` spans; variant classes; `lines` renders that many with the last
shorter unless a width is given; sizes as custom properties; stylesheet: the
wash, 1.8s linear infinite, reversed in RTL, reduced motion keeps an animation
and drops the travel, the border, box-sizing; axe.
