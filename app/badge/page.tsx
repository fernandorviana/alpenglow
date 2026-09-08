import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { Badge, type BadgeTone } from '@/components/Badge/index';
import type { ReactNode } from 'react';
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

const Tick = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M3 8.5l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Clock = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <circle cx="8" cy="8" r="6" />
    <path d="M8 4.5V8l2.5 1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Cross = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
  </svg>
);

const ICONS: Partial<Record<BadgeTone, ReactNode>> = {
  success: <Tick />,
  warning: <Clock />,
  danger: <Cross />,
};

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

      <h2>Two treatments, not one</h2>
      <p>
        Switch the theme at the top of the page and the badge changes shape, not just
        colour. In light it is a tinted fill with no outline. In dark the fill drops back to
        the sunken surface for every tone and an outline appears in the tone&rsquo;s own
        colour — a tinted fill at the dark end of a ramp goes muddy on a dark ground, where
        an outline stays crisp.
      </p>
      <p>
        This is the one component that carries theme logic of its own. The switch is the
        same for every tone, so writing it as twelve more tokens would have cost more than
        it explained.
      </p>

      <h2>Tones</h2>
      <p>
        Each pair reuses status tokens that already existed and, until this component, had
        nothing consuming them. Ratios below are for the light treatment, computed as the
        page renders.
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

      <h2>With an icon</h2>
      <p>
        An icon sits before the label at a fixed 16px, rather than scaling with the text —
        a mark that tracks the font size makes a small badge and a medium one disagree about
        how big a tick is.
      </p>
      <div className="specimen">
        <div className="specimenRow">
          <Badge tone="success" icon={<Tick />}>Confirmed</Badge>
          <Badge tone="warning" icon={<Clock />}>Awaiting</Badge>
          <Badge tone="danger" icon={<Cross />}>No-show</Badge>
        </div>
        <div className="specimenRow">
          <Badge size="sm" tone="success" icon={<Tick />}>Confirmed</Badge>
          <Badge size="sm" tone="warning" icon={<Clock />}>Awaiting</Badge>
          <Badge size="sm" tone="danger" icon={<Cross />}>No-show</Badge>
        </div>
      </div>

      <h2>With a dot</h2>
      <p>
        Where there is no icon that fits, a dot carries the tone at a fraction of the width.
        The label still says what the state is: a dot is a coloured circle, and colour and a
        coloured circle fail exactly the same people. An icon takes precedence over a dot —
        it says more.
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
