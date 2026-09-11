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
 *   050 .975 · 100 .945 · 200 .895 · 300 .825 · 400 .73 · 500 .625
 *   600 .525 · 700 .45  · 800 .365 · 900 .29  · 950 .225
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
 *             Never a button tone: glow/600 and ember/600 are 1.02:1 apart.
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
 * Eleven stops and no half steps, on purpose. Adjacent steps of the twenty-step
 * neutral this replaced measured 1.08–1.23:1 apart and produced text levels
 * nobody could tell apart — secondary against tertiary was 1.22:1. When a
 * ladder runs out, separate with a border.
 */

export const primitives = {
  white: '#FFFFFF',

  'glow/050': '#FFF3F8',
  'glow/100': '#FFE5EE',
  'glow/200': '#FFCCDC',
  'glow/300': '#FFA9BF',
  'glow/400': '#FF738F',
  'glow/500': '#EB3B55',
  'glow/600': '#C21640',
  'glow/700': '#A00333',
  'glow/800': '#780026',
  'glow/900': '#57001A',
  'glow/950': '#3B0010',

  'twilight/050': '#F8F5FF',
  'twilight/100': '#F0E8FF',
  'twilight/200': '#E2D4FF',
  'twilight/300': '#CDB8FF',
  'twilight/400': '#B091FF',
  'twilight/500': '#8F62FF',
  'twilight/600': '#6F43DC',
  'twilight/700': '#5733B8',
  'twilight/800': '#3E228F',
  'twilight/900': '#2A1669',
  'twilight/950': '#1A0D49',

  'flare/050': '#FFF5EC',
  'flare/100': '#FFE8D6',
  'flare/200': '#FFD2B1',
  'flare/300': '#FFB27B',
  'flare/400': '#FF7F05',
  'flare/500': '#D66000',
  'flare/600': '#AC4700',
  'flare/700': '#8D3700',
  'flare/800': '#6B2500',
  'flare/900': '#4E1700',
  'flare/950': '#350C00',

  'glacier/050': '#E1FDFF',
  'glacier/100': '#C3F8FC',
  'glacier/200': '#9EECF3',
  'glacier/300': '#5DDAE9',
  'glacier/400': '#00BDD3',
  'glacier/500': '#0098B0',
  'glacier/600': '#00778C',
  'glacier/700': '#006072',
  'glacier/800': '#004655',
  'glacier/900': '#00313D',
  'glacier/950': '#002029',

  'stone/050': '#F5F7F9',
  'stone/100': '#EAEDF1',
  'stone/200': '#D9DDE2',
  'stone/300': '#C1C6CC',
  'stone/400': '#A3A8AF',
  'stone/500': '#83888F',
  'stone/600': '#666B71',
  'stone/700': '#52555C',
  'stone/800': '#3B3F45',
  'stone/900': '#282B31',
  'stone/950': '#191C21',

  'night/050': '#F3F7FF',
  'night/100': '#E7EDFB',
  'night/200': '#D3DCF4',
  'night/300': '#B9C5E7',
  'night/400': '#98A6D1',
  'night/500': '#7885B6',
  'night/600': '#5C6796',
  'night/700': '#4A527C',
  'night/800': '#363B5E',
  'night/900': '#252944',
  'night/950': '#17192F',

  'mist/050': '#F0F9F9',
  'mist/100': '#E1F0F1',
  'mist/200': '#CBE2E2',
  'mist/300': '#AFCDCD',
  'mist/400': '#8DB0B0',
  'mist/500': '#6A908F',
  'mist/600': '#4F7272',
  'mist/700': '#3D5C5C',
  'mist/800': '#2A4444',
  'mist/900': '#1B2F30',
  'mist/950': '#0F1F1F',

  'ember/050': '#FFF4F3',
  'ember/100': '#FFE6E5',
  'ember/200': '#FFCFCD',
  'ember/300': '#FFADA9',
  'ember/400': '#FF7873',
  'ember/500': '#E44B46',
  'ember/600': '#BC2C2F',
  'ember/700': '#9B1C24',
  'ember/800': '#760D18',
  'ember/900': '#56050F',
  'ember/950': '#3B0208',

  'moss/050': '#EEFBF0',
  'moss/100': '#DDF4E0',
  'moss/200': '#BBEAC4',
  'moss/300': '#93D9A3',
  'moss/400': '#67BE80',
  'moss/500': '#3E9E5F',
  'moss/600': '#1D7E46',
  'moss/700': '#0B6636',
  'moss/800': '#004C27',
  'moss/900': '#00351A',
  'moss/950': '#002310',

  'amber/050': '#FDF7E1',
  'amber/100': '#F8EDC5',
  'amber/200': '#EFDC9D',
  'amber/300': '#E3C364',
  'amber/400': '#CCA21D',
  'amber/500': '#AA8100',
  'amber/600': '#886400',
  'amber/700': '#6F4F00',
  'amber/800': '#533900',
  'amber/900': '#3C2700',
  'amber/950': '#281800',
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
   * the two opacities the elevation layer uses, and at 95% for the dark scrim.
   *
   * The drawn shadow is #18274B at 10% and 12% — a navy that exists nowhere
   * else in the palette. Over white, stone/950 lands ΔE76 1.69 and 2.04 from
   * it, under the ~2.3 just noticeable difference. night/950 lands closer,
   * 0.95 and 1.14, and was rejected: the ink is shared by both surface
   * ladders, so it stays neutral rather than following one of them.
   */
  'alpha/ink-10': { hex: '#191C21', alpha: 0.1 },
  'alpha/ink-12': { hex: '#191C21', alpha: 0.12 },
  /**
   * The dark scrim. Dark was never drawn: the literal mirror of the light
   * wash, the overlay colour at 95%, sits within 1.01:1 of the dialog, so the
   * backdrop takes the system's darkest ink instead, with the dialog's
   * dark-mode border doing the rest.
   */
  'alpha/ink-95': { hex: '#191C21', alpha: 0.95 },
  /**
   * The light scrim: the drawn Overlay is the neutral 200 at 95% — read from
   * the exported PNG's alpha, 242/255. A wash more than a shade: the page
   * behind all but disappears, and the dialog is separated from it by its
   * shadow.
   */
  'alpha/mist-95': { hex: '#D9DDE2', alpha: 0.95 },
} as const;

export type PrimitiveName = keyof typeof primitives;
export type AlphaPrimitiveName = keyof typeof alphaPrimitives;
