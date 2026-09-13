import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { Add, ArrowRight, Search, TrashCan } from '@carbon/icons-react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import * as Icons from '@/icons/index';
import { resolve } from '@/tokens/contrast';
import { spacing } from '@/tokens/scale';

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

/** Counted in the design file when the set was surveyed; the two below are derived from this page. */
const DRAWN = { inUse: 287, fromCarbon: 264 };

/** Where each size goes. Carbon draws at all four; the system uses them by context. */
const SIZES = [
  { size: 16, where: 'beside body text, in a small button, in a badge' },
  { size: 20, where: 'in a field, a menu row, a medium or large button' },
  { size: 24, where: 'in a header, a navigation rail, an icon-only button' },
  { size: 32, where: 'an empty state, a feature mark' },
] as const;

function Grid({ group }: { group: 'ui' | 'domain' }) {
  return (
    <div className="specimen">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: spacing[250],
        }}
      >
        {CUSTOM.filter((i) => i.group === group).map(({ Component, name }) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: spacing[100] }}>
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
          <p>{DRAWN.inUse} in the drawing</p>
          <p>{DRAWN.fromCarbon} from Carbon</p>
          <p>{CUSTOM.length} drawn here</p>
          <p>{RENAMED.length} renamed</p>
          <p>secondary icon on a card</p>
          <p>
            light{' '}
            <Ratio fg={resolve('text/secondary', 'light')} bg={resolve('surface/raised', 'light')} threshold={3} />
          </p>
          <p>
            dark{' '}
            <Ratio fg={resolve('text/secondary', 'dark')} bg={resolve('surface/raised', 'dark')} threshold={3} />
          </p>
          <p>tertiary icon on a card</p>
          <p>
            light{' '}
            <Ratio fg={resolve('text/tertiary', 'light')} bg={resolve('surface/raised', 'light')} threshold={3} />
          </p>
          <p>
            dark{' '}
            <Ratio fg={resolve('text/tertiary', 'dark')} bg={resolve('surface/raised', 'dark')} threshold={3} />
          </p>
        </>
      }
    >
      <h1>Icons</h1>
      <p className="lead">
        Almost all of them are IBM Carbon. These are the ones that are not, and the ones
        whose name will mislead you.
      </p>

      <h2>See it</h2>
      <p>
        Icons where they live: at the start of a button when they carry meaning, at the end
        when they point the way, in a field, in a badge, and alone in a button that then
        carries its name in <code>aria-label</code>.
      </p>
      <div className="specimen">
        <div className="specimenRow">
          <Button size="sm" iconStart={<Add size={16} />}>
            New appointment
          </Button>
          <Button size="sm" variant="outline" tone="neutral" iconEnd={<ArrowRight size={16} />}>
            Next step
          </Button>
          <Button size="sm" variant="ghost" tone="danger" iconStart={<TrashCan size={16} />}>
            Delete note
          </Button>
          <Button size="sm" variant="outline" tone="neutral" aria-label="Add attachment" iconStart={<Add size={16} />} />
        </div>
        <div className="specimenRow">
          <Input size="md" aria-label="Search clients" placeholder="Search clients" iconStart={<Search size={20} />} />
          <Badge tone="warning" icon={<Icons.WaitingRoom size={16} />}>
            Waiting room
          </Badge>
        </div>
      </div>

      <h2>Choosing an icon</h2>
      <p>
        Carbon first, by name: the set is{' '}
        <a href="https://carbondesignsystem.com/elements/icons/library/">IBM Carbon</a>, Apache
        2.0, around 2,700 glyphs at 16, 20, 24 and 32. Do not draw one that looks close
        enough — a hand-drawn lookalike is a shape nobody can find again by name, and two
        libraries on one surface read as two weights of line. Never an emoji as an icon: it
        renders in the platform&rsquo;s own set, in colour, at a size nothing else on the
        surface shares.
      </p>
      <p>
        An icon earns its place by carrying what the label cannot on its own: a plus for
        creating, a bin for deleting, a calendar on a date field. Beside a label it goes at
        the start; when it points where the action goes — next, open, external — it goes at
        the end. Outline is the default and the filled variant marks the active or selected
        state, as <code>UserVerified</code> and <code>UserVerifiedOutline</code> do, so a state
        never needs a second asset, only a second glyph.
      </p>
      <div className="tableScroll">
        <table className="tokens">
          <thead>
            <tr>
              <th>Size</th>
              <th>Where</th>
            </tr>
          </thead>
          <tbody>
            {SIZES.map(({ size, where }) => (
              <tr key={size}>
                <td className="tokenName">{size}</td>
                <td>{where}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Drawn here</h2>
      <p>
        Fifteen icons do not exist in Carbon. Assuming one of them is Carbon produces an
        import that resolves to nothing, or worse, to something plausible that is quietly
        the wrong shape. They ship with the system, drawn on Carbon&rsquo;s grid and at its
        weight, so they sit beside a Carbon glyph as one set.
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
        beside it without being told, and its states — hover, selected, disabled — come from
        that colour and never from a second file. <code>size</code> renders it square; the set
        is drawn at 16 and scales from there. The gap to a label is {spacing[100]}px at every
        size, and a glyph that is not symmetrical — a play triangle, an arrow — is nudged by
        eye rather than centred by the box, because geometric centring is what makes it look
        off.
      </p>
      <div className="specimen">
        <div className="specimenRow" style={{ alignItems: 'flex-end' }}>
          {SIZES.map(({ size }) => (
            <div key={size} style={{ textAlign: 'center' }}>
              <Icons.WaitingRoom size={size} />
              <div className="alias" style={{ marginTop: spacing['075'] }}>{size}</div>
            </div>
          ))}
        </div>
        <div className="specimenRow" style={{ marginTop: spacing[250] }}>
          <span style={{ color: 'var(--ap-color-text-danger)', display: 'inline-flex', alignItems: 'center', gap: spacing[100] }}>
            <Icons.MarkUnread size={20} /> inherits the colour around it
          </span>
          <span style={{ color: 'var(--ap-color-text-disabled)', display: 'inline-flex', alignItems: 'center', gap: spacing[100] }}>
            <Icons.MarkUnread size={20} /> and its disabled state
          </span>
        </div>
      </div>

      <h2>Accessibility</h2>
      <p>
        Every icon is <code>aria-hidden</code> and not focusable by default. An icon beside
        a label repeats it; an icon on its own needs the button or link around it to carry
        the name, and the name says the action — <em>Add attachment</em>, not{' '}
        <em>plus</em>. An icon that carries a state a screen reader would otherwise miss — a
        verified user — is announced by the text beside it, not by the glyph.
      </p>
      <p>
        An icon is non-text and needs 3:1 against its surface. The secondary and tertiary
        colours icons usually take are measured in the margin on a card, in both modes; an
        icon in a colour under that line is decoration and says nothing on its own.
        <code>UserVerified</code> is the one two-colour icon. Its badge and tick are bound
        to <code>interactive/accent</code> and <code>interactive/on-accent</code> rather than
        baked in, so it follows the theme like everything else, at the label ratio measured on
        the <a href="/button">Button</a> page.
      </p>
    </DocPage>
  );
}
