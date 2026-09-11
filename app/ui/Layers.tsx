/**
 * The architecture as a landscape, drawn once for the "Why Alpenglow?" page.
 *
 * Six bands, bottom to top, and one light. The light is not a band: it is a
 * direction — a single source in one corner whose rays cross every layer.
 * That is the brand rule for light in literal form: it has a source, and it
 * is never a symmetrical halo.
 *
 * Every fill and stroke is a neutral theme token. Not tidiness: the palette
 * is an open decision, and a diagram drawn in hex would be stranded by it.
 * Drawn in tokens it follows, in both modes, for free. `Layers.test.tsx`
 * holds that line by reading the rendered attributes.
 *
 * Paths is dashed because there is no pattern in the system yet. Cartography
 * already has the convention: ground not yet surveyed is drawn dashed.
 *
 * `border/default` never appears here: measured against the card this sits
 * on (`surface/raised`), it is 1.72:1 in Light and 2.97:1 in Dark. The
 * strokes are what make the picture, so they carry `border/strong` or a
 * text token instead — see `Layers.test.tsx`'s contrast guard.
 */

export const LAYERS = [
  { id: 'crest', name: 'Crest', code: 'app/' },
  { id: 'paths', name: 'Paths', code: 'patterns — none yet' },
  { id: 'terrain', name: 'Terrain', code: 'src/components' },
  // Token files by name, without `.ts`: with it, the outcrop's three ran to
  // x=241 and into the rays, which start at x=200.
  { id: 'contours', name: 'Contours', code: 'theme, elevation' },
  { id: 'outcrop', name: 'Outcrop', code: 'scale, typography, motion' },
  { id: 'bedrock', name: 'Bedrock', code: 'primitives' },
] as const;

const TOP = 24;
const BAND = 56;
const bandTop = (index: number) => TOP + index * BAND;

// Paint. Named once so the drawing below reads as shapes, not as tokens.
const ink = 'var(--ap-color-text-primary)';
const inkSoft = 'var(--ap-color-text-secondary)';
const inkFaint = 'var(--ap-color-text-tertiary)';
const rock = 'var(--ap-color-surface-sunken)';
const ground = 'var(--ap-color-surface-raised)';
const edgeStrong = 'var(--ap-color-border-strong)';

const LABEL = [...LAYERS]
  .reverse()
  .map((l) => l.name.toLowerCase())
  .join(', ');

export function Layers() {
  return (
    <figure className="specimen" style={{ margin: '0 0 var(--ap-spacing-300)' }}>
      <svg
        role="img"
        aria-label={`${LAYERS.length} layers, bottom to top: ${LABEL}. Light crosses every layer from one corner.`}
        viewBox="0 0 640 360"
        style={{ display: 'block', width: '100%', height: 'auto' }}
      >
        {/* Bedrock: the raw mass. Nothing above touches it directly. */}
        <g data-layer="bedrock">
          <rect x="200" y={bandTop(5)} width="424" height={BAND} fill={rock} stroke={edgeStrong} />
        </g>

        {/* Outcrop: the same rock, where it breaks the surface. */}
        <g data-layer="outcrop">
          <polygon
            points={`512,${bandTop(5)} 552,${bandTop(4) + 4} 624,${bandTop(4) + 4} 624,${bandTop(5)}`}
            fill={rock}
            stroke={edgeStrong}
          />
        </g>

        {/* Contours: lines that join every point at one height. No fill — a
            role has no value of its own. */}
        <g data-layer="contours" fill="none" stroke={edgeStrong}>
          <path d="M200,240 C304,208 400,244 520,216 S600,236 624,224" />
          <path d="M200,226 C296,196 392,230 512,202 S596,222 624,210" />
          <path d="M200,212 C288,184 384,216 504,188 S592,208 624,196" />
        </g>

        {/* Terrain: the built surface. */}
        <g data-layer="terrain">
          <polygon
            points="200,192 264,160 344,176 424,148 504,168 584,150 624,164 624,192"
            fill={ground}
            stroke={edgeStrong}
          />
        </g>

        {/* Paths: dashed, because none has been surveyed yet. */}
        <g data-layer="paths">
          <path
            d="M200,128 C320,92 424,124 624,92"
            fill="none"
            stroke={inkFaint}
            strokeDasharray="6 6"
          />
        </g>

        {/* Crest: the ridge line, where the light lands first. */}
        <g data-layer="crest">
          <polyline
            points="200,72 296,40 384,60 468,32 556,52 624,44"
            fill="none"
            stroke={ink}
            strokeWidth="2"
          />
        </g>

        {/* Light: one source, rays that cross every band. Drawn last so it
            reads over the filled layers rather than vanishing behind them. */}
        <g data-layer="light" stroke={inkFaint}>
          <line x1="628" y1="10" x2="200" y2="110" />
          <line x1="628" y1="10" x2="200" y2="200" />
          <line x1="628" y1="10" x2="200" y2="290" />
          <line x1="628" y1="10" x2="200" y2="352" />
          <circle cx="628" cy="10" r="5" fill={ink} stroke="none" />
        </g>

        {/* Labels. Visible text, one per band, in the reading column. */}
        {LAYERS.map((layer, i) => (
          <g key={layer.id} data-label={layer.id}>
            <text x="16" y={bandTop(i) + 26} fill={ink} fontSize="14" fontWeight="600">
              {layer.name}
            </text>
            <text
              x="16"
              y={bandTop(i) + 44}
              fill={inkSoft}
              fontSize="11"
              style={{ fontFamily: 'var(--ap-font-mono)' }}
            >
              {layer.code}
            </text>
          </g>
        ))}
      </svg>
      <figcaption style={{ marginTop: 'var(--ap-spacing-200)', color: 'var(--ap-color-text-secondary)' }}>
        Clarity, layer by layer.
      </figcaption>
    </figure>
  );
}
