import Link from 'next/link';
import { DocPage } from '@ui/DocPage';

export default function TailwindPage() {
  return (
    <DocPage>
      <h1>Tailwind</h1>
      <p className="lead">
        Import the stylesheet into a layer, and Tailwind&apos;s utilities can override any component.
      </p>

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
        <code>tailwind-theme.css</code> turns the tokens into utilities. They point at the same
        custom properties the components use, so they follow light and dark without a{' '}
        <code>dark:</code> of their own.
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
    </DocPage>
  );
}
