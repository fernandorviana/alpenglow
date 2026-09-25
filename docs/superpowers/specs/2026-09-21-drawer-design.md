# Drawer — design

2026-09-21. Fifth piece of the roadmap's second wave.

## What is drawn

The published **Side Drawer** set: variants Create and View and Edit, sizes md
and lg, and states of the product's appointment. What the component takes from
it is the shell:

| Part | Drawn |
|---|---|
| Width | 480 (md), 768 (lg) |
| Height, corners | the whole height, square |
| Fill, shadow | white (`surface/raised`), Drop Shadow/lg |
| Header | 16 above, 24 at the sides, a title in 18/24 Semibold at the start, icon actions of 24 at the end, a divider inset by the padding |
| Header, View and Edit | no title: the appointment's state (a select), a `···` and the close |
| Body | 24 |
| Footer | buttons at the end, 24 all round |
| Expand | `fit-to-screen` beside the close, on Create |

It is the Popover's shell, not the Dialog's: title at the start, actions at the
end, buttons at the end of the footer. What the panels hold — the appointment's
fields, the sections that open and close — is the product's. The sections are
the Accordion, the next piece of the roadmap.

## Decisions, all Fernando's, 2026-09-21

1. **The end side.** The start is the navigation's. `side="start"` exists; top
   and bottom do not.
2. **Not modal.** The roadmap said `<dialog>`, side-anchored, with the Dialog's
   close rules. The close rules hold; the element does not. In the product the
   calendar stays live beside the panel, and a form left half-way is asked
   about: a modal "leave without saving?". So the panel never closes itself.
   Esc inside it and the close button call `onClose`, and the caller either
   sets `open` to false or opens a Dialog first. A press outside does nothing.
3. **Expand is full screen**, as Asana's task pane: the panel covers the page.
   md and lg are the designer's choice of width and are not what the button
   changes.
4. **Two kinds.** `overlay` grows over the content. `inline` is a sibling of
   the content, which makes room for it — the calendar. One component, `mode`.
   *Amended 2026-09-25:* from `md` up. Below `md` an inline Drawer opens over
   the content as `overlay` does, by the owner's rule of that day — "Em
   telemóveis não há drawer ao lado do conteúdo. O conteúdo é o que aparece e
   abrir drawers ou navegação é com overlays." (on phones there is no drawer
   beside the content; the content is what shows, and drawers and navigation
   open as overlays). The line is `DRAWER_NARROW`, `media.down.md`, exported
   from the root (2026-09-25, branch `fidelity-part-1`). Fernando's words
   set the behaviour; the line is the agent's, chosen to match the
   SideNav's sheet, and waits on Fernando's yes.
5. **Resizable, both kinds**, off unless asked for.

## Shape

One element, `role="dialog"` and never `aria-modal`, rendered only while `open`.

- **overlay**, and either kind while expanded: `popover="manual"`, shown once
  mounted. The top layer without a z-index, no light dismiss, no inert page.
  Fixed to the side, `100dvh` tall.
- **inline**, from `md` up: no `popover`; in the flow, `role="region"`. The
  caller puts it beside the content in a flex row; it stretches to the row's
  height, and its body scrolls. Below `md` (`DRAWER_NARROW`) it is the
  overlay above, `popover="manual"` and `role="dialog"` — amended 2026-09-25,
  decision 4.

`display` is set under `:popover-open` and on the in-flow class only, never on
a class that can stand on a closed `[popover]`.

Surface: overlay is `surface/overlay` on `elevation/lg`, a transparent hairline
on the inner edge that takes `border/default` in dark, as every floating
surface. Inline is part of the page: `surface/raised`, `border/subtle` on the
inner edge, no shadow. Title in `text/primary` where the drawing has secondary,
as the Dialog's and the Popover's.

Narrower than its width plus nothing, the overlay is the screen's width.

## Behaviour

- On the way in the focus goes to `initialFocus`, or to the panel. On the way
  out it goes back to what had it before, if it is still in the document and
  the focus was in the panel or nowhere.
- Esc, from inside the panel, calls `onClose` — unless something inside has a
  popover open (a Select, a DatePicker), whose Esc it is, or the event was
  already handled.
- Expand: a button before the close, present only with `onExpandedChange`.
  `expanded` is the caller's, as `open` is. Named "Expand" and "Collapse".
- The overlay slides in from its side over the fade duration. Reduced motion
  drops it.

## Resize

A handle on the inner edge: `role="separator"`, focusable, vertical, with
`aria-valuenow`, `min` and `max` in pixels and `aria-controls`. Pointer drag
with capture; Left and Right by 16, in the direction the edge moves; Home and
End to the ends; a double click puts the starting width back. Hidden while
expanded.

`width`, `defaultWidth`, `onWidthChange`, `minWidth` (320), `maxWidth`. The
most is also what leaves the content 320: of the window for overlay, of the
parent for inline.

## API

`open`, `onClose`, `mode` (`'overlay'`), `side` (`'end'`), `size` (`'md'`),
`title`, `header`, `aria-label`, `headerActions`, `actions`, `children`,
`expanded`, `onExpandedChange`, `resizable`, `width`, `defaultWidth`,
`onWidthChange`, `minWidth`, `maxWidth`, `initialFocus`, `closeLabel`,
`expandLabel`, `collapseLabel`, `resizeLabel`, `className`.

## Where it leaves the drawing

- The footer is pinned to the foot and the body scrolls; the drawing has the
  buttons straight after the fields. A long form keeps its buttons in reach.
- The title is `text/primary`; the header's icon buttons are the package's
  ghost Button at sm, not bare 24 icons, so they have a target and a ring.

## From the build and the review

- The focus return waits a task and takes a not-rendered active element as
  lost: a Dialog that closes with the panel leaves its button active until the
  next frame.
- The resize limit is read again at every resize; `aria-valuenow` is never past
  its most; no handle where there is nothing to give.
- Expanded keeps the entrance animation; `none` replayed it on collapse.
- The inline panel is `flex: 0 1 auto`: it gives way only when the content
  beside it has a least width and the row has no more.
- Open: `header` with no `aria-label` is an unnamed panel, untyped.

## Not here

A modal drawer with a scrim (a Dialog is that); top and bottom; the Accordion;
a layout component for the inline kind — a flex row is the caller's.

## Tests

Roles and names per kind; `popover` present for overlay and expanded, absent
for inline; nothing rendered while closed; Esc and close call `onClose` and do
not close; Esc handled inside is left alone; focus in and back; expand button
only with its handler, its name and `aria-pressed`-free toggle; separator
values, keys, clamps, double click, controlled and uncontrolled; stylesheet:
no `display` on the bare class, box-sizing, tokens; axe. Contrast cases for
the title and body on both surfaces.
