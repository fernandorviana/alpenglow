'use client';

import { useState } from 'react';
import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { CodeBlock } from '@ui/CodeBlock';
import { Filters } from '@/components/Filters';
import type { FilterField, FilterValue } from '@/components/Filters';
import { Table } from '@/components/Table';
import { resolve } from '@/tokens/contrast';
import type { Mode } from '@/tokens/theme';

const MODES: Mode[] = ['light', 'dark'];

const FIELDS: FilterField[] = [
  {
    key: 'status',
    label: 'Status',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'pending', label: 'Invite pending' },
      { value: 'none', label: 'Not invited' },
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
  {
    key: 'location',
    label: 'Location',
    options: [
      { value: 'lisbon', label: 'Lisbon' },
      { value: 'porto', label: 'Porto' },
    ],
  },
];

const USAGE = `import { Filters } from 'alpenglow';
import type { FilterField, FilterValue } from 'alpenglow';

const fields: FilterField[] = [
  { key: 'status', label: 'Status', options: [{ value: 'active', label: 'Active' }, …] },
  { key: 'role', label: 'Role', options: [{ value: 'owner', label: 'Owner' }, …] },
];

const [filters, setFilters] = useState<FilterValue[]>([]);

<Filters fields={fields} value={filters} onChange={setFilters} />

// Then the caller filters: a row passes when, for every entry, its field is one of the values.
rows.filter((row) => filters.every((f) => f.values.includes(row[f.key])));

// The chip's words, in another language or another logic.
<Filters … describe={(field, chosen) => \`\${field.label}: \${chosen.map((o) => o.label).join(', ')}\`} />`;

type PropRow = { prop: string; type: string; default: string };
const PROPS: PropRow[] = [
  { prop: 'fields', type: 'FilterField[] — { key, label, options: { value, label }[] }', default: 'required' },
  { prop: 'value', type: 'FilterValue[] — { key, values: string[] }', default: 'required' },
  { prop: 'onChange', type: '(next: FilterValue[]) => void', default: 'required' },
  { prop: 'label', type: 'string', default: "'Filters'" },
  { prop: 'addLabel', type: 'string', default: "'Add filter'" },
  { prop: 'clearLabel', type: 'string', default: "'Clear'" },
  { prop: 'describe', type: '(field, chosen) => ReactNode', default: '"Field is A or B"' },
  { prop: 'className', type: 'string', default: '—' },
];

const propColumns = [
  { key: 'prop', header: 'Prop', primary: true, cell: (r: PropRow) => <code>{r.prop}</code> },
  { key: 'type', header: 'Type', cell: (r: PropRow) => <span className="alias">{r.type}</span> },
  { key: 'default', header: 'Default', cell: (r: PropRow) => <span className="alias">{r.default}</span> },
];

export default function Page() {
  const [value, setValue] = useState<FilterValue[]>([{ key: 'status', values: ['active', 'pending'] }]);
  const [pt, setPt] = useState<FilterValue[]>([{ key: 'role', values: ['owner', 'admin'] }]);

  return (
    <DocPage
      evidence={
        <>
          <div>
            <p>the chip&rsquo;s words on the tag</p>
            {MODES.map((mode) => (
              <p key={mode}>
                {mode} <Ratio fg={resolve('text/secondary', mode)} bg={resolve('surface/sunken', mode)} />
              </p>
            ))}
          </div>
          <div>
            <p>the field and the values, Semibold</p>
            {MODES.map((mode) => (
              <p key={mode}>
                {mode} <Ratio fg={resolve('text/primary', mode)} bg={resolve('surface/sunken', mode)} />
              </p>
            ))}
          </div>
        </>
      }
    >
      <h1>Filters</h1>
      <p className="lead">The filters on a list, read as words, so the whole state of the list is always in view.</p>

      <h2>Try it</h2>
      <div className="specimen">
        <Filters fields={FIELDS} value={value} onChange={setValue} />
      </div>
      <p className="alias">
        Press the words of a chip to change its values; press + to add a field; the × takes a chip away.
      </p>
      <p>
        Drawn on the product&rsquo;s staff list, the &ldquo;future proof&rdquo; version: a bar above the table with
        a chip for each field that has a value, a + that opens the fields and then a field&rsquo;s values, and Clear.
        It is what Linear, Notion and Airtable converged on, and it makes a filter simple for one reason: the bar
        says the whole state of the list in words, and nothing is hidden behind an icon. A chip&rsquo;s words are a
        button that opens its values again, which is the part that saves the most.
      </p>

      <h2>Controlled</h2>
      <p>
        <code>value</code> is the caller&rsquo;s: one entry per field with something chosen, in the order the
        fields were added, each holding its values in the field&rsquo;s own order. Every check reports the next
        value at once, as drawn, and unchecking the last value of a field drops the field. The component filters
        nothing; the caller does, and a Table&rsquo;s page shows the two together.
      </p>

      <h2>The words</h2>
      <p>
        The drawing says &ldquo;Status is Active <em>and</em> Invite Pending&rdquo;. Read literally that asks for
        both, and what is meant is either, so the chip says <em>or</em>; Linear writes &ldquo;is any of&rdquo;.{' '}
        <code>describe</code> is for another language, or another logic.
      </p>
      <div className="specimen">
        <Filters
          fields={FIELDS}
          value={pt}
          onChange={setPt}
          label="Filtros"
          addLabel="Adicionar filtro"
          clearLabel="Limpar"
          describe={(field, chosen) => (
            <>
              <strong>{field.label}</strong> é {chosen.map((o) => o.label).join(' ou ')}
            </>
          )}
        />
      </div>

      <h2>Where it departs from the drawing</h2>
      <p>
        The drawn chip is a rectangle at radius 8 in 14px. The chip here is the <a href="/tag">Tag</a>, a capsule in
        12px: &ldquo;a filter on a list&rdquo; is what the Tag was written for, and one chip in the system is worth
        more than a second one that matches a drawing by two pixels. The drawn + opens a menu with a submenu; here
        it is a Popover with the fields on one side and the picked field&rsquo;s values on the other, which is the
        same shape without a second layer to place. And the toolbar&rsquo;s filter icon is not composed beside the
        bar: it repeated the +.
      </p>

      <h2>Accessibility</h2>
      <p>
        The bar is a group named by its label. A chip&rsquo;s words are a button named by the words, with the
        popover&rsquo;s own <code>aria-haspopup</code>; its × is &ldquo;Remove Status filter&rdquo;. The values are
        checkboxes in a fieldset whose legend is the field, so a reader hears &ldquo;Status, Active, checked&rdquo;.
        In the + panel the picked field is <code>aria-pressed</code>. Esc and a click outside close a panel, and the
        focus goes back to the words or the +, which is the platform&rsquo;s.
      </p>

      <h2>Using it</h2>
      <CodeBlock code={USAGE} lang="tsx" />
      <div className="specimen">
        <Table caption="Filters props" captionVisible density="compact" columns={propColumns} rows={PROPS} getRowId={(r) => r.prop} />
      </div>
    </DocPage>
  );
}
