'use client';

import NextLink from 'next/link';
import { Settings, Undo, UserMultiple } from '@carbon/icons-react';
import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { CodeBlock } from '@ui/CodeBlock';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Button } from '@/components/Button';
import { Table } from '@/components/Table';
import { resolve } from '@/tokens/contrast';
import { radius, spacing } from '@/tokens/scale';
import { textStyle } from '@/tokens/typography';
import type { Mode, ThemeTokenName } from '@/tokens/theme';

const MODES: Mode[] = ['light', 'dark'];

const PAIRS: ReadonlyArray<{ name: string; fg: ThemeTokenName; bg: ThemeTokenName }> = [
  { name: 'a link, at rest', fg: 'text/secondary', bg: 'surface/raised' },
  { name: 'the section’s capsule', fg: 'text/secondary', bg: 'interactive/neutral' },
  { name: 'the page', fg: 'text/primary', bg: 'surface/raised' },
];

const USAGE = `import { Breadcrumb } from 'alpenglow';
import NextLink from 'next/link';

<Breadcrumb
  icon={<UserMultiple size={16} />}
  renderLink={(props) => <NextLink {...props} />}
  items={[
    { label: 'Clients', href: '/clients' },
    { label: client.name, href: \`/clients/\${client.id}\` },
    { label: 'Appointments' }, // the page: the last is never a link
  ]}
/>`;

type Measure = { part: string; value: string };
/** Read from the scale and the text styles, so the page cannot quote a number the stylesheet does not use. */
const MEASURES: Measure[] = [
  { part: 'Capsule', value: `28 tall, radius ${radius.md}, ${spacing['025']} and ${spacing[100]} of padding` },
  { part: 'Links, Medium', value: `${textStyle['body/md'].size} / ${textStyle['body/md'].lineHeight}, text/secondary` },
  { part: 'The page, Semibold', value: 'text/primary, not a link' },
  { part: 'Between', value: `a slash, text/tertiary, ${spacing['050']} either side` },
  { part: 'Icon', value: '16, on the first only' },
  { part: 'A long name', value: 'cut at 24ch with an ellipsis' },
];

type PropRow = { prop: string; type: string; default: string };
const PROPS: PropRow[] = [
  { prop: 'items', type: '{ label: string; href?: string }[]', default: 'required' },
  { prop: 'icon', type: 'ReactNode — the first item’s', default: '—' },
  { prop: 'renderLink', type: '(props) => ReactNode', default: 'an a' },
  { prop: 'maxItems', type: 'number', default: '—' },
  { prop: 'aria-label', type: 'string', default: "'Breadcrumb'" },
  { prop: 'expandLabel', type: 'string', default: "'Show path'" },
  { prop: 'className', type: 'string', default: '—' },
];

const bar = { display: 'grid', gap: spacing[200], justifyItems: 'start' } as const;

