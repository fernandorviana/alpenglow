# Tooltip — design

The second component of wave 1 of the completeness roadmap
(`2026-09-18-completeness-roadmap.md`). Drawn in the Alpenglow Figma file on
the *Tooltip* page as two frames, `Tootltip` and `Popover`: the same floating
card, one holding two icon-and-text lines and a paragraph, the other four
Badges, both opened by the pointer (a hand cursor is drawn over the second).

A first proposal was made before the drawing was found — a search for a
component named "tooltip" returns nothing, because the frames are not
published components — and recommended an inverse surface. **The drawing
settles it: the tooltip is the overlay surface.** The inverse proposal is
withdrawn and recorded here so it is not made again.

## Decisions taken with Fernando, 2026-09-19

- **The surface is the drawn one**: white, a hairline edge, radius 12, the
  `md` shadow. Not the inverse surface most systems use.
- **`border/default` is too strong for it.** Shown a mockup edged in
  `border/default`, Fernando said so, and that more border tokens will be
  added when he runs the colour and layout tests in Figma. Until then the
  edge is **`border/subtle`** in both modes. Measured against the tooltip's
  own surface: `subtle` 1.18:1 light and 1.65 dark; `default` 1.72 and 2.97;
  the drawn `stone/200` 1.36 — between the two, which is where the new token
  belongs. The Tooltip moves to it when it lands.
- **A compact size is added**, not drawn: the drawn card has 20 of padding
  and is right for an explanation, and too heavy for the two words on an
  icon button. Same surface, same edge, same shadow.

## Decided by the repository's conventions, for Fernando to overturn

- **One component now, `Tooltip`, for both drawn frames.** Both open on
  hover and hold nothing to click, which is what makes a tooltip a tooltip;
  the Badges frame is a tooltip with rich content. The wave-2 **Popover** is
  the other thing — opened by a click, may hold controls, dialog semantics —
  and will share this stylesheet's surface the way Input, Textarea and Select
  share `control.module.css`. The drawn `lg` shadow on the Badges frame goes
  with it; a tooltip takes `md`.
- **`popover="manual"` and CSS anchor positioning**, the DatePicker's trade.
  `popover="hint"` would be the platform's own tooltip, and is Chromium-only.
  `manual` also leaves an open menu or date picker open, which `auto` would
  close. The top layer means no z-index and no portal.
- **The degraded path shows nothing.** Without anchor positioning the menu
  falls back to the UA's centred placement; a tooltip in the middle of the
  screen describes nothing. Under `@supports not (anchor-name: --a)` it is
  `display: none`, and the text still reaches assistive technology through
  `aria-describedby`, which reads hidden content. A JavaScript positioner was
  refused for the menu and is refused here for the same reason.
- **WCAG 1.4.13, all three conditions.** *Hoverable*: the pointer can move
  from the trigger onto the tooltip; a short grace period bridges the gap
  between them. *Dismissible*: Esc closes it without moving focus. *Persistent*:
  it stays until the pointer or focus leaves, or Esc.
- **It opens on keyboard focus at once and on hover after 400ms**; it closes
  100ms after the pointer leaves, and at once on blur, Esc, or a press of the
  trigger. Focus from a mouse click does not open it (`:focus-visible`). A
  touch does not open it: there is no hover on a phone, which is why a
  tooltip may never hold what the reader cannot do without.
- **It describes by default and can name instead.** `aria-describedby` on
  the trigger; `purpose="label"` writes `aria-labelledby`, for an icon-only
  button whose only name is the tooltip. `role="tooltip"` on the panel.
- **A wrapper, not a clone with handlers.** The trigger is wrapped in an
  inline-flex `span` that carries the anchor name and the pointer and focus
  listeners; only the ARIA attribute is cloned onto the child. No ref has to
  be merged and the child keeps its own handlers.
- **Always mounted.** The panel's content is static text, so nothing the
  server and the browser can disagree on reaches the HTML (invariant 17),
  and the description has to exist for `aria-describedby` before it is shown.
- **No arrow.** Anchor positioning flips the panel when it does not fit and
  CSS cannot yet say which way it went, so an arrow would point the wrong
  way half the time it mattered.

## Deviations from the drawing, with the reason

1. **Colours become theme tokens.** The frames are bound to old primitives
   (`white/white`, `gray-dark/500`, `gray-dark/050`) and a written
   `stone/200`. They take `surface/overlay`, `text/primary`, `text/tertiary`
   and `border/subtle`.
2. **Dark is not drawn.** `surface/overlay` sits a surface step above a card
   and two above the canvas, and the same `border/subtle` edge. Not the
   menu's `border/default` (invariant 11), by the decision above.
3. **The shadow is `elevation/md`** for both frames (see Popover above).
4. **The compact size** — see §3.

## Scope

**In.** `Tooltip`, `TooltipProps`, `TooltipSize`, `TooltipPlacement`; contrast
cases; the `/tooltip` docs page, its `contents.ts` entry and section card;
`CHANGELOG.md`, README counts, `MEMORY.md`.

