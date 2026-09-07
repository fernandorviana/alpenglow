import { Page } from '../ui/Page.js';
import { Ratio } from '../ui/Ratio.js';
import { resolve, contrast } from '../../../src/tokens/contrast.js';
import { primitives } from '../../../src/tokens/primitives.js';

export function Decisions() {
  return (
    <Page
      evidence={
        <>
          <p>brand-2/700</p>
          <p>{contrast(primitives['brand-2/700'], primitives['brand-2/900']).toFixed(2)} on dark label</p>
          <p>{contrast(primitives['brand-2/700'], primitives.white).toFixed(2)} on white</p>
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
        lands at 4.18:1, under AA, with no lighter purple available that fixes it. The
        label was never the constant.
      </p>
      <div className="specimen">
        <p className="ratio" style={{ margin: 0 }}>
          on-accent over accent, hover, pressed — dark:{' '}
          <Ratio fg={resolve('interactive/on-accent', 'dark')} bg={resolve('interactive/accent', 'dark')} />{' '}
          <Ratio fg={resolve('interactive/on-accent', 'dark')} bg={resolve('interactive/accent-hover', 'dark')} />{' '}
          <Ratio fg={resolve('interactive/on-accent', 'dark')} bg={resolve('interactive/accent-pressed', 'dark')} />
        </p>
      </div>

      <h2>The tertiary button has no third step</h2>
      <p>
        <code>interactive/tertiary</code> resolves to brand-2. In light, its pressed state
        would naturally be <code>brand-2/700</code>, and that value falls into a gap where
        neither available label passes.
      </p>
      <div className="rejected">
        <p>
          <strong>Rejected: brand-2/700 as the light pressed fill.</strong>
        </p>
        <p className="ratio">
          with brand-2/900 —{' '}
          <Ratio fg={primitives['brand-2/900']} bg={primitives['brand-2/700']} /> · with white —{' '}
          <Ratio fg={primitives.white} bg={primitives['brand-2/700']} />
        </p>
        <p>
          Light repeats the hover value for pressed rather than shipping a step that cannot
          pass. Dark has room and uses brand-2/300. The tone is also withheld from the
          outline and ghost variants, enforced in the type signature — brand-2 fails as a
          foreground on light surfaces, so offering it would only produce buttons nobody
          should use.
        </p>
      </div>

      <h2>Text inputs and checkboxes share one border</h2>
      <p>
        <code>border/strong</code> is the same primitive in both modes, which is unusual.
        It is the only value in the ramp clearing 3:1 against all four surfaces in light{' '}
        <em>and</em> dark, so every form control can use it without a per-surface exception.
        Sitting mid-ramp, it contrasts in both directions.
      </p>

      <h2>The dark ramp holds four elevation levels, not five</h2>
      <p>
        Sunken, base, raised, overlay — and then it is full. A dropdown opened inside a
        modal stays on <code>surface/overlay</code> and is separated by a border rather than
        another fill step. Running out is not a flaw to design around; it is a constraint to
        state plainly so nobody invents a fifth level that collides with something.
      </p>
    </Page>
  );
}
