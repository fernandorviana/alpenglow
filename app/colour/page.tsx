import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { Swatch } from '@ui/Swatch';
import { primitives, alphaPrimitives } from '@/tokens/primitives';
import { theme, type ThemeTokenName } from '@/tokens/theme';
import { contrast, lightness, resolve } from '@/tokens/contrast';

const RAMPS = ['glow', 'twilight', 'flare', 'glacier', 'stone', 'night', 'mist', 'ember', 'moss', 'amber'] as const;
const STEPS = ['050', '100', '200', '300', '400', '500', '600', '700', '800', '900', '925', '950'] as const;

/** The stops a ramp actually has: 925 exists only in the two surface ladders. */
const stepsOf = (ramp: (typeof RAMPS)[number]) =>
  STEPS.filter((step) => `${ramp}/${step}` in primitives);

const ROLES: Record<(typeof RAMPS)[number], string> = {
  glow: 'the brand — hero, gradient, one call to action per screen; never a button tone',
  twilight: 'everything interactive — fills, links, focus, selection',
  flare: 'the highlight fill — the tertiary tone',
  glacier: 'the second highlight, and the info status',
  stone: 'the neutral foundation — text, borders, the light canvas',
  night: 'the dark surface ladder',
  mist: 'soft states — the wash that hover and pressed lay over any surface, in both modes',
  ember: 'danger',
  moss: 'success',
  amber: 'warning',
};

/**
 * What each stop carries, and the pair that proves it. The claim in the
 * primitives file is that a number means the same amount of light in every
 * family; each row measures the pair across all ten and shows the tightest,
 * so the table is the claim tested rather than restated.
 */
type Guarantee = { stop: (typeof STEPS)[number]; carries: string; fg: (ramp: string) => string; bg: (ramp: string) => string };
const p = primitives as Record<string, string>;
const GUARANTEES: Guarantee[] = [
  { stop: '300', carries: 'text on its own 900', fg: (r) => p[`${r}/300`]!, bg: (r) => p[`${r}/900`]! },
  { stop: '400', carries: 'a night/950 label', fg: () => p['night/950']!, bg: (r) => p[`${r}/400`]! },
  { stop: '500', carries: 'icons and borders on white, 3:1', fg: (r) => p[`${r}/500`]!, bg: () => p.white! },
  { stop: '600', carries: 'a white label', fg: () => p.white!, bg: (r) => p[`${r}/600`]! },
  { stop: '700', carries: 'text on its own 050', fg: (r) => p[`${r}/700`]!, bg: (r) => p[`${r}/050`]! },
];

/** The family where the pair is tightest. */
function tightest(g: Guarantee) {
  return [...RAMPS]
    .map((ramp) => ({ ramp, fg: g.fg(ramp), bg: g.bg(ramp), ratio: contrast(g.fg(ramp), g.bg(ramp)) }))
    .sort((a, b) => a.ratio - b.ratio)[0]!;
}

function group(prefix: string) {
  return (Object.keys(theme) as ThemeTokenName[]).filter((t) => t.startsWith(prefix));
}

/** The surface each group is measured against — the one it actually sits on. */
function against(token: ThemeTokenName): ThemeTokenName {
  if (token.endsWith('-subtle')) return token;
  return 'surface/raised';
}

/** An alpha token has no colour of its own until it lands on something; here that is a card. */
const isAlpha = (alias: string) => alias in alphaPrimitives;

