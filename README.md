# Alpenglow

A design system for dense, data-heavy interfaces. Light and dark, with every
contrast ratio measured rather than assumed.

Named after the light that stays on the mountains after the sun has gone —
and after my daughter Leonor, a name to which the sense of "light" is
usually attributed.

**Theme:** Eleonora.

## Structure

Three layers, mirrored in Figma as three variable collections.

| Layer | Varies by mode | What it holds |
|---|---|---|
| **Primitives** | no | The raw ramp. 81 opaque colours plus 14 alpha values — twelve on the black and white ramps, two shadow inks. Nothing references these directly. |
| **Theme** | Light / Dark | 54 semantic tokens — `surface`, `text`, `interactive`, `border`. Every value is an alias. |
| **Elevation** | Light / Dark | Shadows. Only the ink varies by mode; the geometry does not. |
| **Scale** | no | Spacing, radius and border width. Dimension must not be reachable by a theme switch. |

TypeScript is the source of truth. Both stylesheets are generated from it, and
the type system prevents a token from aliasing a primitive that does not exist.

| Artefact | Consumed by |
|---|---|
| `src/styles/tokens.css` | Anyone. Plain CSS custom properties. |
| `src/styles/tailwind-theme.css` | Tailwind v4 projects, via `@theme`. Points at the variables above rather than restating the palette, so utilities follow light and dark. |
| `src/components/*` | React, styled with CSS Modules. Nothing to configure. |

The token layer is not tied to a styling choice — that is the point of shipping
both, and tests assert the two stay in step.

```bash
npm run dev          # the documentation site
npm run build:css    # regenerate both stylesheets
npm run check        # types, then every documented contrast ratio
```

## The contrast suite

120 test cases covering what the design actually depends on: text clearing AA on
every surface it can appear on, status text clearing AA on its own subtle
background, every button label clearing AA on all of its fill states, control
borders clearing WCAG 1.4.11, the dark elevation ladder staying ordered and
separable, and no token collapsing into the surface behind it.

It is not decoration. It caught five real defects on its first run, including a
divider that resolved to exactly the same colour as the surface beneath it.

## Icons

The system uses [IBM Carbon icons](https://carbondesignsystem.com/elements/icons/library/)
— 2,700 of them, Apache 2.0. They are not re-exported from here: a design system
that bundles an icon library makes everyone carry all of it to use six.

```bash
npm install @carbon/icons-react
```

```tsx
import { Search } from '@carbon/icons-react';

<Input iconStart={<Search size={20} />} placeholder="Search clients" />
```

Sizes are 16, 20, 24 and 32. Components size their own icon slot, so pass the
size that matches: 16 in a badge, 20 in a field.

## Two things that look like mistakes and are not

**Light and dark are asymmetric.** In light, `surface/raised` and
`surface/overlay` are both white and the shadow separates them. In dark, shadows
stop reading as elevation, so `overlay` has to be a lighter colour step.

**Button labels are themed, not constant.** In dark the accent fill *lightens*
across hover and pressed while its label *darkens* to compensate. Keeping a white
label there fails AA at the hover step — which is precisely the trap that makes
the palette look incapable of a lighter dark-mode hover.

## Running it

```bash
npm install
npm run dev      # the documentation site at localhost:3000
npm run check    # types, then every documented contrast ratio
```

The site is a static export, so it hosts anywhere. Set `DOCS_BASE` if it is
served from a subpath.

## Icons

The set is [IBM Carbon](https://carbondesignsystem.com/guidelines/icons/library/),
Apache 2.0. Fifteen icons are not: they were drawn for this system because Carbon
does not have them, and they ship from `alpenglow/icons`.

Eight more exist in Carbon under a different name — `notifications` is
`Notification`, `list--task` is `TaskComplete` — which is the kind of mismatch
that costs an afternoon. The full mapping is on the Icons page.

## Licence

MIT
