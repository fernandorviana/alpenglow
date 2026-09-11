import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { Swatch } from '@ui/Swatch';
import { primitives } from '@/tokens/primitives';
import { theme, type ThemeTokenName } from '@/tokens/theme';
import { resolve } from '@/tokens/contrast';

const RAMPS = ['glow', 'twilight', 'flare', 'glacier', 'stone', 'night', 'mist', 'ember', 'moss', 'amber'] as const;
const STEPS = ['050', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] as const;

const ROLES: Record<(typeof RAMPS)[number], string> = {
  glow: 'the brand — hero, gradient, one call to action per screen; never a button tone',
  twilight: 'everything interactive — fills, links, focus, selection',
  flare: 'the highlight fill — the tertiary tone',
  glacier: 'the second highlight, and the info status',
  stone: 'the neutral foundation — text, borders, the light canvas',
  night: 'the dark surface ladder',
  mist: 'soft states — hover and pressed in light',
  ember: 'danger',
  moss: 'success',
  amber: 'warning',
};

function group(prefix: string) {
  return (Object.keys(theme) as ThemeTokenName[]).filter((t) => t.startsWith(prefix));
}

/** The surface each group is measured against — the one it actually sits on. */
function against(token: ThemeTokenName): ThemeTokenName {
  if (token.endsWith('-subtle')) return token;
  return 'surface/raised';
}

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
          const light = scrim ? resolve(token, 'light', resolve('surface/base', 'light')) : resolve(token, 'light');
          const dark = scrim ? resolve(token, 'dark', resolve('surface/base', 'dark')) : resolve(token, 'dark');
          const measurable = !scrim && !token.startsWith('surface/');

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
        Ten families of eleven stops, {themeCount} roles, and a rule that keeps them apart:
        nothing in the product references a primitive directly.
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
        There are eleven stops and no half steps. The twenty-step neutral this replaced had
        adjacent steps 1.08 to 1.23:1 apart, and produced two text levels nobody could tell
        apart. When a ladder runs out, separate with a border.
      </p>

      {RAMPS.map((ramp) => (
        <div key={ramp}>
          <p className="rampName">
            {ramp} <span className="alias">{ROLES[ramp]}</span>
          </p>
          <div className="ramp">
            {STEPS.map((step) => {
              const key = `${ramp}/${step}` as keyof typeof primitives;
              return <div key={step} className="rampStep" style={{ background: primitives[key] }} />;
            })}
          </div>
          <div className="rampLabels">
            {STEPS.map((step) => (
              <span key={step}>{step}</span>
            ))}
          </div>
        </div>
      ))}

      <h2>Surfaces</h2>
      <p>
        A ladder of elevation rather than a set of colours. In light, raised and overlay are
        both white and the shadow does the separating; in dark, overlay steps lighter
        because shadow no longer reads as height, and sunken shares the canvas because the
        ramp ends at 950 — a well on the canvas takes a border. The dark ladder is{' '}
        <code>night</code>; a product that wants a neutral dark aliases the same stops of{' '}
        <code>stone</code>, and one pair moves: <code>border/strong</code> on{' '}
        <code>stone/800</code> is 2.97:1, so a stone ladder takes <code>stone/400</code> there.
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
        against all of its fill states, not just the resting one.
      </p>
      <TokenTable tokens={group('interactive/')} threshold={3} />

      <h2>Border</h2>
      <p>
        Three tiers by function, not by weight. <code>subtle</code> divides,{' '}
        <code>default</code> outlines containers, and <code>strong</code> is the only tier
        that clears WCAG 1.4.11 — which is why every form control uses it.
      </p>
      <TokenTable tokens={group('border/')} threshold={3} />
    </DocPage>
  );
}
