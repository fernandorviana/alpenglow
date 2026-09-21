# Breadcrumb — design

2026-09-21. Eighth piece of the roadmap's second wave.

## What is drawn

Not published in the library; drawn in the product's client record, in the top
bar: **a capsule** on a grey fill with the section's icon and its name
("Clients"), **a slash**, and the page in Semibold, not a link. Two levels
only. Under it, in the page, a "back to Clients" pill with a return arrow: that
is an outline Button at sm with an icon, which the system has, and is not part
of this component; the page shows it beside the Breadcrumb.

## Decisions (Fernando, 2026-09-21)

Proposed first with a chevron, before the drawing was seen; the drawing has the
slash, and the slash it is. Shown three ways to take it to a third level, which
is not drawn — only the root a capsule, every ancestor a capsule, no capsules —
he took: **the root is a capsule at rest, and every link is a capsule under the
pointer**; and **only the first has an icon**.

## Shape

`nav` named "Breadcrumb" > `ol`, as the roadmap has it. Every ancestor with an
`href` is a link through `Anchor`, so `renderLink` hands it to a router; one
without is words. The last item is the page: a span with
`aria-current="page"`, Semibold, `text/primary`, never a link. The slash is in
the item that follows it, `aria-hidden`.

The capsule: 28 tall, radius md, 4 and 10 of padding. The root's fill is
`interactive/neutral` and not the drawn `surface/base`, the same primitive in
light and in dark a fill and not a hole, as the Dialog's icon button. Under the
pointer the wash lies over it; on the other links the wash alone is the
capsule. No underline: the capsule is the hover's mark, and these are
navigation and not links in a sentence. Medium, `text/secondary`.

A long name — a patient's — is cut with an ellipsis at 24ch; the words are
whole in the DOM.

`maxItems`: with more, the middle is folded into a "…" button that unfolds it
in place. Not a menu: the DropdownMenu's rows are buttons, and a crumb has to
stay a link that opens in a new tab. The first and the last `maxItems − 1`
stay.

## API

`items: { label, href? }[]`, `icon` (the root's), `renderLink`, `maxItems`,
`aria-label` ('Breadcrumb'), `expandLabel` ('Show path'), `className`.

## Tests

nav/ol/li; links and the current page; an ancestor without href; the icon on
the first only and hidden; slashes hidden and one fewer than items; renderLink;
maxItems folds, the button unfolds and the focus goes to the first unfolded
link; stylesheet: root fill, wash on hover, doubled class, no underline,
ellipsis, box-sizing; axe. Contrast: link and page on the bar, link on the
neutral fill and under the wash.
