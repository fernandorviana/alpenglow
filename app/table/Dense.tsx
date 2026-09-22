'use client';

import { useState } from 'react';
import { Archive, Download, Search } from '@carbon/icons-react';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Filters } from '@/components/Filters';
import type { FilterField, FilterValue } from '@/components/Filters';
import { Input } from '@/components/Input';
import { Pagination } from '@/components/Pagination';
import { Switch } from '@/components/Switch';
import { Table } from '@/components/Table';
import type { Column, Sort } from '@/components/Table';
import { toast } from '@/components/Toast';
import { spacing } from '@/tokens/scale';

type Status = 'active' | 'inactive' | 'pending';
type Role = 'owner' | 'admin' | 'practitioner' | 'reception';
type Staff = { id: string; name: string; email: string; status: Status; role: Role; location: string; visits: number };

const FIRST = ['Lisa', 'Gary', 'Sanjay', 'Aoife', 'Marta', 'Tomás', 'Inês', 'Rui', 'Beatriz', 'Diogo', 'Carla', 'Nuno'];
const LAST = ['Roberts', 'Martin', 'Choudhary', 'Byrne', 'Sousa', 'Ferreira', 'Almeida', 'Costa', 'Lopes', 'Ramos'];
const STATUS: Status[] = ['active', 'active', 'active', 'pending', 'inactive'];
const ROLE: Role[] = ['practitioner', 'practitioner', 'reception', 'admin', 'owner'];
const PLACE = ['Lisbon', 'Porto', 'Coimbra'];

/** Seventy-two rows, as drawn, from a fixed sequence so the page is the same on every visit. */
const STAFF: Staff[] = Array.from({ length: 72 }, (_, i) => {
  const name = `${FIRST[i % FIRST.length]} ${LAST[(i * 7) % LAST.length]}`;
  return {
    id: String(i + 1),
    name,
    email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
    status: STATUS[(i * 3) % STATUS.length]!,
    role: ROLE[(i * 5) % ROLE.length]!,
    location: PLACE[i % PLACE.length]!,
    visits: (i * 37) % 120,
  };
});

const FIELDS: FilterField[] = [
  {
    key: 'status',
    label: 'Status',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'pending', label: 'Invite pending' },
    ],
  },
  {
    key: 'role',
    label: 'Role',
    options: [
      { value: 'owner', label: 'Owner' },
      { value: 'admin', label: 'Admin' },
      { value: 'practitioner', label: 'Practitioner' },
      { value: 'reception', label: 'Reception' },
    ],
  },
  { key: 'location', label: 'Location', options: PLACE.map((p) => ({ value: p, label: p })) },
];

const TONE = { active: 'success', pending: 'warning', inactive: 'neutral' } as const;
const LABEL = { active: 'Active', pending: 'Invite pending', inactive: 'Inactive' } as const;

const columns: Column<Staff>[] = [
  {
    key: 'name',
    header: 'Name',
    sortable: true,
    primary: true,
    cell: (s) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[150] }}>
        <Avatar name={s.name} size="sm" />
        <div>
          <div>{s.name}</div>
          <div className="alias">{s.email}</div>
        </div>
      </div>
    ),
  },
  { key: 'status', header: 'Status', cell: (s) => <Badge tone={TONE[s.status]}>{LABEL[s.status]}</Badge> },
  { key: 'role', header: 'Role', sortable: true, cell: (s) => s.role },
  { key: 'location', header: 'Location', cell: (s) => s.location },
  { key: 'visits', header: 'Visits', align: 'end', sortable: true, cell: (s) => s.visits },
];

/** The composed dense screen: search, Filters, the table with its header pinned, the selection bar and the Pagination. */
export function Dense() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<FilterValue[]>([{ key: 'status', values: ['active', 'pending'] }]);
  const [sort, setSort] = useState<Sort | null>({ key: 'name', direction: 'asc' });
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [onlySelected, setOnlySelected] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // The Switch lives in the bar, which goes with the selection: so does its state.
  const showOnlySelected = onlySelected && selected.size > 0;
  const q = query.trim().toLowerCase();
  const matching = STAFF.filter(
    (s) =>
      (!q || s.name.toLowerCase().includes(q) || s.email.includes(q)) &&
      filters.every((f) => f.values.includes(String(s[f.key as keyof Staff]))) &&
      (!showOnlySelected || selected.has(s.id)),
  );
  const sorted = [...matching].sort((a, b) => {
    if (!sort) return 0;
    const dir = sort.direction === 'asc' ? 1 : -1;
    if (sort.key === 'visits') return (a.visits - b.visits) * dir;
    return String(a[sort.key as keyof Staff]).localeCompare(String(b[sort.key as keyof Staff])) * dir;
  });
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pageCount);
  const rows = sorted.slice((current - 1) * pageSize, current * pageSize);

  const narrow = (next: string) => {
    setQuery(next);
    setPage(1);
  };

  return (
    <div style={{ display: 'grid', gap: spacing[200] }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[150], justifyContent: 'space-between' }}>
        <Button size="md">New staff</Button>
        <div style={{ flex: '0 1 320px' }}>
          <Input
            aria-label="Search staff"
            placeholder="Search staff"
            value={query}
            onChange={(e) => narrow(e.target.value)}
            iconStart={<Search size={16} />}
          />
        </div>
      </div>
      <Filters
        fields={FIELDS}
        value={filters}
        onChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
      />
      <Table
        caption="Staff"
        density="compact"
        columns={columns}
        rows={rows}
        getRowId={(s) => s.id}
        sort={sort}
        onSortChange={setSort}
        selected={selected}
        onSelectionChange={setSelected}
        selectionLabel={(s) => `Select ${s.name}`}
        stickyHeader
        maxHeight={392}
        empty="Nobody matches these filters."
        bulkActions={({ selected: chosen }) => (
          <>
            <Button
              variant="ghost"
              tone="neutral"
              size="sm"
              iconStart={<Download size={16} />}
              onClick={() => toast(`Exported ${chosen.size} staff`)}
            >
              Export
            </Button>
            <Button
              variant="ghost"
              tone="neutral"
              size="sm"
              iconStart={<Archive size={16} />}
              onClick={() => toast(`Archived ${chosen.size} staff`)}
            >
              Archive
            </Button>
            <Switch
              checked={onlySelected}
              onChange={(e) => {
                setOnlySelected(e.target.checked);
                setPage(1);
              }}
            >
              Show only selected
            </Switch>
          </>
        )}
        footer={
          <Pagination
            page={current}
            onPageChange={setPage}
            total={sorted.length}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
          />
        }
      />
    </div>
  );
}
