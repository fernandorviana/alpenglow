---
name: applying-alpenglow-tokens
description: Use when working on the Alpenglow design system — in its Figma file or its React component library. Covers creating or editing variables, picking a colour for a surface, text, border or interactive state, choosing spacing, radius or border width, building or restyling a component, setting up Light/Dark theming, and auditing contrast.
---

# Applying Alpenglow Design Tokens

## Overview

This skill carries **project-specific decisions and measured values you cannot derive**. It deliberately does not teach contrast maths, elevation theory, or why a semantic layer is a good idea — baseline testing showed capable agents already do all of that unprompted, and words spent there are words wasted.

What it does carry:

1. The exact token names and values, with every ratio measured.
2. **Decisions already taken that override what you would correctly choose on your own.** One of them will look like a mistake. It is not — read the section before acting.
3. Constraints the values alone don't reveal: where the ramp runs out, which tokens collide, how focus and error interact.
4. Figma variable **scopes** — the one thing baseline testing showed agents consistently omit.

## When to Use

- Picking any colour, spacing, radius or border width in Alpenglow
- Creating or editing variables in the Alpenglow Figma file
- Building or restyling a component, in Figma or in React
- Setting up or checking Light/Dark behaviour
- Migrating from paint styles to variables

**Not for:** typography (still text styles, not variables), icon assets, avatar images, or the `brand-alt` gradient.

## Quick reference — pick a token

| Styling this | Token |
|---|---|
| Page background | `color/surface/base` |
| Card, panel, table body | `color/surface/raised` — but see *A table inside a modal* |
| Modal, popover, dropdown, menu | `color/surface/overlay` |
| Modal backdrop | `color/surface/scrim` |
| Well, table header, progress track | `color/surface/sunken` — but see *A table inside a modal* |
| Tooltip, inverted banner | `color/surface/inverse` |
| Selected nav item, highlighted row | `color/surface/accent-subtle` |
| Status badge background | `color/surface/<status>-subtle` |
| Heading, body copy | `color/text/primary` |
| Label, metadata | `color/text/secondary` |
| Helper text, timestamp | `color/text/tertiary` |
| Input placeholder | `color/text/placeholder` |
| Disabled label | `color/text/disabled` |
| Link | `color/text/accent` |
| Primary button fill | `color/interactive/accent` |
| Secondary button fill | `color/interactive/neutral` + `border/default` outline |
| Row hover (transient) | `color/interactive/neutral-hover` |
| Row selected (persistent) | `color/interactive/selected` |
| Destructive button fill | `color/interactive/danger` |
| Label on any filled button | `color/interactive/on-<variant>` |
| Divider, row separator | `color/border/subtle` |
| Card outline, **text input outline** | `color/border/default` |
| **Unchecked checkbox or radio** | `color/border/strong` |
| Input in error | `color/border/danger` |
| Focus ring | `color/border/focus` |
| Gap, padding | `spacing/*` |
| Corner radius | `radius/*` |
| Stroke width | `border-width/*` |

**Nothing fits? Stop and ask.** Never fall back to a primitive.

---

## Decisions already made — do not re-derive these

### The text-input border is deliberately non-compliant

`color/border/default` (`#D5DBE1` Light, `#414452` Dark) is used on text inputs, textarea, select, combobox and date picker. It measures **1.40:1 / 1.53:1**, below the 3:1 that WCAG 1.4.11 requires for non-text contrast.

**This is a known, deliberate exception**, decided on 2026-09-07 by the design system owner with the measured ratios in front of them, to preserve the established appearance of the forms this system was derived from.

You are likely to want to change it. Baseline testing confirmed that a careful agent, given this palette and asked to specify input borders, independently arrives at `#868F9F` or darker for compliance — and then flags that a designer will push back. That instinct is correct in general and overruled here specifically. **Do not raise it again, do not "fix" it in passing, and do not quietly use `border/strong` on text fields.**

**The carve-out, which is mandatory:** unchecked checkbox and radio use `color/border/strong`. On a text field the border is one signal among several — label, placeholder, height, padding. On an unchecked checkbox it is the entire control. Checked and disabled states are exempt: a brand fill supplies the contrast, and WCAG 2.1 exempts inactive components.

