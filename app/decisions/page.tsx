import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { resolve, contrast } from '@/tokens/contrast';
import { primitives } from '@/tokens/primitives';

export default function Page() {
  return (
    <DocPage
      evidence={
        <>
          <p>flare/500</p>
          <p>{contrast(primitives['flare/500'], primitives['stone/900']).toFixed(2)} on dark label</p>
          <p>{contrast(primitives['flare/500'], primitives.white).toFixed(2)} on white</p>
          <p>neither clears 4.5</p>
        </>
      }
    >
      <h1>Decisions</h1>
      <p className="lead">
        The parts of the system that look like mistakes, and the measurements that made
        them the right answer.
      </p>

      <h2>Light and dark are not symmetric</h2>
      <p>
        In light, <code>surface/raised</code> and <code>surface/overlay</code> are both
        white; a shadow separates a card from a modal. In dark, shadows stop reading as
        elevation, so <code>overlay</code> has to be a lighter colour step instead. The two
        modes describe the same hierarchy through different means, and flattening that into
        symmetry breaks the dark theme.
      </p>

      <h2>Button labels are themed, not constant</h2>
      <p>
        In dark the accent fill <em>lightens</em> across hover and pressed, while its label{' '}
        <em>darkens</em> to compensate. This is the trap that makes the palette look
        incapable of a lighter dark-mode hover: hold the label at white and the hover step
        lands at 1.77:1, nowhere near AA, with no lighter violet available that fixes it. The
        label was never the constant.
      </p>
      <div className="specimen">
        <p className="ratioLine" style={{ margin: 0 }}>
          on-accent over accent, hover, pressed — dark:{' '}
          <Ratio fg={resolve('interactive/on-accent', 'dark')} bg={resolve('interactive/accent', 'dark')} />{' '}
          <Ratio fg={resolve('interactive/on-accent', 'dark')} bg={resolve('interactive/accent-hover', 'dark')} />{' '}
          <Ratio fg={resolve('interactive/on-accent', 'dark')} bg={resolve('interactive/accent-pressed', 'dark')} />
        </p>
      </div>

      <h2>The highlight button lightens on hover, in both modes</h2>
      <p>
        <code>interactive/tertiary</code> resolves to flare, the gold the peaks take before
        they turn pink. Its fill is <code>flare/400</code> with a dark label. The step below
        it, <code>flare/500</code>, is the stop where no label passes at all.
      </p>
      <div className="rejected">
        <p>
          <strong>Rejected: flare/500 as the hover fill.</strong>
        </p>
        <p className="ratioLine">
          with stone/900 —{' '}
          <Ratio fg={primitives['stone/900']} bg={primitives['flare/500']} /> · with white —{' '}
          <Ratio fg={primitives.white} bg={primitives['flare/500']} />
        </p>
        <p>
          So the only three-step ladder that passes goes the other way: 400, then 300, then
          200, the label staying dark throughout. Light and dark share it, because the rule
          that produced it is the same in both — the accent already lightens in dark for the
          same reason. The tone is withheld from the outline and ghost variants, enforced in
          the type signature: the theme has no flare text colour, and nobody has drawn the
          button that would need one.
        </p>
      </div>

      <h2>Text inputs and checkboxes share one border</h2>
      <p>
        <code>border/strong</code> is the same primitive in both modes, which is unusual.
        It is the only value in the ramp clearing 3:1 against all four surfaces in light{' '}
        <em>and</em> dark, so every form control can use it without a per-surface exception.
        Sitting mid-ramp, it contrasts in both directions.
      </p>

      <h2>The dark ramp holds three elevation levels, and sunken shares the canvas</h2>
      <p>
        Base, raised, overlay — and then it is full. The ramp is eleven stops and ends at
        950, so in dark <code>surface/sunken</code> is the canvas: a well reads as recessed
        inside a card, and on the canvas it takes a border. A dropdown opened inside a modal
        stays on <code>surface/overlay</code> and is separated by a border rather than another
        fill step. A twentieth step was measured and refused — adjacent steps of the
        neutral it would have extended were 1.08 to 1.23:1 apart, which is how a system ends
        up with two text levels nobody can tell apart. Running out is not a flaw to design
        around; it is a constraint to state plainly so nobody invents a level that collides
        with something.
      </p>

      <h2>The menu takes a border in dark and not in light</h2>
      <p>
        Not an oversight of symmetry. Against the ground it falls on, the shadow reaches 1.19:1
        in light at 8% opacity and 1.15:1 in dark at 64% — in dark it has stopped carrying
        elevation, whatever it is set to. The border is what separates the menu there, and
        against the canvas it is 3.15:1 in dark against 1.60:1 in light: stronger where it has
        to be. In light the shadow already does the work, and drawing the edge twice would
        look like a mistake, because it would be one.
      </p>

      <h2>Each menu tone hovers to its own fill</h2>
      <p>
        The drawing gives every row the same hover fill. Two measurements broke that. The drawn
        fill is <code>surface/base</code>, which in dark is <em>darker</em> than the menu — the
        row under the pointer would open a hole rather than light up. And the accent row&rsquo;s
        label on a shared neutral fill is 4.23:1 in dark, below AA. On its own subtle surface it
        is 8.39:1.
      </p>

      <h2>The menu takes the top layer, and the suite cannot see it</h2>
      <p>
        jsdom, which runs the test suite, implements none of the popover API. The menu uses it
        anyway. A menu opens from inside other components — a row of actions in the Table, whose
        scroll container clips anything positioned inside it — and escaping that clip is the
        reason for an overlay to exist. The suite stubs the calls the component makes and asserts
        everything the component decides: roles, rows, keys, disabled rows, the stylesheet. Esc,
        the outside click, focus return and placement belong to the browser. All four were
        checked in Chrome, and this entry says so rather than letting a stub claim them.
      </p>
    </DocPage>
  );
}
