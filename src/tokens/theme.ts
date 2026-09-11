/**
 * Alpenglow — theme: Eleonora
 *
 * The semantic layer, and the only part of the system that varies by mode.
 * Every entry is an alias to a primitive in BOTH modes — no raw hex lives here.
 * Adding a second brand means adding another file shaped exactly like this one.
 *
 * Three things about this layer are deliberate and easy to mistake for errors:
 *
 * 1. Light and Dark are NOT symmetric. In Light, `surface/raised` and
 *    `surface/overlay` are both white and the shadow separates them. In Dark,
 *    shadows stop reading as elevation, so `overlay` must be a lighter colour
 *    step. Do not "correct" this into symmetry.
 *
 * 2. `on-*` foregrounds are themed, not constant. In Dark the accent fill
 *    LIGHTENS across hover and pressed while its label DARKENS to compensate.
 *    Keeping a white label there would fail AA at the hover step. The two
 *    highlight fills (tertiary, on flare) lighten in BOTH modes, because their
 *    500 carries no label at all — 4.29:1 with a dark one, 3.80:1 with white.
 *
 * 3. In Dark, `surface/sunken` is the canvas. The ladder is eleven stops and
 *    ends at 950; a well reads as recessed only inside a raised surface, and
 *    on the canvas it takes a border instead. A twentieth step was measured
 *    and refused — see primitives.ts.
 *
 * The dark ladder is `night`. A product that wants a neutral dark can alias
 * the same stops of `stone` instead — every text and border pair below was
 * measured against both and holds; the tightest, `border/strong` on
 * `stone/800`, is 3.44:1.
 *
 * The tail is deep on purpose: 700–950 sit at L .43 / .33 / .245 / .16, so
 * the dark canvas is #090B1F rather than a slate. Decided 2026-09-11 for a
 * dark theme that reads as night; every dark pair gained by it, and the one
 * cost is the 950→900 step, 1.19:1 against 1.22 before.
 */

import type { PrimitiveName, AlphaPrimitiveName } from './primitives';

type Alias = PrimitiveName | AlphaPrimitiveName;
type ThemeEntry = { light: Alias; dark: Alias; use: string };

