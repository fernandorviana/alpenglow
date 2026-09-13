import Link from 'next/link';
import { DocPage } from '@ui/DocPage';
import { radius, spacing } from '@/tokens/scale';
import { theme } from '@/tokens/theme';
import { fontWeight, textStyle } from '@/tokens/typography';

/** What the generated theme holds, counted from the same sources the generator reads. */
const COUNTS = {
  colours: Object.keys(theme).length,
  spacing: Object.keys(spacing).length,
  radii: Object.keys(radius).length,
  styles: Object.keys(textStyle).length,
  weights: Object.keys(fontWeight).length,
};

export default function TailwindPage() {
  return (
    <DocPage
      evidence={
        <>
          <p>{COUNTS.colours} colours</p>
          <p>{COUNTS.spacing} spacing</p>
          <p>{COUNTS.radii} radii</p>
          <p>{COUNTS.styles} text styles</p>
          <p>{COUNTS.weights} weights</p>
          <p>1 dark variant</p>
        </>
      }
    >
      <h1>Tailwind</h1>
      <p className="lead">
        Import the stylesheet into a layer, and Tailwind&apos;s utilities can override any component.
      </p>

      <h2>Set it up</h2>
      <pre>
        <code>{`/* app/globals.css */
@import "tailwindcss";
@import "alpenglow/styles.css" layer(components);
@import "alpenglow/tailwind-theme.css";`}</code>
      </pre>

      <h2>Why a layer</h2>
      <p>
        Tailwind keeps its rules in cascade layers: its reset in <code>base</code>, utilities in{' '}
        <code>utilities</code>. A rule in no layer beats every layered rule, whatever its
        selector. Alpenglow&apos;s stylesheet ships in no layer on purpose, so that an app&apos;s
        global rules cannot unstyle a component — which, in a Tailwind app, also means{' '}
        <code>className=&quot;rounded-none&quot;</code> on a button does nothing.
      </p>
      <p>
        <code>layer(components)</code> puts the stylesheet between the two: above the reset, so
        preflight cannot strip a button, and below the utilities, so your classes win.
      </p>
      <pre>
        <code>{`<Button className="rounded-none mt-6">Save</Button>`}</code>
      </pre>

      <h2>What the layer costs</h2>
      <p>
        Once the components are in a layer, a rule of your own that is in none beats them too. A
        global <code>button {'{'} background: none {'}'}</code> would empty every Alpenglow button.
        Keep resets in <code>@layer base</code>, where Tailwind keeps its own.
      </p>

      <h2>Without the layer</h2>
      <p>
        Import <code>alpenglow/styles.css</code> plainly and everything still works. An override
        then needs Tailwind&apos;s important modifier: <code>rounded-none!</code>.
      </p>
      <p>
        Import it from CSS, not from JavaScript, either way. A layer chosen in CSS is fixed; the
        order of stylesheets imported from JavaScript is decided by the bundler.
      </p>

      <h2>The theme</h2>
      <p>
        <code>tailwind-theme.css</code> turns the tokens into utilities: {COUNTS.colours} colours,{' '}
        {COUNTS.spacing} spacing steps, {COUNTS.radii} radii, {COUNTS.styles} text styles and{' '}
        {COUNTS.weights} weights, generated from the same source as everything else. The colours
        point at the custom properties the components use, so they follow light and dark
        without a <code>dark:</code> of their own. The doubled name — <code>text-text-primary</code>{' '}
        — is Tailwind&apos;s: the utility is <code>text-</code> and the token is{' '}
        <code>text/primary</code>, and <code>bg-surface-raised</code> reads the same way.
      </p>
      <pre>
        <code>{`<section className="rounded-lg bg-surface-raised p-300 text-text-primary">
  <p className="text-text-secondary">Due today</p>
</section>`}</code>
      </pre>
      <p>
        When something should differ in dark, <code>dark:</code> follows the components&apos;
        rule: <code>data-theme=&quot;dark&quot;</code>, or the system preference when no theme is
        set. <Link href="/dark-mode">Dark mode</Link> covers setting it.
      </p>
      <pre>
        <code>{`<img className="dark:opacity-80" src="/chart.png" alt="Bookings this week" />`}</code>
      </pre>

      <h2>Choosing a utility</h2>
      <p>
        Utilities are for the layout around the components — the grid, the gap, the margin a
        button needs from the edge of its card — and for the text and surfaces of your own
        pages, through the theme&apos;s names. A component&apos;s own colour is not a place for
        one: a <code>bg-</code> on a Button repaints a fill whose label was measured against the
        fill it had, and a <code>text-</code> on a Badge does the same to its tone. If a
        component needs a colour it does not have, the answer is a tone or a token, not a
        class.
      </p>
      <p>
        Tailwind&apos;s own palette stays available beside the theme — <code>bg-blue-500</code>{' '}
        still compiles. Nothing in the system is measured against it, and it does not follow the
        light, so a page that uses it has left the system at that element. The theme&apos;s
        pairs are the ones on <Link href="/colour">Colour</Link> and{' '}
        <Link href="/accessibility">Accessibility</Link>: <code>text-text-tertiary</code> on{' '}
        <code>bg-surface-raised</code> is a measured pair, and a class from the raw palette is
        not.
      </p>
      <p>
        Two utilities to keep away from a component. <code>outline-none</code> removes the focus
        ring, which is the only thing telling a keyboard where it is; the components draw their
        own and need nothing added. And a <code>transition-</code> of your own on something that
        moves belongs under <code>motion-safe:</code>, as the components&apos; own motion sits
        under the reduced-motion query.
      </p>
    </DocPage>
  );
}
