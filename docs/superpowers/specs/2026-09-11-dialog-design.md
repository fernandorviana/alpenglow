# Dialog — design

A modal dialog, drawn in the Alpenglow Figma file (the Modals and Overlay
pages), built on the native `<dialog>`. It is the consumer `surface/scrim` has
waited for, and the piece a dense, data-heavy interface needs to confirm an
action or hold a short form.

## Decisions taken with Fernando, 2026-09-11

- **Native `<dialog>` with `showModal()`.** The platform supplies the top
  layer, an inert page behind, Esc as a `cancel` event, focus return and a
  `::backdrop`. The same trade Select, DropdownMenu and DatePicker make.
  Rejected: the popover API, which leaves the page readable behind the dialog;
  a portal with `role="dialog"` and hand-managed `inert`, which is more code
  to reach what the element already does.
- **The backdrop is the drawn one.** The Figma Overlay is `gray-light/200` at
  95% opacity (read from the exported PNG's alpha: 242/255), not the black
  wash `surface/scrim` held until now. Dark was never drawn; see §3.
- **The title is `text/primary`, not the drawn `text/tertiary`.** A dialog's
  title is its most important text; tertiary is the level for helper text and
  timestamps. Tertiary passes AA (5.74:1 light, 5.69:1 dark on
  `surface/overlay`); primary reads 11.26:1 and 12.24:1. Recorded as a
  deviation from the drawing.
- **A click on the backdrop does not close.** Esc, the close button and the
  caller's actions do. A stray click beside a form must not throw away what
  was typed.
- **The back button is optional.** It is drawn at every size, but it exists
  for flows of more than one step; it renders only when `onBack` is given.

## Scope

**In.** `Dialog` and `DialogSize`; a `<dialog>` test stub; an `elevation/lg`
step; `surface/scrim` retuned with two new alpha primitives; the `/dialog` docs
page and its navigation entry; the stale `use` notes in `theme.ts`; README and
`MEMORY.md` updates.

**Out, deliberately.**

- `role="alertdialog"` for destructive confirmations — its initial-focus and
  description rules are a separate design.
- Non-modal dialogs, drawers and sheets.
- Closing on a backdrop click (see above).
- Updating the Figma file's `color/surface/scrim` variable and primitives to
  the new values. It writes to Fernando's file, so it is asked for separately
  after the code lands.

---

## 1. API

```tsx
<Dialog
  open={open}
  onClose={() => setOpen(false)}
  title="Add staff member"
  size="md"
  onBack={goToStepOne}
  actions={
    <>
      <Button variant="outline" tone="neutral" onClick={() => setOpen(false)}>Cancel</Button>
      <Button type="submit" form="staff">Save</Button>
    </>
  }
>
  <form id="staff">…</form>
</Dialog>
```

```ts
export type DialogSize = 'xs' | 'sm' | 'md' | 'lg';

export type DialogProps = {
  open: boolean;
  /** Esc and the close button call it. The caller decides whether to close. */
  onClose: () => void;
  /** The dialog's accessible name, shown in the header. */
  title: string;
  /** 320, 480, 640 or 960px wide. Defaults to `md`. */
  size?: DialogSize;
  /** Shows the back button. For flows of more than one step. */
  onBack?: () => void;
  /** The footer's buttons, in reading order. No footer without them. */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};
```

- **Controlled.** An effect calls `showModal()` when `open` turns true and
  `close()` when it turns false. The component never closes itself: the
  `cancel` event (Esc) is prevented and turned into `onClose()`, so a caller
  holding unsaved input can refuse.
- **Named by its title.** The `<dialog>` carries `aria-labelledby` pointing at
  the `<h2>` title.
- **`DialogSize` is its own type.** It measures widths; `ControlSize` measures
  control heights.
- **Initial focus is the platform's:** the first focusable element, or an
  element the caller marks `autoFocus` — the first field of a form. The page
  says so, with the form example doing it.
- **Header buttons belong to the component.** Close (`aria-label="Close"`) and
  back (`aria-label="Back"`) are `<button type="button">`, with inline SVG
  icons as Calendar draws its own. The package keeps no runtime dependency.
- **The page does not scroll behind an open dialog.** One rule,
  `:global(html:has(dialog:modal)) { overflow: hidden; }`, no JavaScript.
- `'use client'`: it uses `useEffect`, `useRef` and `useId`.

## 2. Layout

As drawn, all four sizes:

| Part | Measure |
|---|---|
| Surface | `surface/overlay`, radius 16px (`radius/2xl` in code, `radius/xl` in Figma — the scales name it one step apart) |
| Width | 320 / 480 / 640 / 960px, never wider than the viewport less 16px each side |
| Height | content-sized, never taller than the viewport less 16px each side; the body scrolls, header and footer stay |
| Header | 88px: 24px padding; 40px back and close buttons at each end; title centred between them |
| Title | `subheading/lg` (20/24, −0.3), weight 600, `text/primary`, one line, truncated with an ellipsis |
| Header buttons | 40px circle, `surface/base` ground, `text/secondary` icon, the system's focus ring |
| Dividers | `border/subtle`, hairline, inset 24px, under the header and over the footer |
| Body | 40px padding |
| Footer | 32px above and below the actions |
| Actions, `sm` `md` `lg` | a row inset 40px, at most 560px wide and centred, each action an equal share, 16px apart |
| Actions, `xs` | stacked in DOM order — the first on top — inset 24px, 8px apart, each full width |

On `lg` the drawn actions stay 592px wide and centred rather than stretching to
880px; the 560px cap is that.

The drawing's `lg` has no header divider in its layer list but shows one in the
render; every size gets it.

## 3. Tokens

### `elevation/lg`

Light as drawn: `0 14px 64px -4px` and `0 8px 22px -6px`, both `#18274B` at
12%, rendered through the existing shadow ink `alpha/ink-12`.

Dark was not drawn. The same decision as `md`: the lg geometry with the
modest dark colours `md` already uses (`alpha/black-32`, `alpha/black-48`),
and the surface takes a `border/default` hairline in dark, written twice like
DropdownMenu's. `elevation.test.ts` covers the new step without change.

### `surface/scrim`

| Mode | Value | New primitive | Dialog against the scrim over `surface/base` |
|---|---|---|---|
| Light | `gray-light/200` at 95% | `alpha/mist-95` | 1.24:1 (the black 48% it replaces: 3.90:1) |
| Dark | `gray-dark/900` at 95% | `alpha/ink-95` | 1.43:1 (the black 64% it replaces: 1.52:1) |

- In light the dialog is separated from the wash by its shadow, as `raised`
  is from `overlay` (invariant 1). The number is recorded, not treated as a
  failure: WCAG 1.4.11 asks 3:1 of a control's boundary, and the dialog's edge
  is not the only cue that a dialog is open.
- The literal dark mirror of the drawing, `gray-dark/600` at 95%, measures
  1.01:1 — the dialog would vanish into its own backdrop — so dark uses the
  system's darkest ink.
- `alpha/ink-95` joins the two shadow inks; the primitive comment that says
  the ink exists at "the two opacities the elevation layer uses" changes to
  say what the third is for.
- `npm run build:css` regenerates `tokens.css` and the Tailwind theme; the
  generated-file tests cover both primitives with no new case. The contrast
  suite already excludes the scrim, and the Colour page already composites it
  over `surface/base`.

### `theme.ts` notes

- `surface/scrim`: *Modal backdrop* stays, now true.
- `surface/sunken`: *Wells, progress tracks* becomes what uses it — read-only
  fields, the checkbox and radio box, the neutral badge, the avatar overflow
  count.
- `surface/inverse`: *Tooltips, inverted banners* becomes *Avatar fill*.

## 4. Tests

`src/test/dialog.ts`, a `<dialog>` stub for jsdom 30, which has no
`showModal`, `close` or `open` reflection. Like `popover.ts`: it covers what
the component calls, flips `open`, fires `close`, lets a test dispatch
`cancel`, and asserts in its own test that jsdom still lacks the API — the day
it ships, the stub is deleted.

`Dialog.test.tsx`:

- named by its title (`getByRole('dialog', { name })`);
- `open` true shows it, false closes it;
- Esc dispatches `cancel`, which is prevented and calls `onClose`, and the
  dialog stays open until the caller changes `open`;
- the close button calls `onClose`; the back button exists only with `onBack`
  and calls it;
- a click on the dialog element itself (the backdrop) does not call `onClose`;
- no footer without `actions`;
- an `autoFocus` field in the body receives focus on open;
- `size` sets the width class, `md` by default;
- axe: no WCAG A or AA violation open, with `onBack` and actions.

Covered with no new case: `'use client'` (`directives.test.ts`), box sizing
(`box-sizing.test.ts`), the build (`check:package`), the page (axe sweep).

Not testable in jsdom, checked by hand in Chrome and recorded on the page only
once done: focus returns to the opener, the page behind is inert, the dialog is
in the top layer, the page does not scroll, Esc closes, the backdrop in light
and dark.

## 5. Documentation

`/dialog`, in the Components group:

- a button per size opening that size;
- a form dialog, its first field `autoFocus`, Cancel and Save;
- a two-step flow whose second step shows the back button;
- the props table;
- *Decisions*: the scrim as drawn with its ratios and the dark choice, the
  title as primary with both ratios, no close on a backdrop click;
- *Accessibility*: native modal, name from the title, Esc through `onClose`,
  initial focus, what was checked by hand.

`app/colour/page.tsx` needs nothing: it already composites the scrim.

## 6. README and `MEMORY.md`

- README: *81 opaque colours plus 14 alpha values — twelve on the black and
  white ramps, two shadow inks* becomes 16 — twelve on the ramps, three inks,
  one mist. The README lists no components, so nothing else changes there.
- `MEMORY.md`: Open work §1 loses `surface/scrim` (it has a consumer); the
  Vocabulary or Conventions entry for `DialogSize`; the invariant that a
  click on the backdrop does not close, with the reason; the verification test
  count.

## Addendum — found while planning, 2026-09-11

- **`initialFocus`, not `autoFocus`.** React 19's client renderer does not
  write the `autofocus` attribute — it calls `focus()` at mount, while the
  dialog is still closed — and only `renderToString` writes it, so
  `showModal()` would find an `autoFocus` field on a server-rendered page and
  not on a client-rendered one. `DialogProps` gains
  `initialFocus?: RefObject<HTMLElement | null>`, focused after `showModal()`.
  §1's *initial focus* and §4's `autoFocus` test read accordingly.
- **A close the platform forces calls `onClose`.** Chrome's close watcher
  fires a cancelable `cancel` only after user activation; a second Esc without
  it closes with no `cancel`. The `close` event calls `onClose` whenever `open`
  is still true. The caller can refuse one Esc, not two.
- **The header buttons are `interactive/neutral`, not `surface/base`.** The
  same primitive in light; in dark `surface/base` is a step below the overlay,
  `interactive/neutral` a step above, as the Calendar's month buttons have it.
- **Header and footer are `<div>`s.** Outside sectioning content, `<header>`
  and `<footer>` are the page's banner and contentinfo landmarks.