### Light and Dark are asymmetric on purpose

In Light, `raised` and `overlay` are both white and the shadow separates them. In Dark, shadows stop reading as elevation, so `overlay` must be a lighter colour step. Do not "correct" this into symmetry.

### `gray-light` and `gray-dark` are one ramp

They form a single continuous 20-step neutral scale from `#F6F8FA` to `#10111A`. The names are historical and do **not** mean light-theme and dark-theme. `gray-light/900` (`#778091`) is *lighter* than `gray-dark/050` (`#687185`) — they are adjacent steps, not a mode boundary.

---

## Constraints the values don't show

### The dark ramp is nearly full — 4 elevation levels, no more

`sunken → base → raised → overlay` consumes `gray-dark` 900/800/700/600. Adjacent steps differ by only 1.10–1.16, which is enough to read but leaves no fifth level.

**When you run out of elevation, separate with a border, not another step.** A popover opened inside a modal stays on `surface/overlay` and is outlined with `border/default`. Do not invent `overlay-raised`.

Corollary: `surface/base` must never sit at the floor of the ramp, or `sunken` has nowhere to go. Baseline testing produced exactly this failure — page and table header collapsed onto the same value.

### Two tokens collide if you pick the obvious values

| Trap | What happens | Correct value |
|---|---|---|
| `border/subtle` in Dark as `gray-dark/600` | Identical to `surface/overlay` — **1.00:1, invisible** | `gray-dark/500` `#383A47` |
| `border/strong` as `#868F9F` (Light) or `#687185` (Dark) | Passes on cards, **fails on `sunken` (2.80) / `overlay` (2.66)** | `#778091` in **both** modes |
| `interactive/neutral` in Dark as `gray-dark/600` | Identical to `surface/overlay` — a secondary button on a modal is **1.00:1, invisible** | `gray-dark/500` `#383A47`, ladder 500 → 400 → 300 |

`#778091` is the only value clearing 3:1 against all four surfaces in both themes — it sits mid-ramp, so it contrasts in both directions.

**`border/subtle` on `surface/sunken` is invisible in both modes.** Step up to `border/default` there.

### Shadows in Dark reinforce, they do not carry

Shadows stop being the *primary* elevation signal in Dark — that job moves to the colour step. They are still worth having as reinforcement, which is why correction 6 adds `md` and `lg` Dark Mode shadows. Both statements are true: colour leads, shadow supports. Do not read the first as "no shadows in dark".

### A table inside a modal

The modal is `surface/overlay` (gray-dark/600). A table placed inside it must **not** use `surface/raised` for the body and `surface/sunken` for the header — both are *darker* than their container and the elevation reads backwards.

Inside an overlay, a table keeps `surface/overlay` for the body, separates rows with `border/subtle`, and marks the header with `border/default` beneath it rather than a fill. Same rule as the dropdown-in-modal case: out of elevation, use a border.

**This applies in both modes.** In Light the fills happen to coincide (overlay and raised are both white), but a modal table still uses the border treatment for its header rather than `sunken` — so the two themes stay structurally identical.

### The brand-2 dead zone

`interactive/tertiary` has no third step in Light. `brand-2/700` `#13A89B` fails with **both** possible labels — 3.71:1 with `#034444`, 2.96:1 with white — so there is no compliant pressed value between hover and the point where the label must flip. Light therefore repeats the hover value for pressed. Dark has room and uses `brand-2/300`.

This is a palette limitation, not an oversight. Do not "fix" it by adding a token.

### The `on-*` foreground is a themed token, not a constant

This is the single most valuable rule here. Baseline testing showed a careful agent compute the ratios correctly, conclude that `brand-1/400` drops a white label to 4.18:1, and therefore decide **the palette cannot support a lighter dark-mode hover** — because it never considered changing the label.

Resolution: in Dark, the accent fill **lightens** (`400 → 300 → 200`) *and* the label darkens to `#10111A`. That yields 4.50 / 6.81 / 10.43 — all passing.

**Always pair a fill with its matching `on-*` token. Never assume white.**

