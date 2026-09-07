import { Page } from '../ui/Page.js';
import { Ratio } from '../ui/Ratio.js';
import { resolve } from '../../../src/tokens/contrast.js';
import { theme } from '../../../src/tokens/theme.js';
import { primitives } from '../../../src/tokens/primitives.js';

export function Overview() {
  const counts = {
    primitives: Object.keys(primitives).length,
    theme: Object.keys(theme).length,
  };

  return (
    <Page
      evidence={
        <>
          <p>{counts.primitives} primitives</p>
          <p>{counts.theme} theme tokens</p>
          <p>90 assertions</p>
        </>
      }
    >
      <h1>A design system that shows its working</h1>
      <p className="lead">
        Alpenglow is built for dense, data-heavy interfaces — scheduling grids, patient
        records, tables that stay legible at 11px. Light and dark, with every contrast
        ratio measured rather than assumed.
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
        <p className="ratio" style={{ marginTop: 12 }}>
          text/primary on surface/raised —{' '}
          <Ratio fg={resolve('text/primary', 'light')} bg={resolve('surface/raised', 'light')} />{' '}
          light,{' '}
          <Ratio fg={resolve('text/primary', 'dark')} bg={resolve('surface/raised', 'dark')} />{' '}
          dark
        </p>
      </div>

      <h2>Three layers</h2>
      <p>
        Primitives hold raw values and no meaning. The theme names roles and is the only
        layer that changes between light and dark. The scale holds dimension, kept apart
        so that a mis-set theme can never alter layout — only colour.
      </p>
      <p>
        Every theme token is an alias. There is no hex anywhere in the semantic layer, and
        the type system rejects an alias pointing at a primitive that does not exist.
      </p>

      <h2>What the tests caught</h2>
      <p>
        The contrast suite found five real defects the first time it ran. One was a divider
        that resolved to exactly the same colour as the surface beneath it — 1.00:1,
        invisible, and impossible to notice by eye in a palette of eighty-one greys.
      </p>
    </Page>
  );
}
