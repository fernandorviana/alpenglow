import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { Swatch } from '@ui/Swatch';
import { primitives } from '@/tokens/primitives';
import { theme, type ThemeTokenName } from '@/tokens/theme';
import { resolve } from '@/tokens/contrast';

const RAMPS = ['gray-light', 'gray-dark', 'brand-1', 'brand-2', 'red', 'green', 'yellow', 'blue'] as const;
const STEPS = ['050', '100', '200', '300', '400', '500', '600', '700', '800', '900'] as const;

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
          const isSubtle = token.endsWith('-subtle');
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
  return (
    <DocPage
      evidence={
        <>
          <p>81 primitives</p>
          <p>49 theme tokens</p>
          <p>0 hex in the theme</p>
          <p>measured against</p>
          <p>surface/raised</p>
        </>
      }
    >
      <h1>Colour</h1>
      <p className="lead">
        Eighty-one raw values, forty-nine roles, and a rule that keeps them apart: nothing
        in the product references a primitive directly.
      </p>

      <h2>Primitives</h2>
      <p>
        The raw ramp. These carry no meaning and are not used in components — they exist to
        be aliased. Note that <code>gray-light</code> and <code>gray-dark</code> form one
        continuous twenty-step ramp: <code>gray-light/900</code> is <em>lighter</em> than{' '}
        <code>gray-dark/050</code>. The names are historical and say nothing about mode.
      </p>

      {RAMPS.map((ramp) => (
        <div key={ramp}>
          <p className="rampName">{ramp}</p>
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
        because shadow no longer reads as height.
      </p>
      <TokenTable tokens={group('surface/')} threshold={3} />

      <h2>Text</h2>
      <p>
        Measured against <code>surface/raised</code>. Placeholder and disabled sit below AA
        deliberately — disabled text is exempt under WCAG 2.1, and placeholder is documented
        at its recorded value so a future edit cannot quietly make it worse.
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