The resting Dark pair has **no headroom**: `#10111A` on `#8B60F0` is 4.502:1 against a 4.5 threshold. Do not adjust `brand-1/400`, and do not use a lighter font weight for button labels in Dark.

### Focus and error

- Focus **adds geometry**: a 2px ring (`border-width/ring`) at 2px offset, in `border/focus`. Recolouring the border is not sufficient on its own — colour must never be the only channel carrying a state.
- **The field's own border never changes width.** It stays `border-width/hairline` in every state; only its colour changes, and the ring is added outside it. A 1px → 1.5px step would shift the control's outer box and reflow the form on focus.
- **Error plus focus:** the border stays `border/danger`, and the focus ring is drawn in addition. Focus never replaces the error signal.
- **A focused field's border does not recolour.** It stays `border/default` (or `border/danger` if in error); the ring alone carries focus.
- **The secondary button always carries a `border/default` outline**, in both modes. Its fill is only 1.09:1 against a white card in Light and 1.16:1 against a modal in Dark — the fill alone does not describe the button's shape. The outline does.
- **Disabled drops that outline to `border/subtle`** and removes hover. In Dark `interactive/disabled` resolves to the same value as `interactive/neutral`, so without this the disabled and enabled states would be identical — and colour would be the only channel, which is exactly what the focus rule forbids.
- **Checked checkbox/radio** use `border/accent` at `border-width/control`, matching the unchecked geometry so the box does not resize between states.
- The 2px gap between control and ring shows the parent surface. The ring follows the control's own `radius/*`, stepped up by the 2px offset.
- The ring extends **4px beyond the control** (2px offset + 2px ring). Form fields need at least `spacing/075` (6px) between them, and more at a card edge or table-cell boundary, or focused fields will collide with their neighbours.

---

## Token tables

### color/surface

| Token | Light | Dark | Use |
|---|---|---|---|
| `color/surface/base` | `#F6F8FA` gray-light/050 | `#1A1B25` gray-dark/800 | App canvas |
| `color/surface/raised` | `#FFFFFF` white | `#262733` gray-dark/700 | Cards, panels, table body |
| `color/surface/overlay` | `#FFFFFF` white | `#2F303D` gray-dark/600 | Modals, popovers, dropdowns |
| `color/surface/sunken` | `#EBEEF1` gray-light/100 | `#10111A` gray-dark/900 | Wells, table headers, tracks |
| `color/surface/scrim` | `alpha/black-48` | `alpha/black-64` | Modal backdrop |
| `color/surface/inverse` | `#10111A` gray-dark/900 | `#F6F8FA` gray-light/050 | Tooltips, inverted banners |
| `color/surface/accent-subtle` | `#F2EFFE` brand-1/050 | `#310D84` brand-1/800 | Selected nav, highlighted row |
| `color/surface/success-subtle` | `#B0FFCD` green/200 | `#034624` green/900 | Success badge |
| `color/surface/warning-subtle` | `#FFFBDD` yellow/100 | `#735C0F` yellow/900 | Warning badge |
| `color/surface/danger-subtle` | `#FFE1DB` red/100 | `#8F1818` red/800 | Error badge |
| `color/surface/info-subtle` | `#DEECFF` blue/100 | `#143180` blue/800 | Info badge |

### color/text

Ratios against `surface/raised` in each mode. Every status token also clears AA on its own `*-subtle` surface.

| Token | Light | Dark | Use | L / D |
|---|---|---|---|---|
| `color/text/primary` | `#383A47` gray-dark/500 | `#F6F8FA` gray-light/050 | Headings, body | 11.3 / 13.9 |
| `color/text/secondary` | `#545969` gray-dark/200 | `#C3CAD4` gray-light/400 | Labels, metadata | 7.0 / 9.0 |
| `color/text/tertiary` | `#687185` gray-dark/050 | `#A3ACBA` gray-light/600 | Helper text | 4.9 / 6.5 |
| `color/text/placeholder` | `#778091` gray-light/900 | `#868F9F` gray-light/800 | Placeholders | 4.0 / 4.5 |
| `color/text/disabled` | `#939CAB` gray-light/700 | `#687185` gray-dark/050 | Disabled (WCAG-exempt) | 2.8 / 3.0 |
| `color/text/inverse` | `#FFFFFF` | `#10111A` | On `surface/inverse` | 17.7 / 17.7 |
| `color/text/accent` | `#7544E9` brand-1/500 | `#AA89F5` brand-1/300 | Links | 5.6 / 5.4 |
| `color/text/success` | `#0C703C` green/800 | `#7DFAAF` green/300 | Success messages | 6.2 / 11.4 |
| `color/text/warning` | `#735C0F` yellow/900 | `#FFEA7F` yellow/300 | Warning messages | 6.4 / 12.2 |
| `color/text/danger` | `#AA2722` red/700 | `#FFBEB2` red/200 | Validation errors | 7.0 / 9.3 |
| `color/text/info` | `#1F54C7` blue/600 | `#BFD9FF` blue/200 | Info messages | 6.7 / 9.5 |

