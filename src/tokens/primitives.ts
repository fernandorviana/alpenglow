/**
 * Alpenglow — primitives
 *
 * Raw values with no meaning attached. Nothing in the product references these
 * directly; the theme layer aliases them and components reference the theme.
 *
 * Ten families, eleven stops each, generated in OKLCH — `scripts/generate-ramps.mjs`
 * is the generator, and every ratio quoted below was read from it, not
 * estimated. The lightness of a stop is the same in every family:
 *
 * The generator is the source, byte for byte. When the tail deepened on
 * 2026-09-11 only the forty 700–950 stops were copied across, but the hue
 * drift between 500 and 950 is interpolated by lightness, so four 600s moved
 * by one unit in one channel as well (glow, twilight, flare, moss). The file
 * was brought back to the generator on 2026-09-12; no ratio quoted anywhere
 * moved at two decimals except glow/600 against ember/600, 1.02 → 1.01.
 *
 *   050 .975 · 100 .945 · 200 .895 · 300 .825 · 400 .73 · 500 .625
 *   600 .525 · 700 .43  · 800 .33  · 900 .245 · 950 .16
 *
 * plus a twelfth stop, 925 at L .205, in stone and night only. It is the
 * surface step: the only stop that exists for surfaces rather than for text
 * or fills. The dark ladder is 950 → 925 → 900, ΔL .043 per step, which is
 * where the reference systems place their surface levels (Radix, Atlassian,
 * Spectrum and Geist sit at .025–.045; the old ladder jumped .085). It lives
 * in the two families a surface ladder is built from and nowhere else —
 * Fernando's call on 2026-09-12, the day it was added; see the elevation
 * spec of that date.
 *
 * That is the rule that makes the families interchangeable by role: any 600
 * carries a white label at 4.5:1 or better, any 400 carries a night/950
 * label, any 500 is the 3:1 stop for icons and borders, any 700 is text on
 * its own 050, any 300 is text on its own 900. Chroma and hue are each
 * family's own; the sRGB gamut clips the vivid families at 300–400, which is
 * where a Display P3 pass would add saturation without touching anything else.
 *
 * Roles, so a reader does not have to infer them from the names:
 *   glow      the brand — pink to coral. Hero, gradient, one CTA per screen.
 *             Never a button tone: glow/600 and ember/600 are 1.01:1 apart.
 *   twilight  everything interactive — violet to indigo.
 *   flare     the highlight fill — the gold the peaks take before they turn
 *             pink. The tertiary tone, never a status: amber sits at h 86–95
 *             so the two stay ΔEok 0.11 apart at 400.
 *   glacier   the second highlight and the info status — the cyan of the
 *             twilight sky (drawn reference #069CB4, ΔEok 0.012 from 500).
 *   stone     the neutral foundation and, when a product wants it, the dark
 *             surface ladder.
 *   night     the dark surface ladder — blue-violet. A product's surfaces are
 *             either stone or night, never mixed in one ladder.
 *   mist      soft states — a near-neutral with a cyan cast. Hover, selection.
 *   ember / moss / amber   danger, success, warning.
 *
 * No half steps for text or fills, on purpose. Adjacent steps of the
 * twenty-step neutral this replaced measured 1.08–1.23:1 apart and produced
 * text levels nobody could tell apart — secondary against tertiary was
 * 1.22:1. 925 is the one exception and it is a surface step: no text is ever
 * set in one surface against another. When a ladder runs out, separate with
 * a border; do not add a 975.
 */

