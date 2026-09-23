import { DocPage } from '@ui/DocPage';
import { CodeBlock } from '@ui/CodeBlock';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Select } from '@/components/Select';
import { Table } from '@/components/Table';
import type { Column } from '@/components/Table';
import { Scheduler } from '@/components/Scheduler';
import type { SchedulerEvent } from '@/components/Scheduler';
import { density, densityModes } from '@/tokens/density';
import type { DensityTokenName } from '@/tokens/density';

/**
 * The Density page: the five tokens, how to choose between the two modes,
 * why touch is exempt, and a Try it that puts a Button, an Input, a Select,
 * a Table and a Scheduler slice through both.
 */

/**
 * One row per token, except `row` and `row-header`: `row` is a literal
 * prefix of `row-header`, so an accessible-name lookup for `density/row`
 * matches `density/row-header`'s row too the moment both exist as separate
 * table rows — no markup trick changes that, since the longer name contains
 * the shorter one as a substring by construction. Keeping the pair in one
 * row makes every lookup — `density/row` and `density/row-header` alike —
 * resolve to that single row, so `page.test.tsx` can find each unambiguously.
 */
type Row = { key: string; tokens: readonly DensityTokenName[] };
const ROWS: Row[] = [
  { key: 'control', tokens: ['control'] },
  { key: 'row', tokens: ['row', 'row-header'] },
  { key: 'hour', tokens: ['hour'] },
  { key: 'nav-item', tokens: ['nav-item'] },
];

const stack = (tokens: readonly DensityTokenName[], render: (t: DensityTokenName) => string) => (
  <>
    {tokens.map((t) => (
      <div key={t}>{render(t)}</div>
    ))}
  </>
);

const COLUMNS: Column<Row>[] = [
  {
    key: 'token',
    header: 'Token',
    primary: true,
    cell: (r) => (
      <>
        {r.tokens.map((t) => (
          <div className="tokenName" key={t}>
            density/{t}
          </div>
        ))}
      </>
    ),
  },
  { key: 'comfortable', header: 'Comfortable', align: 'end', cell: (r) => stack(r.tokens, (t) => `${density[t].comfortable}px`) },
  { key: 'compact', header: 'Compact', align: 'end', cell: (r) => stack(r.tokens, (t) => `${density[t].compact}px`) },
  { key: 'use', header: 'Read by', cell: (r) => stack(r.tokens, (t) => density[t].use) },
];

// A three-row slice of Ridge Physio's client list, for the Try it Table — no
// `density` prop, so each copy follows the `data-density` it sits under.
type ClientRow = { id: string; client: string; appointment: string };
const CLIENTS: ClientRow[] = [
  { id: '1', client: 'Maya Costa', appointment: 'Assessment' },
  { id: '2', client: 'Joaquim Okafor', appointment: 'Follow-up' },
  { id: '3', client: 'Aisha Nguyen', appointment: 'Sports massage' },
];
const CLIENT_COLUMNS: Column<ClientRow>[] = [
  { key: 'client', header: 'Client', primary: true, cell: (r) => r.client },
  { key: 'appointment', header: 'Appointment', cell: (r) => r.appointment },
];

// A two-hour slice of the fixed day, 09:00–11:00, three events — enough to
// show the hour token without pulling in the whole screen.
const EVENTS: SchedulerEvent[] = [
  { id: 'a', title: 'Ana Ferreira', start: '2026-09-17T09:00', end: '2026-09-17T09:30' },
  { id: 'b', title: 'Kwame Mensah', start: '2026-09-17T09:45', end: '2026-09-17T10:30', kind: 'pending' },
  { id: 'c', title: 'Lin Zhao', start: '2026-09-17T10:30', end: '2026-09-17T11:00' },
];

const SELECT_OPTIONS = [
  { value: 'assessment', label: 'Assessment' },
  { value: 'follow-up', label: 'Follow-up' },
  { value: 'sports', label: 'Sports massage' },
];

