'use client';

import { ArrowRight, Launch } from '@carbon/icons-react';
import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { CodeBlock } from '@ui/CodeBlock';
import { Link } from '@/components/Link';
import { Button } from '@/components/Button';
import { Table } from '@/components/Table';
import { contrast, resolve } from '@/tokens/contrast';
import { spacing } from '@/tokens/scale';
import type { Mode, ThemeTokenName } from '@/tokens/theme';

const MODES: Mode[] = ['light', 'dark'];
const GROUNDS: ThemeTokenName[] = ['surface/base', 'surface/raised', 'surface/sunken'];
const WORDS: ThemeTokenName[] = ['text/primary', 'text/secondary'];

const USAGE = `import { Link, Button } from 'alpenglow';
import NextLink from 'next/link';

<p>What just happened is a <Link href="/toast">toast</Link>.</p>

<Link variant="standalone" href="/locations" iconEnd={<ArrowRight size={16} />}>
  All locations
</Link>

<Link href="https://www.w3.org/TR/WCAG22/" external>WCAG 2.2</Link>

// A router's link takes the props and is the element.
<Link href="/settings" render={(props) => <NextLink {...props} />}>Settings</Link>

// What looks like a button and goes somewhere is a Button with an href.
<Button href="/signup">Create account</Button>`;

type Against = { words: ThemeTokenName; light: string; dark: string };
/** Measured as the page renders, from the tokens: the numbers the decision rests on. */
const AGAINST: Against[] = WORDS.map((words) => ({
  words,
  light: contrast(resolve('text/accent', 'light'), resolve(words, 'light')).toFixed(2),
  dark: contrast(resolve('text/accent', 'dark'), resolve(words, 'dark')).toFixed(2),
}));

type Choice = { when: string; use: string };
const CHOICES: Choice[] = [
  { when: 'It goes to another page or place, inside a sentence', use: 'Link' },
  { when: 'It goes somewhere, on a line of its own: “All locations”', use: 'Link, standalone' },
  { when: 'It goes somewhere and is the main thing to do here: “Create account”', use: 'Button with href' },
  { when: 'It does something here: saves, deletes, opens a dialog', use: 'Button' },
];

type PropRow = { prop: string; type: string; default: string };
const PROPS: PropRow[] = [
  { prop: 'href', type: 'string', default: 'required' },
  { prop: 'variant', type: "'inline' | 'standalone'", default: "'inline'" },
  { prop: 'iconEnd', type: 'ReactNode', default: '—' },
  { prop: 'external', type: 'boolean', default: 'false' },
  { prop: 'externalLabel', type: 'string', default: "'opens in a new tab'" },
  { prop: 'render', type: '(props: LinkRenderProps) => ReactNode', default: '—' },
  { prop: '…anchor', type: 'target, rel, download, aria-current and the rest of an anchor’s', default: '—' },
];

