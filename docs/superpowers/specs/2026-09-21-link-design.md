# Link — design

2026-09-21. Seventh and last component of the roadmap's first wave.

## What is drawn

Nothing. The published `link` is an icon. The theme has `text/accent`, whose
use is "Links", and the docs paint their prose links with it.

## Decisions

| Question | Shown | Chosen |
|---|---|---|
| The underline | 0: colour alone. 1: always. 2: inline always, standalone on hover (recommended) | **Fernando: the accent always, the line only on hover — inline too** |
| A button that navigates | A: `Button` takes `href`. B: `Link` takes a button variant. C: neither | **A**, left to "whatever is best practice in code" |

### The decision that runs against the default, 2026-09-21

WCAG 1.4.1 asks that colour is not the only means of telling a link from
the words around it, and the usual reading (G183) is 3:1 between the two
colours plus a cue on hover and focus. Measured:

| `text/accent` against | Light | Dark |
|---|---|---|
| `text/primary` | 2.73:1 | 1.64:1 |
| `text/secondary` | 2.06:1 | 1.03:1 |

Colour alone does not carry it, least of all in dark. Fernando chose no
underline at rest, knowing the numbers. **The second cue is weight**: a link
is Medium (500) in text that is Regular, which is a visual means that is not
colour, and the underline comes on hover and on keyboard focus. The suite
records the four ratios so a change to the theme is seen. This is a
decision, not an oversight: whoever "fixes" it should change this table
first. It does not hold inside text that is itself Medium or heavier — a
table header, a button — where a link should be `standalone` on its own
line or the underline forced by the caller.

## API

```tsx
<p>What just happened is a <Link href="/toast">toast</Link>.</p>
<Link variant="standalone" href="/locations" iconEnd={<ArrowRight />}>All locations</Link>
<Link href="https://…" external>The specification</Link>
<Link href="/x" render={(props) => <NextLink {...props} />}>Routed</Link>

<Button href="/signup">Create account</Button>
```

**Link** — `variant`: `inline` (default; inherits size, line height and
colour of nothing: accent, Medium) or `standalone` (`body/md`, inline-flex,
least height 24 for WCAG 2.5.8, which exempts only links in a sentence).
`href` required. `iconEnd`. `external`: `target="_blank"`,
`rel="noreferrer"` and, said and not shown, `externalLabel` ("opens in a
new tab"). `render`: handed every prop the `a` would take, for a router's
link. Anchor props pass through. The ring is the system's.

No `:visited` colour: in an application it tells nothing, and the theme has
no token for it. No hover colour either: the theme has one accent text.

**Button** — gains `href` and `render`. With `href` it is an `a` with the
same classes. An `a` has no `disabled`, so `disabled` or `loading` with
`href` renders an `a` with no `href`, `role="link"` and
`aria-disabled="true"`: not focusable, not followed, and `render` is not
called, since a router's link wants an `href`. The stylesheet's
`:not(:disabled)` becomes `:not(:disabled, [aria-disabled='true'])`.
`type` means nothing on a link and is not passed.

`render` is the DropdownMenu's `trigger` idiom. CardTitle, Pagination's
`hrefFor` and the Tabs' link variant take it in a later pass.

## With it

The visually-hidden rule, written out in three stylesheets and about to be
in a fourth, moves to `src/components/visuallyHidden.module.css`, and the
Toast, the Alert and the Pagination use it. The docs' `.prose a` follows
the decision: Medium, no line at rest, a line on hover and focus.

## Found by the browser and the review

- The docs' `.prose a` (0,1,1) outranked `.button` and made a Button with
  an `href` Medium and underlined under the pointer. The docs rule is
  `a:not([class])`; the Button names the element, `a.button:hover`, so a
  consumer's `a:hover` does the same nothing.
- The Compiler lint refuses a ref handed to a function during render, which
  is what calling `render(props)` is. `Anchor` in `linkRender.tsx` is a
  component, and the ref reaches it as a prop.
- `:not(:disabled):not([aria-disabled='true'])`, two `:not`s and no comma:
  the Button's loading test splits selector lists on commas.
- A caller's `rel` joins `noreferrer`; the new tab is said only while
  `target` is `_blank`; a disabled link loses every handler and its
  `tabIndex`, not `onClick` alone; a third overload takes
  `href: string | undefined`, a row that may or may not link; `displayName`.

## Tests

Link: element, classes by variant, href, anchor props, `external`'s three
effects, `render` receives href, className and children, icon hidden from
the name; stylesheet: accent, Medium, no line at rest, a line on hover and
focus-visible, the ring, least height on standalone; axe. Button: `a` with
`href`, no `type`, disabled and loading forms, `render`, the button form
unchanged; stylesheet: no bare `:not(:disabled)` left. Contrast: accent on
the three surfaces; the four recorded ratios.
