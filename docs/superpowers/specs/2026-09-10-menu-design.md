# Menu — design

> **Renamed during execution.** The component shipped as `DropdownMenu`, at
> `/dropdown-menu`. "Menu" alone is also what a site's navigation is called,
> and navigation menus are planned — a different pattern, for which
> `role="menu"` is the wrong role. "Dropdown menu" names both how it appears
> and what it holds. The rest of this document keeps the name it was designed
> under.

**Figma:** page `__ Dropdown` in the source design file (the file key is kept
out of this repository), variant set `628:10566`, 15 variants.

## Why it is called Menu

The Figma page is called "Dropdown". "Dropdown" is an umbrella over two
components with different semantics: a list of commands (`role="menu"`) and a
list of values (`role="listbox"`). Eight of the drawn variants are the first;
seven — the checkbox, radio, switch and avatar rows, and the Cancel/Apply
footer — are the second.

This spec covers the first and calls it `Menu`, so the second has a name left
to take. The documentation page says so, and cites the Figma page it came from.

## Scope

**In.** The overlay surface; a trigger; rows carrying a label, an optional
leading icon, an optional trailing icon, a tone and a disabled state; group
labels; separators; keyboard and pointer behaviour; the elevation token the
surface needs.

**Out, deliberately.** The selection listbox (checkbox / radio / switch /
avatar rows, and the Apply/Cancel footer) gets its own spec. Submenus, which
are not drawn. Menu items that navigate (`<a role="menuitem">`), which are not
drawn either and are cheap to add when something needs one.

---

## 1. Token work

Three of these land outside the component and are the reason this is
architectural rather than a new file in `src/components`.

### 1.1 A new moded layer: `src/tokens/elevation.ts`

The system argues in `theme.ts` that in light, `surface/raised` and
`surface/overlay` are both white and *the shadow separates them* — and no
shadow token exists. The Menu is the first component that needs it.

Elevation cannot live in either existing layer. The theme layer is typed as
colour aliases and the contrast suite iterates its keys; the scale layer must
not vary by mode, and this does. So: a fourth file, moded, with **one step**.
`sm` and `lg` exist in the drawing; they land when a component asks.

```ts
type ShadowLayer = {
  y: number;
  blur: number;
  spread: number;
  colour: AlphaPrimitiveName;
};

export const elevation = {
  md: {
    light: [
      { y: 10, blur: 32, spread: -4, colour: 'alpha/ink-10' },
      { y: 6,  blur: 14, spread: -6, colour: 'alpha/ink-12' },
    ],
    dark: [
      { y: 10, blur: 32, spread: -4, colour: 'alpha/black-32' },
      { y: 6,  blur: 14, spread: -6, colour: 'alpha/black-48' },
    ],
  },
} satisfies Record<string, Record<Mode, ShadowLayer[]>>;
```

`satisfies` forces the colour to be an alpha primitive that exists — the same
discipline `theme.ts` uses to stop an alias pointing at a missing primitive.

**This is not a fourth Figma collection.** Effects are styles there, not
variables. The three-collection architecture in `MEMORY.md` is unchanged.

`scripts/build-css.ts` gains an `elevationBlock(mode)` emitted next to
`themeBlock(mode)` in all three places — `:root`, the
`prefers-color-scheme: dark` query guarded by `:not([data-theme="light"])`,
and `[data-theme="dark"]` — producing `--ap-elevation-md`.

The geometry is shared by both modes. Only the ink changes: the same light,
a different room.

### 1.2 Two new alpha primitives: `alpha/ink-10`, `alpha/ink-12`

The drawn shadow is `#18274B` at 10% and 12%. That navy exists nowhere in the
palette, and the alpha ramp holds only pure black and white at
`04/08/16/32/48/64`.

Rounding to the ramp was the first proposal. It was measured and rejected:

