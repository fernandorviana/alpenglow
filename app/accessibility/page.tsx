import { DocPage } from '@ui/DocPage';
import { theme, type ThemeTokenName, type Mode } from '@/tokens/theme';
import { resolve, contrast } from '@/tokens/contrast';

/** Opaque grounds a component can sit on. Scrim is a wash, not a ground. */
const SURFACES = [
  'surface/base',
  'surface/raised',
  'surface/overlay',
  'surface/sunken',
] as const satisfies readonly ThemeTokenName[];

/**
 * The worst case is the honest number. A token that clears AA on a card and
 * fails in a table header has not cleared AA — reporting only the comfortable
 * pairing is how documentation ends up true and useless at the same time.
 */
function worst(token: ThemeTokenName, grounds: readonly ThemeTokenName[], mode: Mode) {
  return grounds
    .map((ground) => ({ ground, ratio: contrast(resolve(token, mode), resolve(ground, mode)) }))
    .reduce((low, next) => (next.ratio < low.ratio ? next : low));
}

function Cell({ ratio, threshold }: { ratio: number; threshold: number }) {
  const passes = ratio >= threshold;
  return (
    <span className="ratio">
      {ratio.toFixed(2)}
      <span className={`grade ${passes ? 'gradePass' : 'gradeFail'}`}>
        {passes ? 'Pass' : 'Below'}
      </span>
    </span>
  );
}

