import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { Badge, type BadgeTone } from '@/components/Badge/index';
import { resolve } from '@/tokens/contrast';
import type { ThemeTokenName } from '@/tokens/theme';

const TONES: ReadonlyArray<{
  tone: BadgeTone;
  label: string;
  fg: ThemeTokenName;
  bg: ThemeTokenName;
}> = [
  { tone: 'neutral', label: 'Draft', fg: 'text/primary', bg: 'surface/sunken' },
  { tone: 'accent', label: 'New', fg: 'text/accent', bg: 'surface/accent-subtle' },
  { tone: 'success', label: 'Confirmed', fg: 'text/success', bg: 'surface/success-subtle' },
  { tone: 'warning', label: 'Awaiting', fg: 'text/warning', bg: 'surface/warning-subtle' },
  { tone: 'danger', label: 'No-show', fg: 'text/danger', bg: 'surface/danger-subtle' },
  { tone: 'info', label: 'Rescheduled', fg: 'text/info', bg: 'surface/info-subtle' },
];

export default function Page() {
  return (
    <DocPage
      evidence={
        <>
          <p>6 tones</p>
          <p>12 pairs</p>
          <p>all AA</p>
        </>
      }
    >
      <h1>Badge</h1>
      <p className="lead">
        A state, said in a word. The colour agrees with the word — it never replaces it.
      </p>

      <p>
        The drawn component names its colours by hue: Gray, Red, Yellow, Green, Blue,
        Indigo, Purple, Pink. These are named for meaning instead. A badge that takes a
        colour makes every caller decide what green means, and the answers drift — one
        screen&rsquo;s green is &ldquo;paid&rdquo;, another&rsquo;s is &ldquo;active&rdquo;,
        a third&rsquo;s is &ldquo;low risk&rdquo;. Naming the meaning keeps that decision in
        one place.
      </p>

      <h2>Tones</h2>
      <p>
        Each pair reuses status tokens that already existed and, until this component, had
        nothing consuming them. Ratios below are computed as the page renders.
      </p>
      <div className="specimen">
        <div className="specimenRow">
          {TONES.map(({ tone, label }) => (
            <Badge key={tone} tone={tone}>
              {label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="tableScroll">
        <table className="tokens">
          <thead>
            <tr>
              <th>Tone</th>
              <th>Light</th>
              <th>Dark</th>
            </tr>
          </thead>
          <tbody>
            {TONES.map(({ tone, fg, bg }) => (
              <tr key={tone}>
                <td className="tokenName">{tone}</td>
                <td>
                  <Ratio fg={resolve(fg, 'light')} bg={resolve(bg, 'light')} />
                </td>
                <td>
                  <Ratio fg={resolve(fg, 'dark')} bg={resolve(bg, 'dark')} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Sizes</h2>
      <div className="specimen">
        <div className="specimenRow">
          <Badge size="sm" tone="success">Confirmed</Badge>
          <Badge size="md" tone="success">Confirmed</Badge>
        </div>
      </div>

      <h2>With a dot</h2>
      <p>
        For a dense table where a full badge would not fit, a dot carries the tone at a
        fraction of the width. The label still says what the state is: a dot is a coloured
        circle, and colour and a coloured circle fail exactly the same people.
      </p>
      <div className="specimen">
        <div className="specimenRow">
          {TONES.map(({ tone, label }) => (
            <Badge key={tone} tone={tone} dot size="sm">
              {label}
            </Badge>
          ))}
        </div>
      </div>

      <h2>Accessibility</h2>
      <p>
        A badge carries no role. It is text with a background, not a control, and announcing
        it as a button or as a status that never changes would be worse than announcing
        nothing.
      </p>
      <p>
        There is no icon-only badge. If the colour is the only thing saying what the state
        is, nothing is saying it to a person who cannot separate the hues — which is why
        every badge here has a word in it.
      </p>
      <p>
        The dot and the icon are hidden from assistive technology. Both repeat what the
        label already says.
      </p>
    </DocPage>
  );
}
