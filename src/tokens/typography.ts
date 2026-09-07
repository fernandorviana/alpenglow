/**
 * Alpenglow — typography
 *
 * Part of the scale layer: type does not vary by theme.
 *
 * The Figma file this was derived from stored the cross-product of style and
 * weight as 44 separate text styles (`heading/h1/(600) Semibold`, and so on).
 * That is the wrong shape: weight is an independent axis, so 13 styles plus 4
 * weights expresses the same system in 17 tokens instead of 44.
 *
 * Three defects in the source are corrected here:
 *
 * 1. Two caption styles were set in Montserrat while everything else was Inter.
 * 2. Letter-spacing mixed px and % between weights of the same style. All
 *    tracking is px — at these sizes the percentage values resolved to
 *    fractions of a pixel, which was plainly not the intent.
 * 3. The all-caps family had `textTransform` on its regular weight and not on
 *    its medium and semibold. Inverted; now uniform.
 */

export const fontFamily = {
  sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
} as const;

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

type TextStyle = {
  size: number;
  lineHeight: number;
  tracking: number;
  transform?: 'uppercase';
  use: string;
};

export const textStyle = {
  'heading/h1':     { size: 40, lineHeight: 44, tracking: -1.8, use: 'Page title' },
  'heading/h2':     { size: 32, lineHeight: 36, tracking: -1.6, use: 'Section title' },
  'heading/h3':     { size: 28, lineHeight: 32, tracking: -1.1, use: 'Subsection title' },
  'heading/h4':     { size: 24, lineHeight: 28, tracking: -0.8, use: 'Card title' },

  'subheading/lg':  { size: 20, lineHeight: 24, tracking: -0.3, use: 'Lead paragraph, prominent label' },
  'subheading/md':  { size: 18, lineHeight: 24, tracking: -0.2, use: 'Panel heading' },

  'body/lg':        { size: 16, lineHeight: 24, tracking: -0.1, use: 'Long-form copy' },
  'body/md':        { size: 14, lineHeight: 22, tracking: 0,    use: 'Default body — the most used style in the system' },

  'button/lg':      { size: 16, lineHeight: 20, tracking: -0.2, use: 'Large button label' },
  'button/md':      { size: 14, lineHeight: 18, tracking: -0.1, use: 'Default button label' },

  'caption/md':     { size: 12, lineHeight: 16, tracking: 0.2,  use: 'Helper text, metadata' },
  'caption/sm':     { size: 11, lineHeight: 14, tracking: 0.8,  use: 'Dense table cells, timestamps' },
  'caption/caps':   { size: 10, lineHeight: 12, tracking: 0.8, transform: 'uppercase', use: 'Section eyebrows, overline labels' },
} as const satisfies Record<string, TextStyle>;

export type FontWeightName = keyof typeof fontWeight;
export type TextStyleName = keyof typeof textStyle;
