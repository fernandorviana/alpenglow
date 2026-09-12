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

**Not for:** typography (still text styles, not variables), avatar images, or the brand gradient.

**Icons are IBM Carbon** (`@carbon/icons-react`, Apache 2.0), at 16, 20, 24 or 32. Do not draw one that looks close enough — the set has 2,700 and a hand-drawn lookalike is a shape nobody can find again by name.

**But not all of them are Carbon.** Twenty-two icons in the system were drawn for it and do not exist in the package. Assuming one of these is Carbon produces a silently wrong shape, so check the name before reaching for an import:

| Group | Icons |
|---|---|
| Domain | `waiting--room` · `availability` · `services` · `resources` · `user--medic` · `stress-breath-editor` |
| Brand marks | `whatsapp` · `messenger` · `facebook` · `linkedin` · `markdown` · `zapier` |
| UI gaps | `chevron--small--down` · `chevron--small--right` · `close--panel` · `ai--sparkle` · `text--heading` · `brush-freehand` · `angle` · `mark-unread` · `user--verified` · `user--verified--outline` |

A further eight exist in Carbon under a different name: `notifications` is `Notification`, `direction--right--01` is `DirectionRight_01`, `list--task` is `TaskComplete`, `close--panel` is `SidePanelClose`, `collapse` is `CollapseAll`, `private` is `PrivateNetwork`, `calendar--day` is `Calendar`, `rotate--360` is `Rotate`.

## Quick reference — pick a token

| Styling this | Token |
|---|---|
| Page background | `color/surface/base` |
| Card, panel, table body | `color/surface/raised` — but see *A table inside a modal* |
| Modal, popover, dropdown, menu | `color/surface/overlay` |
| Modal backdrop | `color/surface/scrim` |
| Well, checkbox box, progress track | `color/surface/sunken` — in Dark it is the canvas; on the canvas add `border/default` |
| Table header band | `color/surface/base` — not `sunken`, which in Light equals `border/subtle` and swallows the row separator |
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
| Highlight (tertiary) button fill | `color/interactive/tertiary` — flare, lightens on hover |
| Row hover, menu-item hover, ghost or outline button hover — anything with no fill of its own | `color/interactive/wash-hover` as the background; `wash-pressed` when pressed |
| Secondary button hover, or any filled control's hover | the same wash, as a `background-image` gradient over the fill — the neutral tone has no hover ladder |
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

`color/border/default` (`#C1C6CC` stone/300 Light, `#5C6796` night/600 Dark) is used on text inputs, textarea, select, combobox and date picker. Against a card it measures **1.72:1 / 2.97:1**, below the 3:1 that WCAG 1.4.11 requires for non-text contrast. In the React library the field currently draws no border at all at rest — the boundary is its fill, 1.07:1 against a card — which is the parked decision recorded in `MEMORY.md`.

**This is a known, deliberate exception**, decided on 2026-09-07 by the design system owner with the measured ratios in front of them, to preserve the established appearance of the forms this system was derived from.

You are likely to want to change it. Baseline testing confirmed that a careful agent, given this palette and asked to specify input borders, independently arrives at `stone/500` or darker for compliance — and then flags that a designer will push back. That instinct is correct in general and overruled here specifically. **Do not raise it again, do not "fix" it in passing, and do not quietly use `border/strong` on text fields.**

**The carve-out, which is mandatory:** unchecked checkbox and radio use `color/border/strong`. On a text field the border is one signal among several — label, placeholder, height, padding. On an unchecked checkbox it is the entire control. Checked and disabled states are exempt: a brand fill supplies the contrast, and WCAG 2.1 exempts inactive components.

### Light and Dark are asymmetric on purpose

In Light, `raised` and `overlay` are both white and the shadow separates them. In Dark, shadows stop reading as elevation, so `overlay` must be a lighter colour step. Do not "correct" this into symmetry.

### One lightness per stop, in every family

Ten families of eleven stops (`050`–`950`), generated in OKLCH, plus a twelfth, `925` (L .205), in `stone` and `night` only. The lightness of a stop is the same in every family — 050 .975 · 100 .945 · 200 .895 · 300 .825 · 400 .73 · 500 .625 · 600 .525 · 700 .43 · 800 .33 · 900 .245 · 950 .16 — so a number means the same amount of light everywhere:

