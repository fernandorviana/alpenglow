# Toast — design

The third component of wave 1 of the completeness roadmap
(`2026-09-18-completeness-roadmap.md`).

**It is drawn** (corrected 2026-09-24, fidelity audit). This spec said "It is
not drawn": five searches of the published library on 2026-09-20 found no
toast or snackbar. The drawing has tone-filled notifications with a
close (`1219:21015`, `1219:20982`) — a surface filled in the tone, not the
inverse one built here. Fernando's decisions below were taken on the
premise that nothing was drawn, so they are **reopened, pending his
ruling**; the component is unchanged until he rules. As written on
2026-09-20: the nearest thing the searches found, the `Notification status`
component set on the *Notifications* page, is the inline **Alert**: 880 wide,
56 tall, a tinted status surface with a border of its own tone, in four
states and three shapes (close, no button, one action). It is kept for the
Alert, the next component. The three "7 days left on your trial" bars beside
it are banners, which Fernando will draw with the other bars. So the Toast is
proposed, as the underline Tabs were.

## Decisions taken with Fernando, 2026-09-20

*Reopened 2026-09-24 (fidelity audit): taken on the premise "not drawn",
which was false — see above. They stand in the code until Fernando rules.*

- **The surface is `surface/inverse`.** Shown three — the overlay surface
  with a coloured icon, the drawn Alert floating, and the inverse — and then
  the overlay and the inverse over a card in both modes, he chose the
  inverse: a toast floats in a corner, and that is the default he expects of
  one. This is the opposite of the Tooltip's decision, on purpose: a tooltip
  opens where the reader is already looking and can be quiet; a toast opens
  away from it and has to be seen. Against every surface it can float over
  it is 15:1 or more in both modes.
- **No colour for the tone, for now.** The theme has two tokens for the
  inverse surface, `text/inverse` and `border/inverse`; `text/success` on
  `stone/950` does not read. The icon is `text/inverse` and the tone is read
  from its shape. Four status-on-inverse tokens and one for the action would
  be chosen and measured just before the theme changes with Fernando's
  Figma tests; when they exist the icon takes them and the API does not
  move.
- **Simple.** A message, at most one action, a close. No title, no
  description, no rich content: what needs those is an Alert or a Dialog.

## Decided by the repository's conventions, for Fernando to overturn

- **Hover and pressed are the theme's wash**, as everywhere else. Measured
  over `surface/inverse`: ΔL .043 light and .040 dark for hover, .087 and
  .069 pressed, all above `SURFACE_STEP`; `text/inverse` stays above 14:1 on
  both.
- **The focus ring is `currentColor`, not `border/focus`.** On the inverse
  surface in dark — a near-white block — `border/focus` is 1.64:1. The ring
  takes the text's colour, 18:1 or more in both modes. Geometry is the
  system's: the same width and offset.
- **The action is underlined text**, since the accent has no token on this
  surface. The close is an icon button, always there: a toast that cannot be
  dismissed covers what is under it for as long as it likes.
- **Icons are Carbon's own vectors**, the ones drawn in `Notification
  status` (`checkmark--outline`, `error`, `warning`, `information`,
  `close`), inlined: the package does not depend on `@carbon/icons-react`
  at runtime.
- **Timing (WCAG 2.2.1).** 5s; 10s with an action; a `danger` toast stays
  until dismissed. The clock stops while the pointer is over the region,
  while focus is inside it, and while the document is hidden, and starts
  again from the full duration.
- **One live region, always mounted.** `Toaster` renders a
  `section[role=region]` with a name, and inside it a polite live list. A
  `danger` toast is also `role="alert"`, so it interrupts. The list exists
  before anything is put in it, which is what makes a screen reader
  announce it. The tone is only a shape to the eye, so it is said in words:
  "Error: Couldn't send the invite".
- **No exit animation.** A toast arrives with a slide and leaves at once:
  leaving with one means keeping it mounted after it is dismissed.
- **F6 moves focus to the newest toast**; Esc inside the region dismisses
  the focused toast and returns focus to where it was. The docs page says
  what no key can fix: a toast is never the only way to an action.
- **The top layer.** The region is a `popover="manual"`, open from the
  start and while empty: a closed popover is `display: none`, and a live
  region that is not rendered is not listening when the first toast
  arrives. On every arrival it is closed and opened in one task (not while
  focus is inside it), so it sits above whatever entered the top layer
  since; nothing is painted between the two, so the toasts showing do not
  fade in again. No z-index, no portal.
- **Known limit, recorded and not solved.** A modal `<dialog>` makes
  everything outside it inert, the top layer included: a toast raised while
  a Dialog is open is drawn above it, cannot be pressed, and is not
  announced. Close the Dialog first, or say it inside the Dialog.
- **An imperative `toast()` over a module store**, read with
  `useSyncExternalStore`. No provider and no context, callable from outside
  React. The Compiler lint refuses a component reassigning a module
  variable, so the store is module functions (the Tooltip's lesson). The
  server snapshot is the empty list, so nothing reaches the HTML.
- **Three show at once**; the rest wait. A plain list, 8 apart, newest
  nearest the edge. No fanned deck.

## Found by the review, 2026-09-20

A focused toast dismissed with nowhere to give the focus back to lets the
hold go by hand, since a removed element fires no blur. The action's handler
runs after the toast is dismissed, so one that throws cannot leave it up.
`toast()` on the server does nothing: the list there belongs to every
request. F6 pressed from inside the region is left to the browser, so an
error toast that stays does not keep the key. Recorded, not solved: an error
is `role="alert"` inside a polite list and may be announced twice;
`app/ui/ToastSpecimen.tsx` restates the stylesheet by hand.

## Scope

**In.** `Toaster`, `toast`, their types; contrast cases; the `/toast` docs
page, its `contents.ts` entry and section card; `CHANGELOG.md`, README
counts, `MEMORY.md`.

**Out, deliberately.** `toast.promise`. Swipe to dismiss. Rich content, a
title, a description. Colour by tone. Banners and bars. A second Toaster on
one page. Drawing it in Figma.

---

## 1. API

```tsx
<Toaster placement="bottom-end" label="Notifications" />  // once, at the root

