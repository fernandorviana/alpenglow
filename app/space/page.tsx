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
          <p>1 elevation step, moded</p>
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
      <p>
        Buttons are capsules — <code>radius/full</code>, not <code>radius/md</code>. It is
        the most recognisable thing about the system&rsquo;s shape language, so it is worth
        stating rather than leaving each component to decide.
      </p>
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

      <h2>Elevation</h2>
      <p>
        One step, <code>md</code>, and it is the only token besides the theme that varies by
        mode. It cannot live in either existing layer: the theme is typed as colour aliases and
        the contrast suite iterates its keys, while the scale must not vary by mode — and this
        does. It is not a fourth Figma collection, because effects are styles there rather than
        variables.
      </p>
      <p>
        The geometry is shared by both modes and only the ink changes: the same light, a
        different room. In light the ink is <code>gray-dark/900</code> at 10% and 12%, which
        lands ΔE76 1.73 and 1.57 from the drawn navy. Pure black at the nearest steps of the
        alpha ramp was tried first and measured at 2.20 and 5.70 — the second is well past the
        ~2.3 just noticeable difference, so the shadow needed its own ink.
      </p>
      <p>
        Dark was never drawn: the source library has this shadow in three sizes for light and
        one for dark, and not this one. So the dark values are a decision, and the decision is
        to keep them modest. Against the ground it falls on, black at 8% in light reaches
        1.19:1; black at 64% in dark reaches 1.16:1. An 8% shadow in light does more than a 64%
        shadow in dark. Pushing dark harder buys 0.07 of ratio and costs a smear.
      </p>
      <p>
        Which is why, in dark, the Menu also takes a 1px border. That is the rule for running
        out of elevation, applied: separate with a border rather than inventing a step.
        Against the canvas <code>border/default</code> is 1.77:1 in dark and 1.31:1 in light —
        stronger exactly where it is needed. Light does not get one; there the shadow already
        separates, and a border would draw the edge twice.
      </p>

      <div className="specimen">
        <div
          style={{
            padding: 24,
            maxWidth: 240,
            borderRadius: 'var(--ap-radius-xl)',
            background: 'var(--ap-color-surface-overlay)',
            boxShadow: 'var(--ap-elevation-md)',
          }}
        >
          <span className="alias">elevation/md</span>
        </div>
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
