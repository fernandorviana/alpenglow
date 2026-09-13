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
        Four pairs sit below 4.5:1, all four deliberate. Listing them is the point: a
        system that reports no exceptions is a system that has not looked.
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
              <td className="tokenName">on-success on success-pressed</td>
              <td className="ratio">
                {contrast(
                  resolve('interactive/on-success', 'light'),
                  resolve('interactive/success-pressed', 'light'),
                ).toFixed(2)}
              </td>
              <td className="ratio">
                {contrast(
                  resolve('interactive/on-success', 'dark'),
                  resolve('interactive/success-pressed', 'dark'),
                ).toFixed(2)}
              </td>
              <td>
                Pressed is feedback after the decision, not information used to make it —
                nobody reads a label while their finger is down. The green ramp has no third
                step that keeps a dark label above 4.5, and a light label fails far worse.
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
            <tr>
              <td className="tokenName">text/inert on surface/overlay</td>
              <td className="ratio">
                {contrast(resolve('text/inert', 'light'), resolve('surface/overlay', 'light')).toFixed(2)}
              </td>
              <td className="ratio">
                {contrast(resolve('text/inert', 'dark'), resolve('surface/overlay', 'dark')).toFixed(2)}
              </td>
              <td>
                The calendar&rsquo;s days from the adjacent months: not focusable, not
                clickable, their numbers hidden from a screen reader. Decoration is exempt.
                Kept quieter than <code>text/disabled</code> in both themes, so a day outside
                the month never reads as more present than an unavailable one.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        The first three are asserted in the test suite at their recorded figures, so an edit
        that makes any of them <em>worse</em> still fails the build; <code>text/inert</code>{' '}
        is asserted as quieter than <code>text/disabled</code> in both themes. An exemption is
        not a place to stop measuring.
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
        <li>
          Every page of this site passes axe at WCAG A and AA, and the states a page cannot
          show — an open menu, an open date picker, a field in error — are checked beside
          their component.
        </li>
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
        <code>prefers-reduced-motion</code>, and what it carried stays: the switch&rsquo;s knob
        still moves, it stops sliding. The one animation, the Loader&rsquo;s spin, slows rather
        than stops, because a frozen spinner reads as a hung page.
      </p>
      <p>
        <strong>Targets have a floor.</strong> No control is under 24px, the AA target size,
        and the ones that are close borrow the rest from what wraps them — a checkbox from its
        label, a row&rsquo;s checkbox from the row. The small button is 32px; for a screen that
        is touched, the large one is 48.
      </p>

      <h2>Keyboard and structure</h2>
      <p>
        Every component has a keyboard path, and it is the platform&rsquo;s wherever the
        platform has one: Space and arrows on the native inputs, Enter on a button, Esc on a
        popover. Where the pattern asks for more, it is the APG&rsquo;s — one tab stop and
        roving arrows in the menu and the calendar grid, Tab wrapping inside an open picker,
        Esc handed to the caller by the dialog rather than closing behind its back. A modal
        makes the page behind it inert and returns focus to what opened it; a closing menu
        does the same.
      </p>
      <p>
        The site is built the same way. A skip link is the first tab stop, the page is a{' '}
        <code>main</code> landmark with the navigation, the section list and the pager as named{' '}
        <code>nav</code>s, every page has one <code>h1</code> and a heading outline with no
        skipped level, and every section heading is an anchor. The page reflows to 320px and to
        200% zoom with no sideways scroll.
      </p>

      <h2>What a product still has to do</h2>
      <p>
        The system carries what it can: the ratios, the roles, the focus, the keyboard. A
        product built on it still owns the parts only it can know.
      </p>
      <ul>
        <li>
          Name every icon-only button for its action — <em>Add attachment</em>, not the
          glyph — and every image for its meaning, or mark it decorative.
        </li>
        <li>
          Write the error: what to enter, beside the field that failed, with focus moved to the
          first one on submit. The components mark and announce; the words are the
          product&rsquo;s.
        </li>
        <li>
          Keep one <code>h1</code> per page and an outline underneath it, and put a skip link
          and a <code>main</code> before the chrome, as this site does.
        </li>
        <li>
          Announce what changes away from the control that changed it: a polite status region
          for a toast or a result count, <code>alert</code> only for an error the reader must
          hear now.
        </li>
        <li>
          Give a field its <code>type</code>, <code>inputMode</code> and{' '}
          <code>autoComplete</code>, and never block paste.
        </li>
        <li>
          Keep hit areas apart in a layout of your own, and never let a decorative layer sit
          over a control without <code>pointer-events: none</code>.
        </li>
      </ul>
    </DocPage>
  );
}