const id = toast('Appointment saved', {
  tone: 'success',
  action: { label: 'Undo', onClick: restore },
});
toast.dismiss(id);
toast.dismiss();   // all of them
```

| `toast(message, options?)` | Type | Default | |
|---|---|---|---|
| `message` | `string` | required | |
| `tone` | `'neutral' \| 'success' \| 'danger' \| 'warning' \| 'info'` | `'neutral'` | Neutral has no icon. |
| `action` | `{ label: string; onClick: () => void }` | — | Pressing it dismisses the toast. |
| `duration` | `number` (ms, `Infinity` to stay) | 5000; 10000 with an action; `Infinity` for `danger` | |
| `id` | `string` | generated | An id already showing updates that toast and restarts its clock. |

Returns the id.

| `Toaster` | Type | Default |
|---|---|---|
| `placement` | `'top-start' \| 'top-center' \| 'top-end' \| 'bottom-start' \| 'bottom-center' \| 'bottom-end'` | `'bottom-end'` |
| `label` | `string` | `'Notifications'` |
| `className` | `string` | — |

## 2. Structure

`section[role=region][aria-label][popover=manual].region.<placement>` >
`div.list[aria-live=polite]` > `div.toast[tabindex=-1]` (`role="alert"` for
`danger`) > `span.icon`?, `span.message` (the tone in words, visually
hidden, then the message), `button.action`?,
`button.close[aria-label="Dismiss"]`.

Not a list: a `li` that is a `status` is no longer a list item, and the `ol`
around it fails axe.

Every selector is compound; nothing is reached by descent.

## 3. Geometry and paint

| | |
|---|---|
| Surface, text | `surface/inverse`, `text/inverse`, body/md Medium |
| Min height | 48 |
| Width | 288 to 360; the message wraps |
| Padding | 16 inline-start, 8 inline-end, 8 block |
| Gap | 8 |
| Radius | `xl` |
| Shadow | `elevation/lg` |
| Icon | 20 |
| Close | 32 square, radius `lg`, icon 20 |
| Action | 32 tall, 8 inline, radius `lg`, Semibold, underlined |
| From the viewport | 24; between toasts 8 |
| Under 480 wide | the region spans the viewport less 16 each side, at the bottom |

It arrives over `duration/travel` on the `enter` curve, 8px from its edge
with a fade, through `@starting-style`. Under reduced motion it keeps the
fade and drops the travel, as the roadmap set down.

## 4. Contrast cases

- `text/inverse` on `surface/inverse`, and under both washes — AA.
- The wash over `surface/inverse` is a surface step in both modes.
- `surface/inverse` against `surface/base`, `raised` and `overlay` — 3:1 as
  a boundary, recorded at 15 and up.
- `border/focus` on `surface/inverse` recorded at 4.96 and 1.64: the reason
  the ring is `currentColor`.

## 5. Tests

`store.test.ts`: add, update by id, dismiss one and all, default durations
by tone and action, subscribers told. `Toaster.test.tsx` with the popover
stub and fake timers: region always present and named; status and alert
roles; shows the popover with the first toast and hides it after the last;
three at most, the fourth arrives when one goes; auto-dismiss at 5s and 10s,
never for danger; hover, focus and a hidden document stop the clock; the
action calls and dismisses; close dismisses; F6 focuses the newest; Esc
dismisses and returns focus; the stylesheet's rules (manual popover reset,
compound selectors, `currentColor` ring and no `border-focus`, reduced
motion); axe.

## 6. Checked by hand after the build

Both modes, in the Browser pane: the corner and the 24; three stack and the
fourth waits; hover stops the clock; F6 and Esc; over an open DropdownMenu;
at 320 wide; the six placements.
