# Popover — design

2026-09-21. First component of the roadmap's second wave, and the floating
surface it was to be extracted from.

## What is drawn

A published set, `Popover`, in four variants on the Figma file's Popover
page: Messages (352 wide), User Menu (233), New Appointment and Edit
Appointment (424). All four are a product's panels. What they share: a fill
of `surface/raised` on `Drop Shadow/lg`, radius 12 (16 on Messages); a header
with a title at 18/24 Semibold in `text/secondary` and icon actions, over a
divider inset by the padding; a body at 24; a footer of buttons at the end,
24 around. The User Menu is a list of commands under a profile header, and
Messages' pills are Tabs.

## Asked on the way

Fernando did not know whether the DropdownMenu was finished and applied to
the selects. It is finished; the Select is a native `<select>` by a recorded
decision ("Prefer the native element", "Select stays native"), so its open
list is the operating system's. His drawing asks for more: a Select with an
Avatar in it, an option with a code in bold. Offered `appearance:
base-select` (Chrome and Edge 135, Safari 27, Firefox behind a flag; the OS
list elsewhere) and a listbox of the system's own, he asked why everyone's
select is custom and whether a button with a list is a select at all. It is,
when the choice stays shown: what tells it from a menu is what it does, not
how it looks. **Decided: `Select` becomes a button with a listbox on this
surface, and today's becomes `NativeSelect`**, as its own spec and cycle
after this one. The old decision is revised in writing there, not erased.

## Two pieces

### 1. `src/components/floating.module.css`

The anchored top-layer surface was written out four times: DropdownMenu,
DatePicker, the Pagination's page size, and the Tooltip. One copy now, for
the first three and the Popover: `position: fixed` with the UA's centring
cleared, the overlay fill, `elevation/md`, the transparent hairline that
takes `border/default` in dark only (invariant 1 measured, written twice for
the system preference and the explicit theme), `position-anchor`, the area,
`flip-block, flip-inline`, `anchors-visible`, a 4 gap on both block sides so
it is there whichever way the panel lands, and the `@supports not
(anchor-name)` path that centres it.

Two classes from two modules weigh the same and the later stylesheet wins,
so the shared class sets **nothing a consumer also sets**: padding, radius
and width stay with each consumer, and what may differ travels as a custom
property with a default — `--floating-anchor`, `--floating-area`,
`--floating-elevation`, `--floating-gap`. Each consumer's stylesheet tests
now read the two files as one, or assert that the consumer kept no placement
of its own.

Not the Tooltip: its edge is `border/subtle` in both modes and without
anchor positioning it is not shown at all.

### 2. `Popover`

The Dialog's shape, smaller and not modal: `trigger`, `title` (or
`aria-label`), `headerActions`, `actions`, `children`, `placement`
(`bottom-start`, `bottom-end`, `top-start`, `top-end`), `width`, `open` and
`onOpenChange`, `initialFocus`, `className`. `children`, `actions` and
`headerActions` may be functions handed `{ close }`, which is how a Cancel
ends it.

Native `popover="auto"`: the top layer, light dismiss, Esc and the focus
going back to the trigger are the platform's. The component writes the name
(`role="dialog"`, never `aria-modal`), the trigger's `aria-haspopup`,
`aria-expanded` and `aria-controls`, `popovertarget` only once hydrated (the
menu's reason), the focus on the way in (the panel, or `initialFocus`), and
carries a controlled `open` to the platform in an effect. The panel element
is held as state, not a ref, because `close` is handed to the caller's render
functions and the Compiler lint will not have a ref read on the way there.

`display` only under `:popover-open`: set on the class alone, an author's
`display` outranks the UA's `[popover]:not(:popover-open) { display: none }`
and it would never close. The body scrolls between a header and a footer
that stay. The panel is never wider than the screen less 8, nor taller than
the area it is placed in: `max-block-size` is `100%` of that area, and since
a panel that never overflows never flips, `position-try-order:
most-block-size` has it take the roomier side first.

Found by the browser: capped at the viewport's height, the 502 tall New
Appointment opened at 301 in a 600 viewport and its buttons were off the
screen; and with the cap made a percentage, an inner wrapper could not
inherit it inside an auto height, so the body did not scroll and ran out of
the panel. From the review: the controlled prop goes to the platform through
`togglePopover(open)`, because `showPopover()` throws on a panel the trigger
has already opened and `shown` is a task behind.

Where it leaves the drawing: `surface/overlay`, the floating surface's, which
is the drawn white in light and the level above a card in dark; radius 12
throughout; the title in `text/primary`, as the Dialog's is. `elevation/lg`
is kept, a level above a menu.

## Not this component

The four drawn panels are compositions. The docs page rebuilds New
Appointment (Field, Input, DatePicker, Select, Buttons) and Messages (Tabs,
Avatar, Link) and adds one with no header. The User Menu is a DropdownMenu
with a profile header, recorded and not built. An arrow, a hover-opened
popover, a modal one.

## Tests

Structure and naming, the trigger's attributes, one anchor name on both, the
four placements, width, header and footer only when asked, no
`popovertarget` in server HTML; opening, focus, `initialFocus`, `close` from
the body and from the actions, controlled `open`; stylesheet holds (a level
above a menu, nothing the floating surface sets, no `display` on the popover,
inside the screen, the inset divider); axe closed and open. Contrast: text
and links on `surface/overlay`, the focus ring on it, the dark border
against the canvas and a card.
