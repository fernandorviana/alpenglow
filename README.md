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
| **Primitives** | no | The raw ramp. 81 opaque colours plus 12 alpha values. Nothing references these directly. |
| **Theme** | Light / Dark | 49 semantic tokens — `surface`, `text`, `interactive`, `border`. Every value is an alias. |
| **Scale** | no | Spacing, radius and border width. Dimension must not be reachable by a theme switch. |

TypeScript is the source of truth. `src/styles/tokens.css` is generated from it,
and the type system prevents a token from aliasing a primitive that does not exist.

```bash
npm run build:css   # regenerate the CSS
npm test            # verify every documented contrast ratio
```

## The contrast suite

77 assertions covering what the design actually depends on: text clearing AA on
every surface it can appear on, status text clearing AA on its own subtle
background, every button label clearing AA on all of its fill states, control
borders clearing WCAG 1.4.11, the dark elevation ladder staying ordered and
separable, and no token collapsing into the surface behind it.

It is not decoration. It caught five real defects on its first run, including a
divider that resolved to exactly the same colour as the surface beneath it.

## Two things that look like mistakes and are not

**Light and dark are asymmetric.** In light, `surface/raised` and
`surface/overlay` are both white and the shadow separates them. In dark, shadows
stop reading as elevation, so `overlay` has to be a lighter colour step.

**Button labels are themed, not constant.** In dark the accent fill *lightens*
across hover and pressed while its label *darkens* to compensate. Keeping a white
label there fails AA at the hover step — which is precisely the trap that makes
the palette look incapable of a lighter dark-mode hover.

## Licence

MIT