function WorstCaseTable({
  tokens,
  grounds,
  threshold,
}: {
  tokens: readonly ThemeTokenName[];
  grounds: readonly ThemeTokenName[];
  threshold: number;
}) {
  return (
    <div className="tableScroll">
      <table className="tokens">
        <thead>
          <tr>
            <th>Token</th>
            <th>Light, worst case</th>
            <th>Dark, worst case</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((token) => {
            const light = worst(token, grounds, 'light');
            const dark = worst(token, grounds, 'dark');
            return (
              <tr key={token}>
                <td className="tokenName">{token}</td>
                <td>
                  <Cell ratio={light.ratio} threshold={threshold} />
                  <div className="alias">on {light.ground.split('/')[1]}</div>
                </td>
                <td>
                  <Cell ratio={dark.ratio} threshold={threshold} />
                  <div className="alias">on {dark.ground.split('/')[1]}</div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const BODY_TEXT = [
  'text/primary',
  'text/secondary',
  'text/tertiary',
  'text/accent',
  'text/success',
  'text/warning',
  'text/danger',
  'text/info',
] as const satisfies readonly ThemeTokenName[];

const ACCENT_FILLS = [
  'interactive/accent',
  'interactive/accent-hover',
  'interactive/accent-pressed',
] as const satisfies readonly ThemeTokenName[];

const DANGER_FILLS = [
  'interactive/danger',
  'interactive/danger-hover',
  'interactive/danger-pressed',
] as const satisfies readonly ThemeTokenName[];

export default function Page() {
  const failing = BODY_TEXT.filter(
    (t) => worst(t, SURFACES, 'light').ratio < 4.5 || worst(t, SURFACES, 'dark').ratio < 4.5,
  );

  // Derived, not typed. A hand-written count is the failure this page argues
  // against, and it goes stale faster than anything else on it.
  const pairsMeasured =
    (BODY_TEXT.length * SURFACES.length +
      3 * SURFACES.length +
      ACCENT_FILLS.length +
      DANGER_FILLS.length) *
    2;

  return (
    <DocPage
      evidence={
        <>
          <p>{pairsMeasured} pairs</p>
          <p>measured live</p>
          <p>{failing.length} below AA</p>
          <p>{SURFACES.length} surfaces</p>
          <p>2 modes</p>
        </>
      }
    >
      <h1>Accessibility</h1>
      <p className="lead">
        Every number on this page is computed as the page renders, by the same function the
        test suite runs. None of them was typed in and hoped over.
      </p>

      <p>
        Most design systems state a claim — <em>AA compliant</em> — once, by hand, near the
        top of a page. The claim is true when written and quietly stops being true the first
        time a value moves. Here the documentation and the tests read the same source, so a
        token cannot drift without both the page and the build changing.
      </p>

      <h2>Worst case, not best case</h2>
      <p>
        A colour that clears AA on a white card and fails in a table header has not cleared
        AA. Every figure below is the lowest ratio the token reaches against any surface it
        can sit on, and the surface that produced it is named underneath.
      </p>

      <h3>Text</h3>
      <p>Against all four surfaces, in both themes. The threshold is 4.5:1.</p>
      <WorstCaseTable tokens={BODY_TEXT} grounds={SURFACES} threshold={4.5} />

      <h3>Control borders</h3>
      <p>
        WCAG 1.4.11 asks for 3:1 where a border is what identifies a control.{' '}
        <code>border/strong</code> is the only value in the ramp that manages it against
        every surface in both themes, which is why every form control uses it and why it is
        the same primitive in light and dark.
      </p>
      <WorstCaseTable
        tokens={['border/strong', 'border/focus', 'border/danger'] as const}
        grounds={SURFACES}
        threshold={3}
      />

      <h3>Button labels</h3>
      <p>
        Measured against every fill the label can appear on, not just the resting one. In
        dark the accent fill lightens across hover and pressed while the label darkens to
        compensate — holding the label at white would put the hover step under AA.
      </p>
      <WorstCaseTable
        tokens={['interactive/on-accent'] as const}
        grounds={ACCENT_FILLS}
        threshold={4.5}
      />
      <WorstCaseTable
        tokens={['interactive/on-danger'] as const}
        grounds={DANGER_FILLS}
        threshold={4.5}
      />

      <h2>Where the system falls short, on purpose</h2>
      <p>
        Two tokens sit below 4.5:1, and both are deliberate. Listing them is the point:
        a system that reports no exceptions is a system that has not looked.
      </p>

      <div className="tableScroll">
        <table className="tokens">
          <thead>
            <tr>
              <th>Token</th>
              <th>Light</th>
              <th>Dark</th>
              <th>Why</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="tokenName">text/placeholder</td>
              <td className="ratio">
                {worst('text/placeholder', SURFACES, 'light').ratio.toFixed(2)}
              </td>
              <td className="ratio">
                {worst('text/placeholder', SURFACES, 'dark').ratio.toFixed(2)}
              </td>
              <td>
                Placeholder text is a hint, never the only copy of a label. Darkening it far
                enough to clear AA makes an empty field read as a filled one.
              </td>
            </tr>
            <tr>
              <td className="tokenName">text/disabled</td>
              <td className="ratio">
                {worst('text/disabled', SURFACES, 'light').ratio.toFixed(2)}
              </td>
              <td className="ratio">
                {worst('text/disabled', SURFACES, 'dark').ratio.toFixed(2)}
              </td>
              <td>
                WCAG 2.1 exempts inactive components. Low contrast is what communicates that
                the control cannot be used.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        Both are asserted in the test suite at their recorded figures, so an edit that makes
        either <em>worse</em> still fails the build. An exemption is not a place to stop
        measuring.
      </p>

      <h2>What the suite actually checks</h2>
      <p>
        The suite runs before anything deploys, and blocks it on failure. In plain terms:
      </p>
      <ul>
        <li>Every text token clears AA on all four surfaces, in both themes.</li>
        <li>Every status colour clears AA on its own subtle background, not just on white.</li>
        <li>Every button label clears AA on all of its fill states, not only at rest.</li>
        <li>Control borders clear 1.4.11 on every surface they can appear on.</li>
        <li>The dark elevation ladder stays ordered, and each step stays separable.</li>
        <li>No token collapses into the surface behind it.</li>
        <li>Both generated stylesheets stay in step with the token source.</li>
        <li>Components keep their semantics: labels, roles, keyboard, form participation.</li>
      </ul>
      <p>
        The colour checks caught five real defects the first time they ran. One was a
        divider that resolved to exactly the same value as the surface beneath it — 1.00:1,
        invisible, and not something anyone finds by eye in a palette of eighty-one greys.
      </p>

      <h2>Beyond colour</h2>
      <p>
        Contrast is the part that can be measured, which makes it the part that gets
        measured. The rest is enforced by component tests instead.
      </p>
      <p>
        <strong>Focus adds geometry.</strong> A ring is drawn outside the control rather
        than the border being recoloured, so colour is never the only channel carrying the
        state. A field&rsquo;s border keeps its width in every state, so nothing reflows when
        it gains focus.
      </p>
      <p>
        <strong>Error survives focus.</strong> Focusing an invalid field adds the ring and
        keeps the red border. One signal does not replace the other.
      </p>
      <p>
        <strong>Controls cannot ship unlabelled.</strong> Checkbox and Radio wrap their input
        in the label, so there is no id to forget. Input and Textarea deliberately do not
        invent a label — a control that guesses at one gets it wrong.
      </p>
      <p>
        <strong>Descriptions stay descriptions.</strong> Help text sits outside the label and
        is attached with <code>aria-describedby</code>. Inside it, assistive technology reads
        it as part of the control&rsquo;s name.
      </p>
      <p>
        <strong>Everything is a real element.</strong> Native inputs underneath mean arrow
        keys move through a radio group, space toggles a checkbox, and form submission works
        without a single key handler.
      </p>
      <p>
        <strong>Motion asks first.</strong> Every transition is removed under{' '}
        <code>prefers-reduced-motion</code>.
      </p>
    </DocPage>
  );
}