export const primitives = {
  white: '#FFFFFF',

  'glow/050': '#FFF3F8',
  'glow/100': '#FFE5EE',
  'glow/200': '#FFCCDC',
  'glow/300': '#FFA9BF',
  'glow/400': '#FF738F',
  'glow/500': '#EB3B55',
  'glow/600': '#C2173F',
  'glow/700': '#97002F',
  'glow/800': '#680020',
  'glow/900': '#430012',
  'glow/950': '#220006',

  'twilight/050': '#F8F5FF',
  'twilight/100': '#F0E8FF',
  'twilight/200': '#E2D4FF',
  'twilight/300': '#CDB8FF',
  'twilight/400': '#B091FF',
  'twilight/500': '#8F62FF',
  'twilight/600': '#7043DC',
  'twilight/700': '#532CB1',
  'twilight/800': '#361583',
  'twilight/900': '#20055B',
  'twilight/950': '#0D0033',

  'flare/050': '#FFF5EC',
  'flare/100': '#FFE8D6',
  'flare/200': '#FFD2B1',
  'flare/300': '#FFB27B',
  'flare/400': '#FF7F05',
  'flare/500': '#D66000',
  'flare/600': '#AB4800',
  'flare/700': '#843300',
  'flare/800': '#5C1F00',
  'flare/900': '#3C1000',
  'flare/950': '#1E0400',

  'glacier/050': '#E1FDFF',
  'glacier/100': '#C3F8FC',
  'glacier/200': '#9EECF3',
  'glacier/300': '#5DDAE9',
  'glacier/400': '#00BDD3',
  'glacier/500': '#0098B0',
  'glacier/600': '#00778C',
  'glacier/700': '#005A6B',
  'glacier/800': '#003C49',
  'glacier/900': '#00252F',
  'glacier/950': '#001016',

  'stone/050': '#F5F7F9',
  'stone/100': '#EAEDF1',
  'stone/200': '#D9DDE2',
  'stone/300': '#C1C6CC',
  'stone/400': '#A3A8AF',
  'stone/500': '#83888F',
  'stone/600': '#666B71',
  'stone/700': '#4C5057',
  'stone/800': '#32353C',
  'stone/900': '#1E2026',
  'stone/925': '#15171C',
  'stone/950': '#0B0D12',

  'night/050': '#F3F7FF',
  'night/100': '#E7EDFB',
  'night/200': '#D3DCF4',
  'night/300': '#B9C5E7',
  'night/400': '#98A6D1',
  'night/500': '#7885B6',
  'night/600': '#5C6796',
  'night/700': '#444C76',
  'night/800': '#2D3254',
  'night/900': '#1B1E38',
  'night/925': '#12142C',
  'night/950': '#090B1F',

  'mist/050': '#F0F9F9',
  'mist/100': '#E1F0F1',
  'mist/200': '#CBE2E2',
  'mist/300': '#AFCDCD',
  'mist/400': '#8DB0B0',
  'mist/500': '#6A908F',
  'mist/600': '#4F7272',
  'mist/700': '#385656',
  'mist/800': '#213A3B',
  'mist/900': '#102425',
  'mist/950': '#031010',

  'ember/050': '#FFF4F3',
  'ember/100': '#FFE6E5',
  'ember/200': '#FFCFCD',
  'ember/300': '#FFADA9',
  'ember/400': '#FF7873',
  'ember/500': '#E44B46',
  'ember/600': '#BC2C2F',
  'ember/700': '#94131E',
  'ember/800': '#6A000F',
  'ember/900': '#440007',
  'ember/950': '#220002',

  'moss/050': '#EEFBF0',
  'moss/100': '#DDF4E0',
  'moss/200': '#BBEAC4',
  'moss/300': '#93D9A3',
  'moss/400': '#67BE80',
  'moss/500': '#3E9E5F',
  'moss/600': '#1E7E46',
  'moss/700': '#006031',
  'moss/800': '#004120',
  'moss/900': '#002912',
  'moss/950': '#001206',

  'amber/050': '#FDF7E1',
  'amber/100': '#F8EDC5',
  'amber/200': '#EFDC9D',
  'amber/300': '#E3C364',
  'amber/400': '#CCA21D',
  'amber/500': '#AA8100',
  'amber/600': '#886400',
  'amber/700': '#684A00',
  'amber/800': '#483100',
  'amber/900': '#2E1D00',
  'amber/950': '#150B00',
} as const satisfies Record<string, `#${string}`>;

