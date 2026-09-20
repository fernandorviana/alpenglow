# Alert — design

The fourth component of wave 1 of the completeness roadmap
(`2026-09-18-completeness-roadmap.md`).

**It is drawn**: the published `Notification status` component set on the
*Notifications* page of the Figma file. 880 by 56, radius 12, a 20 icon, a
14/22 Medium message with a Semibold fragment, on `surface/*-subtle` with
`text/*`; four states (Info, Danger, Success, Alert) and three shapes (a 24
round close, no button, one filled 32 action pill). The three "7 days left
on your trial" bars on the same page are banners, which Fernando will draw
with the other bars, and are not this component.

## Decisions taken with Fernando, 2026-09-20

- **Every edge is soft.** The drawing is not consistent with itself: Danger
  and Success are edged in `border/danger` and `border/success`, the theme's
  600 stops, and Info and Alert in `glacier/200` and `amber/300`, primitives
  with no token. Shown the drawing, all four strong and all four soft, he
  chose soft. Four tokens are added, `border/{info,success,warning,danger}-subtle`,
  named after the surfaces they edge. Light is the drawn stops, with
  `ember/200` and `moss/200` for the two that were drawn strong. Dark is
  `*/700`. Measured on their surfaces: 1.25 to 1.60 light, 1.90 to 2.05
  dark. Decorative, recorded and held to no floor.
- **The action is an outline in the text's colour**, "for now". Drawn
  filled with the state's colour, which has tokens for success and danger
  only; filling info and warning would take about eight more
  (`interactive/info`, `-hover`, `-pressed`, `on-info`, and the same for
  warning), and white on the drawn `glacier/500` is about 3.4:1. The outline
  takes `currentColor`, which is already 7.2:1 or more on the surface, and
  the theme's wash for hover, under which the text stays above 6:1. The
  filled action returns when the theme has those fills.

## Decided by the repository's conventions, for Fernando to overturn

- **`warning`, not `alert`**, for the drawn "Alert" state: the Badge and the
  Toast already say `warning`, and a component named Alert with a tone named
  alert reads twice.
- **A `title`, not drawn.** Optional, Semibold, above the message. In use an
  alert often needs a line that names it and a line that explains.
- **It does not hide itself.** `onClose` shows the close and calls back; the
  caller removes the Alert, as with the Dialog.
- **It is not a live region unless asked.** An alert that is in the page when
  it loads must not be announced over the page. `announce` makes it
  `role="alert"` for `danger` and `warning` and `role="status"` for the
  others, for one that is inserted in answer to something. The tone is said
  in words either way, visually hidden, as in the Toast.
- **The close is 32 with a 20 icon**, the Toast's, not the drawn 24: one
  close button across the system, and a larger target.
- **Dark is the tinted surface**, `*/900`, a surface step above a card (ΔL
  .040 to .043), with the `*/700` edge. Not the Badge's dark treatment (the
  sunken surface and an outline): that was chosen for a 24px label, and an
  alert is a panel whose tint is how it is found.
- **Carbon's vectors are shared with the Toast**, moved to
  `src/components/statusGlyphs.tsx`.
- **The focus ring is `border/focus`**, which is 3:1 or more on all four
  surfaces in both modes; the suite holds it.

## Deviations from the drawing, with the reason

1. Two edges become soft (above).
2. The action is an outline (above).
3. The close is 32 (above).
4. The radius is `xl`, 12. The Figma variable is called `radius/lg` and is
   12 there; in the code `lg` is 8 and `xl` is 12. The number is kept.
5. The width is the container's, not 880.
6. The message wraps; the icon and the buttons keep to the first line. Under
   a narrow container the action drops below the message.

## Found by the review, 2026-09-20

The root is `width: 100%`: a size container cannot take its width from its
content, and in a flex row it was 0 wide. `alertTones` is held to `TintTone`
and listed in vocabulary.test.ts, like every component with tones.
`ALERT_NARROW` is the 400 the container query says, held by a test, so the
docs page does not repeat a number. Replacing the search index's total cap
with a per-page one lost the figure the browser actually fetches; it has
both now. The Toaster gained `closeLabel`, which the Alert had. Recorded,
not solved: the tone said to a screen reader is an English word with no
prop, in both.

## Scope

**In.** `Alert`, its types; the four border tokens; `statusGlyphs`; contrast
cases; the `/alert` docs page, its `contents.ts` entry and section card;
`CHANGELOG.md`, README counts, `MEMORY.md`.

**Out, deliberately.** A neutral tone. More than one action. The banners and
trial bars. An alert that dismisses itself or times out. The filled action.
Creating the four variables in Figma, until asked.

---

## 1. API

```tsx
<Alert tone="warning" title="Trial ending" onClose={hide}
       action={{ label: 'Upgrade', onClick }}>
  Your trial ends in <strong>3 days</strong>.
</Alert>
```

| Prop | Type | Default | |
|---|---|---|---|
| `tone` | `'info' \| 'success' \| 'warning' \| 'danger'` | `'info'` | |
| `children` | `ReactNode` | required | The message. `strong` is Semibold. |
| `title` | `string` | — | |
| `action` | `{ label: string; onClick: () => void }` | — | One. |
| `onClose` | `() => void` | — | Shows the close. |
| `closeLabel` | `string` | `'Dismiss'` | |
| `announce` | `boolean` | `false` | |
| `className` | `string` | — | On the root, which is the container. |

## 2. Structure

`div.root` (the size container, `className`) > `div.alert.<tone>[role?]` > `span.icon`, `div.content` (`span.spoken`,
`div.title`?, `div.message`), `button.action`?, `button.close`?.

## 3. Geometry and paint

| | |
|---|---|
| Surface, text, edge | `surface/<tone>-subtle`, `text/<tone>`, hairline `border/<tone>-subtle` |
| Min height | 56 |
| Padding | 12 block; 16 inline-start, 12 inline-end |
| Gap | 8 |
| Radius | `xl` |
| Text | body/md Medium; `strong` and the title Semibold |
| Icon | 20, centred on the first line |
| Action | 32 tall, 16 inline, radius `full`, `border-width/control` in `currentColor`, Semibold |
| Close | 32 square, radius `full`, icon 20 |

12 + 32 + 12 is the drawn 56. The message is 22 tall in a 32 row, so it
takes 5 above and below and a second line grows the alert downward.

## 4. Contrast cases

- `text/<tone>` on `surface/<tone>-subtle`, at rest and under both washes —
  AA, both modes.
- `border/focus` on each surface — 3:1.
- Dark: each surface is a step above a card.
- The four edges recorded: light 1.25, 1.26, 1.60, 1.29; dark 2.05, 2.05,
  1.99, 1.90 (info, success, warning, danger).

## 5. Tests

`Alert.test.tsx`: tone class and default; the tone said in words; title;
`strong`; no role by default, `alert` and `status` under `announce`; close
only with `onClose`, its label, its call; the action's call; the
stylesheet's rules (each tone's three tokens, compound selectors,
`currentColor` outline on the action, reduced motion); axe for every tone.

## 6. Checked by hand after the build

Both modes, in the Browser pane: 56 tall on one line; a long message wraps
with the icon and buttons on the first line; the action drops at 320; the
wash on both buttons; the four tones on a card and on the canvas.
