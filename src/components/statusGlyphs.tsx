/**
 * Carbon's own vectors, the ones drawn in the design file's notifications
 * (checkmark--outline, error, warning, information, close), on their 32
 * grid. Inlined because the package does not depend on @carbon/icons-react
 * at runtime. Apache-2.0, © IBM.
 *
 * Shared by the Toast and the Alert, so a success is the same mark in both.
 */
const GLYPHS = {
  success: [
    'M14 21.414 9 16.413 10.413 15 14 18.586 21.585 11 23 12.415 14 21.414z',
    'M16,2A14,14,0,1,0,30,16,14,14,0,0,0,16,2Zm0,26A12,12,0,1,1,28,16,12,12,0,0,1,16,28Z',
  ],
  danger: [
    'M2,16H2A14,14,0,1,0,16,2,14,14,0,0,0,2,16Zm23.15,7.75L8.25,6.85a12,12,0,0,1,16.9,16.9ZM8.24,25.16A12,12,0,0,1,6.84,8.27L23.73,25.16a12,12,0,0,1-15.49,0Z',
  ],
  warning: [
    'M16,2A14,14,0,1,0,30,16,14,14,0,0,0,16,2Zm0,26A12,12,0,1,1,28,16,12,12,0,0,1,16,28Z',
    'M15 8H17V19H15z',
    'M16,22a1.5,1.5,0,1,0,1.5,1.5A1.5,1.5,0,0,0,16,22Z',
  ],
  info: [
    'M17 22 17 14 13 14 13 16 15 16 15 22 12 22 12 24 20 24 20 22 17 22z',
    'M16,8a1.5,1.5,0,1,0,1.5,1.5A1.5,1.5,0,0,0,16,8Z',
    'M16,30A14,14,0,1,1,30,16,14,14,0,0,1,16,30ZM16,4A12,12,0,1,0,28,16,12,12,0,0,0,16,4Z',
  ],
  close: [
    'M17.4141 16 24 9.4141 22.5859 8 16 14.5859 9.4143 8 8 9.4141 14.5859 16 8 22.5859 9.4143 24 16 17.4141 22.5859 24 24 22.5859 17.4141 16z',
  ],
} as const;

export type StatusGlyphName = keyof typeof GLYPHS;

/** The tone in words, for a screen reader: to the eye it is a shape, or a colour. */
export const SPOKEN_TONE = {
  success: 'Success',
  danger: 'Error',
  warning: 'Warning',
  info: 'Information',
} as const;

/** Sized by its parent; painted with `currentColor`. */
export function StatusGlyph({ name }: { name: StatusGlyphName }) {
  return (
    <svg viewBox="0 0 32 32" width="100%" height="100%" fill="currentColor" aria-hidden="true" focusable="false">
      {GLYPHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