- any **600** carries a white label at ≥ 4.5:1 (5.1 to 6.0 across the families);
- any **400** carries a `night/950` label at ≥ 4.5:1 (7.6 or better);
- any **500** is the 3:1 stop for icons, borders and large text — and carries **no** label, white or dark;
- any **700** is text on its own 050; any **300** is text on its own 900.

The tail is deep on purpose — the dark canvas is `#090B1F`, decided 2026-09-11 so the dark theme reads as night; a deeper one (950 at L .13) was measured and refused because the 950→900 step fell to 1.11:1. Chroma and hue are each family's own. The sRGB gamut clips the vivid families at 300–400; a Display P3 pass would add saturation there without touching any ratio.

| Family | Role |
|---|---|
| `glow` | The brand — hero, gradient, one call to action per screen. **Never a button or status tone**: `glow/600` and `ember/600` are 1.01:1 apart. |
| `twilight` | Everything interactive — fills, links, focus, selection tint. |
| `flare` | The highlight fill, `interactive/tertiary`. Never a status: `amber` was pushed to h 86–95 to stay ΔEok 0.11 from it. |
| `glacier` | The second highlight and the info status. |
| `stone` | The neutral foundation — text, borders, the light canvas. |
| `night` | The dark surface ladder. |
| `mist` | Soft states — the wash. `mist/500` at 8–20% is `alpha/haze-*`, the ink of `interactive/wash-hover` / `wash-pressed` in both modes. Its opaque stops are not used in Dark: `mist/800` is a surface's lightness in another hue. |
| `ember` · `moss` · `amber` | Danger, success, warning. |

There are no half steps for text or fills. The twenty-step neutral this replaced had adjacent steps 1.08–1.23:1 apart and gave the theme two text levels 1.22:1 from each other. The one exception is `925`, the **surface step** (2026-09-12): no text is ever set in one surface against another, and every reference system measured (Radix, Atlassian, Spectrum, Geist) places adjacent surface levels at ΔL .025–.045 in OKLCH, where one whole stop is .085. It exists in `night` and `stone` only, the families a surface ladder is built from. Do not propose another, do not add it to another family, and do not propose a `975`.

---

## Constraints the values don't show

### The dark ramp holds 3 colour levels, and `sunken` is the canvas

`base → raised → overlay` is `night` 950 / 925 / 900 (`#090B1F` → `#12142C` → `#1B1E38`, ΔL .043 per step), and the ramp ends at 950. `surface/sunken` therefore resolves to `surface/base` in Dark: a well reads as recessed inside a card (ΔL .043) and on the canvas it takes `border/default`. `contrast.test.ts` asserts the equality so it is not mistaken for an oversight.

**Surface against surface is measured in OKLCH lightness, floor ΔL .035 — not in the WCAG ratio.** The ratio flattens the dark end: the 950→925 step is 1.08:1 and plainly visible, and Radix's first two dark greys are 1.06. Text on a surface and a boundary on a surface stay on the ratio. Do not "fix" a surface step by reading its WCAG figure.

**When you run out of elevation, separate with a border, not another step.** A popover opened inside a modal stays on `surface/overlay` and is outlined with `border/default`. Do not invent `overlay-raised`, and do not invent a `975`.

**The ladder can be `stone` instead of `night`**, per product, by aliasing the same stops. Every text and border pair was measured against both and holds — the tightest, `border/strong` on `stone/800`, is 3.44:1. Never mix the two families in one ladder — the chroma difference reads as two materials, not as elevation.

### Two tokens collide if you pick the obvious values

