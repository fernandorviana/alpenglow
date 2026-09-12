import { primitives, type PrimitiveName } from '@/tokens/primitives';

/** The families in the order the primitives file declares them. */
export const FAMILIES = [
  'glow',
  'twilight',
  'flare',
  'glacier',
  'stone',
  'night',
  'mist',
  'ember',
  'moss',
  'amber',
] as const;

/** The eleven stops every family has. `925` is the surface step and lives in two families only. */
export const STOPS = [
  '050',
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
  '950',
] as const;

/**
 * The bedrock, drawn: ten families across eleven stops, one cell per
 * primitive, coloured from the token source as the page renders. It is the
 * home page's one picture, and it is not an image — change a primitive and
 * the picture changes with the build.
 *
 * The hex reaches the style attribute here for the same reason it reaches a
 * swatch: colour is the content. Nothing else on the site paints from a
 * primitive.
 */
export function Bedrock() {
  return (
    <div
      className="bedrock"
      role="img"
      aria-label={`The ten colour families, ${FAMILIES.length} rows of ${STOPS.length} stops, from the lightest to the darkest`}
    >
      {FAMILIES.map((family) =>
        STOPS.map((stop) => {
          const name = `${family}/${stop}` as PrimitiveName;
          return (
            <span key={name} className="bedrockCell" style={{ background: primitives[name] }} />
          );
        }),
      )}
    </div>
  );
}
