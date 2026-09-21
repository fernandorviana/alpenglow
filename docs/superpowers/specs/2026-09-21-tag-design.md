# Tag — design

2026-09-21. Fourth piece of the roadmap's second wave, taken next because the
Combobox had a private one waiting for it.

## What is drawn

The published `tag` is an icon. The Tag is drawn once, inside the Combobox's
"Multiple Select With Search": a capsule 32 tall, an Avatar of 28 two in from
the edge, a name in `caption/md`, a close in a 20 holder, white on the
field's grey.

## Decisions

**A sibling of the Badge, not a variant** — the question the roadmap left
open. A Badge is a rectangle that says a state and is never touched; its own
page says it is not interactive and carries no role. A Tag is a capsule that
stands for a thing the reader put there and can take away, and it has a
button. One component for both would have given the Badge a button or taken
the Tag's.

**Neutral only** (Fernando, shown the Badge's tones on a Tag). The theme's
tones are meanings — success, danger, warning. What is painted on a tag is a
category, and the theme has no colours for categories. Given green and red,
tags would spend them, and they would stop meaning success and danger
elsewhere. The tones come with a categorical palette. The roadmap's line is
revised in writing.

## API

`children`, `start` (an Avatar, an icon), `size` (`md` 32 as drawn, `sm` 24,
what a 40 field has room for), `onRemove`, `removeLabel` ("Remove" and the
words, when the words are a string), `removeProps`, `disabled`, `className`
and what a span takes. It does not remove itself: `onRemove` tells the
caller, as with the Alert.

`removeProps` is for a field that holds tags: `tabIndex={-1}` where the
keyboard has another way to take a tag away, `onMouseDown` to keep the focus
in the field. The Combobox uses both, and its private tag is gone.

## The fill, and a field

`surface/sunken` on a card. A field is already that grey, so a field hands
`--tag-fill` down; the Combobox gives `surface/raised`, the drawn white.

What stands before the words sits in the capsule's own curve, the same
distance from the edge all round. The Avatar's scale has 24 and 30 and no
28, so the Avatar is 24: four in, in the 32 tag, and flush in the 24 one.
An icon is given the words' inset back.

The button is 24 in the 32 tag, the least a target may be (WCAG 2.5.8), and
20 in the 24 one, where the tag is the room there is and a field gives the
keyboard another way.

## Found by the review

- The fill is the tag's only edge and forced colours remove it: a
  transparent hairline, its width given back by the paddings, and what
  stands before the words laid over it so a 24 Avatar does not make the 24
  tag 26.
- The docs' own example removed the tag whose button had the focus and put
  the focus nowhere. It gives it to the list. The page says the focus is the
  caller's to place, and why.
- The small tag's button had its size by descent from the tag (`.sm
  .remove`); it has its own class.
- Nothing held the Combobox to handing `--tag-fill`; a test does.

## Not here

Tones; a tag that is pressed (a filter that toggles is a button with
`aria-pressed`); a group component — a set of tags is the caller's `ul`.