| Trap | What happens | Correct value |
|---|---|---|
| `border/subtle` as an opaque stop | In Light `stone/100` was the sunken surface itself, 1.00:1; in Dark a stop has to sit above the overlay and then reads 1.97 on a card, twice what the references draw | An alpha: `alpha/ink-08` Light, `alpha/white-16` Dark — 1.18–1.19 and 1.54–1.65 on every surface |
| `border/strong` as `stone/400` (Light) or `stone/600` (Dark) | 2.39 on white; **2.30 on the dark overlay** | `stone/500` `#83888F` in **both** modes — 3.04 on light sunken is the tight one; 3.47 on the dark overlay |
| `text/placeholder` as `stone/500` | 3.57:1 on white, and a placeholder is text | `stone/600`, the same stop as tertiary — 5.38 / 4.58 on sunken |
| `interactive/selected` as `mist/200` | `text/accent` on it is **4.42:1**, and the calendar paints today's label that way | `twilight/050` / `twilight/900` — 5.55 / 8.39 |
| `interactive/neutral` in Dark as a `night` stop | Reads as a hole or a lift in the ladder | `stone/800` — 1.47:1 on a card, 1.33 on a modal; `border/default` (2.97 on the overlay) still carries the shape, as in Light where the fill is the canvas |
| An opaque hover — `mist/100`, `stone/700` | In Light it is the sunken surface itself; in Dark it is ΔL +.184 over a card where the references sit at +.05 to +.09 | `interactive/wash-hover` — `mist/500` at 8% Light / 12% Dark, laid over whatever is beneath |
| A `flare` or `glacier` 500 as a fill | No label passes — 4.29 with `stone/900`, 3.80 with white | 400 with a dark label; hover 300, pressed 200 |

**`border/subtle` reads on every surface, sunken included** (1.18 Light, 1.54 Dark): it is an alpha now. The old rule — step up to `border/default` on sunken — is gone with the old value.

### Shadows in Dark reinforce, they do not carry

Shadows stop being the *primary* elevation signal in Dark — that job moves to the colour step. They are still worth having as reinforcement, which is why `md` and `lg` exist in Dark Mode. Both statements are true: colour leads, shadow supports. Do not read the first as "no shadows in dark".

### A table inside a modal

The modal is `surface/overlay` (night/900). A table placed inside it must **not** use `surface/raised` for the body and `surface/sunken` for the header — both are *darker* than their container and the elevation reads backwards.

Inside an overlay, a table keeps `surface/overlay` for the body, separates rows with `border/subtle`, and marks the header with `border/default` beneath it rather than a fill. Same rule as the dropdown-in-modal case: out of elevation, use a border.

**This applies in both modes.** In Light the fills happen to coincide (overlay and raised are both white), but a modal table still uses the border treatment for its header rather than `sunken` — so the two themes stay structurally identical.

### The highlight fill lightens on hover, in both modes

`interactive/tertiary` is `flare/400` with a dark label (`stone/900` in Light 6.43:1, `night/950` in Dark 7.68:1). The next stop down, `flare/500`, carries no label — 4.29:1 dark, 3.80:1 white — so the only three-step ladder that passes goes **up**: 400 → 300 → 200, the label staying dark. Light and Dark share it. Do not "fix" it by darkening hover, and do not add a tertiary text token to make an outline variant: nobody has drawn that button.

### The `on-*` foreground is a themed token, not a constant

This is the single most valuable rule here. Baseline testing showed a careful agent compute the ratios correctly, conclude that a lighter dark-mode hover drops a white label below AA, and therefore decide **the palette cannot support a lighter dark-mode hover** — because it never considered changing the label.

Resolution: in Dark, the accent fill **lightens** (`twilight` 400 → 300 → 200) *and* the label darkens to `night/950`. That yields 7.73 / 11.02 / 13.99 — all passing. A white label on the dark hover would be 1.77:1.

**Always pair a fill with its matching `on-*` token. Never assume white.** Success and danger follow the same shape: white on the 600 in Light, `night/950` on the 400 in Dark.

The tight pairs are in Light, and both in `stone`: `text/tertiary` on sunken is **4.58:1** and `border/strong` on sunken is **3.04:1**. Dark has headroom (the same pairs are 6.81 and 4.56 on the overlay). Do not nudge `stone/100`, `stone/500` or `stone/600`. Under the wash, `text/tertiary` holds AA on raised and overlay — where rows and menu items live — and not on base (pressed, 4.28) or sunken (4.27 / 3.94); do not put helper text on a washed control over those two.

### Focus and error