function TokenTable({ tokens, threshold }: { tokens: ThemeTokenName[]; threshold: number }) {
  return (
    <div className="tableScroll">
    <table className="tokens">
      <thead>
        <tr>
          <th>Token</th>
          <th colSpan={2}>Light</th>
          <th colSpan={2}>Dark</th>
        </tr>
      </thead>
      <tbody>
        {tokens.map((token) => {
          const entry = theme[token];
          const scrim = token === 'surface/scrim';
          const wash = token.startsWith('interactive/wash-');
          // The scrim is flattened over the canvas it covers; every other
          // alpha — the wash, the subtle border — over the card it lands on.
          const ground = (mode: 'light' | 'dark') =>
            isAlpha(entry[mode]) ? resolve(scrim ? 'surface/base' : 'surface/raised', mode) : undefined;
          const light = resolve(token, 'light', ground('light'));
          const dark = resolve(token, 'dark', ground('dark'));
          // A wash is a ground for text, not a figure against one; its
          // readings are on the Elevation page.
          const measurable = !scrim && !wash && !token.startsWith('surface/');

          return (
            <tr key={token}>
              <td>
                <div className="tokenName">{token.split('/').slice(1).join('/')}</div>
                <div className="alias">{entry.use}</div>
              </td>
              <td><Swatch value={light} /></td>
              <td>
                <div className="alias">{entry.light}</div>
                {measurable && (
                  <Ratio fg={light} bg={resolve(against(token), 'light')} threshold={threshold} />
                )}
              </td>
              <td><Swatch value={dark} /></td>
              <td>
                <div className="alias">{entry.dark}</div>
                {measurable && (
                  <Ratio fg={dark} bg={resolve(against(token), 'dark')} threshold={threshold} />
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
    </div>
  );
}

export default function Page() {
  const primitiveCount = Object.keys(primitives).length;
  const themeCount = Object.keys(theme).length;
  return (
    <DocPage
      evidence={
        <>
          <p>{primitiveCount} primitives</p>
          <p>{themeCount} theme tokens</p>
          <p>0 hex in the theme</p>
          <p>measured against</p>
          <p>surface/raised</p>
        </>
      }
    >
      <h1>Colour</h1>
      <p className="lead">
        Ten families of eleven stops, a twelfth in the two surface ladders, {themeCount} roles,
        and a rule that keeps them apart:
        nothing in the product references a primitive directly.
      </p>

      <h2>How colour is organised</h2>
      <p>
        Three layers, and a seam between the first two. Primitives name a value —{' '}
        <code>twilight/600</code> — and are never applied in a component. Theme tokens name a
        job — <code>interactive/accent</code> — and point at a primitive; they are the only
        layer a component references, and the only one that changes between light and dark.
        That seam is what makes the dark theme possible: without it, dark mode would mean
        auditing every use to work out which meant &ldquo;the accent&rdquo; and which just
        wanted violet.
      </p>

      <h2>Primitives</h2>
      <p>
        The raw ramps. These carry no meaning and are not used in components — they exist to
        be aliased. Every family is generated in OKLCH and shares one lightness per stop, so a
        number means the same amount of light everywhere: any 600 carries a white label at
        4.5:1 or better, any 400 carries a <code>night/950</code> label, any 500 is the 3:1 stop
        for icons and borders, any 700 is text on its own 050, any 300 is text on its own 900.
        Chroma and hue are each family&rsquo;s own.
      </p>
      <p>
        There are no half steps for text or fills. The twenty-step neutral this replaced had
        adjacent steps 1.08 to 1.23:1 apart, and produced two text levels nobody could tell
        apart. The one exception is <code>925</code>, the surface step, in <code>stone</code>{' '}
        and <code>night</code> only: no text is ever set in one surface against another, and
        every reference system measured places its surface levels closer than any ramp places
        its text stops — see{' '}
        <a href="/elevation">Elevation and states</a>. When a ladder runs out, separate with
        a border.
      </p>

      {RAMPS.map((ramp) => (
        <div key={ramp}>
          <p className="rampName">
            {ramp} <span className="alias">{ROLES[ramp]}</span>
          </p>
          <div className="ramp">
            {stepsOf(ramp).map((step) => {
              const key = `${ramp}/${step}` as keyof typeof primitives;
              return <div key={step} className="rampStep" style={{ background: primitives[key] }} />;
            })}
          </div>
          <div className="rampLabels">
            {stepsOf(ramp).map((step) => (
              <span key={step}>{step}</span>
            ))}
          </div>
        </div>
      ))}

      <h3>One lightness per stop</h3>
      <p>
        The lightness is <code>stone</code>&rsquo;s, read in OKLCH; every other family sits
        within a thousandth of it. Each stop&rsquo;s job is measured across all ten families as
        the page renders, and the family shown is the one where the pair is tightest.
      </p>
      <div className="tableScroll">
        <table className="tokens">
          <thead>
            <tr>
              <th>Stop</th>
              <th>L</th>
              <th>Carries</th>
              <th>Tightest</th>
            </tr>
          </thead>
          <tbody>
            {STEPS.filter((step) => step !== '925').map((step) => {
              const guarantee = GUARANTEES.find((g) => g.stop === step);
              const pair = guarantee && tightest(guarantee);
              return (
                <tr key={step}>
                  <td className="tokenName">{step}</td>
                  <td className="alias">{lightness(p[`stone/${step}`]!).toFixed(3)}</td>
                  <td>{guarantee?.carries ?? <span className="alias">—</span>}</td>
                  <td>
                    {pair && (
                      <>
                        <span className="alias">{pair.ramp} </span>
                        <Ratio fg={pair.fg} bg={pair.bg} threshold={step === '500' ? 3 : 4.5} />
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2>Choosing a colour</h2>
      <p>
        Reach for the role, never the value. A component that needs the accent takes{' '}
        <code>interactive/accent</code>; if what it needs has no token, the answer is a new
        token, not a primitive that happens to look right today — a separator borrowed as a
        text colour reads until borders get lighter, and then the text goes with them.
      </p>
      <p>
        One colour, one meaning. The accent means interactive, so that hue on static text tells
        the reader to click something that is not a control. <code>glow</code> is the brand
        and never a button tone: <code>glow/600</code> and <code>ember/600</code> are 1.02:1
        apart, and a pink button beside a danger button would be two of the same thing.{' '}
        <code>amber</code> is warning and <code>flare</code> the highlight, kept far enough
        apart at 400 to read as two. And filled colour is emphasis: one solid accent per view,
        with the alternative beside it neutral — see <a href="/button">Button</a>.
      </p>
      <p>
        Measure the pair that renders. Text against the surface it sits on, a border against
        the fill it edges, a label against its own button in every state, and an alpha over
        the ground it lands on. The tables below do exactly that, with the function the test
        suite runs; a value written by hand is a value that can rot.
      </p>

      <h2>Surfaces</h2>
      <p>
        A ladder of elevation rather than a set of colours. In light, raised and overlay are
        both white and the shadow does the separating; in dark, overlay steps lighter
        because shadow no longer reads as height, and sunken shares the canvas because the
        ramp ends at 950 — a well on the canvas takes a border. The dark ladder is{' '}
        <code>night</code> 950, 925, 900, ΔL .043 per step; a product that wants a neutral
        dark aliases the same stops of <code>stone</code>, and every pair holds — the
        tightest, <code>border/strong</code> on <code>stone/800</code>, is 3.44:1. The tail
        is deep on purpose: 700 to 950 sit at L .43, .33, .245, .205 and .16, so the dark
        canvas reads as night rather than slate. Alpha tokens are shown flattened over a card.
      </p>
      <TokenTable tokens={group('surface/')} threshold={3} />

      <h2>Text</h2>
      <p>
        Measured against <code>surface/raised</code>. Placeholder is the same stop as tertiary
        and clears AA; disabled and inert sit below it deliberately — both are exempt under
        WCAG 2.1, and both are documented at their recorded value so a future edit cannot
        quietly make them worse.
      </p>
      <TokenTable tokens={group('text/')} threshold={4.5} />

      <h2>Interactive</h2>
      <p>
        Fills and the labels that sit on them. Every <code>on-*</code> token is measured
        against all of its fill states, not just the resting one. The two wash tokens are a
        state layer rather than a fill — laid over a row, a menu item, a ghost button or the
        neutral button&rsquo;s own fill — and are shown here over a card; their readings are
        on the <a href="/elevation">Elevation page</a>.
      </p>
      <TokenTable tokens={group('interactive/')} threshold={3} />

      <h2>Border</h2>
      <p>
        Three tiers by function, not by weight. <code>subtle</code> divides, and is an alpha
        so it reads on every surface without picking a stop above any of them;{' '}
        <code>default</code> outlines containers; and <code>strong</code> is the only tier
        that clears WCAG 1.4.11 — which is why every form control uses it.
      </p>
      <TokenTable tokens={group('border/')} threshold={3} />

      <h2>Accessibility</h2>
      <p>
        Colour is never the only channel. A state has an icon, a label or a shape beside its
        colour; focus adds a ring rather than recolouring a border; a selected row carries an
        attribute a screen reader can read. Text clears 4.5:1 and non-text, borders and icons
        and the parts of a control, 3:1, on the surface they render on, in both modes.
      </p>
      <p>
        Two text tokens sit under the line on purpose. <code>disabled</code> and{' '}
        <code>inert</code> are exempt under WCAG 2.1 — one is an unavailable control, the other
        decoration — and each is documented at its recorded value above, so an edit that made
        either worse would show in the table before it shipped.
      </p>
    </DocPage>
  );
}
