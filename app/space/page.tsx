import { DocPage } from '@ui/DocPage';
import { spacing, radius, borderWidth } from '@/tokens/scale';

export default function Page() {
  return (
    <DocPage
      evidence={
        <>
          <p>spacing/100 = 8px</p>
          <p>22 steps</p>
          <p>9 radii</p>
          <p>3 stroke widths</p>
        </>
      }
    >
      <h1>Space and shape</h1>
      <p className="lead">
        Dimension lives apart from the theme. A mis-set theme should change colour, never
        layout.
      </p>

      <h2>Spacing</h2>
      <p>
        Named on the Atlassian convention, where <code>100</code> is 8px rather than 100px.
        The naming survives a change of base unit, which a pixel-named scale does not.
      </p>
      {Object.entries(spacing)
        .filter(([, px]) => px > 0 && px <= 64)
        .map(([name, px]) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <span className="alias" style={{ width: 120 }}>
              spacing/{name}
            </span>
            <div
              style={{
                width: px,
                height: 16,
                background: 'var(--ap-color-interactive-accent)',
                borderRadius: 2,
              }}
            />
            <span className="ratio">{px}px</span>
          </div>
        ))}

      <h2>Radius</h2>
      <div className="specimenRow">
        {Object.entries(radius).map(([name, px]) => (
          <div key={name} style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 72,
                height: 56,
                borderRadius: px,
                background: 'var(--ap-color-surface-sunken)',
                border: '1px solid var(--ap-color-border-default)',
              }}
            />
            <div className="alias" style={{ marginTop: 6 }}>
              {name} · {px === 9999 ? 'full' : `${px}px`}
            </div>
          </div>
        ))}
      </div>

      <h2>Stroke width</h2>
      <p>
        A control's border never changes width between states. Only its colour changes, and
        the focus ring is added outside it — a 1px to 1.5px step would shift the outer box
        and reflow the form on focus.
      </p>
      {Object.entries(borderWidth).map(([name, px]) => (
        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
          <span className="alias" style={{ width: 160 }}>
            border-width/{name}
          </span>
          <div style={{ width: 200, borderTop: `${px}px solid var(--ap-color-border-strong)` }} />
          <span className="ratio">{px}px</span>
        </div>
      ))}
    </DocPage>
  );
}