| Candidate, over white | Result | ΔE76 to the drawn value |
|---|---|---|
| drawn ambient `#18274B` @10% | `#E8E9ED` | — |
| drawn contact `#18274B` @12% | `#E3E5E9` | — |
| `alpha/black-08` (ambient) | `#EBEBEB` | 2.20 |
| **`alpha/black-16` (contact)** | `#D6D6D6` | **5.70 — visible** |
| black @10% / @12% | `#E6E6E6` / `#E0E0E0` | 2.35 / 2.77 |
| **`gray-dark/900` @10% / @12%** | `#E7E7E8` / `#E2E2E4` | **1.73 / 1.57** |
| `blue/900` @10% / @12% | `#E7E9EF` / `#E2E4EB` | 1.08 / 1.58 |

The contact layer at `black-16` is a ΔE of 5.70 — well past the ~2.3 just
noticeable difference. Reaching the drawn opacities needs new primitives
either way, so the question became *which ink*.

`gray-dark/900` (`#10111A`) wins: it is the system's own darkest ink, so no
new colour enters the palette, and it lands within ΔE 1.8 of the drawing on
both layers. `blue/900` is marginally closer on the ambient layer and was
rejected — it is the info ramp, and a shadow is not information.

They are named `alpha/ink-10` and `alpha/ink-12` rather than extending
`alpha/black-*`, because they are not on the doubling ramp and should not look
as though they are. They exist at two opacities because the shadow uses two.

Dark uses `alpha/black-32` and `alpha/black-48`, already on the ramp. There is
no drawing to match in dark (see 1.3), and at those opacities over a near-black
ground the tint is below threshold.

### 1.3 The dark shadow was never drawn, and cannot do the job alone

The source library has `Drop Shadow` in `sm`, `md` and `lg` for Light Mode,
and **only `sm` for Dark Mode**. The menu is drawn with `md`. Dark elevation is
therefore a decision, not a reading.

Measured — the darkest point of the shadow against the ground it falls on:

| | Shadow | Ratio vs its ground |
|---|---|---|
| light, over `surface/overlay` (white) | black @8% | **1.19:1** |
| dark, over `surface/base` | black @16% | 1.04:1 |
| dark, over `surface/base` | black @32% | 1.09:1 |
| dark, over `surface/base` | black @48% | 1.13:1 |
| dark, over `surface/base` | black @64% | **1.16:1** |

**An 8% shadow in light does more than a 64% shadow in dark.** This is
invariant 1 of `MEMORY.md` — "in dark, shadows stop reading as elevation" —
measured for the first time rather than asserted.

Two consequences.

**The dark shadow stays, but stays modest.** Pushing it to 48/64% buys 0.07 of
ratio and costs a smear. It renders a soft contact and nothing more.

**In dark the surface takes a 1px border.** This is invariant 4 applied
exactly as written — when the elevation ramp runs out, separate with a border
rather than inventing a step. `border/default` is the token whose `use` reads
"Cards and containers — decorative":

| | vs `surface/overlay` | vs `surface/base` | vs `surface/raised` |
|---|---|---|---|
| `border/default`, light | 1.40:1 | 1.31:1 | 1.40:1 |
| `border/default`, dark | 1.35:1 | **1.77:1** | 1.53:1 |

Against the canvas the border is *stronger* in dark than in light — which is
the point, and why light does not get one. In light the shadow already
separates; adding a border there would draw the edge twice.

**The border is asymmetric between modes on purpose.** It is the same shape as
invariant 1 and belongs beside it.

### 1.4 The radius names are off by one between the two files

| | Figma | Alpenglow |
|---|---|---|
| `md` | 8 | 6 |
| `lg` | 12 | 8 |
| `xl` | — | 12 |

The drawing's surface radius is `radius/lg` = 12, which is **`radius/xl`**
here. Its row radius is `radius/md` = 8, which is **`radius/lg`** here.
Reading the names across instead of the numbers would shrink both.

### 1.5 `surface/overlay`, not `surface/raised`

