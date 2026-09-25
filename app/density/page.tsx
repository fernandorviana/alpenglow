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
import { spacing } from '@/tokens/scale';

/**
 * The Density page: the five tokens, how to choose between the two modes,
 * why touch is exempt, and a Try it that puts a Button, an Input, a Select,
 * a Table and a Scheduler slice through both.
 */

/** One row per token, generated straight from `density` — the reference table's whole point. */
type Row = { name: DensityTokenName; entry: (typeof density)[DensityTokenName] };
const ROWS: Row[] = (Object.entries(density) as [DensityTokenName, (typeof density)[DensityTokenName]][]).map(
  ([name, entry]) => ({ name, entry }),
);

const COLUMNS: Column<Row>[] = [
  // A token's name keeps to one line (`.tokenName` in docs.css): the
  // longest, `density/row-header`, is 134, and with the cell's 24 it fits
  // the primary's 160, said here so the two stay together.
  { key: 'token', header: 'Token', primary: true, minWidth: spacing[1300], cell: (r) => <span className="tokenName">density/{r.name}</span> },
  // minWidth said: at its default 96 the header "Comfortable" overflowed its
  // own end-aligned column once the Table narrowed past its Type column. It
  // is 92, so 120 with the cell's 24 holds it — and leaves room beside the
  // token's 160 at 320, where 128 put the pair 2px past the phone's 288 and
  // the table showed its names alone.
  { key: 'comfortable', header: 'Comfortable', align: 'end', minWidth: 120, cell: (r) => `${r.entry.comfortable}px` },
  { key: 'compact', header: 'Compact', align: 'end', cell: (r) => `${r.entry.compact}px` },
  { key: 'use', header: 'Read by', cell: (r) => r.entry.use },
];

// A three-row slice of Ridge Physio's client list, for the Try it Table — no
// `density` prop, so each copy follows the `data-density` it sits under.
type ClientRow = { id: string; client: string; appointment: string };
const CLIENTS: ClientRow[] = [
  { id: '1', client: 'Maya Costa', appointment: 'Assessment' },
  { id: '2', client: 'Joaquim Okafor', appointment: 'Follow-up' },
  { id: '3', client: 'Aisha Nguyen', appointment: 'Sports massage' },
];
// "Appointment" is 91, and 123 with a comfortable cell's 32: at its default
// 96 it read "APPOINTM…" at 320. The client gives up the primary's 160 for
// 128 — a name wraps at its space — so the pair still fits the phone's 288.
const CLIENT_COLUMNS: Column<ClientRow>[] = [
  { key: 'client', header: 'Client', primary: true, minWidth: spacing[1200], cell: (r) => r.client },
  { key: 'appointment', header: 'Appointment', minWidth: spacing[1200], cell: (r) => r.appointment },
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

/**
 * One panel of the Try it: a Button, an Input and a Select, none passed a
 * `size`, and a two-hour Scheduler slice. Narrow enough to sit two up that
 * the Table can't join them without losing its Appointment column, below
 * the client Table's own 258px threshold — decision 18's row-height
 * comparison needs the Table full width, so the two client Tables are
 * stacked below instead, each still following the `data-density` it sits
 * under.
 */
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

/** One of the two full-width Table specimens below the panels, captioned with its mode. */
function TableSpecimen({ mode }: { mode: (typeof densityModes)[number] }) {
  const suffix = mode === 'compact' ? ' (compact)' : ' (comfortable)';
  return (
    <div className="specimen" data-density={mode === 'compact' ? 'compact' : undefined}>
      <p className="densityPanelCaption">{mode === 'compact' ? 'Compact' : 'Comfortable'}</p>
      <Table caption={`Ridge Physio’s clients${suffix}`} columns={CLIENT_COLUMNS} rows={CLIENTS} getRowId={(r) => r.id} />
    </div>
  );
}

export default function Page() {
  return (
    <DocPage
      evidence={
        <>
          <p>{Object.keys(density).length} tokens</p>
          {Object.entries(density).map(([name, v]) => (
            <p key={name}>
              density/{name} {v.comfortable} / {v.compact}
            </p>
          ))}
          <p>touch floor 24, compact {density.control.compact}</p>
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
        while the rest stays comfortable. A region inside a compact one returns to comfortable
        with <code>data-density=&quot;comfortable&quot;</code>.
      </p>
      <div className="specimen">
        <Table
          caption="Density tokens: comfortable and compact, and what reads each one"
          captionVisible
          density="compact"
          columns={COLUMNS}
          rows={ROWS}
          getRowId={(r) => r.name}
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
        The same Button, Input, Select and Scheduler slice, drawn twice: once at rest, and once
        inside <code>data-density=&quot;compact&quot;</code>. None of the controls take a{' '}
        <code>size</code> — every measurement below comes from the attribute alone.
      </p>
      <div className="densityCompare">
        <Panel mode="comfortable" />
        <Panel mode="compact" />
      </div>
      <p>
        The client Table takes no <code>density</code> prop either, but it needs its own full
        width to prove it: below the Table&rsquo;s own 258px threshold it loses its Appointment
        column, which is correct — and exactly what the panels above would force on it.
        Stacked instead, its row is {density.row.comfortable}px in the first and{' '}
        {density.row.compact}px in the second.
      </p>
      <TableSpecimen mode="comfortable" />
      <TableSpecimen mode="compact" />

      <h2>In code</h2>
      <CodeBlock
        lang="tsx"
        code={`<div data-density="compact">
  {/* Button, Input, Select, Table and Scheduler inside read the compact values. */}
</div>

// Tailwind: the density utilities read the token where they are used.
<div className="h-density-row">…</div>`}
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