- Focus **adds geometry**: a 2px ring (`border-width/ring`) at 2px offset, in `border/focus`. Recolouring the border is not sufficient on its own — colour must never be the only channel carrying a state.
- **The field's own border never changes width.** It stays `border-width/hairline` in every state; only its colour changes, and the ring is added outside it. A 1px → 1.5px step would shift the control's outer box and reflow the form on focus.
- **Error plus focus:** the border stays `border/danger`, and the focus ring is drawn in addition. Focus never replaces the error signal.
- **A focused field's border does not recolour.** It stays `border/default` (or `border/danger` if in error); the ring alone carries focus.
- **The focus ring cannot sit on the accent fill.** `border/focus` is `twilight/500` in Light and `twilight/300` in Dark; against the accent fill that is 1.51 and 1.43. The offset puts the ring on the surface, where it is 3.34 to 11.02.
- **The secondary button always carries a `border/default` outline**, in both modes. Its fill is 1.07:1 against a white card in Light and 1.33:1 against a modal in Dark — the fill alone does not describe the button's shape. The outline does. It has no hover ladder: hover and pressed are the wash over its fill.
- **Disabled drops that outline to `border/subtle`** and removes hover. In Dark `interactive/disabled` resolves to the same value as `interactive/neutral`, so without this the disabled and enabled states would be identical — and colour would be the only channel, which is exactly what the focus rule forbids.
- **Checked checkbox/radio** use `border/accent` at `border-width/control`, matching the unchecked geometry so the box does not resize between states.
- The 2px gap between control and ring shows the parent surface. The ring follows the control's own `radius/*`, stepped up by the 2px offset.
- The ring extends **4px beyond the control** (2px offset + 2px ring). Form fields need at least `spacing/075` (6px) between them, and more at a card edge or table-cell boundary, or focused fields will collide with their neighbours.

---

## Token tables

Every value is an alias; the hex beside it is what the alias resolves to. The tables are generated from `src/tokens` — if a value here disagrees with the code, the code is right and this file is stale.

### color/surface

Ratios are not shown: surfaces are grounds, and the ladder is asserted in `contrast.test.ts`.

| Token | Light | Dark | Use |
|---|---|---|---|
| `color/surface/base` | `#F5F7F9` stone/050 | `#090B1F` night/950 | App canvas |
| `color/surface/raised` | `#FFFFFF` white | `#12142C` night/925 | Cards, panels, table body |
| `color/surface/overlay` | `#FFFFFF` white | `#1B1E38` night/900 | Modals, popovers, dropdowns |
| `color/surface/sunken` | `#EAEDF1` stone/100 | `#090B1F` night/950 | Read-only fields, checkbox and radio box, neutral badge, avatar overflow |
| `color/surface/scrim` | `alpha/mist-95` | `alpha/ink-95` | Modal backdrop |
| `color/surface/inverse` | `#0B0D12` stone/950 | `#F5F7F9` stone/050 | Avatar fill |
| `color/surface/accent-subtle` | `#F8F5FF` twilight/050 | `#20055B` twilight/900 | Selected nav, highlighted row |
| `color/surface/success-subtle` | `#EEFBF0` moss/050 | `#002912` moss/900 | Success badge |
| `color/surface/warning-subtle` | `#FDF7E1` amber/050 | `#2E1D00` amber/900 | Warning badge |
| `color/surface/danger-subtle` | `#FFF4F3` ember/050 | `#440007` ember/900 | Error badge |
| `color/surface/info-subtle` | `#E1FDFF` glacier/050 | `#00252F` glacier/900 | Info badge |

### color/text

Ratios against `surface/raised` in each mode. Every status token also clears AA on its own `*-subtle` surface.