The drawing paints the menu `surface/raised`. In light the two tokens are both
white, so the drawing cannot tell them apart. In dark, `raised` would put the
menu on the same step as the card it opens over.

`surface/overlay` is the token whose `use` string reads "Modals, popovers,
dropdowns". This is the first component to claim it, and it removes one entry
from the "tokens still promise components that do not exist" list in
`MEMORY.md`.

---

## 2. The component

### 2.1 API

```tsx
<Menu
  trigger={(props) => <Button variant="ghost" {...props}>Actions</Button>}
  items={[
    { id: 'edit',   label: 'Edit',    icon: <Edit />,  onSelect: … },
    { id: 'share',  label: 'Share',   iconEnd: <ArrowUpRight />, onSelect: … },
    'separator',
    { id: 'add',    label: 'Add new', icon: <Add />, tone: 'accent', onSelect: … },
    { id: 'delete', label: 'Delete',  tone: 'danger', onSelect: … },
  ]}
/>
```

```ts
export type MenuItemTone = 'default' | 'accent' | 'danger';

export type MenuAction = {
  /** Stable identity. React key, and the typeahead target. */
  id: string;
  label: ReactNode;
  /** 20px slot, leading. */
  icon?: ReactNode;
  /** 20px slot, trailing. The drawing's "Icon on the Right". */
  iconEnd?: ReactNode;
  tone?: MenuItemTone;
  /** Skipped by every form of navigation. See 4.3. */
  disabled?: boolean;
  /** Typeahead reads this when `label` is not a plain string. */
  textValue?: string;
  onSelect?: () => void;
};

export type MenuGroup = { label: string; items: MenuAction[] };
export type MenuEntry = MenuAction | MenuGroup | 'separator';

export type MenuTriggerProps = {
  id: string;
  /** React 19's spelling. The DOM attribute is `popovertarget`. */
  popoverTarget: string;
  'aria-haspopup': 'menu';
  'aria-expanded': boolean;
  onKeyDown: KeyboardEventHandler;
  style: CSSProperties;   // carries the anchor-name
};

export type MenuProps = {
  trigger: (props: MenuTriggerProps) => ReactNode;
  items: MenuEntry[];
};
```

**The menu has no `label` prop.** It takes `aria-labelledby` pointing at the
trigger's id, which is what the APG menu button pattern asks for. A trigger
with visible text names the menu with that text; an icon-only trigger already
has to carry its own `aria-label`, and that names the menu too. A separate prop
would be a second place for the same name to be wrong.

**A separator is the string `'separator'`, not an object.** It discriminates
the union on `typeof e === 'string'` and reads as what it is. A group
discriminates on `'items' in e`.

**"Add new" is not a variant.** In the drawing it is an accent-toned row with
an icon, below a separator — three things the caller composes. Encoding a
layout convention as a component feature would make it the only way to do it.

**`onSelect` sits on the row, not on the menu.** This diverges from `Table`,
which puts its callbacks at the top, and the reason is that a table's rows are
data with uniform behaviour while a menu's rows are each their own behaviour. A
menu-level `onSelect(id)` would force a six-branch `switch` on every caller.

**`trigger` is a render prop, not a cloned element.** It receives
`popoverTarget`, `aria-haspopup`, `aria-expanded`, `onKeyDown` and a `style`
carrying the `anchor-name`. It is the same shape as `Column.cell` on `Table`,
and it avoids `cloneElement` guessing where to put the props.

**No `size` prop.** The drawing has one row height, 40px, which is already the
`md` of every other control, so a menu and a field line up. Inventing `sm` and
`lg` here would deepen open-work item 4 rather than serve it.

### 2.2 Anatomy