export const theme = {
  // ---- surface ---------------------------------------------------------
  // A ladder of elevation, not of colour. Dark holds three colour steps —
  // base, raised, overlay — and sunken shares the canvas. When you run out,
  // separate with a border rather than inventing a step.
  'surface/base':           { light: 'stone/050', dark: 'night/950', use: 'App canvas' },
  'surface/raised':         { light: 'white',     dark: 'night/900', use: 'Cards, panels, table body' },
  'surface/overlay':        { light: 'white',     dark: 'night/800', use: 'Modals, popovers, dropdowns' },
  // Not table headers: in light this resolves to the same hex as
  // border/subtle, so a header band painted with it swallows the row
  // separator. Table uses surface/base. In dark it IS surface/base — a well
  // on the canvas takes border/default.
  'surface/sunken':         { light: 'stone/100', dark: 'night/950', use: 'Read-only fields, checkbox and radio box, neutral badge, avatar overflow' },
  'surface/scrim':          { light: 'alpha/mist-95', dark: 'alpha/ink-95', use: 'Modal backdrop' },
  'surface/inverse':        { light: 'stone/950', dark: 'stone/050', use: 'Avatar fill' },
  'surface/accent-subtle':  { light: 'twilight/050', dark: 'twilight/900', use: 'Selected nav, highlighted row' },
  'surface/success-subtle': { light: 'moss/050',    dark: 'moss/900',    use: 'Success badge' },
  'surface/warning-subtle': { light: 'amber/050',   dark: 'amber/900',   use: 'Warning badge' },
  'surface/danger-subtle':  { light: 'ember/050',   dark: 'ember/900',   use: 'Error badge' },
  'surface/info-subtle':    { light: 'glacier/050', dark: 'glacier/900', use: 'Info badge' },

  // ---- text ------------------------------------------------------------
  // Light reads stone 900 / 800 / 600; dark reads stone 050 / 300 / 400.
  // Secondary was stone/700 until the deep tail made the primary read as
  // ink; Fernando moved it up one stop on 2026-09-12 so labels sit closer
  // to body copy — 12.28:1 on white, and 1.33:1 from primary, which is the
  // separation to watch: the old neutral's indistinguishable levels were
  // 1.22:1 apart.
  // Tertiary is the tight one: 4.58:1 on sunken in light, 5.18:1 on the
  // overlay in dark. Placeholder is the same stop as tertiary — the next one
  // up, stone/500, is 3.57:1 on white, and a placeholder is text.
  'text/primary':     { light: 'stone/900', dark: 'stone/050', use: 'Headings and body' },
  'text/secondary':   { light: 'stone/800', dark: 'stone/300', use: 'Labels, metadata' },
  'text/tertiary':    { light: 'stone/600', dark: 'stone/400', use: 'Helper text, timestamps' },
  'text/placeholder': { light: 'stone/600', dark: 'stone/400', use: 'Input placeholders' },
  'text/disabled':    { light: 'stone/400', dark: 'stone/600', use: 'Disabled text (WCAG-exempt)' },
  'text/inert':       { light: 'stone/300', dark: 'night/700', use: 'Inert text beside interactive content, such as days outside the month (WCAG-exempt)' },
  'text/inverse':     { light: 'white',     dark: 'stone/950', use: 'Text on surface/inverse' },
  'text/accent':      { light: 'twilight/600', dark: 'twilight/300', use: 'Links' },
  'text/success':     { light: 'moss/700',     dark: 'moss/300',     use: 'Success messages' },
  // Two steps below the other status texts: yellow loses luminance slowly,
  // and amber/700 on amber/050 would be short.
  'text/warning':     { light: 'amber/800',    dark: 'amber/300',    use: 'Warning messages' },
  'text/danger':      { light: 'ember/700',    dark: 'ember/300',    use: 'Validation errors' },
  'text/info':        { light: 'glacier/700',  dark: 'glacier/300',  use: 'Info messages' },

  // ---- interactive -----------------------------------------------------
  'interactive/accent':          { light: 'twilight/600', dark: 'twilight/400', use: 'Primary button fill' },
  'interactive/accent-hover':    { light: 'twilight/700', dark: 'twilight/300', use: 'Primary hover' },
  'interactive/accent-pressed':  { light: 'twilight/800', dark: 'twilight/200', use: 'Primary pressed' },
  'interactive/on-accent':       { light: 'white',        dark: 'night/950',    use: 'Label on accent' },

  // In light the secondary button's fill is the canvas and its outline
  // describes it; hover and pressed step into mist, the soft-state family —
  // ΔEok 0.013 from the same stops of stone, a cast rather than a colour.
  // Dark mirrors the outline idea: the fill is the overlay's own lightness in
  // stone, and border/default carries the shape on a modal. Mist stays out of
  // dark — mist/800 is the overlay's lightness in another hue, 1.00:1 on it.
  'interactive/neutral':         { light: 'stone/050', dark: 'stone/800', use: 'Secondary button fill' },
  'interactive/neutral-hover':   { light: 'mist/100',  dark: 'stone/700', use: 'Secondary hover, row hover' },
  'interactive/neutral-pressed': { light: 'mist/200',  dark: 'stone/600', use: 'Secondary pressed' },
  'interactive/on-neutral':      { light: 'stone/900', dark: 'stone/050', use: 'Label on neutral' },

  // The highlight fill: flare/400 with a dark label in both modes. flare/500
  // carries no label (4.29:1 dark, 3.80:1 white), so the only three-step
  // ladder that passes goes lighter — 400 → 300 → 200 — in both modes.
  'interactive/tertiary':         { light: 'flare/400', dark: 'flare/400', use: 'Highlight fill' },
  'interactive/tertiary-hover':   { light: 'flare/300', dark: 'flare/300', use: 'Highlight hover' },
  'interactive/tertiary-pressed': { light: 'flare/200', dark: 'flare/200', use: 'Highlight pressed' },
  'interactive/on-tertiary':      { light: 'stone/900', dark: 'night/950', use: 'Label on highlight' },

  // Success no longer crosses over: moss/600 carries white at 5.09:1 in light
  // and moss/400 carries night/950 at 8.57:1 in dark, so the green follows
  // the same shape as the accent — darker in light, lighter in dark, label
  // themed to match.
  'interactive/success':         { light: 'moss/600', dark: 'moss/400', use: 'Confirming button fill' },
  'interactive/success-hover':   { light: 'moss/700', dark: 'moss/300', use: 'Confirming hover' },
  'interactive/success-pressed': { light: 'moss/800', dark: 'moss/200', use: 'Confirming pressed' },
  'interactive/on-success':      { light: 'white',    dark: 'night/950', use: 'Label on success' },

  'interactive/danger':         { light: 'ember/600', dark: 'ember/400', use: 'Destructive button fill' },
  'interactive/danger-hover':   { light: 'ember/700', dark: 'ember/300', use: 'Destructive hover' },
  'interactive/danger-pressed': { light: 'ember/800', dark: 'ember/200', use: 'Destructive pressed' },
  'interactive/on-danger':      { light: 'white',     dark: 'night/950', use: 'Label on danger' },

  // Selection is the accent tint, not mist: the calendar paints today's label
  // in text/accent on this fill, and twilight/600 on mist/200 is 4.42:1.
  'interactive/selected':    { light: 'twilight/050', dark: 'twilight/900', use: 'Selected row, tab, nav' },
  'interactive/disabled':    { light: 'stone/200', dark: 'stone/800', use: 'Disabled fill — in Dark equals neutral; the label carries the state' },
  'interactive/on-disabled': { light: 'stone/400', dark: 'stone/600', use: 'Disabled label' },

  // ---- border ----------------------------------------------------------
  // `strong` is the only value clearing 3:1 against all four surfaces in both
  // modes, which is why every form control uses it and why it is the same
  // primitive in Light and Dark. In dark, subtle has to sit above the overlay
  // (night/800) to be visible on it, so it is night/700 and default is
  // night/600.
  'border/subtle':  { light: 'stone/100', dark: 'night/700', use: 'Dividers, row separators' },
  'border/default': { light: 'stone/300', dark: 'night/600', use: 'Cards and containers — decorative' },
  'border/strong':  { light: 'stone/500', dark: 'stone/500', use: 'All form control boundaries' },
  'border/accent':  { light: 'twilight/600', dark: 'twilight/400', use: 'Active, selected' },
  'border/focus':   { light: 'twilight/500', dark: 'twilight/300', use: 'Focus ring — the only focus token' },
  'border/danger':  { light: 'ember/600',    dark: 'ember/400',    use: 'Error' },
  'border/success': { light: 'moss/600',     dark: 'moss/400',     use: 'Validated' },
  'border/inverse': { light: 'stone/700',    dark: 'stone/200',    use: 'On surface/inverse' },
} as const satisfies Record<string, ThemeEntry>;

export type ThemeTokenName = keyof typeof theme;
export type Mode = 'light' | 'dark';