### color/interactive

| Token | Light | Dark | Use |
|---|---|---|---|
| `color/interactive/accent` | `#7544E9` brand-1/500 | `#8B60F0` brand-1/400 | Primary fill |
| `color/interactive/accent-hover` | `#5928C9` brand-1/600 | `#AA89F5` brand-1/300 | Primary hover |
| `color/interactive/accent-pressed` | `#4317AA` brand-1/700 | `#C9B7FB` brand-1/200 | Primary pressed |
| `color/interactive/on-accent` | `#FFFFFF` | `#10111A` | Label on accent — 5.6 / 4.5 |
| `color/interactive/neutral` | `#F6F8FA` gray-light/050 | `#383A47` gray-dark/500 | Secondary fill |
| `color/interactive/neutral-hover` | `#EBEEF1` gray-light/100 | `#414452` gray-dark/400 | Secondary hover, row hover |
| `color/interactive/neutral-pressed` | `#E1E6EB` gray-light/200 | `#4B4F5E` gray-dark/300 | Secondary pressed |
| `color/interactive/on-neutral` | `#383A47` | `#F6F8FA` | Label on neutral — 10.6 / 12.2 |
| `color/interactive/tertiary` | `#33EFD8` brand-2/500 | `#33EFD8` brand-2/500 | brand-2 highlight |
| `color/interactive/tertiary-hover` | `#20D6C4` brand-2/600 | `#67F5DF` brand-2/400 | Tertiary hover |
| `color/interactive/tertiary-pressed` | `#20D6C4` brand-2/600 | `#92F9E7` brand-2/300 | Tertiary pressed — Light repeats hover, see dead zone |
| `color/interactive/on-tertiary` | `#034444` brand-2/900 | `#034444` brand-2/900 | Label — 7.6 / 7.6 |
| `color/interactive/danger` | `#CC392E` red/600 | `#F77463` red/400 | Destructive fill |
| `color/interactive/danger-hover` | `#AA2722` red/700 | `#FB9787` red/300 | Destructive hover |
| `color/interactive/danger-pressed` | `#8F1818` red/800 | `#FFBEB2` red/200 | Destructive pressed — 9.1 / 11.9 |
| `color/interactive/on-danger` | `#FFFFFF` | `#10111A` | Label — 5.0 / 6.8 |
| `color/interactive/selected` | `#F2EFFE` brand-1/050 | `#310D84` brand-1/800 | Selected row, tab, nav |
| `color/interactive/disabled` | `#E1E6EB` gray-light/200 | `#383A47` gray-dark/500 | Disabled fill — in Dark equals `neutral`; the label carries the state |
| `color/interactive/on-disabled` | `#939CAB` gray-light/700 | `#687185` gray-dark/050 | Disabled label |

### color/border

| Token | Light | Dark | Use |
|---|---|---|---|
| `color/border/subtle` | `#EBEEF1` gray-light/100 | `#383A47` gray-dark/500 | Dividers, row separators |
| `color/border/default` | `#D5DBE1` gray-light/300 | `#414452` gray-dark/400 | Cards, containers, text inputs — see decisions |
| `color/border/strong` | `#778091` gray-light/900 | `#778091` gray-light/900 | Unchecked checkbox and radio — 3:1 on all surfaces |
| `color/border/accent` | `#7544E9` brand-1/500 | `#8B60F0` brand-1/400 | Active, selected |
| `color/border/focus` | `#7544E9` brand-1/500 | `#AA89F5` brand-1/300 | Focus ring — the **only** focus token; 5.6 / 5.4 |
| `color/border/danger` | `#CC392E` red/600 | `#F77463` red/400 | Error — 5.0 / 5.4 |
| `color/border/success` | `#12A356` green/700 | `#51F093` green/400 | Validated |
| `color/border/inverse` | `#383A47` gray-dark/500 | `#E1E6EB` gray-light/200 | On `surface/inverse` |