| Token | Light | Dark | Use | L / D |
|---|---|---|---|---|
| `color/text/primary` | `#1E2026` stone/900 | `#F5F7F9` stone/050 | Headings and body | 16.3 / 16.8 |
| `color/text/secondary` | `#32353C` stone/800 | `#C1C6CC` stone/300 | Labels, metadata — 1.33:1 from primary in Light, by Fernando's choice | 12.3 / 10.5 |
| `color/text/tertiary` | `#666B71` stone/600 | `#A3A8AF` stone/400 | Helper text, timestamps | 5.4 / 7.5 |
| `color/text/placeholder` | `#666B71` stone/600 | `#A3A8AF` stone/400 | Input placeholders | 5.4 / 7.5 |
| `color/text/disabled` | `#A3A8AF` stone/400 | `#666B71` stone/600 | Disabled text (WCAG-exempt) | 2.4 / 3.4 |
| `color/text/inert` | `#C1C6CC` stone/300 | `#444C76` night/700 | Inert text beside interactive content (WCAG-exempt); always below disabled | 1.7 / 2.4 |
| `color/text/inverse` | `#FFFFFF` white | `#0B0D12` stone/950 | Text on `surface/inverse` — 19.4 / 18.1 there | — |
| `color/text/accent` | `#7043DC` twilight/600 | `#CDB8FF` twilight/300 | Links | 6.0 / 9.2 |
| `color/text/success` | `#006031` moss/700 | `#93D9A3` moss/300 | Success messages | 7.7 / 9.8 |
| `color/text/warning` | `#483100` amber/800 | `#E3C364` amber/300 | Warning messages | 12.2 / 9.5 |
| `color/text/danger` | `#94131E` ember/700 | `#FFADA9` ember/300 | Validation errors | 8.9 / 9.2 |
| `color/text/info` | `#005A6B` glacier/700 | `#5DDAE9` glacier/300 | Info messages | 7.9 / 9.8 |

### color/interactive

Ratios for `on-*` tokens are against their resting fill; for fills, against `surface/raised`.

| Token | Light | Dark | Use | L / D |
|---|---|---|---|---|
| `color/interactive/accent` | `#7043DC` twilight/600 | `#B091FF` twilight/400 | Primary button fill | 6.0 / 6.5 |
| `color/interactive/accent-hover` | `#532CB1` twilight/700 | `#CDB8FF` twilight/300 | Primary hover | 8.9 / 9.2 |
| `color/interactive/accent-pressed` | `#361583` twilight/800 | `#E2D4FF` twilight/200 | Primary pressed | 13.2 / 11.7 |
| `color/interactive/on-accent` | `#FFFFFF` white | `#090B1F` night/950 | Label on accent | 6.0 / 7.7 |
| `color/interactive/neutral` | `#F5F7F9` stone/050 | `#32353C` stone/800 | Secondary button fill — no ladder; takes the wash | 1.1 / 1.5 |
| `color/interactive/on-neutral` | `#1E2026` stone/900 | `#F5F7F9` stone/050 | Label on neutral — 14.1 / 9.8 under the hover wash, 13.0 / 8.9 pressed | 15.2 / 11.4 |
| `color/interactive/wash-hover` | `alpha/haze-08` (mist/500 at 8%) | `alpha/haze-12` (12%) | Hover wash over any surface or the neutral fill — ΔL −.029 on a light card, +.057 on a dark one | — |
| `color/interactive/wash-pressed` | `alpha/haze-16` (16%) | `alpha/haze-20` (20%) | Pressed wash, same consumers — ΔL −.058 / +.094 | — |
| `color/interactive/tertiary` | `#FF7F05` flare/400 | `#FF7F05` flare/400 | Highlight fill | 2.5 / 6.4 |
| `color/interactive/tertiary-hover` | `#FFB27B` flare/300 | `#FFB27B` flare/300 | Highlight hover — lighter, see decisions | 1.8 / 9.2 |
| `color/interactive/tertiary-pressed` | `#FFD2B1` flare/200 | `#FFD2B1` flare/200 | Highlight pressed | 1.4 / 11.7 |
| `color/interactive/on-tertiary` | `#1E2026` stone/900 | `#090B1F` night/950 | Label on highlight | 6.4 / 7.7 |
| `color/interactive/success` | `#1E7E46` moss/600 | `#67BE80` moss/400 | Confirming button fill | 5.1 / 7.2 |
| `color/interactive/success-hover` | `#006031` moss/700 | `#93D9A3` moss/300 | Confirming hover | 7.7 / 9.8 |
| `color/interactive/success-pressed` | `#004120` moss/800 | `#BBEAC4` moss/200 | Confirming pressed | 11.8 / 12.2 |
| `color/interactive/on-success` | `#FFFFFF` white | `#090B1F` night/950 | Label on success | 5.1 / 8.6 |
| `color/interactive/danger` | `#BC2C2F` ember/600 | `#FF7873` ember/400 | Destructive button fill | 5.9 / 6.3 |
| `color/interactive/danger-hover` | `#94131E` ember/700 | `#FFADA9` ember/300 | Destructive hover | 8.9 / 9.2 |
| `color/interactive/danger-pressed` | `#6A000F` ember/800 | `#FFCFCD` ember/200 | Destructive pressed | 13.0 / 11.7 |
| `color/interactive/on-danger` | `#FFFFFF` white | `#090B1F` night/950 | Label on danger | 5.9 / 7.6 |
| `color/interactive/selected` | `#F8F5FF` twilight/050 | `#20055B` twilight/900 | Selected row, tab, nav | 1.1 / 1.0 |
| `color/interactive/disabled` | `#D9DDE2` stone/200 | `#32353C` stone/800 | Disabled fill — in Dark equals `neutral`; the label carries the state | 1.4 / 1.3 |
| `color/interactive/on-disabled` | `#A3A8AF` stone/400 | `#666B71` stone/600 | Disabled label | 1.8 / 2.3 |