**Out, deliberately.** The click Popover (wave 2). An arrow. A delay prop or
a delay group ("skip the delay once one tooltip has shown"). Long-press on
touch. Putting the Tooltip on the site's own rail Search item, whose shortcut
lives in a `title` today — the Nav's tests assert that `title`, so it is its
own change. Rebinding the Figma frames to theme variables.

---

## 1. API

```tsx
<Tooltip content="Copy link" purpose="label">
  <Button variant="ghost" tone="neutral" iconStart={<Copy />} />
</Tooltip>

<Tooltip content="Search" shortcut="⌘K"><button>…</button></Tooltip>

<Tooltip
  content={<VerifiedLines />}  {/* the caller's own markup: icon-and-text rows */}
  description="Patients with this badge have been authenticated with a verified email."
>
  <Badge tone="accent">Verified</Badge>
</Tooltip>
```

| Prop | Type | Default | |
|---|---|---|---|
| `content` | `ReactNode` | required | Nothing interactive. |
| `description` | `string` | — | The drawn paragraph under the content, `text/tertiary`. |
| `shortcut` | `string` | — | Shown in a `kbd` after the content. |
| `size` | `'sm' \| 'md'` | `'sm'` for a string, `'md'` otherwise | `md` is the drawn card. |
| `placement` | `'top' \| 'bottom' \| 'start' \| 'end'` | `'top'` | Flips when it does not fit. |
| `purpose` | `'describe' \| 'label'` | `'describe'` | |
| `children` | one element | required | The trigger. It must be focusable. |
| `className` | `string` | — | On the wrapper. |

## 2. Structure

`span.wrapper[style=--tooltip-anchor]` > the child (with `aria-describedby`
or `aria-labelledby`), then `span[role=tooltip][popover=manual].tooltip` >
`span.body` (`span.content`, `kbd.shortcut`?), `span.description`?.

**Spans all the way down.** A tooltip's trigger is often a word inside a
paragraph, and a `div` or a `p` inside a `p` is closed early by the HTML
parser, so the server's markup would not be the markup React hydrates. The
anchor name travels as one custom property on the wrapper, which the panel
inherits: the stylesheet reads it as the wrapper's `anchor-name` and the
panel's `position-anchor`.

**Found by the review, 2026-09-19.** A press on the panel does not close it
(a reader may be selecting its words); only a press on the trigger does. The
Esc that dismisses a tooltip is cancelled, so inside a Dialog it does not also
become a close request. One tooltip shows at a time: the last one asked for.
The wrapper is `inline-flex` and does not stretch, so a `fullWidth` trigger
needs `className` on the Tooltip to fill its row — recorded, not solved.

## 3. Geometry and paint

| | `md` — drawn | `sm` — proposed |
|---|---|---|
| Padding | 20 | 6 block, 12 inline |
| Radius | `xl` 12 | `lg` 8 |
| Text | 14 / 22 Medium, `text/primary` | 12 / 16 Medium, `text/primary` |
| Description | 12 / 16 Medium, `text/tertiary`, 16 above | — |
| Max width | 266 | 240 |
| Distance from the trigger | 8 | 8 |
| Surface, edge, shadow | `surface/overlay`, `border/subtle`, `elevation/md` | the same |
| `kbd` | `surface/sunken`, `text/secondary`, radius `sm`, 11 / 16 | the same |

It fades in over `duration/fade` through `@starting-style`; under reduced
motion it appears.

## 4. Contrast cases

- `text/primary`, `text/tertiary` on `surface/overlay` — covered by the
  suite's own surface loop; asserted again by name so the Tooltip's pairs are
  findable.
- `text/secondary` on `surface/sunken` — the `kbd`.
- In dark the panel is a surface step above a card and the canvas
  (`SURFACE_STEP`); in light it is the card's own white, and the record says
  so: the shadow and a 1.18:1 edge are what separate it there.
- `border/subtle` over `surface/overlay` is **recorded, not asserted**, at
  1.18 and 1.65: decorative, and the figure a new token is expected to
  replace.

## 5. Tests

`Tooltip.test.tsx`, with `installPopoverStub` and fake timers: role and the
ARIA link in both purposes; opens on focus at once, on hover after 400ms,
not before; stays open while the pointer is on the panel; closes 100ms after
leaving, at once on blur, Esc and press; Esc does not move focus; a touch
pointer does not open it; `size` defaults by content; `placement` reaches
the stylesheet; the stylesheet's rules (manual popover reset, anchor, the
`@supports` branch hides it, reduced motion, `border/subtle` and no
`border/default`); axe open and closed.

## 6. Checked by hand after the build

Both modes, in the Browser pane: it sits 8 above the trigger and flips under
the top edge; the pointer can travel onto it; Esc closes it and focus stays;
it does not close an open DropdownMenu; the compact and the drawn sizes
beside each other.