/** One panel of the Try it: a Button, an Input, a Select, a Table and a Scheduler slice, none passed a `size` or `density`. */
function Panel({ mode }: { mode: (typeof densityModes)[number] }) {
  const suffix = mode === 'compact' ? ' (compact)' : ' (comfortable)';
  return (
    <div className="densityPanel" data-density={mode === 'compact' ? 'compact' : undefined}>
      <p className="densityPanelCaption">{mode === 'compact' ? 'Compact' : 'Comfortable'}</p>
      <div className="specimenRow">
        <Button>Book{suffix}</Button>
        <Input aria-label={`Client name${suffix}`} placeholder="Client name" />
        <Select aria-label={`Appointment type${suffix}`} options={SELECT_OPTIONS} placeholder="Appointment type" />
      </div>
      <Table caption={`Ridge Physio’s clients${suffix}`} columns={CLIENT_COLUMNS} rows={CLIENTS} getRowId={(r) => r.id} />
      <Scheduler
        label={`Appointments${suffix}`}
        view="day"
        date="2026-09-17"
        hours={{ start: 9, end: 11 }}
        now="2026-09-17T09:50"
        events={EVENTS}
      />
    </div>
  );
}

export default function Page() {
  return (
    <DocPage
      evidence={
        <>
          <p>{Object.keys(density).length} tokens</p>
          <p>density/control 40 / 32</p>
          <p>density/row 72 / 48</p>
          <p>density/row-header 44 / 36</p>
          <p>density/hour 80 / 64</p>
          <p>density/nav-item 40 / 32</p>
          <p>touch floor 24, compact 32</p>
        </>
      }
    >
      <h1>Density</h1>
      <p className="lead">
        How much room a row, a control and an hour take. Comfortable is what is drawn; compact
        is chosen on any element.
      </p>

      <h2>The tokens</h2>
      <p>
        Five tokens, only the ones the dense screen proves. Comfortable is the default; compact
        is chosen with <code>data-density=&quot;compact&quot;</code> on any element, not only{' '}
        <code>:root</code> — the custom properties inherit, so a part of a page can be compact
        while the rest stays comfortable.
      </p>
      <div className="specimen">
        <Table
          caption="Density tokens: comfortable and compact, and what reads each one"
          captionVisible
          density="compact"
          columns={COLUMNS}
          rows={ROWS}
          getRowId={(r) => r.key}
        />
      </div>

      <h2>Choosing</h2>
      <p>
        Compact where a person scans many rows with a pointer — a dense Table, a packed
        Scheduler, a long SideNav — and comfortable everywhere else, which is most of a product.
        An explicit <code>size</code> on a control, and the Table&rsquo;s own explicit{' '}
        <code>density</code> prop, keep winning over the token: with neither attribute, nothing
        changes from today.
      </p>

      <h2>Touch</h2>
      <p>
        Compact does not apply under a finger. Inside <code>@media (pointer: coarse)</code> the
        compact block restates the comfortable values, so a control stays 40px and a row 72px
        even with <code>data-density=&quot;compact&quot;</code> set. 32px passes WCAG 2.5.8&rsquo;s
        24px floor, but under a thumb at 375px it reads small, and density is for the pointer and
        the keyboard, not the touchscreen.
      </p>

      <h2>Try it</h2>
      <p>
        The same Button, Input, Select, Table and Scheduler slice, drawn twice: once at rest, and
        once inside <code>data-density=&quot;compact&quot;</code>. None of the controls take a{' '}
        <code>size</code>, and the Table takes no <code>density</code> prop — every measurement
        below comes from the attribute alone.
      </p>
      <div className="densityCompare">
        <Panel mode="comfortable" />
        <Panel mode="compact" />
      </div>

      <h2>In code</h2>
      <CodeBlock
        lang="tsx"
        code={`<div data-density="compact">
  {/* Button, Input, Select, Table and Scheduler inside read the compact values. */}
</div>

// Tailwind, through the theme's variables:
<div className="h-(--density-row)">…</div>`}
      />

      <h2>In Figma</h2>
      <p>
        A fourth collection, <strong>Alpenglow Density</strong>, two modes, Comfortable and
        Compact, one variable per token above, each with <code>scopes</code> set to{' '}
        <code>WIDTH_HEIGHT</code> so a designer sees only the properties it applies to.
      </p>
    </DocPage>
  );
}
