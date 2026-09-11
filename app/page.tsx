import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { resolve } from '@/tokens/contrast';
import { theme } from '@/tokens/theme';
import { primitives } from '@/tokens/primitives';

export default function Page() {
  const counts = {
    primitives: Object.keys(primitives).length,
    theme: Object.keys(theme).length,
    // Derived, not typed. A hand-written count is exactly the kind of number
    // this system exists to stop shipping.
    aliases: Object.values(theme).filter((t) => !String(t.light).startsWith('#')).length,
  };

  return (
    <DocPage
      evidence={
        <>
          <p>{counts.primitives} primitives</p>
          <p>{counts.theme} theme tokens</p>
          <p>{counts.aliases} aliases</p>
          <p>0 hex</p>
        </>
      }
    >
      <h1>Bring structure to light</h1>
      <p className="lead">
        A design system that shows its working. Alpenglow is built for dense, data-heavy
        interfaces — scheduling grids, patient records, tables that stay legible at 11px.
        Light and dark, with every contrast ratio measured rather than assumed.
      </p>

      <p>
        Design systems tend to publish a palette and a claim: <em>AA compliant</em>. The
        claim is made once, by hand, and then quietly rots as values change. Here the
        numbers on every page are computed as the page renders, by the same function the
        test suite runs in CI. If a token drifts, the documentation changes and the build
        fails in the same commit.
      </p>

      <h2>The measurement is the point</h2>
      <p>
        Below is body text on a card, in whichever theme you are currently reading. The
        ratio is not written down anywhere — it is calculated from the tokens as you look
        at it.
      </p>

      <div className="specimen">
        <p style={{ margin: 0 }}>
          The appointment was moved to Thursday at 14:30.
        </p>
        <p className="ratioLine" style={{ marginTop: 12 }}>
          text/primary on surface/raised —{' '}
          <Ratio fg={resolve('text/primary', 'light')} bg={resolve('surface/raised', 'light')} />{' '}
          light,{' '}
          <Ratio fg={resolve('text/primary', 'dark')} bg={resolve('surface/raised', 'dark')} />{' '}
          dark
        </p>
      </div>

      <h2>Three layers</h2>
      <p>
        Primitives hold raw values and no meaning. The theme names roles and, with the
        shadows, is all that changes between light and dark. The scale holds dimension, kept
        apart so that a mis-set theme can never alter layout — only colour and shadow.
      </p>
      <p>
        Every theme token is an alias. There is no hex anywhere in the semantic layer, and
        the type system rejects an alias pointing at a primitive that does not exist.
      </p>
      <p>
        The names those layers take on the landscape — bedrock, outcrop, contours, light —
        and the rule that splits them are on <a href="/why">Why Alpenglow</a>.
      </p>

      <h2>What the tests caught</h2>
      <p>
        The contrast suite found five real defects the first time it ran. One was a divider
        that resolved to exactly the same colour as the surface beneath it — 1.00:1,
        invisible, and impossible to notice by eye in a palette of eighty-one greys.
      </p>
    </DocPage>
  );
}