### color/border

Ratios against `surface/raised`.

| Token | Light | Dark | Use | L / D |
|---|---|---|---|---|
| `color/border/subtle` | `alpha/ink-08` (stone/950 at 8%) | `alpha/white-16` | Dividers, row separators — reads on every surface | 1.2 / 1.6 |
| `color/border/default` | `#C1C6CC` stone/300 | `#5C6796` night/600 | Cards, containers, text inputs — see decisions | 1.7 / 3.3 |
| `color/border/strong` | `#83888F` stone/500 | `#83888F` stone/500 | All form control boundaries — 3:1 on every surface | 3.6 / 5.1 |
| `color/border/accent` | `#7043DC` twilight/600 | `#B091FF` twilight/400 | Active, selected | 6.0 / 6.5 |
| `color/border/focus` | `#8F62FF` twilight/500 | `#CDB8FF` twilight/300 | Focus ring — the **only** focus token | 3.9 / 9.2 |
| `color/border/danger` | `#BC2C2F` ember/600 | `#FF7873` ember/400 | Error | 5.9 / 6.3 |
| `color/border/success` | `#1E7E46` moss/600 | `#67BE80` moss/400 | Validated | 5.1 / 7.2 |
| `color/border/inverse` | `#4C5057` stone/700 | `#D9DDE2` stone/200 | On `surface/inverse` | 8.1 / 11.9 |

### spacing, radius, border-width

Single mode, identical in both themes. Atlassian convention: `spacing/100` = 8px.

`spacing/` 0=0 · 025=2 · 050=4 · 075=6 · **100=8** · 150=12 · **200=16** · 250=20 · 300=24 · 400=32 · 500=40 · 600=48 · 700=56 · 800=64 · 900=72 · 1000=80 · 1100=96 · 1200=128 · 1300=160 · 1400=192 · 1500=240 · 1600=320

Most used in production: gap 16 / 8 / 12 / 4 · padding 8 / 12 / 16 / 20.

`radius/` none=0 · xs=2 · sm=4 (checkbox, small badge) · md=6 (medium badge) · lg=8 · xl=12 (input, textarea, select) · 2xl=16 (card) · 3xl=20 (large card) · 4xl=24 (modal) · full=9999 (**button**, avatar, toggle)

`border-width/` hairline=1 (dividers, inputs, textarea, select, cards — **never changes on focus or error**) · control=1.5 (checkbox and radio only) · ring=2 (the focus ring itself)

10 and 50 found in the files are drift — snap to 8 and `full`. 6 is not drift: it is the medium badge, and dropping it silently rounded that component up by two pixels.

---

## Collections

| Collection | Modes | Contents | Published |
|---|---|---|---|
| `Alpenglow Primitives` | 1 (`Value`) | Ten ramps + `white` + `alpha/*` | **Hidden** |
| `Alpenglow Theme` | 2 (`Light`, `Dark`) | `color/surface`, `color/text`, `color/interactive`, `color/border` | Yes |
| `Alpenglow Scale` | 1 (`Value`) | `spacing/*`, `radius/*`, `border-width/*` | Yes |

`Alpenglow Theme` is the **only** multi-mode collection — one dropdown for a designer to set, one way to ship a broken screen. The three names say what each layer is: `Primitives` are raw values, `Theme` is the part that varies by mode, `Scale` is dimension. A second brand would add its own `<Name> Theme` aliasing the same primitives.

