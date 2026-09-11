import { DocPage } from '@ui/DocPage';
import * as Icons from '@/icons/index';

const CUSTOM = [
  { Component: Icons.ChevronSmallDown, name: 'ChevronSmallDown', group: 'ui' },
  { Component: Icons.ChevronSmallRight, name: 'ChevronSmallRight', group: 'ui' },
  { Component: Icons.AiSparkle, name: 'AiSparkle', group: 'ui' },
  { Component: Icons.TextHeading, name: 'TextHeading', group: 'ui' },
  { Component: Icons.BrushFreehand, name: 'BrushFreehand', group: 'ui' },
  { Component: Icons.Angle, name: 'Angle', group: 'ui' },
  { Component: Icons.MarkUnread, name: 'MarkUnread', group: 'ui' },
  { Component: Icons.UserVerified, name: 'UserVerified', group: 'ui' },
  { Component: Icons.UserVerifiedOutline, name: 'UserVerifiedOutline', group: 'ui' },
  { Component: Icons.Resources, name: 'Resources', group: 'domain' },
  { Component: Icons.Services, name: 'Services', group: 'domain' },
  { Component: Icons.WaitingRoom, name: 'WaitingRoom', group: 'domain' },
  { Component: Icons.Availability, name: 'Availability', group: 'domain' },
  { Component: Icons.UserMedic, name: 'UserMedic', group: 'domain' },
  { Component: Icons.StressBreathEditor, name: 'StressBreathEditor', group: 'domain' },
] as const;

const RENAMED = [
  ['notifications', 'Notification'],
  ['direction--right--01', 'DirectionRight_01'],
  ['list--task', 'TaskComplete'],
  ['close--panel', 'SidePanelClose'],
  ['collapse', 'CollapseAll'],
  ['private', 'PrivateNetwork'],
  ['calendar--day', 'Calendar'],
  ['rotate--360', 'Rotate'],
] as const;

function Grid({ group }: { group: 'ui' | 'domain' }) {
  return (
    <div className="specimen">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 20,
        }}
      >
        {CUSTOM.filter((i) => i.group === group).map(({ Component, name }) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Component size={20} />
            <span className="alias">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <DocPage
      evidence={
        <>
          <p>287 in use</p>
          <p>264 from Carbon</p>
          <p>15 drawn here</p>
          <p>8 renamed</p>
        </>
      }
    >
      <h1>Icons</h1>
      <p className="lead">
        Almost all of them are IBM Carbon. These are the ones that are not, and the ones
        whose name will mislead you.
      </p>

      <p>
        The set is <a href="https://carbondesignsystem.com/elements/icons/library/">IBM
        Carbon</a>, Apache 2.0, at 16, 20, 24 or 32. Do not draw one that looks close
        enough — Carbon has around 2,700, and a hand-drawn lookalike is a shape nobody can
        find again by name.
      </p>

      <h2>Drawn here</h2>
      <p>
        Fifteen icons do not exist in Carbon. Assuming one of them is Carbon produces an
        import that resolves to nothing, or worse, to something plausible that is quietly
        the wrong shape. They ship with the system.
      </p>

      <h3>Gaps in the set</h3>
      <p>
        A chevron small enough for a dense row, a sparkle, a heading mark. General shapes
        Carbon happens not to carry at this weight.
      </p>
      <Grid group="ui" />

      <h3>From the domain</h3>
      <p>
        A waiting room, an availability grid, a clinician. No general-purpose icon set was
        ever going to have these — they exist because the product they were drawn for
        needed them.
      </p>
      <Grid group="domain" />

      <h2>Eight that Carbon has under another name</h2>
      <p>
        These are the ones that cost time. The name in the design file is not the name in
        the package, so the import fails or lands on the wrong icon.
      </p>
      <div className="tableScroll">
        <table className="tokens">
          <thead>
            <tr>
              <th>In the design</th>
              <th>In Carbon</th>
            </tr>
          </thead>
          <tbody>
            {RENAMED.map(([from, to]) => (
              <tr key={from}>
                <td className="tokenName">{from}</td>
                <td className="tokenName">{to}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Using them</h2>
      <p>
        Every icon paints with <code>currentColor</code>, so it takes the colour of the text
        beside it without being told. <code>size</code> renders it square; the set is drawn
        at 16 and scales from there.
      </p>
      <div className="specimen">
        <div className="specimenRow" style={{ alignItems: 'flex-end' }}>
          {[16, 20, 24, 32].map((size) => (
            <div key={size} style={{ textAlign: 'center' }}>
              <Icons.WaitingRoom size={size} />
              <div className="alias" style={{ marginTop: 6 }}>{size}</div>
            </div>
          ))}
        </div>
        <div className="specimenRow" style={{ marginTop: 20 }}>
          <span style={{ color: 'var(--ap-color-text-danger)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Icons.MarkUnread size={20} /> inherits the colour around it
          </span>
        </div>
      </div>

      <h2>Accessibility</h2>
      <p>
        Every icon is <code>aria-hidden</code> and not focusable by default. An icon beside
        a label repeats it; an icon on its own needs the button or link around it to carry
        the name.
      </p>
      <p>
        <code>UserVerified</code> is the one two-colour icon. Its badge and tick are bound
        to <code>interactive/accent</code> and <code>interactive/on-accent</code> rather than
        baked in, so it follows the theme like everything else.
      </p>
    </DocPage>
  );
}
