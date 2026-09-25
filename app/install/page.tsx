import type { ReactNode } from 'react';
import Link from 'next/link';
import { CodeBlock } from '@ui/CodeBlock';
import { DocPage } from '@ui/DocPage';
import { Button } from '@/components/Button';
import { Table, type Column } from '@/components/Table';
import { tokenContrast } from '@/tokens/contrast';
import { fontFamily } from '@/tokens/typography';
import { ENTRY_POINTS, PEERS, VERSION } from '@ui/package';
import { TypeText } from '@ui/TypeText';

type ImportRow = { path: string; holds: ReactNode };
const IMPORTS: ImportRow[] = [
  { path: 'alpenglow', holds: 'The components, the drawn icons, and the tokens in TypeScript.' },
  { path: 'alpenglow/styles.css', holds: <>The tokens and every component&apos;s styles. What almost every app imports.</> },
  { path: 'alpenglow/tokens.css', holds: 'The custom properties alone, for the palette without the components.' },
  { path: 'alpenglow/tailwind-theme.css', holds: <>The tokens as Tailwind v4 utilities, and a <code>dark:</code> that follows them.</> },
];

/**
 * The import names the row and what it holds is the rest. On a phone an
 * import wraps after its slash, so what it holds keeps a column a sentence
 * can be read in; `alpenglow/`, 86 and the cell's 24, is the widest part
 * left whole. A slash is not a place a line may break: TypeText offers one
 * there, where a phone split `alpenglow/s` from `tyles.css`, and adds
 * nothing to what is copied.
 */
const IMPORT_COLUMNS: Column<ImportRow>[] = [
  {
    key: 'path',
    header: 'Import',
    primary: true,
    minWidth: 112,
    cell: ({ path }) => (
      <code>
        <TypeText kind="path">{path}</TypeText>
      </code>
    ),
  },
  { key: 'holds', header: 'Holds', minWidth: 160, cell: (r) => r.holds },
];

export default function InstallPage() {
  const secondaryOnRaised = tokenContrast('text/secondary', 'surface/raised', 'dark').toFixed(2);

  return (
    <DocPage
      evidence={
        <>
          <p>alpenglow {VERSION}</p>
          {PEERS.map(([name, range]) => (
            <p key={name}>
              {name} {range}
            </p>
          ))}
          <p>0 runtime dependencies</p>
          <p>{ENTRY_POINTS} entry points</p>
        </>
      }
    >
      <h1>Install</h1>
      <p className="lead">One package and one stylesheet. React 19 is all it asks of your app.</p>

      <h2>Install the package</h2>
      <CodeBlock lang="sh" code="npm install alpenglow" />
      <p>
        It brings no dependencies of its own. React and React DOM are peers — your app already
        has them — and the icons are installed separately, below, so an app carries only the
        ones it uses.
      </p>

      <h2>Import the stylesheet once</h2>
      <p>
        Every component is painted by <code>alpenglow/styles.css</code>, tokens included. Import it
        once, where the app starts: the root layout in Next.js, the entry file in Vite. The
        components inject nothing themselves, so without this import they render unstyled.
      </p>
      <CodeBlock lang="ts" code={`// app/layout.tsx, or src/main.tsx
import 'alpenglow/styles.css';`} />
      <p>
        With Tailwind, import it into a layer instead. <Link href="/tailwind">Tailwind</Link> says
        why.
      </p>

      <h2>Load the font</h2>
      <p>
        The type is Inter, and the package does not ship it: the stylesheet names the family
        and falls back to the system sans if nothing has loaded it. Load it under the name{' '}
        <code>Inter</code> — with <code>next/font</code>, which declares that family name, or
        with your own <code>@font-face</code> — in the four weights the system uses.
      </p>
      <CodeBlock
        lang="tsx"
        title="app/layout.tsx"
        code={`import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap' });

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}`}
      />
      <p className="alias">
        The stack, for reference: <code>{fontFamily.sans}</code>.
      </p>

      <h2>Use the components</h2>
      <CodeBlock
        lang="tsx"
        code={`import { Button, Field, Input } from 'alpenglow';

export function Invite() {
  return (
    <form>
      <Field label="Email" description="One message, sent today.">
        <Input type="email" name="email" autoComplete="email" />
      </Field>
      <Button type="submit">Send invite</Button>
    </form>
  );
}`}
      />

      <h2>Check it</h2>
      <p>
        Render one button. It should look like this — a capsule in the accent, with a
        semibold label — and it should change with your system&rsquo;s appearance if you have
        not chosen a theme. If it is a grey rectangle, the stylesheet import is missing. If the
        letters look like your operating system&rsquo;s, the font has not loaded.
      </p>
      <div className="specimen">
        <div className="specimenRow">
          <Button>Send invite</Button>
        </div>
      </div>

      <h2>Server Components</h2>
      <p>
        Every component that needs the browser says so with <code>&apos;use client&apos;</code>,
        and the package keeps the directive, so a server page can render any of them. What a
        server page cannot do is hand a component a function, because React cannot send one from
        the server. The props that take one — <code>DropdownMenu</code>&apos;s{' '}
        <code>trigger</code>, a <code>Table</code> column&apos;s <code>cell</code>, any{' '}
        <code>onSelect</code> or <code>onChange</code> — belong in a client component of your own.
      </p>
      <CodeBlock
        lang="tsx"
        code={`'use client';

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
}`}
      />

      <h2>Icons</h2>
      <p>
        Fifteen icons were drawn for this system and ship with it. Everything else is IBM Carbon,
        installed on its own so an app carries only the icons it uses.{' '}
        <Link href="/icons">Icons</Link> lists the drawn ones, and the Carbon names that mislead.
      </p>
      <CodeBlock
        lang="ts"
        code={`npm install @carbon/icons-react

import { AiSparkle } from 'alpenglow';
import { Search } from '@carbon/icons-react';`}
      />

      <h2>Dark mode</h2>
      <p>
        Nothing to install. The stylesheet follows <code>prefers-color-scheme</code> on its own,
        and one attribute on the root, <code>data-theme</code>, overrides it.{' '}
        <Link href="/dark-mode">Dark mode</Link> has the attribute, the script that applies a
        stored choice before the first paint, and what changes with the light.
      </p>

      <h2>What the package holds</h2>
      <div className="specimen">
        <Table caption="What the package holds" density="compact" columns={IMPORT_COLUMNS} rows={IMPORTS} getRowId={(r) => r.path} />
      </div>

      <h2>Tokens in TypeScript</h2>
      <p>
        The values the stylesheet uses are exported for code that computes with them — a chart
        choosing a label colour, a test asserting contrast. The function below is the one
        every number on this site is computed with.
      </p>
      <CodeBlock
        lang="ts"
        code={`import { tokenContrast } from 'alpenglow';

tokenContrast('text/secondary', 'surface/raised', 'dark'); // ${secondaryOnRaised}`}
      />
    </DocPage>
  );
}