### spacing, radius, border-width

Single mode, identical in both themes. Atlassian convention: `spacing/100` = 8px.

`spacing/` 0=0 · 025=2 · 050=4 · 075=6 · **100=8** · 150=12 · **200=16** · 250=20 · 300=24 · 400=32 · 500=40 · 600=48 · 700=56 · 800=64 · 900=72 · 1000=80 · 1100=96 · 1200=128 · 1300=160 · 1400=192 · 1500=240 · 1600=320

Most used in production: gap 16 / 8 / 12 / 4 · padding 8 / 12 / 16 / 20.

`radius/` none=0 · xs=2 (checkbox) · sm=4 (badge) · md=8 (input, textarea, select, button) · lg=12 (dropdown, popover) · xl=16 (card) · 2xl=20 (large card) · 3xl=24 (modal) · full=9999 (pill, avatar, toggle)

`border-width/` hairline=1 (dividers, inputs, textarea, select, cards — **never changes on focus or error**) · control=1.5 (checkbox and radio only) · ring=2 (the focus ring itself)

Values of 6, 10 and 50 found in the files are drift — snap to 8, 8 and `full`.

---

## Collections

| Collection | Modes | Contents | Published |
|---|---|---|---|
| `Alpenglow Primitives` | 1 (`Value`) | Raw ramp + `alpha/*` | **Hidden** |
| `Alpenglow Theme` | 2 (`Light`, `Dark`) | `color/surface`, `color/text`, `color/interactive`, `color/border` | Yes |
| `Alpenglow Scale` | 1 (`Value`) | `spacing/*`, `radius/*`, `border-width/*` | Yes |

`Alpenglow Theme` is the **only** multi-mode collection — one dropdown for a designer to set, one way to ship a broken screen. The three names say what each layer is: `Primitives` are raw values, `Theme` is the part that varies by mode, `Scale` is dimension. A second brand would add its own `<Name> Theme` aliasing the same primitives.

**Light must be `modes[0]`.** Figma treats the first mode as the default for anything without an explicit mode, so the accident should be Light.

**Every `Alpenglow Theme` value is an alias. Zero raw hex, both modes.** If a value isn't in `Primitives`, add it there first.

### Alpha primitives are required

You cannot set opacity on an alias — it resolves to the primitive's own alpha. Scrims, hover washes and focus halos therefore need dedicated alpha primitives, or raw values will leak into the semantic layer:

`alpha/black-04 08 16 32 48 64` and `alpha/white-04 08 16 32 48 64` (Figma colour variables carry an alpha channel).

### Primitives ramp

| Group | 050 → 900 |
|---|---|
| `white` | `#FFFFFF` (single) |
| `gray-light` | `F6F8FA` `EBEEF1` `E1E6EB` `D5DBE1` `C3CAD4` `B1BAC7` `A3ACBA` `939CAB` `868F9F` `778091` |
| `gray-dark` | `687185` `5F6678` `545969` `4B4F5E` `414452` `383A47` `2F303D` `262733` `1A1B25` `10111A` |
| `blue` | `F0F6FF` `DEECFF` `BFD9FF` `99BEFF` `6B9DFF` `3F7AF8` `1F54C7` `1B41A3` `143180` `0B1F5C` |
| `green` | `F0FFF4` `DBFFE7` `B0FFCD` `7DFAAF` `51F093` `25E578` `19C868` `12A356` `0C703C` `034624` |
| `yellow` | `FFFDEF` `FFFBDD` `FFF5B1` `FFEA7F` `FFDF5D` `FFD33D` `F9C513` `DBAB09` `B08800` `735C0F` |
| `red` | `FFF2F0` `FFE1DB` `FFBEB2` `FB9787` `F77463` `EB503F` `CC392E` `AA2722` `8F1818` `720F12` |
| `brand-1` | `F2EFFE` `E3DAFE` `C9B7FB` `AA89F5` `8B60F0` `7544E9` `5928C9` `4317AA` `310D84` `20065C` |
| `brand-2` | `F0FFFB` `D6FFF7` `B8FFF2` `92F9E7` `67F5DF` `33EFD8` `20D6C4` `13A89B` `0A7A73` `034444` |

