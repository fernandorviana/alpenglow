import Link from 'next/link';
import { DocPage } from '@ui/DocPage';
import { tokenContrast } from '@/tokens/contrast';

export default function InstallPage() {
  const secondaryOnRaised = tokenContrast('text/secondary', 'surface/raised', 'dark').toFixed(2);

  return (
    <DocPage>
      <h1>Install</h1>
      <p className="lead">One package and one stylesheet. React 19 is all it asks of your app.</p>

      <pre>
        <code>npm install alpenglow</code>
      </pre>

      <h2>Import the stylesheet once</h2>
      <p>
        Every component is painted by <code>alpenglow/styles.css</code>, tokens included. Import it
        once, where the app starts: the root layout in Next.js, the entry file in Vite. The
        components inject nothing themselves, so without this import they render unstyled.
      </p>
      <pre>
        <code>{`// app/layout.tsx, or src/main.tsx
import 'alpenglow/styles.css';`}</code>
      </pre>
      <p>
        With Tailwind, import it into a layer instead. <Link href="/tailwind">Tailwind</Link> says
        why.
      </p>

      <h2>Use the components</h2>
      <pre>
        <code>{`import { Button, Field, Input } from 'alpenglow';

export function Invite() {
  return (
    <form>
      <Field label="Email" description="One message, sent today.">
        <Input type="email" name="email" />
      </Field>
      <Button type="submit">Send invite</Button>
    </form>
  );
}`}</code>
      </pre>

      <h2>Server Components</h2>
      <p>
        Every component that needs the browser says so with <code>&apos;use client&apos;</code>,
        and the package keeps the directive, so a server page can render any of them. What a
        server page cannot do is hand a component a function, because React cannot send one from
        the server. The props that take one — <code>DropdownMenu</code>&apos;s{' '}
        <code>trigger</code>, a <code>Table</code> column&apos;s <code>cell</code>, any{' '}
        <code>onSelect</code> or <code>onChange</code> — belong in a client component of your own.
      </p>
      <pre>
        <code>{`'use client';

import { useRouter } from 'next/navigation';
import { Button, DropdownMenu } from 'alpenglow';

export function RowActions({ id }: { id: string }) {
  const router = useRouter();
  return (
    <DropdownMenu
      trigger={(props) => (
        <Button variant="ghost" tone="neutral" {...props}>
          Actions
        </Button>
      )}
      items={[{ id: 'edit', label: 'Edit', onSelect: () => router.push(\`/rows/\${id}\`) }]}
    />
  );
}`}</code>
      </pre>

      <h2>Icons</h2>
      <p>
        Fifteen icons were drawn for this system and ship with it. Everything else is IBM Carbon,
        installed on its own so an app carries only the icons it uses.{' '}
        <Link href="/icons">Icons</Link> lists the drawn ones, and the Carbon names that mislead.
      </p>
      <pre>
        <code>{`npm install @carbon/icons-react

import { AiSparkle } from 'alpenglow';
import { Search } from '@carbon/icons-react';`}</code>
      </pre>

      <h2>What the package holds</h2>
      <div className="tableScroll">
        <table className="tokens">
          <thead>
            <tr>
              <th>Import</th>
              <th>Holds</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>alpenglow</code></td>
              <td>The components, the drawn icons, and the tokens in TypeScript.</td>
            </tr>
            <tr>
              <td><code>alpenglow/styles.css</code></td>
              <td>The tokens and every component&apos;s styles. What almost every app imports.</td>
            </tr>
            <tr>
              <td><code>alpenglow/tokens.css</code></td>
              <td>The custom properties alone, for the palette without the components.</td>
            </tr>
            <tr>
              <td><code>alpenglow/tailwind-theme.css</code></td>
              <td>The tokens as Tailwind v4 utilities, and a <code>dark:</code> that follows them.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Tokens in TypeScript</h2>
      <p>
        The values the stylesheet uses are exported for code that computes with them — a chart
        choosing a label colour, a test asserting contrast.
      </p>
      <pre>
        <code>{`import { tokenContrast } from 'alpenglow';

tokenContrast('text/secondary', 'surface/raised', 'dark'); // ${secondaryOnRaised}`}</code>
      </pre>
    </DocPage>
  );
}
