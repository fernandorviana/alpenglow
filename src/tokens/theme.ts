/**
 * Alpenglow — theme: Eleonora
 *
 * The semantic layer, and the only part of the system that varies by mode.
 * Every entry is an alias to a primitive in BOTH modes — no raw hex lives here.
 * Adding a second brand means adding another file shaped exactly like this one.
 *
 * Two things about this layer are deliberate and easy to mistake for errors:
 *
 * 1. Light and Dark are NOT symmetric. In Light, `surface/raised` and
 *    `surface/overlay` are both white and the shadow separates them. In Dark,
 *    shadows stop reading as elevation, so `overlay` must be a lighter colour
 *    step. Do not "correct" this into symmetry.
 *
 * 2. `on-*` foregrounds are themed, not constant. In Dark the accent fill
 *    LIGHTENS across hover and pressed while its label DARKENS to compensate.
 *    Keeping a white label there would fail AA at the hover step.
 */

import type { PrimitiveName, AlphaPrimitiveName } from './primitives.js';

type Alias = PrimitiveName | AlphaPrimitiveName;
type ThemeEntry = { light: Alias; dark: Alias; use: string };

export const theme = {
  // ---- surface ---------------------------------------------------------
  // A ladder of elevation, not of colour. The dark ramp holds exactly four
  // levels; when you run out, separate with a border rather than inventing
  // a fifth step.
  'surface/base':           { light: 'gray-light/050', dark: 'gray-dark/800', use: 'App canvas' },
  'surface/raised':         { light: 'white',          dark: 'gray-dark/700', use: 'Cards, panels, table body' },
  'surface/overlay':        { light: 'white',          dark: 'gray-dark/600', use: 'Modals, popovers, dropdowns' },
  'surface/sunken':         { light: 'gray-light/100', dark: 'gray-dark/900', use: 'Wells, table headers, tracks' },
  'surface/scrim':          { light: 'alpha/black-48', dark: 'alpha/black-64', use: 'Modal backdrop' },
  'surface/inverse':        { light: 'gray-dark/900',  dark: 'gray-light/050', use: 'Tooltips, inverted banners' },
  'surface/accent-subtle':  { light: 'brand-1/050',    dark: 'brand-1/800',   use: 'Selected nav, highlighted row' },
  'surface/success-subtle': { light: 'green/200',      dark: 'green/900',     use: 'Success badge' },
  'surface/warning-subtle': { light: 'yellow/100',     dark: 'yellow/900',    use: 'Warning badge' },
  'surface/danger-subtle':  { light: 'red/100',        dark: 'red/800',       use: 'Error badge' },
  'surface/info-subtle':    { light: 'blue/100',       dark: 'blue/800',      use: 'Info badge' },

  // ---- text ------------------------------------------------------------
  'text/primary':     { light: 'gray-dark/500',  dark: 'gray-light/050', use: 'Headings and body' },
  'text/secondary':   { light: 'gray-dark/200',  dark: 'gray-light/400', use: 'Labels, metadata' },
  'text/tertiary':    { light: 'gray-dark/100',  dark: 'gray-light/600', use: 'Helper text, timestamps' },
  'text/placeholder': { light: 'gray-light/900', dark: 'gray-light/800', use: 'Input placeholders' },
  'text/disabled':    { light: 'gray-light/700', dark: 'gray-dark/050',  use: 'Disabled text (WCAG-exempt)' },
  'text/inverse':     { light: 'white',          dark: 'gray-dark/900',  use: 'Text on surface/inverse' },
  'text/accent':      { light: 'brand-1/500',    dark: 'brand-1/300',    use: 'Links' },
  'text/success':     { light: 'green/800',      dark: 'green/300',      use: 'Success messages' },
  'text/warning':     { light: 'yellow/900',     dark: 'yellow/300',     use: 'Warning messages' },
  'text/danger':      { light: 'red/700',        dark: 'red/200',        use: 'Validation errors' },
  'text/info':        { light: 'blue/600',       dark: 'blue/200',       use: 'Info messages' },

  // ---- interactive -----------------------------------------------------
  'interactive/accent':          { light: 'brand-1/500', dark: 'brand-1/400', use: 'Primary button fill' },
  'interactive/accent-hover':    { light: 'brand-1/600', dark: 'brand-1/300', use: 'Primary hover' },
  'interactive/accent-pressed':  { light: 'brand-1/700', dark: 'brand-1/200', use: 'Primary pressed' },
  'interactive/on-accent':       { light: 'white',       dark: 'gray-dark/900', use: 'Label on accent' },

  'interactive/neutral':         { light: 'gray-light/050', dark: 'gray-dark/500', use: 'Secondary button fill' },
  'interactive/neutral-hover':   { light: 'gray-light/100', dark: 'gray-dark/400', use: 'Secondary hover, row hover' },
  'interactive/neutral-pressed': { light: 'gray-light/200', dark: 'gray-dark/300', use: 'Secondary pressed' },
  'interactive/on-neutral':      { light: 'gray-dark/500',  dark: 'gray-light/050', use: 'Label on neutral' },

  'interactive/tertiary':         { light: 'brand-2/500', dark: 'brand-2/500', use: 'brand-2 highlight fill' },
  'interactive/tertiary-hover':   { light: 'brand-2/600', dark: 'brand-2/400', use: 'Tertiary hover' },
  'interactive/tertiary-pressed': { light: 'brand-2/600', dark: 'brand-2/300', use: 'Tertiary pressed — Light repeats hover, see brand-2 dead zone' },
  'interactive/on-tertiary':      { light: 'brand-2/900', dark: 'brand-2/900', use: 'Label on tertiary' },

  'interactive/danger':         { light: 'red/600', dark: 'red/400', use: 'Destructive button fill' },
  'interactive/danger-hover':   { light: 'red/700', dark: 'red/300', use: 'Destructive hover' },
  'interactive/danger-pressed': { light: 'red/800', dark: 'red/200', use: 'Destructive pressed' },
  'interactive/on-danger':      { light: 'white',   dark: 'gray-dark/900', use: 'Label on danger' },

  'interactive/selected':    { light: 'brand-1/050',    dark: 'brand-1/800',   use: 'Selected row, tab, nav' },
  'interactive/disabled':    { light: 'gray-light/200', dark: 'gray-dark/500', use: 'Disabled fill — in Dark equals neutral; the label carries the state' },
  'interactive/on-disabled': { light: 'gray-light/700', dark: 'gray-dark/050', use: 'Disabled label' },

  // ---- border ----------------------------------------------------------
  // `strong` is the only value clearing 3:1 against all four surfaces in both
  // modes, which is why every form control uses it and why it is the same
  // primitive in Light and Dark.
  'border/subtle':  { light: 'gray-light/100', dark: 'gray-dark/500',  use: 'Dividers, row separators' },
  'border/default': { light: 'gray-light/300', dark: 'gray-dark/400',  use: 'Cards and containers — decorative' },
  'border/strong':  { light: 'gray-light/900', dark: 'gray-light/900', use: 'All form control boundaries' },
  'border/accent':  { light: 'brand-1/500',    dark: 'brand-1/400',    use: 'Active, selected' },
  'border/focus':   { light: 'brand-1/500',    dark: 'brand-1/300',    use: 'Focus ring — the only focus token' },
  'border/danger':  { light: 'red/600',        dark: 'red/400',        use: 'Error' },
  'border/success': { light: 'green/700',      dark: 'green/400',      use: 'Validated' },
  'border/inverse': { light: 'gray-dark/500',  dark: 'gray-light/200', use: 'On surface/inverse' },
} as const satisfies Record<string, ThemeEntry>;

export type ThemeTokenName = keyof typeof theme;
export type Mode = 'light' | 'dark';