`brand-alt/*` is excluded — it is the brand gradient sliced by hue, not a lightness ramp. Keep it as a gradient asset.

---

## Building the collections

One `use_figma` call per step, validating between. **Primitives must exist before Tokens** — aliases need targets.

**Always set `scopes` explicitly.** Baseline testing showed this is the step agents skip. The default `ALL_SCOPES` puts every token in every picker and makes the system unusable.

| Group | scopes |
|---|---|
| `color/surface` | `['FRAME_FILL','SHAPE_FILL']` |
| `color/text` | `['TEXT_FILL']` |
| `color/interactive` | `['FRAME_FILL','SHAPE_FILL','TEXT_FILL']` |
| `color/border` | `['STROKE_COLOR']` |
| `spacing` | `['GAP','WIDTH_HEIGHT']` |
| `radius` | `['CORNER_RADIUS']` |
| `border-width` | `['STROKE_FLOAT']` |

```js
// Step 1 — Primitives
const prim = figma.variables.createVariableCollection('Alpenglow Primitives');
prim.renameMode(prim.modes[0].modeId, 'Value');   // never leave it as "Mode 1"
const mode = prim.modes[0].modeId;

const hex = (h) => ({ r: parseInt(h.slice(0,2),16)/255,
                      g: parseInt(h.slice(2,4),16)/255,
                      b: parseInt(h.slice(4,6),16)/255 });

const ids = {};
function prime(name, h, a) {
  const v = figma.variables.createVariable(name, prim, 'COLOR');
  v.setValueForMode(mode, a === undefined ? hex(h) : { ...hex(h), a });
  v.scopes = ['FRAME_FILL','SHAPE_FILL','TEXT_FILL','STROKE_COLOR'];
  v.hiddenFromPublishing = true;   // the ONLY thing enforcing the layer
  ids[name] = v.id;
}
prime('gray-light/050', 'F6F8FA');
prime('alpha/black-48', '000000', 0.48);
// ...remaining primitives

return { collectionId: prim.id, createdVariableIds: Object.values(ids) };
```

```js
// Step 2 — Alpenglow Theme. Light first. Aliases only.
const col = figma.variables.createVariableCollection('Alpenglow Theme');
col.renameMode(col.modes[0].modeId, 'Light');
const light = col.modes[0].modeId;
const dark  = col.addMode('Dark');

async function token(name, lightPrimId, darkPrimId, scopes) {
  const v = figma.variables.createVariable(name, col, 'COLOR');
  const lp = await figma.variables.getVariableByIdAsync(lightPrimId);
  const dp = await figma.variables.getVariableByIdAsync(darkPrimId);
  v.setValueForMode(light, figma.variables.createVariableAlias(lp));
  v.setValueForMode(dark,  figma.variables.createVariableAlias(dp));
  v.scopes = scopes;
  return v.id;
}
```

**Verify by reading back the resolved hex, not just that an alias exists.** `gray-light/900` and `gray-dark/050` are adjacent steps in one continuous ramp with misleading names, so a wrong-but-valid primitive name binds silently and looks correct in the picker. Check the resolved value *together with* the primitive name — some values are shared (`#778091` is both `border/strong` and Light `text/placeholder`), so hex alone does not identify the source.

If you set `codeSyntax`, confirm the naming convention against the React component library first — a mechanically derived custom-property name will be confidently wrong across every token if the library uses something else.

`hiddenFromPublishing` is **per variable and defaults to false**. Every primitive added later will be publishable unless you set it. One leaked primitive quietly undermines the layer.

### Binding to a node

`setBoundVariableForPaint` returns a **new** paint; fills are read-only arrays:

