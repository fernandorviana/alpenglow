import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { composite, contrast, hexToRgb, lightness, resolve, rgbToHex, tokenContrast } from '@/tokens/contrast';
import { alphaPrimitives, primitives } from '@/tokens/primitives';

const f3 = (n: number) => n.toFixed(3);
const f2 = (n: number) => n.toFixed(2);

/** A shadow's darkest layer flattened over the ground it falls on, as a ratio against that ground. */
function shadowOn(name: 'alpha/black-08' | 'alpha/black-64', ground: string) {
  const { hex, alpha } = alphaPrimitives[name];
  return contrast(rgbToHex(composite(hexToRgb(hex), hexToRgb(ground), alpha)), ground);
}

/** When a decision was made, where the record has it. A decision without a date is from the first drawing. */
function Decided({ on }: { on: string }) {
  return (
    <p className="alias" style={{ margin: '-8px 0 12px' }}>
      Decided {on}
    </p>
  );
}

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
      <p>
        Each entry is a record: what was decided, the number that decided it, and the date
        where the record has one. An entry with no date is from the first drawing. A decision
        that runs against a good instinct — a border that fails a guideline on purpose, a
        ladder that is not symmetric — is written here so the next person finds the number
        before they find the instinct.
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

      <h2>Checkboxes take the strong border; text fields have none at rest</h2>
      <Decided on="2026-09-07, and the code has since moved" />
      <p>
        <code>border/strong</code> is the same primitive in both modes, which is unusual.
        It is the only value in the ramp clearing 3:1 against all four surfaces in light{' '}
        <em>and</em> dark, so a checkbox and a radio — where the border <em>is</em> the
        control — use it without a per-surface exception. Sitting mid-ramp, it contrasts in
        both directions.
      </p>
      <p>
        The text field is the exception, and it has two records. The decision of 2026-09-07
        kept a hairline in <code>border/default</code> at rest, 1.40:1 in light and 1.53:1 in
        dark, failing 1.4.11 to preserve the drawn look. The code today draws no resting border
        at all — the boundary is the fill, {f2(contrast(resolve('interactive/neutral', 'light'), resolve('surface/raised', 'light')))}:1
        against a card in light — and the <a href="/input">Input</a> page records that as a
        known gap. The two have not been reconciled, and this entry says so rather than
        picking one quietly.
      </p>

      <h2>The dark ramp holds three elevation levels, and sunken shares the canvas</h2>
      <Decided on="2026-09-11, with the deep tail" />
      <p>
        Base, raised, overlay — 950, 925, 900 — and then it is full. The ramp ends at 950, so
        in dark <code>surface/sunken</code> is the canvas: a well reads as recessed inside a
        card, and on the canvas it takes a border. A dropdown opened inside a modal stays on{' '}
        <code>surface/overlay</code> and is separated by a border rather than another fill
        step. A twentieth step was measured and refused — adjacent steps of the neutral it
        would have extended were 1.08 to 1.23:1 apart, which is how a system ends up with two
        text levels nobody can tell apart. Running out is not a flaw to design around; it is
        a constraint to state plainly so nobody invents a level that collides with something.
      </p>

      <h2>925 is a surface step, and the only half step there will be</h2>
      <Decided on="2026-09-12" />
      <p>
        The ladder used to be 950, 900, 800: one whole stop per level, ΔL .085 in OKLCH, and
        it looked strong because it was. Every reference system measured — Radix, Atlassian,
        Spectrum, Geist — places adjacent surface levels at .025 to .045. The rule against
        half steps was written against text levels nobody could tell apart, and no text is
        ever set in one surface against another, so one stop was added for surfaces and
        nothing else: <code>925</code> at L .205, in <code>night</code> and <code>stone</code> only,
        the two families a surface ladder is built from. The steps are now{' '}
        {f3(lightness(resolve('surface/raised', 'dark')) - lightness(resolve('surface/base', 'dark')))} and{' '}
        {f3(lightness(resolve('surface/overlay', 'dark')) - lightness(resolve('surface/raised', 'dark')))}.
        The <code>975</code> the old rule refused stays refused. See{' '}
        <a href="/elevation">Elevation and states</a> for the survey.
      </p>

      <h2>Surfaces are measured in lightness, not in the contrast ratio</h2>
      <Decided on="2026-09-12" />
      <p>
        The WCAG ratio adds 0.05 to both luminances, which flattens the dark end: Radix&rsquo;s
        first two dark greys are 1.06:1 apart and everyone sees the step. This system&rsquo;s
        new step is{' '}
        {f2(contrast(resolve('surface/base', 'dark'), resolve('surface/raised', 'dark')))}:1, and
        the suite&rsquo;s old floor of 1.09 would have refused it while passing the jump that
        looked wrong. Text on a surface and a boundary on a surface stay on the ratio, which is
        what WCAG asks of them. A ladder step, a well inside a card and a wash over a surface
        are measured in OKLCH lightness, floor .035.
      </p>

      <h2>Hover is a wash, not a fill</h2>
      <Decided on="2026-09-12" />
      <p>
        A row, a menu item, a ghost button and the neutral button all used to hover to one
        opaque colour: <code>mist/100</code> in light, <code>stone/700</code> in dark. Over a
        dark card that was ΔL +.184 where the references sit at +.05 to +.09, and in light it
        was invisible on <code>surface/sunken</code>, the same primitive. Now they take{' '}
        <code>interactive/wash-hover</code>, <code>mist/500</code> at 8% in light and 12% in
        dark — one ink that darkens a light surface and lightens a dark one, laid over whatever
        is beneath. A hovered row on a dark card is{' '}
        {f3(lightness(resolve('interactive/wash-hover', 'dark', resolve('surface/raised', 'dark'))) - lightness(resolve('surface/raised', 'dark')))}{' '}
        above it. The text beneath keeps its own token and is measured there: the tightest
        pair where rows live, <code>text/tertiary</code> on a hovered row on a light card, is{' '}
        <Ratio fg={resolve('text/tertiary', 'light')} bg={resolve('interactive/wash-hover', 'light', resolve('surface/raised', 'light'))} />.
        The filled ladders — accent, danger, success, tertiary — are untouched: a filled button
        changes its own colour, and its label is themed with it.
      </p>

      <h2>The menu takes a border in dark and not in light</h2>
      <p>
        Not an oversight of symmetry. Against the ground it falls on, the shadow reaches{' '}
        {f2(shadowOn('alpha/black-08', primitives.white))}:1 in light at 8% opacity and{' '}
        {f2(shadowOn('alpha/black-64', resolve('surface/base', 'dark')))}:1 in dark at 64% — in
        dark it has stopped carrying elevation, whatever it is set to. The border is what
        separates the menu there, and against the canvas it is{' '}
        {f2(tokenContrast('border/default', 'surface/base', 'dark'))}:1 in dark against{' '}
        {f2(tokenContrast('border/default', 'surface/base', 'light'))}:1 in light: stronger where
        it has to be. In light the shadow already does the work, and drawing the edge twice
        would look like a mistake, because it would be one.
      </p>

      <h2>Each menu tone hovers to its own fill</h2>
      <p>
        The drawing gives every row the same hover fill. Two measurements broke that. The drawn
        fill is <code>surface/base</code>, which in dark is <em>darker</em> than the menu — the
        row under the pointer would open a hole rather than light up. And the accent row&rsquo;s
        label on a shared neutral fill was 3.50:1 in dark when the rule was made. The deeper
        dark tail brought it to 4.59:1, which passes, and the rule stays: a tone hovers to its
        own subtle surface because that is the design, not because of 0.09 of headroom. On its
        own surface the label is 9.64:1, and on the wash the neutral row takes now it would be{' '}
        {f2(tokenContrast('text/accent', 'interactive/wash-hover', 'dark', 'surface/overlay'))}:1.
      </p>

      <h2>The menu takes the top layer, and the suite cannot see it</h2>
      <Decided on="2026-09-10, checked by hand in Chrome and Safari" />
      <p>
        jsdom, which runs the test suite, implements none of the popover API. The menu uses it
        anyway. A menu opens from inside other components — a row of actions in the Table, whose
        scroll container clips anything positioned inside it — and escaping that clip is the
        reason for an overlay to exist. The suite stubs the calls the component makes and asserts
        everything the component decides: roles, rows, keys, disabled rows, the stylesheet. Esc,
        the outside click, focus return and placement belong to the browser. All four were
        checked in Chrome, and this entry says so rather than letting a stub claim them.
      </p>

      <h2>The section list joins the prose at 1440, and not before</h2>
      <Decided on="2026-09-12" />
      <p>
        The site&rsquo;s page has three columns on a wide screen — the sections, the prose,
        the measurements — and a Table specimen needs 704px of prose to keep its header: 654
        for the table and a specimen&rsquo;s padding and hairline on both sides. At 1440 the
        prose has 728 with the list beside it; at 1280 it would have 616 and every Table on
        its own page would render collapsed. So below 1440 the list sits at the head of the
        measurements column instead, and the prose keeps 784.
      </p>

      <h2>The Dialog&rsquo;s title wraps</h2>
      <Decided on="2026-09-13" />
      <p>
        It used to truncate with an ellipsis, and at <code>xs</code> the header&rsquo;s grid
        left it 112px: two 40px buttons, two 40px gaps, and 48 of padding out of 320.{' '}
        <em>Reschedule appointment</em>, this system&rsquo;s own example, read &ldquo;Reschedule
        appoint…&rdquo;, and the question a confirmation asks was cut at &ldquo;Cancel th…&rdquo;.
        A title the reader cannot read is a dialog they cannot answer, so the title wraps,
        balanced, and the gap came down to 24 — the header&rsquo;s own padding — because
        &ldquo;appointment?&rdquo; alone is 115px. A stylesheet test refuses the ellipsis from
        now on.
      </p>

      <h2>A theme flip holds every transition but the toggle&rsquo;s own</h2>
      <Decided on="2026-09-12" />
      <p>
        A flip changes the colour of nearly everything at once, and every colour transition on
        the page fired together: measured on the Button page, 92 on the buttons and 7 on the
        section list, so the buttons faded for 120ms while the page around them snapped. The
        toggle now puts an attribute on the root for the frame the theme is written in, the
        stylesheet turns transitions off under it, and the next frame takes it away. The
        toggle&rsquo;s own transitions are excepted, because the knob&rsquo;s slide is the
        control answering the click. Measured after: four transitions, all the toggle&rsquo;s.
      </p>
    </DocPage>
  );
}