| Part | Value | Token |
|---|---|---|
| Surface fill | — | `surface/overlay` |
| Surface radius | 12 | `radius/xl` |
| Surface padding | 8 | `spacing/100` |
| Surface shadow | — | `--ap-elevation-md` |
| Surface border, dark only | 1 | `border-width/hairline` + `border/default` |
| Gap between groups | 4 | `spacing/050` |
| Row height | 40 | — |
| Row padding | 8 vertical, 12 horizontal | `spacing/100`, `spacing/150` |
| Row radius | 8 | `radius/lg` |
| Gap, `icon` to label | 12 | `spacing/150` |
| Gap, label to `iconEnd` | 8 | `spacing/100` |
| Row label | 14 / 22, medium | body `md` |
| Group label | 12 / 16, +0.2, medium | caption `md`, `text/tertiary` |
| Group label padding | 8 vertical, 12 left, 8 right | `spacing/100`, `spacing/150` |
| Separator | 1px, inset 12 | `border/subtle` |
| Icon slot | 20 × 20 | — |

The separator is `border/subtle`, not the drawn `surface/sunken`. The two
resolve to the same primitive in light (`gray-light/100`); `border/subtle` is
the token that means "divider", and in dark it is the one that stays a divider.

**Icon slots inherit `currentColor`.** The drawing left them empty — dashed
placeholder squares — so the colour is ours to decide. `control.module.css`
paints its icons `text/tertiary`, which does not serve here: a grey icon beside
a red label splits the row in two. The icon takes the row's tone.

### 2.3 Tone, and the fill it hovers to

**Each tone hovers to its own subtle surface.** This started as a rule for the
danger row only and became uniform when `text/accent` was measured on the
neutral fill.

| Tone | Label | Hover fill |
|---|---|---|
| `default` | `text/primary` | `interactive/neutral-hover` |
| `accent` | `text/accent` | `surface/accent-subtle` |
| `danger` | `text/danger` | `surface/danger-subtle` |

Label against its own hover fill:

| | light | dark |
|---|---|---|
| `text/primary` on `interactive/neutral-hover` | 9.67:1 | 9.08:1 |
| `text/accent` on `surface/accent-subtle` | 4.93:1 | 5.00:1 |
| `text/accent` on `interactive/neutral-hover` | 4.80:1 | **3.50:1 — rejected** |
| `text/danger` on `surface/danger-subtle` | 5.64:1 | 5.74:1 |

At rest, on `surface/overlay`: `text/primary` 11.26 / 12.24, `text/tertiary`
5.74 / 5.69, `text/accent` 5.59 / 4.72, `text/danger` 6.95 / 8.23.

**The hover fill is measured in ΔE, not in contrast ratio.** The accent fill in
dark is 1.06:1 against the surface, which reads as invisible and is not — it is
a hue change, and the WCAG ratio is a luminance-only measure that misses it
entirely:

| Hover fill vs `surface/overlay` | Ratio | ΔE76 |
|---|---|---|
| `interactive/neutral-hover`, light | 1.16:1 | 6.32 |
| `interactive/neutral-hover`, dark | 1.35:1 | 8.85 |
| `surface/accent-subtle`, light | 1.13:1 | 9.22 |
| `surface/accent-subtle`, dark | **1.06:1** | **65.86** |
| `surface/danger-subtle`, light | 1.23:1 | 14.14 |
| `surface/danger-subtle`, dark | 1.43:1 | 61.74 |

All six clear the ~2.3 just noticeable difference by a wide margin. Hover is a
secondary channel in any case — it is not the only indicator of anything, and
it is never the thing that identifies a control.

**The danger row loses the drawn border.** The drawing adds 1px of
`border/danger` on hover alongside the fill. Two objections: it appears only on
hover, so it reflows the row by 1px; and it would be the only place in the
system where hover changes geometry, which is the channel reserved for focus.
At ΔE 14.14 and 61.74 the fill is unambiguous on its own.

---

## 3. Placement and dismissal

Native, with no positioning JavaScript. This is the same trade `Select` already
makes and records at the top of `Select.module.css`: take the platform's
behaviour, lose some control over the rendering.

- The surface carries `popover="auto"`. The browser gives the top layer —
  escaping `overflow: hidden` and every stacking context without a portal —
  plus light dismiss, Esc, and focus return to the invoker.