```js
const v = await figma.variables.getVariableByIdAsync(tokenId);
const paint = figma.variables.setBoundVariableForPaint(
  JSON.parse(JSON.stringify(node.fills[0])), 'color', v
);
node.fills = [paint];                    // reassign, never mutate in place

node.setBoundVariable('itemSpacing', spacingVar);
node.setBoundVariable('topLeftRadius', radiusVar);
node.setBoundVariable('strokeWeight', widthVar);
```

### Migration is not automatic

Creating variables does **not** retire the 81 paint styles, which are already applied across two files, one of them a published library. There is no built-in swap. Expect both systems to coexist and plan a deliberate rebinding pass. Do not assume a component picks up the new tokens because the variables exist.

---

## Corrections to apply

Decided, not open questions.

| # | Currently | Change to | Why |
|---|---|---|---|
| 1 | Danger button `#EB503F` + white | `red/600` `#CC392E` | 3.65:1 fails AA → 5.01:1 |
| 2 | Error text `red/500` | `red/700` `#AA2722` | Needs AA on white *and* on `danger-subtle` |
| 3 | Unchecked checkbox/radio `#D5DBE1` | `border/strong` `#778091` | 1.40:1 fails 1.4.11 → 3.41:1 minimum |
| 4 | `#778091` as body-supporting text | Demote to `text/placeholder` | 3.98:1 below AA for body copy |
| 5 | `brand-alt/*` treated as a ramp | Keep out of tokens | Hue slice, not a lightness ramp |
| 6 | Only `Drop Shadow/sm/Dark Mode` | Add `md` and `lg` Dark Mode | `surface/overlay` needs them |
| 7 | `caption/sm/(600)`, `caption/md/(600)` in Montserrat | Inter **Semi Bold**, same size/leading/tracking/case | Everything else is Inter |

Correction 7 — Inter's Figma style string is `"Semi Bold"` (with a space), Montserrat's is `"SemiBold"`. Load before mutating:
```js
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
```

## Common mistakes

Only failures actually observed in testing, or collisions measured in this palette.

| Mistake | Correct approach |
|---|---|
| Leaving `scopes` at default | Set explicitly from the table above — the one step agents reliably skip |
| Assuming a white label on a filled button | Use the matching `on-*` token; in Dark it is `#10111A` |
| Concluding the palette can't support a lighter dark hover | It can — lighten the fill *and* darken the label |
| Putting `surface/base` at the floor of the dark ramp | `sunken` needs somewhere to go; base is `gray-dark/800` |
| Adding a fifth dark elevation level | Separate with `border/default` instead |
| `border/subtle` as `gray-dark/600` in Dark | Collides with `surface/overlay` at 1.00:1 — use `gray-dark/500` |
| `border/subtle` on `surface/sunken` | Invisible in both modes — step up to `border/default` |
| Signalling focus by recolouring the border | Add a 2px ring at 2px offset; colour alone is never the sole channel |
| Focus replacing the error border | Error border stays; the ring is drawn in addition |
| Raw hex anywhere in `Alpenglow Theme` | Alias a primitive; add it to `Primitives` first if missing |
| Semi-transparent colour without alpha primitives | Use `alpha/*`; you cannot set opacity on an alias |
| Secondary button with no outline | Its fill is ~1.1:1 against its surface in both modes — `border/default` describes the shape |
| Disabled looking identical to enabled in Dark | Same fill by design; drop the outline to `border/subtle` and remove hover |
| Recolouring a field's border on focus | Border stays; only the ring is added |
| `interactive/neutral` as `gray-dark/600` in Dark | Collides with `surface/overlay` at 1.00:1 — use `gray-dark/500` |
| Thickening a field's border on focus or error | Width never changes; colour changes and the ring is added |
| Using `surface/raised` for a table inside a modal | Backwards elevation — stay on `overlay`, separate with borders |
| Adding a `tertiary-pressed` value for Light | `brand-2/700` fails with both labels; Light repeats hover |
| Reading `gray-light`/`gray-dark` as two themes | One continuous 20-step ramp; names are historical |
| Assuming variables replace the paint styles | They coexist; migration is a separate deliberate pass |
