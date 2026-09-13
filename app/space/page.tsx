import { DocPage } from '@ui/DocPage';
import { elevation } from '@/tokens/elevation';
import { borderWidth, focusRingOffset, radius, spacing } from '@/tokens/scale';

/** The three control heights Button, Input, Select and the date field share, held by `vocabulary.test.ts`. */
const CONTROL = { sm: 32, md: 40, lg: 48 };

/** WCAG 2.5.8's AA floor for a target, and the sizes the system aims for on a desktop and under a thumb. */
const TARGET = { floor: 24, desktop: 40, touch: 44 };

// Sorted by value: an object orders its integer-like keys first, which put
// 025, 050 and 075 after 800.
const steps = Object.entries(spacing)
  .filter(([, px]) => px > 0)
  .sort(([, a], [, b]) => a - b);
const drawn = steps.filter(([, px]) => px <= 64);
const large = steps.filter(([, px]) => px > 64);

export default function Page() {
  return (
    <DocPage
      evidence={
        <>
          <p>spacing/100 = {spacing[100]}px</p>
          <p>{steps.length} steps</p>
          <p>{Object.keys(radius).length} radii</p>
          <p>{Object.keys(borderWidth).length} stroke widths</p>
          <p>{Object.keys(elevation).length} shadow steps, moded</p>
          <p>ring {borderWidth.ring}px at {focusRingOffset}px</p>
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
        Named on the Atlassian convention, where <code>100</code> is {spacing[100]}px rather than
        100px. The naming survives a change of base unit, which a pixel-named scale does not.
        Three steps sit under the base — {spacing['025']}, {spacing['050']} and {spacing['075']}{' '}
        — for the gaps inside a control, where a whole step is too much: the space between an
        icon and its label, a badge&rsquo;s padding, the rail beside a list.
      </p>
      {drawn.map(([name, px]) => (
        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: spacing[200], marginBottom: spacing[100] }}>
          <span className="alias" style={{ width: 120 }}>
            spacing/{name}
          </span>
          <div
            style={{
              width: px,
              height: 16,
              background: 'var(--ap-color-interactive-accent)',
              borderRadius: radius.xs,
            }}
          />
          <span className="ratio">{px}px</span>
        </div>
      ))}
      <p className="alias" style={{ marginTop: spacing[150] }}>
        Above 64, for sections and page margins:{' '}
        {large.map(([name, px]) => `${name} = ${px}px`).join(' · ')}.
      </p>

      <h3>Choosing a step</h3>
      <p>
        Group with space before lines. Things that belong together sit one small step apart
        and groups sit at least twice that apart — {spacing[100]}px inside a group,{' '}
        {spacing[200]}px or more between groups — or the grouping reads as noise. One step per
        level of subordination, with {spacing[200]}px as the default, so a form&rsquo;s fields
        are {spacing[200]} apart and its sections {spacing[400]}. A hairline is the last resort,
        for where space alone cannot carry the structure: a table&rsquo;s rows, a dialog&rsquo;s
        bands.
      </p>
      <p>
        Between targets, {spacing[150]}px is the floor for bordered or filled controls beside
        each other, and {spacing[300]}px around a borderless one — a ghost button, an icon
        button — whose edge nothing draws. Controls stay inside the layout&rsquo;s margins and
        the safe area; a full-width button on a phone is inset by {spacing[200]}px, never
        against the edge. Breakpoints come from content, not devices: this site breaks at 370
        where a Calendar stops fitting a bordered specimen, at 760 where the sidebar stops
        fitting beside the prose, and at 1440 where the section list can join the prose without
        squeezing a Table below its width.
      </p>

      <h2>Size</h2>
      <p>
        Three control heights — {CONTROL.sm}, {CONTROL.md} and {CONTROL.lg}px — shared by
        Button, Input, Select and the date field, so a button and a field in one row sit on one
        line. A 20px icon slot inside them, at every size. Checkbox, Radio and Switch have one
        size, because a field&rsquo;s size changes its box and never its text, and those
        controls are their box.
      </p>
      <p>
        A target is at least {TARGET.floor}px square, the AA floor, and aims for{' '}
        {TARGET.desktop}px on a desktop and {TARGET.touch}px under a thumb. A control smaller
        than that borrows the rest from what it is wrapped in — a checkbox&rsquo;s label, a
        row&rsquo;s width — and two targets never overlap. The small button is {CONTROL.sm}px:
        above the floor, and for a screen that is touched, use the large one.
      </p>

      <h2>Radius</h2>
      <p>
        Buttons are capsules — <code>radius/full</code>, not <code>radius/md</code>. It is
        the most recognisable thing about the system&rsquo;s shape language, so it is worth
        stating rather than leaving each component to decide. Fields are <code>xl</code>, and
        deliberately not the capsule, so what you press and what you type into never look
        alike. Cards and dialogs are <code>2xl</code>; wells and small chips <code>sm</code>.
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
                border: `${borderWidth.hairline}px solid var(--ap-color-border-default)`,
              }}
            />
            <div className="alias" style={{ marginTop: spacing['075'] }}>
              {name} · {px === 9999 ? 'full' : `${px}px`}
            </div>
          </div>
        ))}
      </div>
      <h3>Nested corners are concentric</h3>
      <p>
        When one rounded box sits inside another, the outer radius is the inner radius plus
        the padding between them, so the two curves share a centre. The home page&rsquo;s cards
        are the rule applied: <code>2xl</code> outside, <code>sm</code> inside, and{' '}
        {spacing[150]}px between — {radius['2xl']} = {radius.sm} + {spacing[150]}. The dropdown
        menu is a step short of it: <code>xl</code> outside and <code>lg</code> rows at{' '}
        {spacing[100]}px, where concentric would want {radius.lg + spacing[100]} outside. Those
        are the drawn numbers, and they are recorded here rather than corrected.
      </p>
      <div className="specimen">
        <div className="specimenRow">
          <div
            style={{
              padding: spacing[150],
              borderRadius: radius['2xl'],
              border: `${borderWidth.hairline}px solid var(--ap-color-border-default)`,
              background: 'var(--ap-color-surface-raised)',
            }}
          >
            <div style={{ width: 120, height: 56, borderRadius: radius.sm, background: 'var(--ap-color-surface-sunken)' }} />
          </div>
          <span className="alias">
            {radius['2xl']} outside, {radius.sm} inside, {spacing[150]} between
          </span>
        </div>
      </div>

      <h2>Stroke width</h2>
      <p>
        Three widths by function. The hairline divides and outlines; the control width edges a
        field, a checkbox, a radio; the ring is the focus indicator, drawn outside the control
        at a {focusRingOffset}px offset. A control&rsquo;s border never changes width between
        states — only its colour changes, and the ring is added outside it — because a 1 to
        1.5px step would shift the outer box and reflow the form on focus. Focus adds
        geometry, never recolours a border, so colour is never the only channel carrying it.
      </p>
      {Object.entries(borderWidth).map(([name, px]) => (
        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: spacing[200], marginBottom: spacing[150] }}>
          <span className="alias" style={{ width: 160 }}>
            border-width/{name}
          </span>
          <div style={{ width: 200, borderTop: `${px}px solid var(--ap-color-border-strong)` }} />
          <span className="ratio">{px}px</span>
        </div>
      ))}

      <h2>Shadow ink</h2>
      <p>
        The shadow steps, their geometry and what they measure against the ground are on{' '}
        <a href="/elevation">Elevation and states</a>. What belongs here is the ink, because
        it was a choice with a number. In light it is <code>stone/950</code> at 10% and 12%,
        which lands ΔE76 1.88 and 2.27 from the drawn navy. Pure black at the nearest steps of
        the alpha ramp was tried first and measured 2.20 and 5.70 — the second is well past
        the ~2.3 just-noticeable difference, so the shadow needed its own ink.{' '}
        <code>night/950</code> lands closer, 1.32 and 1.59, and was rejected: the ink is shared
        by both surface ladders, so it stays neutral rather than following one of them. The
        shadow is the one token besides the theme that varies by mode, and it is not a fourth
        Figma collection, because effects are styles there rather than variables.
      </p>

      <h2>Accessibility</h2>
      <p>
        Dimension is where reflow lives. The page holds its structure to 320px and 200% zoom
        without a sideways scroll, text containers take a minimum height rather than a fixed
        one, and a translated label that grows finds room to wrap rather than a box sized to
        one language. Targets meet the floor above, keep their spacing, and never overlap; a
        decorative layer over a control takes <code>pointer-events: none</code> so a glow
        never swallows a click.
      </p>
    </DocPage>
  );
}