- The trigger carries `popovertarget`.
- Placement is CSS:

```css
.menu {
  position-anchor: var(--menu-anchor);
  position-area: block-end span-inline-end;
  position-try-fallbacks: flip-block, flip-inline;
  position-visibility: anchors-visible;
  margin-block-start: var(--ap-spacing-050);
}
```

The only JavaScript in placement is a `useId()` giving each trigger/menu pair a
unique `anchor-name`, handed to the trigger through the render prop.

### 3.1 The degraded path

CSS anchor positioning shipped in Chrome 05/2024, Safari 09/2025 and Firefox
10/2025. Below those, `popover` still works and the browser centres it.

**That is the fallback, and it is documented rather than papered over.** The
menu stays in the top layer, still closes on Esc and on an outside click, still
navigates by keyboard. It loses its anchor and gains a centred position. Zero
additional JavaScript, and one sentence on the documentation page: *in a
browser older than about 2025, the menu opens centred rather than anchored.*

The alternative considered and rejected: feature-detect with
`CSS.supports('anchor-name: --a')` and hand-write the old path — absolute
positioning in a relative wrapper, with outside-click and Esc handlers. It
restores visual fidelity on old browsers by writing exactly the code the native
choice exists to avoid.

---

## 4. Semantics and keyboard

The APG menu button pattern. `aria-haspopup="menu"` and `aria-expanded` on the
trigger; `role="menu"` and `aria-label` on the surface; `role="menuitem"` and
`tabindex="-1"` on rows, with roving focus. A group is `role="group"` with
`aria-labelledby` pointing at its label; a separator is `role="separator"`.

### 4.1 Keys

| Key | On the trigger | In the menu |
|---|---|---|
| Enter / Space | open, focus the first row | activate, close |
| ↓ | open, focus the first row | next, wrapping |
| ↑ | open, focus the **last** row | previous, wrapping |
| Home / End | — | first / last |
| a–z | — | typeahead on the first character |
| Esc | — | close, focus returns to the trigger |
| Tab | — | close, tabbing continues |

`popover="auto"` already provides Esc, outside click and focus return. Four
things remain ours: focusing the first row on the `toggle` event, opening from
the trigger with ↑/↓, the roving focus, and closing on Tab — which `popover`
does not do and the APG asks for.

### 4.2 The pointer moves focus

Entering a row with the pointer calls `focus()` on it.

Without this there are two highlights at once — the one the pointer is over and
the one the keyboard holds — and neither answers "what happens if I press Enter
now". With it there is always exactly one highlighted row, and it is always the
one that will be activated.

The focus ring fits inside the surface's 8px padding: 2px of ring at a 2px
offset. It is not clipped.

### 4.3 Disabled rows are skipped, not focusable

A disabled row is skipped by the arrows, by Home/End and by typeahead, carries
no `tabindex`, takes no hover fill, and is not focused by the pointer. It keeps
`role="menuitem"` and `aria-disabled="true"`, so a screen reader in browse mode
still finds it — the discoverability stays, the dead end does not. Cursor is
`not-allowed`, as everywhere else in the system.

`text/disabled` on `surface/overlay` is 2.77:1 light and 2.66:1 dark. Both are
below AA and both are exempt: WCAG 2.1 excludes inactive components. The
recorded exemption in `contrast.test.ts` is measured against `surface/raised`;
the dark figure on `surface/overlay` is 2.66 rather than 3.02, and the test
gains the second surface.

**Edge case.** If every row is disabled, focus goes to the menu surface itself
on open, so the popover is not a focus black hole.

**This is an addition to the drawing**, which has no disabled state. It is
recorded as one — open-work item 7 of `MEMORY.md` exists because the Loader
added silently and the Table's `compact` was nearly deleted as drift.

---

## 5. Testing

