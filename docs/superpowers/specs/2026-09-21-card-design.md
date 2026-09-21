# Card — design

2026-09-21. Sixth component of the roadmap's first wave.

## What is drawn

One published set, `Card - Locations`, in two states. At rest: a fill of
`surface/base` on a white page, no border and no shadow, radius 16, padding
16; a picture set into it at radius 12 that carries `elevation/md`; a title
at 16/24 Semibold; two caption lines in `text/tertiary` with 16 icons; an
overflow button. Under the pointer: the fill turns `surface/accent-subtle`,
the picture takes 8% black and `elevation/lg`, and two inverse Badges with
counts and a "See details" button appear over the picture.

Fernando: there are more cards in the product, a complex tool that needed
several; the calendar's are to be ignored. This one carries the language.

## Decisions

| Question | Shown | Chosen |
|---|---|---|
| What the package's Card is | A: a surface and a few parts, the rest the caller's. B: the surface alone. C: closed props | **A** |
| The surface | A: raised with a hairline, on the canvas (the site's). B: filled, a step under its ground, no border (drawn). C: B on the canvas | **B, "for now"** |
| Hover, when the card is a link | 1: `surface/accent-subtle` (drawn). 2: the theme's wash | **2** |

Set down without being asked, to be corrected on sight:

- **Nothing is behind the hover.** The drawn counts and "See details" do not
  exist for touch or the keyboard. The counts are information and are always
  shown; the button goes, since the whole card is the link.
- The picture's hover is the same wash, not 8% black: the theme has no token
  for that, and the wash is what hover is everywhere.
- A `CardBody` and a `CardActions` beside the three parts agreed: the drawn
  words stand 8 inside the picture's edge, which needs a wrapper, and a
  control inside a linked card has to be lifted over the link.

## The surface, and where it can stand

`surface/sunken`: the token that means "a step under its ground". Light is
stone/100 under the white of `surface/raised`, a little deeper than the
drawn stone/050. In dark `sunken` is the canvas (invariant 4), so **a Card
stands on `surface/raised`** — a section, a panel, a dialog — and on the
canvas in dark it is not seen. The suite holds the step against `raised` in
both modes. The site's own navigation cards stand on the canvas and stay as
they are; an outline variant, if it comes, is what they would move to.

## API

```tsx
<Card as="li">
  <CardMedia><img src="…" alt="" /></CardMedia>
  <CardBody>
    <CardTitle href="/locations/phoenix">Phoenix Clinic Hospital</CardTitle>
    …the caller's lines…
    <CardActions><Button …>…</Button></CardActions>
  </CardBody>
</Card>
```

| Part | Props | Notes |
|---|---|---|
| `Card` | `as` (`div`, `li`, `article`, `section`; `div`), `className`, `children` | Flex column, gap 8, padding 16, radius 2xl. |
| `CardMedia` | `ratio` (CSS `aspect-ratio`; `'16 / 9'`), `className`, `children` | Radius xl, `elevation/md`, on `surface/raised`. An `img` or `video` inside covers it; anything else is centred. |
| `CardBody` | `className`, `children` | 4 block, 8 inline: with the gap, the drawn 12 under the picture and 20 at the foot. |
| `CardTitle` | `as` (`h2`–`h4`, `div`; `h3`), `href`, anchor props, `className`, `children` | `body/lg` Semibold. With `href` it is a link whose `::after` covers the card. |
| `CardActions` | `className`, `children` | Lifts its controls over the link. |

With a linked title: hover is the wash on the card and on the picture, and
the picture rises to `elevation/lg`; the focus ring is drawn on the card
through `:has()`, and where `:has()` is missing it stays on the link. The
accessible name of the card's link is the title alone. Without `href` the
card does not answer the pointer.

`CardActions` is `position: relative` with `z-index: 1`, the package's only
z-index, inside a card that is `isolation: isolate` so it cannot leak: a
positioned part earlier in the DOM than the link would otherwise be under
the link's `::after`.

The link is a plain `a`. A router's link is the Link component's question,
next in this wave.

## Tests

Parts render their elements and classes; `as`; the link's name is the title;
no link without `href`; anchor props pass; `ratio` travels as a custom
property; stylesheet holds: sunken, no border, wash only under `:has(.link)`,
the ring moved only inside `@supports selector(:has(*))`, one z-index; axe.
Contrast: the step under `raised`, primary and tertiary text at rest and
under the wash, the focus ring.

## Found by the browser and the review

- `text/tertiary`, the drawn captions' token, is 4.27:1 on the fill under
  the wash in light. A linked card's captions are `text/secondary`; the
  suite records the number.
- `.media > img`, not any `img` inside: an avatar laid over the picture was
  stretched to cover it.
- A card that holds cards does not hover, and a card resets the two custom
  properties so an outer hover is not handed down.
- A transparent hairline, given back by the padding: forced colours remove
  the fill, which is the card's only edge.
- `id` goes on the title's element, linked or not, so a container card can
  be labelled by its title.
- The card's `background-color` transition never ran, since the wash is a
  background-image. The wash snaps, as on the Button; the shadow travels.
- Words under the link's hit area cannot be selected and a second link
  outside `CardActions` cannot be pressed. Documented, not solved.

## Not done

An outline variant; a selected state (what `accent-subtle` is kept for);
the other product cards; a horizontal layout.
