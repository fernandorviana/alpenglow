'use client';

import { useState } from 'react';
import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Table } from '@/components/Table';
import type { Column, Sort } from '@/components/Table';
import { resolve } from '@/tokens/contrast';

type Client = {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'pending' | 'lapsed';
  visits: number;
  seen: string;
};

const CLIENTS: Client[] = [
  { id: '1', name: 'Lisa Roberts', email: 'lisa.roberts@example.com', status: 'active', visits: 14, seen: '2 days ago' },
  { id: '2', name: 'Gary Martin', email: 'gary.martin@example.com', status: 'pending', visits: 3, seen: 'today' },
  { id: '3', name: 'Sanjay Choudhary', email: 'sanjay.c@example.com', status: 'active', visits: 27, seen: 'last week' },
  { id: '4', name: 'Aoife Byrne', email: 'aoife.byrne@example.com', status: 'lapsed', visits: 1, seen: '4 months ago' },
];

const TONE = { active: 'success', pending: 'warning', lapsed: 'neutral' } as const;

export default function Page() {
  const [sort, setSort] = useState<Sort | null>({ key: 'name', direction: 'asc' });
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set(['3']));

  // Sorting is the caller's job — the table reports intent and draws the
  // state. This is the whole point of the controlled API.
  const rows = [...CLIENTS].sort((a, b) => {
    if (!sort) return 0;
    const dir = sort.direction === 'asc' ? 1 : -1;
    if (sort.key === 'visits') return (a.visits - b.visits) * dir;
    return String(a[sort.key as keyof Client]).localeCompare(String(b[sort.key as keyof Client])) * dir;
  });

  const columns: Column<Client>[] = [
    {
      key: 'name',
      header: 'Client',
      sortable: true,
      primary: true,
      cell: (c) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name={c.name} size="md" />
          <div>
            <div>{c.name}</div>
            <div className="alias">{c.email}</div>
          </div>
        </div>
      ),
    },
    { key: 'status', header: 'Status', cell: (c) => <Badge tone={TONE[c.status]}>{c.status}</Badge> },
    { key: 'visits', header: 'Visits', align: 'end', sortable: true, cell: (c) => c.visits },
    { key: 'seen', header: 'Last seen', cell: (c) => c.seen },
  ];

  // The compact and state specimens drop the avatar cell deliberately: a 48px
  // row is for one line of content, and an avatar beside two lines is what the
  // 72px row exists for. `primary` still marks one column, because these
  // specimens are the ones narrow enough to collapse.
  const simpleColumns: Column<Client>[] = [
    { key: 'name', header: 'Client', primary: true, cell: (c) => c.name },
    { key: 'visits', header: 'Visits', align: 'end', cell: (c) => c.visits },
    { key: 'seen', header: 'Last seen', cell: (c) => c.seen },
  ];

  return (
    <DocPage
      evidence={
        <>
          <p>header on band</p>
          <p>light <Ratio fg={resolve('text/secondary', 'light')} bg={resolve('surface/base', 'light')} /></p>
          <p>dark <Ratio fg={resolve('text/secondary', 'dark')} bg={resolve('surface/base', 'dark')} /></p>
        </>
      }
    >
      <h1>Table</h1>
      <p className="lead">
        Sorting and selection are controlled. The table draws the state and reports the
        intent; it holds nothing and sorts nothing.
      </p>

      <h2>Try it</h2>
      <div className="specimen">
        <Table
          caption="Clients"
          columns={columns}
          rows={rows}
          getRowId={(c) => c.id}
          sort={sort}
          onSortChange={setSort}
          selected={selected}
          onSelectionChange={setSelected}
          selectionLabel={(c) => `Select ${c.name}`}
          rowAction={(c) => (
            <button type="button" className="rowAction" aria-label={`Actions for ${c.name}`}>
              &#8943;
            </button>
          )}
        />
      </div>
      <p className="alias">
        Sort by Client or Visits — three activations return to the natural order.
      </p>

      <h2>Density</h2>
      <p>
        The drawn row is 72 pixels. <code>compact</code> is an addition: a system sold on
        dense, data-heavy interfaces cannot have the table be the component that proves it
        least.
      </p>
      <div className="specimen">
        <Table
          caption="Clients, compact"
          density="compact"
          columns={simpleColumns}
          rows={rows}
          getRowId={(c) => c.id}
        />
      </div>

      <h2>Cell content is not the table's business</h2>
      <p>
        The Figma file draws twelve kinds of cell. Only some of them are structure —
        alignment, the selection column, the trailing action. The rest are things put
        inside a cell, so they are what <code>cell</code> returns: an{' '}
        <code>Avatar</code> beside two lines of text, a <code>Badge</code>, a number
        aligned to the end.
      </p>

      <h2>States</h2>
      <div className="specimen">
        <Table caption="Empty example" columns={simpleColumns} rows={[]} getRowId={(c) => c.id} empty="No clients yet" />
      </div>
      <div className="specimen">
        <Table caption="Loading example" columns={simpleColumns} rows={[]} getRowId={(c) => c.id} loading />
      </div>

      <h2>Accessibility</h2>
      <p>
        The caption is required, because a table with no accessible name is the most
        common table defect there is. It is hidden unless you ask for it, and{' '}
        <code>captionVisible</code> is what asks — shown here, aligned to the first
        column rather than centred the way a bare <code>caption</code> would be.
      </p>
      <div className="specimen">
        <Table
          caption="Clients"
          captionVisible
          density="compact"
          columns={simpleColumns}
          rows={rows}
          getRowId={(c) => c.id}
        />
      </div>
      <p>
        <code>aria-sort</code> lands on the sorted column and no other, and the control is
        a button inside the header rather than a handler on it, so a keyboard can reach it.
      </p>
      <p>
        The header checkbox derives its mixed state from the selection, and every row
        checkbox gets a name of its own — ten controls called &ldquo;select row&rdquo; are
        useless in a screen reader.
      </p>
      <p>
        A selected row carries <code>data-selected</code>, not{' '}
        <code>aria-selected</code>: that attribute is only valid under{' '}
        <code>role=&quot;grid&quot;</code>, and on a plain table it is invalid ARIA that
        reads as correct.
      </p>
      <p>
        The table sits in a focusable, labelled region, so a keyboard can scroll it
        sideways. Below 40rem of container width it collapses to a list: the header
        and the secondary columns go, and the primary cell, the selection checkbox
        and the row action stay. The drawing keeps only the first and the last of
        those — dropping the checkbox would remove selection on a phone rather
        than lay it out differently. The empty and loading cells are spared by the
        same rule, for the same reason: they are the only content those two states
        have.
      </p>
      <p>
        The select-all checkbox in the header is <code>disabled</code> while{' '}
        <code>loading</code> is true, because it would otherwise write a selection
        derived from rows that are no longer on screen. The sort buttons deliberately
        stay live, because they only report intent to the caller.
      </p>
      <p>
        The sortable header's hit target is the label rather than the whole cell —
        a deliberate choice — and the label raises its contrast on hover so a pointer
        user can see where the target is.
      </p>

      <h2>Props</h2>
      <div className="tableScroll">
        <table className="tokens">
          <thead>
            <tr><th>Prop</th><th>Type</th><th>Default</th></tr>
          </thead>
          <tbody>
            {[
              ['caption', 'string', 'required'],
              ['captionVisible', 'boolean', 'false'],
              ['columns', 'Column<Row>[]', 'required'],
              ['rows', 'Row[]', 'required'],
              ['getRowId', '(row: Row) => string', 'required'],
              ['density', "'comfortable' | 'compact'", "'comfortable'"],
              ['sort', 'Sort | null', '—'],
              ['onSortChange', '(next: Sort | null) => void', '—'],
              ['selected', 'ReadonlySet<string>', '—'],
              ['onSelectionChange', '(next: Set<string>) => void', '—'],
              ['selectionLabel', '(row: Row) => string', 'Select row {n}'],
              ['rowAction', '(row: Row) => ReactNode', '—'],
              ['empty', 'ReactNode', "'No rows'"],
              ['loading', 'boolean', 'false'],
            ].map(([prop, type, def]) => (
              <tr key={prop}>
                <td className="tokenName">{prop}</td>
                <td className="alias">{type}</td>
                <td className="alias">{def}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Column props</h2>
      <div className="tableScroll">
        <table className="tokens">
          <thead>
            <tr><th>Field</th><th>Type</th><th>Default</th></tr>
          </thead>
          <tbody>
            {[
              ['key', 'string', 'required'],
              ['header', 'ReactNode', 'required'],
              ['cell', '(row: Row) => ReactNode', 'required'],
              ['align', "'start' | 'center' | 'end'", "'start'"],
              ['sortable', 'boolean', 'false'],
              ['width', 'string (CSS)', 'auto'],
              ['primary', 'boolean', 'false'],
            ].map(([field, type, def]) => (
              <tr key={field}>
                <td className="tokenName">{field}</td>
                <td className="alias">{type}</td>
                <td className="alias">{def}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DocPage>
  );
}