export default function Page() {
  return (
    <DocPage
      evidence={
        <>
          {PAIRS.map((pair) => (
            <div key={pair.name}>
              <p>{pair.name}</p>
              {MODES.map((mode) => (
                <p key={mode}>
                  {mode} <Ratio fg={resolve(pair.fg, mode)} bg={resolve(pair.bg, mode)} />
                </p>
              ))}
            </div>
          ))}
        </>
      }
    >
      <h1>Breadcrumb</h1>
      <p className="lead">Where the page is, from its section down, and a way back up.</p>

      <h2>Try it</h2>
      <div className="specimen">
        <div style={bar}>
          <Breadcrumb
            icon={<UserMultiple size={16} />}
            items={[{ label: 'Clients', href: '#try-it' }, { label: 'Justin Anderson' }]}
          />
          <Breadcrumb
            icon={<UserMultiple size={16} />}
            items={[
              { label: 'Clients', href: '#try-it' },
              { label: 'Justin Anderson', href: '#try-it' },
              { label: 'Appointments' },
            ]}
          />
        </div>
      </div>
      <p>
        The first is as drawn, in the product&rsquo;s top bar: the section as a capsule with its icon, a slash, the
        page in Semibold. A third level is not drawn. Decided on 2026-09-21: the section is a capsule at rest, every
        link is a capsule under the pointer, and only the first has an icon — it is the section&rsquo;s, the one lit in
        the navigation.
      </p>

      <h2>A long path, a long name</h2>
      <div className="specimen">
        <div style={bar}>
          <Breadcrumb
            icon={<Settings size={16} />}
            maxItems={3}
            items={[
              { label: 'Settings', href: '#a-long-path-a-long-name' },
              { label: 'Calendar', href: '#a-long-path-a-long-name' },
              { label: 'Reminders', href: '#a-long-path-a-long-name' },
              { label: 'SMS', href: '#a-long-path-a-long-name' },
              { label: 'Template' },
            ]}
          />
          <Breadcrumb
            icon={<UserMultiple size={16} />}
            items={[
              { label: 'Clients', href: '#a-long-path-a-long-name' },
              { label: 'Maria Francisca de Albuquerque e Castro Vasconcelos', href: '#a-long-path-a-long-name' },
              { label: 'Appointments' },
            ]}
          />
        </div>
      </div>
      <p>
        With <code>maxItems</code> the middle is folded into a button that unfolds it in place, and the focus goes to
        the first link it revealed. It is not a menu: a menu&rsquo;s rows are buttons, and a crumb has to stay a link
        that can be opened in a new tab. A long name is cut with an ellipsis; the words are whole for a screen reader.
      </p>

      <h2>Back, in the page</h2>
      <div className="specimen">
        <Button variant="outline" tone="neutral" size="sm" href="#back-in-the-page" iconStart={<Undo size={16} />}>
          Clients
        </Button>
      </div>
      <p>
        The same drawing has a second piece, in the page over the client&rsquo;s name: a pill with a return arrow and
        the level above. It is not part of this component, because it is one the system has — an outline{' '}
        <a href="/button">Button</a> at <code>sm</code> with an icon and an <code>href</code>. On a phone, where a bar
        has no room for a path, it is the whole of it.
      </p>

      <h2>With a router</h2>
      <div className="specimen">
        <Breadcrumb
          renderLink={(props) => <NextLink {...props} />}
          items={[{ label: 'Components', href: '/components' }, { label: 'Breadcrumb' }]}
        />
      </div>

      <h2>Anatomy</h2>
      <div className="specimen">
        <Table
          caption="Breadcrumb geometry, in pixels"
          density="compact"
          columns={[
            { key: 'part', header: 'Part', primary: true, cell: (r: Measure) => r.part },
            { key: 'value', header: 'Value', cell: (r: Measure) => <span className="alias">{r.value}</span> },
          ]}
          rows={MEASURES}
          getRowId={(r) => r.part}
        />
      </div>
      <p>
        The capsule&rsquo;s fill is <code>interactive/neutral</code> and not the drawn <code>surface/base</code>: the
        same primitive in light, and in dark a fill and not a hole. Under the pointer the wash lies over it; on the
        other links the wash alone is the capsule. There is no underline — the capsule is the hover&rsquo;s mark, and
        these are navigation and not links in a sentence.
      </p>

      <h2>Accessibility</h2>
      <p>
        A <code>nav</code> named &ldquo;Breadcrumb&rdquo; holding an ordered list, so the number of levels and the
        order are said. The page is the last item, with <code>aria-current=&quot;page&quot;</code>, and is never a
        link: a link to where you are is a link that does nothing. The slashes and the icon are hidden. Give a second
        breadcrumb on one page its own <code>aria-label</code>.
      </p>

      <h2>Using it</h2>
      <CodeBlock code={USAGE} lang="tsx" />
      <div className="specimen">
        <Table
          caption="Breadcrumb props"
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