**Light must be `modes[0]`.** Figma treats the first mode as the default for anything without an explicit mode, so the accident should be Light.

**Every `Alpenglow Theme` value is an alias. Zero raw hex, both modes.** If a value isn't in `Primitives`, add it there first.

### Alpha primitives are required

You cannot set opacity on an alias — it resolves to the primitive's own alpha. Scrims, hover washes and focus halos therefore need dedicated alpha primitives, or raw values will leak into the semantic layer:

`alpha/black-04 08 16 32 48 64` and `alpha/white-04 08 16 32 48 64`, plus nine off the doubling ramp: `alpha/ink-08` (the light divider), `alpha/ink-10` and `alpha/ink-12` (stone/950, the shadow ink — ΔE76 1.88 and 2.27 from the drawn navy over white), `alpha/ink-95` (the dark scrim), `alpha/mist-95` (stone/200 at 95%, the drawn light scrim), and `alpha/haze-08 12 16 20` (mist/500, the wash: hover 8 Light / 12 Dark, pressed 16 / 20).

### Primitives

| Family | 050 → 950 (stone and night carry a 925 between 900 and 950) |
|---|---|
| `white` | `#FFFFFF` (single) |
| `glow` | `FFF3F8` `FFE5EE` `FFCCDC` `FFA9BF` `FF738F` `EB3B55` `C2173F` `97002F` `680020` `430012` `220006` |
| `twilight` | `F8F5FF` `F0E8FF` `E2D4FF` `CDB8FF` `B091FF` `8F62FF` `7043DC` `532CB1` `361583` `20055B` `0D0033` |
| `flare` | `FFF5EC` `FFE8D6` `FFD2B1` `FFB27B` `FF7F05` `D66000` `AB4800` `843300` `5C1F00` `3C1000` `1E0400` |
| `glacier` | `E1FDFF` `C3F8FC` `9EECF3` `5DDAE9` `00BDD3` `0098B0` `00778C` `005A6B` `003C49` `00252F` `001016` |
| `stone` | `F5F7F9` `EAEDF1` `D9DDE2` `C1C6CC` `A3A8AF` `83888F` `666B71` `4C5057` `32353C` `1E2026` **`15171C`** `0B0D12` |
| `night` | `F3F7FF` `E7EDFB` `D3DCF4` `B9C5E7` `98A6D1` `7885B6` `5C6796` `444C76` `2D3254` `1B1E38` **`12142C`** `090B1F` |
| `mist` | `F0F9F9` `E1F0F1` `CBE2E2` `AFCDCD` `8DB0B0` `6A908F` `4F7272` `385656` `213A3B` `102425` `031010` |
| `ember` | `FFF4F3` `FFE6E5` `FFCFCD` `FFADA9` `FF7873` `E44B46` `BC2C2F` `94131E` `6A000F` `440007` `220002` |
| `moss` | `EEFBF0` `DDF4E0` `BBEAC4` `93D9A3` `67BE80` `3E9E5F` `1E7E46` `006031` `004120` `002912` `001206` |
| `amber` | `FDF7E1` `F8EDC5` `EFDC9D` `E3C364` `CCA21D` `AA8100` `886400` `684A00` `483100` `2E1D00` `150B00` |

The brand gradient — `flare/300 → glow/300 → glow/500 → twilight/400 → night/600` in Light, one stop more saturated in Dark (`400 → 400 → 500 → 500 → 500`) — is a gradient asset, not a variable. It never carries text.

---

## Building the collections

`docs/figma/alpenglow-variables.json` is generated from `src/tokens` by `npx tsx scripts/export-figma.ts` and lists every primitive, every theme alias with its scopes, and the scale. `docs/figma/apply-variables.md` beside it is the prompt and the plugin script that apply it. Use those rather than retyping values.

One `use_figma` call per step, validating between. **Primitives must exist before Theme** — aliases need targets. When replacing an older bedrock, re-point every alias before deleting any primitive: deleting first detaches the alias and Figma does not warn.

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
prime('stone/050', 'F5F7F9');
prime('alpha/ink-95', '0B0D12', 0.95);
// ...remaining primitives, from the JSON

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