jsdom performs no layout, so no placement is assertable in any of these
options. The house pattern already solves this: `Button.test.tsx` reads the
stylesheet and asserts the selector invariant.

**Against the stylesheet.**

- `.menu` uses `--ap-color-surface-overlay`, and not `-raised`.
- `.menu` uses `--ap-elevation-md`.
- The dark border rule exists, and only under the two dark selectors.
- Each tone's hover rule names its own fill token.
- The hover rule carries `:not([aria-disabled='true'])` — the same shape as
  Button's `:not(.loading)` guard, and the regression guard for 4.3.
- The `@supports not (anchor-name: --a)` branch exists.

**Against the DOM.** jsdom 30 implements none of the popover API, and its UA
sheet hides every `[popover]`. (This section first said the opposite; the
probe during implementation corrected it.) The test file stubs show, hide,
toggle, the queued `toggle` event and invoker clicks — what the component calls
and what the trigger relies on — with a guard test that fails once jsdom ships
the real API. Esc, light dismiss, focus return, the top layer and placement are
the platform's: verified in a real browser, not asserted here.

Arrows skip disabled rows · Home/End land on the first and last *enabled* row ·
Tab closes · typeahead skips
disabled rows · `onSelect` fires and the menu closes · a disabled row fires
nothing · the `role`, `aria-expanded` and `aria-labelledby` wiring · every row
disabled focuses the surface.

**Outside the component.**

- `generated.test.ts` gains a case: `--ap-elevation-md` appears in all three
  blocks and the dark value differs from the light one.
- The contrast suite derives its pairs from the theme keys, and
  `interactive/neutral-hover` is not currently among the surfaces text is
  checked against. The Menu introduces three real pairings. The derivation is
  extended to treat the tone hover fills as surfaces, rather than listing pairs
  by hand — a hand-kept list is how `success` shipped untested.

---

## 6. Documentation

- **`app/menu/page.tsx`**, linked from `Nav` under Components. Anatomy with the
  measured figures in the evidence gutter, the keyboard table, the degraded-path
  sentence, and the five divergences from the drawing declared in one place.
- **Elevation goes on `/space`** ("Space and shape") — it is the third
  dimension of shape, beside spacing and radius. Both modes side by side, with
  the ΔE of the ink and the 8%-beats-64% measurement.
- **`/decisions`** gains the dark border and the tone hover fills.
- **`MEMORY.md`**: `surface/overlay` leaves the list of tokens promising
  components that do not exist; the dark border and the elevation layer join
  the invariants; `MenuItemTone` joins open-work item 5 as a fourth tone
  vocabulary.

## 7. Register of divergences from the drawing

Five, each with the measurement that caused it.

1. `surface/overlay` replaces `surface/raised` — indistinguishable in light,
   wrong by one elevation step in dark.
2. `radius/xl` and `radius/lg` replace the drawn `lg` and `md` — the two files'
   radius names are off by one; the numbers are unchanged at 12 and 8.
3. The hover fill follows the row's tone rather than being `surface/base` for
   all rows — `surface/base` is *darker* than the menu in dark, and
   `text/accent` on the neutral fill is 3.50:1 in dark.
4. The danger row's hover border is dropped — it reflows the row by 1px and
   would be the only hover in the system that changes geometry.
5. The surface takes a 1px `border/default` in dark, which is not drawn — a
   64% shadow in dark reaches 1.16:1 against its ground where an 8% shadow in
   light reaches 1.19:1.

Plus two additions the drawing does not contain: the `disabled` row state
(4.3), and the dark elevation values, which were never drawn (1.3).

## 8. Follow-ups this creates

- The selection listbox — the other seven variants — needs its own spec.
- `MenuItemTone` is the fourth tone vocabulary in the system. Open-work item 5
  of `MEMORY.md` is unchanged by this work and slightly more expensive.
- `elevation.sm` and `elevation.lg` exist in the drawing and are unbuilt.
- A menu item that navigates (`<a role="menuitem">`) is not drawn and not
  built.
