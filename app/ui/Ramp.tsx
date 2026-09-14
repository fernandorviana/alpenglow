import { primitives, type PrimitiveName } from '@/tokens/primitives';
import { FAMILIES, STOPS } from './Bedrock';

/** A strip of one family, lightest to darkest — the accent's, unless told otherwise. */
export function Ramp({ family = 'twilight' }: { family?: (typeof FAMILIES)[number] }) {
  return (
    <div className="miniRamp">
      {STOPS.map((stop) => {
        const name = `${family}/${stop}` as PrimitiveName;
        return <span key={name} style={{ background: primitives[name] }} />;
      })}
    </div>
  );
}

/**
 * The ten families as strips, one per row, read across the way the Colour
 * page reads them. The bedrock on the home page is the same primitives as a
 * grid; this is the Foundations page's picture of them. As there, the hex
 * reaches the style attribute because colour is the content.
 */
export function Ramps() {
  return (
    <div
      className="ramps"
      role="img"
      aria-label={`The ten colour families as strips, ${STOPS.length} stops each, from the lightest to the darkest`}
    >
      {FAMILIES.map((family) => (
        <span key={family} className="rampStrip">
          {STOPS.map((stop) => {
            const name = `${family}/${stop}` as PrimitiveName;
            return <span key={name} style={{ background: primitives[name] }} />;
          })}
        </span>
      ))}
    </div>
  );
}