export default function Page() {
  return (
    <DocPage
      evidence={
        <>
          {GROUNDS.map((ground) => (
            <div key={ground}>
              <p>on {ground.split('/')[1]}</p>
              {MODES.map((mode) => (
                <p key={mode}>
                  {mode} <Ratio fg={resolve('text/accent', mode)} bg={resolve(ground, mode)} />
                </p>
              ))}
            </div>
          ))}
        </>
      }
    >
      <h1>Link</h1>
      <p className="lead">
        Words that go somewhere: in the accent and a weight heavier than the sentence, with a
        line that comes under the pointer and the keyboard.
      </p>

      <h2>Try it</h2>
      <div className="specimen" style={{ display: 'grid', gap: spacing[200] }}>
        <p style={{ margin: 0 }}>
          What has just happened and needs no place is a <Link href="/toast">toast</Link>; what
          stays true beside a part of the page is an <Link href="/alert">alert</Link>. The rule
          for how long a message may stay is{' '}
          <Link href="https://www.w3.org/TR/WCAG22/#timing-adjustable" external>
            WCAG 2.2.1
          </Link>
          .
        </p>
        <p style={{ margin: 0, color: 'var(--ap-color-text-secondary)' }}>
          In secondary text, where the accent and the words are closest:{' '}
          <Link href="/colour">how the colours were measured</Link>.
        </p>
        <div className="specimenRow">
          <Link variant="standalone" href="/components" iconEnd={<ArrowRight size={16} />}>
            All components
          </Link>
          <Link variant="standalone" href="https://github.com/fernandorviana/alpenglow" external iconEnd={<Launch size={16} />}>
            The repository
          </Link>
        </div>
      </div>
      <p className="alias">Move the pointer over one, or Tab to it: the line and the ring arrive together.</p>

      <h2>No line at rest</h2>
      <p>
        The usual link is underlined, and for a reason: colour must not be the only thing that
        tells a link from the words around it, and this accent does not stand far enough from
        them to try.
      </p>
      <div className="specimen">
        <Table
          caption="text/accent against the words around it; colour alone would need 3:1"
          density="compact"
          columns={[
            { key: 'words', header: 'Against', primary: true, cell: (r: Against) => <code>{r.words}</code> },
            { key: 'light', header: 'Light', cell: (r: Against) => <span className="alias">{r.light}:1</span> },
            { key: 'dark', header: 'Dark', cell: (r: Against) => <span className="alias">{r.dark}:1</span> },
          ]}
          rows={AGAINST}
          getRowId={(r) => r.words}
        />
      </div>
      <p>
        The system keeps its sentences clean of underlines all the same, a decision made on
        2026-09-21 with these numbers on the table. What carries the link, beside its colour,
        is its weight: Medium in a sentence that is Regular, which is a difference of shape
        and not of hue. The line comes under the pointer and under the keyboard&rsquo;s focus,
        with the ring. It follows that a link does not belong inside words that are already
        Medium or heavier, a table header or a button&rsquo;s label: there it goes on a line of
        its own.
      </p>

      <h2>A link, or a button</h2>
      <div className="specimen">
        <Table
          caption="What it does decides what it is"
          density="compact"
          columns={[
            { key: 'when', header: 'When', primary: true, cell: (r: Choice) => r.when },
            { key: 'use', header: 'Use', cell: (r: Choice) => r.use },
          ]}
          rows={CHOICES}
          getRowId={(r) => r.when}
        />
      </div>
      <div className="specimen">
        <div className="specimenRow">
          <Button href="/button">A Button with an href</Button>
          <Link variant="standalone" href="/button">
            A standalone Link
          </Link>
        </div>
      </div>
      <p>
        Both are an <code>a</code>. The look says how much the page wants it pressed; the
        element says what it does, to the browser&rsquo;s menu, to a new tab, to a screen
        reader. A Link has no button variant and needs none.
      </p>

      <h2>Accessibility</h2>
      <p>
        An <code>external</code> link opens a new tab with <code>rel=&quot;noreferrer&quot;</code>,
        and says &ldquo;opens in a new tab&rdquo; after its name, in words that are read and
        not shown; <code>externalLabel</code> says them in another language. An icon is not
        part of the name. A standalone link is a target of its own and is 24 tall (WCAG 2.5.8
        exempts only a link in a sentence). There is no colour for a visited link: in an
        application it says nothing, and the theme has no token for it.
      </p>

      <h2>Using it</h2>
      <CodeBlock code={USAGE} lang="tsx" />
      <div className="specimen">
        <Table
          caption="Link props"
          density="compact"
          columns={[
            { key: 'prop', header: 'Prop', primary: true, cell: (r: PropRow) => <code>{r.prop}</code> },
            { key: 'type', header: 'Type', cell: (r: PropRow) => <span className="alias">{r.type}</span> },
            { key: 'default', header: 'Default', cell: (r: PropRow) => <span className="alias">{r.default}</span> },
          ]}
          rows={PROPS}
          getRowId={(r) => r.prop}
        />
      </div>
    </DocPage>
  );
}