**Verify by reading back the resolved hex, not just that an alias exists.** Some values are shared — `#666B71` is both `text/tertiary` and `text/placeholder` in Light, `stone/500` is `border/strong` in both modes, `night/950` is `surface/base`, `surface/sunken` and every dark `on-*` label, and the two wash tokens and `border/subtle` resolve to alpha primitives whose `a` must survive the alias — so hex alone does not identify the source. Check the resolved value *together with* the primitive name.

If you set `codeSyntax`, confirm the naming convention against the React component library first — a mechanically derived custom-property name will be confidently wrong across every token if the library uses something else. The library's names are `--ap-color-<group>-<token>` for the theme and `--ap-<family>-<stop>` for primitives.

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

Creating variables does **not** retire the paint styles, which are already applied across two files, one of them a published library. There is no built-in swap. Expect both systems to coexist and plan a deliberate rebinding pass. Do not assume a component picks up the new tokens because the variables exist.

---

## Corrections to apply

Decided, not open questions. These are the places where the drawn files disagree with the measured system.

| # | Drawn | Change to | Why |
|---|---|---|---|
| 1 | Danger button `#EB503F` + white | `ember/600` `#BC2C2F` | 3.65:1 fails AA → 5.93:1 |
| 2 | Error text on the drawn red 500 | `ember/700` `#9B1C24` | Needs AA on white *and* on `danger-subtle` — 8.12 / 7.54 |
| 3 | Unchecked checkbox/radio on the drawn light grey | `border/strong` `#83888F` | 1.40:1 fails 1.4.11 → 3.04:1 minimum |
| 4 | The drawn mid-grey as body-supporting text | `text/tertiary` `stone/600` | The drawn value was 3.98:1; tertiary is 5.38 on white, 4.58 on sunken |
| 5 | The brand gradient sliced into a ramp | Keep out of tokens | Hue slice, not a lightness ramp — a gradient asset |
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
| Assuming a white label on a filled button | Use the matching `on-*` token; in Dark it is `night/950` |
| Concluding the palette can't support a lighter dark hover | It can — lighten the fill *and* darken the label |
| Adding a fourth dark colour level, or a `975` | `sunken` is the canvas in Dark; separate with `border/default` instead. `925` is the one surface step and it is already in the ladder |
| Judging a surface step by its WCAG ratio | Surface against surface is OKLCH ΔL, floor .035; the 950→925 step is 1.08:1 and correct |
| An opaque hover fill on a row, a menu item or a ghost button | `interactive/wash-hover` as the background; over a filled control, as a `background-image` gradient |
| Mixing `stone` and `night` in one surface ladder | Pick one family per product; the chroma difference reads as two materials |
| `border/subtle` as an opaque stop | It is an alpha — `alpha/ink-08` Light, `alpha/white-16` Dark — and reads on every surface, sunken included |
| `text/placeholder` as `stone/500` | 3.57:1 — a placeholder is text; use `stone/600` |
| `interactive/selected` in `mist` | The accent label on it is 4.42:1; selection is `twilight/050` / `900` |
| Signalling focus by recolouring the border | Add a 2px ring at 2px offset; colour alone is never the sole channel |
| Focus replacing the error border | Error border stays; the ring is drawn in addition |
| Raw hex anywhere in `Alpenglow Theme` | Alias a primitive; add it to `Primitives` first if missing |
| Semi-transparent colour without alpha primitives | Use `alpha/*`; you cannot set opacity on an alias |
| Secondary button with no outline | Its fill is 1.07:1 against a card in Light and 1.33:1 against a modal in Dark — `border/default` describes the shape |
| Disabled looking identical to enabled in Dark | Same fill by design; drop the outline to `border/subtle` and remove hover |
| Recolouring a field's border on focus | Border stays; only the ring is added |
| Thickening a field's border on focus or error | Width never changes; colour changes and the ring is added |
| Using `surface/raised` for a table inside a modal | Backwards elevation — stay on `overlay`, separate with borders |
| Darkening the highlight button on hover | `flare/500` carries no label; the ladder goes 400 → 300 → 200 |
| Using `glow` for a button or a status | It is the brand; `glow/600` and `ember/600` are 1.01:1 apart |
| Assuming variables replace the paint styles | They coexist; migration is a separate deliberate pass |
