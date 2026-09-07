/**
 * Alpenglow — primitives
 *
 * Raw values with no meaning attached. Nothing in the product references these
 * directly; the theme layer aliases them and components reference the theme.
 *
 * `gray-light` and `gray-dark` are ONE continuous 20-step neutral ramp from
 * #F6F8FA to #10111A. The names are historical: `gray-light/900` (#778091) is
 * *lighter* than `gray-dark/050` (#687185). They are adjacent steps, not a
 * mode boundary.
 */

export const primitives = {
  white: '#FFFFFF',

  'gray-light/050': '#F6F8FA',
  'gray-light/100': '#EBEEF1',
  'gray-light/200': '#E1E6EB',
  'gray-light/300': '#D5DBE1',
  'gray-light/400': '#C3CAD4',
  'gray-light/500': '#B1BAC7',
  'gray-light/600': '#A3ACBA',
  'gray-light/700': '#939CAB',
  'gray-light/800': '#868F9F',
  'gray-light/900': '#778091',

  'gray-dark/050': '#687185',
  'gray-dark/100': '#5F6678',
  'gray-dark/200': '#545969',
  'gray-dark/300': '#4B4F5E',
  'gray-dark/400': '#414452',
  'gray-dark/500': '#383A47',
  'gray-dark/600': '#2F303D',
  'gray-dark/700': '#262733',
  'gray-dark/800': '#1A1B25',
  'gray-dark/900': '#10111A',

  'brand-1/050': '#F2EFFE',
  'brand-1/100': '#E3DAFE',
  'brand-1/200': '#C9B7FB',
  'brand-1/300': '#AA89F5',
  'brand-1/400': '#8B60F0',
  'brand-1/500': '#7544E9',
  'brand-1/600': '#5928C9',
  'brand-1/700': '#4317AA',
  'brand-1/800': '#310D84',
  'brand-1/900': '#20065C',

  'brand-2/050': '#F0FFFB',
  'brand-2/100': '#D6FFF7',
  'brand-2/200': '#B8FFF2',
  'brand-2/300': '#92F9E7',
  'brand-2/400': '#67F5DF',
  'brand-2/500': '#33EFD8',
  'brand-2/600': '#20D6C4',
  'brand-2/700': '#13A89B',
  'brand-2/800': '#0A7A73',
  'brand-2/900': '#034444',

  'red/050': '#FFF2F0',
  'red/100': '#FFE1DB',
  'red/200': '#FFBEB2',
  'red/300': '#FB9787',
  'red/400': '#F77463',
  'red/500': '#EB503F',
  'red/600': '#CC392E',
  'red/700': '#AA2722',
  'red/800': '#8F1818',
  'red/900': '#720F12',

  'green/050': '#F0FFF4',
  'green/100': '#DBFFE7',
  'green/200': '#B0FFCD',
  'green/300': '#7DFAAF',
  'green/400': '#51F093',
  'green/500': '#25E578',
  'green/600': '#19C868',
  'green/700': '#12A356',
  'green/800': '#0C703C',
  'green/900': '#034624',

  'yellow/050': '#FFFDEF',
  'yellow/100': '#FFFBDD',
  'yellow/200': '#FFF5B1',
  'yellow/300': '#FFEA7F',
  'yellow/400': '#FFDF5D',
  'yellow/500': '#FFD33D',
  'yellow/600': '#F9C513',
  'yellow/700': '#DBAB09',
  'yellow/800': '#B08800',
  'yellow/900': '#735C0F',

  'blue/050': '#F0F6FF',
  'blue/100': '#DEECFF',
  'blue/200': '#BFD9FF',
  'blue/300': '#99BEFF',
  'blue/400': '#6B9DFF',
  'blue/500': '#3F7AF8',
  'blue/600': '#1F54C7',
  'blue/700': '#1B41A3',
  'blue/800': '#143180',
  'blue/900': '#0B1F5C',
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
} as const;

export type PrimitiveName = keyof typeof primitives;
export type AlphaPrimitiveName = keyof typeof alphaPrimitives;