/**
 * Semi-transparent primitives.
 *
 * These exist because opacity cannot be applied to an alias — an alias resolves
 * to the primitive's own alpha. Scrims, hover washes and focus halos therefore
 * need dedicated alpha primitives, or raw values leak into the theme layer.
 */
export const alphaPrimitives = {
  'alpha/black-04': { hex: '#000000', alpha: 0.04 },
  'alpha/black-08': { hex: '#000000', alpha: 0.08 },
  'alpha/black-16': { hex: '#000000', alpha: 0.16 },
  'alpha/black-32': { hex: '#000000', alpha: 0.32 },
  'alpha/black-48': { hex: '#000000', alpha: 0.48 },
  'alpha/black-64': { hex: '#000000', alpha: 0.64 },
  'alpha/white-04': { hex: '#FFFFFF', alpha: 0.04 },
  'alpha/white-08': { hex: '#FFFFFF', alpha: 0.08 },
  'alpha/white-16': { hex: '#FFFFFF', alpha: 0.16 },
  'alpha/white-32': { hex: '#FFFFFF', alpha: 0.32 },
  'alpha/white-48': { hex: '#FFFFFF', alpha: 0.48 },
  'alpha/white-64': { hex: '#FFFFFF', alpha: 0.64 },
  /**
   * Shadow ink. Deliberately off the doubling ramp above, and deliberately not
   * called `black`: this is stone/950, the system's darkest neutral ink, at
   * 8% for the light divider (`border/subtle`), at the two opacities the
   * elevation layer uses, and at 95% for the dark scrim.
   *
   * The drawn shadow is #18274B at 10% and 12% — a navy that exists nowhere
   * else in the palette. Over white, stone/950 lands ΔE76 1.88 and 2.27 from
   * it, under the ~2.3 just noticeable difference. night/950 lands closer,
   * 1.32 and 1.59, and was rejected: the ink is shared by both surface
   * ladders, so it stays neutral rather than following one of them.
   */
  'alpha/ink-08': { hex: '#0B0D12', alpha: 0.08 },
  'alpha/ink-10': { hex: '#0B0D12', alpha: 0.1 },
  'alpha/ink-12': { hex: '#0B0D12', alpha: 0.12 },
  /**
   * The dark scrim. Dark was never drawn: the literal mirror of the light
   * wash, the overlay colour at 95%, sits within 1.01:1 of the dialog, so the
   * backdrop takes the system's darkest ink instead, with the dialog's
   * dark-mode border doing the rest.
   */
  'alpha/ink-95': { hex: '#0B0D12', alpha: 0.95 },
  /**
   * The light scrim: the drawn Overlay is the neutral 200 at 95% — read from
   * the exported PNG's alpha, 242/255. A wash more than a shade: the page
   * behind all but disappears, and the dialog is separated from it by its
   * shadow.
   */
  'alpha/mist-95': { hex: '#D9DDE2', alpha: 0.95 },
  /**
   * The wash: mist/500, the soft-state family's mid stop, at the four
   * opacities the two wash tokens take (hover 8/12, pressed 16/20, light then
   * dark). One ink serves both modes — it darkens a light surface with the
   * faint cyan cast the light hover always had, and lightens a dark one — the
   * way Primer's #656c76 and Apple's 120,120,128 do. Measured over every
   * surface in contrast.test.ts; at 12% over the dark canvas the hue lands
   * ΔEok .003 from what a neutral stone/500 would give. Added 2026-09-12.
   */
  'alpha/haze-08': { hex: '#6A908F', alpha: 0.08 },
  'alpha/haze-12': { hex: '#6A908F', alpha: 0.12 },
  'alpha/haze-16': { hex: '#6A908F', alpha: 0.16 },
  'alpha/haze-20': { hex: '#6A908F', alpha: 0.2 },
} as const;

export type PrimitiveName = keyof typeof primitives;
export type AlphaPrimitiveName = keyof typeof alphaPrimitives;
