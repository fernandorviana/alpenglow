import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import userEvent from '@testing-library/user-event';
import { Table, nextSort, headerSelectionState } from './Table';
import type { Column } from './Table';
import styles from './Table.module.css';
import { readCss, block } from '@/test/css';
import { axeViolations } from '../../test/axe';

type Row = { id: string; name: string; seen: string };

const rows: Row[] = [
  { id: 'a', name: 'Lisa Roberts', seen: '2 days ago' },
  { id: 'b', name: 'Gary Martin', seen: 'today' },
];

const columns: Column<Row>[] = [
  { key: 'name', header: 'Name', cell: (r) => r.name, primary: true },
  { key: 'seen', header: 'Last seen', cell: (r) => r.seen, align: 'end' },
];

const base = { caption: 'Clients', columns, rows, getRowId: (r: Row) => r.id };

describe('Table semantics', () => {
  it('names the table with a caption that is available but not seen', () => {
    // A table with no accessible name is the most common table defect there
    // is, which is why `caption` is required rather than optional.
    render(<Table {...base} />);
    const caption = screen.getByText('Clients');
    expect(caption.tagName).toBe('CAPTION');
    expect(caption).toHaveClass('ap-sr-only');
  });

  it('shows the caption when asked, styled rather than bare', () => {
    // A browser's default <caption> is centred and unpadded, which is not
    // how any other heading in the system sits, so the visible state gets a
    // class of its own rather than only losing the hidden one.
    render(<Table {...base} captionVisible />);
    const caption = screen.getByText('Clients');
    expect(caption).not.toHaveClass('ap-sr-only');
    expect(caption).toHaveClass(styles.caption!);
  });

  it('scopes every header to its column', () => {
    // Without scope, a screen reader cannot say which column a cell is in.
    render(<Table {...base} />);
    for (const header of screen.getAllByRole('columnheader')) {
      expect(header).toHaveAttribute('scope', 'col');
    }
  });

  it('puts a fixed width on the header cell, in px, and draws no colgroup', () => {
    // A positional <col> would slide onto its neighbour once a column's cells
    // are display: none, so the width is the header cell's, from the rules.
    const { container } = render(<Table {...base} columns={[{ ...columns[0]!, width: 320 }, columns[1]!]} />);
    expect(container.querySelector('colgroup')).toBeNull();
    expect(container.querySelector('style')!.textContent).toContain('th[data-col="name"] { width: 320px; }');
  });

  it('renders a row per item and a cell per column', () => {
    render(<Table {...base} />);
    expect(screen.getAllByRole('row')).toHaveLength(3); // header + 2
    expect(screen.getByText('Lisa Roberts')).toBeInTheDocument();
    expect(screen.getByText('today')).toBeInTheDocument();
  });

  it('aligns a column by its own declaration, defaulting to start', () => {
    const { container } = render(<Table {...base} />);
    const headers = container.querySelectorAll('th');
    expect(headers[0]).toHaveAttribute('data-align', 'start');
    expect(headers[1]).toHaveAttribute('data-align', 'end');
  });

  it('is a labelled region a keyboard can scroll', () => {
    // Without tabindex a keyboard cannot scroll a wide table at all —
    // WCAG 2.1.1, and routinely missed.
    render(<Table {...base} />);
    const region = screen.getByRole('region', { name: 'Clients' });
    expect(region).toHaveAttribute('tabindex', '0');
  });

  it('takes its region name from the caption, so the two cannot drift', () => {
    render(<Table {...base} caption="Appointments" />);
    expect(screen.getByRole('region', { name: 'Appointments' })).toBeInTheDocument();
  });
});

describe('Table empty state', () => {
  it('replaces the rows with the fallback and spans every column', () => {
    render(<Table {...base} rows={[]} empty="No clients yet" />);
    const cell = screen.getByText('No clients yet');
    expect(cell.closest('td')).toHaveAttribute('colspan', '2');
  });

  it('falls back to a default message rather than an empty body', () => {
    render(<Table {...base} rows={[]} />);
    expect(screen.getByText('No rows')).toBeInTheDocument();
  });

  it('keeps the headers when there are no rows', () => {
    // Dropping them makes the table jump when data arrives.
    render(<Table {...base} rows={[]} />);
    expect(screen.getAllByRole('columnheader')).toHaveLength(2);
  });
});

describe('Table density', () => {
  it('follows the token by default, not a literal comfortable', () => {
    // `density` has no default in the destructuring any more: with none
    // passed the root takes the internal `auto` class, which reads
    // `--ap-density-row`/`--ap-density-row-header` rather than a literal.
    // At comfortable (no `data-density` attribute) that renders identically
    // to the old literal default — see the `density` describe block below.
    const { container } = render(<Table {...base} />);
    expect(container.firstElementChild).toHaveClass(styles.auto!);
    expect(container.firstElementChild).not.toHaveClass(styles.comfortable!);
  });

  it('takes the compact density', () => {
    const { container } = render(<Table {...base} density="compact" />);
    expect(container.firstElementChild).toHaveClass(styles.compact!);
  });

  it('sets height on the row rather than deriving it from padding', () => {
    // The arithmetic does not close the other way round: the drawn primary
    // cell stacks body/lg on body/md for 46px of content, and no symmetric
    // padding takes that to 72 while also taking a single 22px line to 72.
    // A padding-derived implementation gives 62px rows that look nearly
    // right, so the rule is asserted against the stylesheet source.
    const css = readFileSync('src/components/Table/Table.module.css', 'utf8');
    const comfortable = css.match(/\.comfortable\s+\.td\s*\{([^}]*)\}/)?.[1] ?? '';

    expect(comfortable).toMatch(/height:\s*72px/);
    expect(comfortable).toMatch(/padding-inline:/);
    expect(comfortable).not.toMatch(/padding-block|padding-top|padding-bottom/);
  });

  it('declares both densities', () => {
    const css = readFileSync('src/components/Table/Table.module.css', 'utf8');
    expect(css).toMatch(/\.comfortable\s+\.td/);
    expect(css).toMatch(/\.compact\s+\.td/);
    expect(css).toMatch(/\.comfortable\s+\.th/);
    expect(css).toMatch(/\.compact\s+\.th/);
  });
});

describe('density', () => {
  it('follows the token when no density is passed', () => {
    const { container } = render(<Table caption="People" columns={columns} rows={rows} getRowId={(r) => r.id} />);
    expect(container.firstElementChild).toHaveClass(styles.auto!);
  });

  it('keeps an explicit density', () => {
    const { container } = render(<Table caption="People" columns={columns} rows={rows} getRowId={(r) => r.id} density="comfortable" />);
    expect(container.firstElementChild).toHaveClass(styles.comfortable!);
    expect(container.firstElementChild).not.toHaveClass(styles.auto!);
  });

  it('reads the row tokens, with the inline padding following the row', () => {
    const css = readCss('src/components/Table/Table.module.css');
    expect(block(css, '.auto .th {')).toContain('height: var(--ap-density-row-header);');
    expect(block(css, '.auto .td {')).toContain('height: var(--ap-density-row);');
    expect(block(css, '.auto .caption {')).toContain('padding-inline: calc(var(--ap-density-row) / 6 + var(--ap-spacing-050));');
  });
});

describe('Table figures', () => {
  it('sets numbers in tabular figures', () => {
    // An end-aligned column holds numbers. Proportional digits differ in
    // width, so 14 and 27 do not line up down the column; tabular ones do.
    const css = readFileSync('src/components/Table/Table.module.css', 'utf8');
    expect(css).toMatch(/\.td\[data-align='end'\]\s*\{[^}]*font-variant-numeric: tabular-nums/);
  });
});

describe('nextSort', () => {
  it('starts a new column ascending', () => {
    expect(nextSort(null, 'name')).toEqual({ key: 'name', direction: 'asc' });
    expect(nextSort({ key: 'seen', direction: 'desc' }, 'name')).toEqual({
      key: 'name',
      direction: 'asc',
    });
  });

  it('turns ascending into descending on the same column', () => {
    expect(nextSort({ key: 'name', direction: 'asc' }, 'name')).toEqual({
      key: 'name',
      direction: 'desc',
    });
  });

  it('returns to no sort on the third activation', () => {
    // Two states would strand the caller with no way back to the natural
    // order. The drawing does not specify a cycle; this is a decision.
    expect(nextSort({ key: 'name', direction: 'desc' }, 'name')).toBeNull();
  });
});

describe('Table sorting', () => {
  const sortable: Column<Row>[] = [
    { key: 'name', header: 'Name', cell: (r) => r.name, sortable: true, primary: true },
    { key: 'seen', header: 'Last seen', cell: (r) => r.seen },
  ];

  it('marks only the sorted column with aria-sort', () => {
    // Putting aria-sort on every header is the usual mistake, and is worse
    // than omitting it: it claims every column is sorted.
    render(
      <Table
        {...base}
        columns={sortable}
        sort={{ key: 'name', direction: 'asc' }}
        onSortChange={() => {}}
      />,
    );
    const [name, seen] = screen.getAllByRole('columnheader');
    expect(name).toHaveAttribute('aria-sort', 'ascending');
    expect(seen).not.toHaveAttribute('aria-sort');
  });

  it('reports descending as descending', () => {
    render(
      <Table
        {...base}
        columns={sortable}
        sort={{ key: 'name', direction: 'desc' }}
        onSortChange={() => {}}
      />,
    );
    expect(screen.getAllByRole('columnheader')[0]).toHaveAttribute('aria-sort', 'descending');
  });

  it('puts a button inside the header so a keyboard can reach it', () => {
    // A click handler on the <th> is unreachable without a pointer.
    render(<Table {...base} columns={sortable} onSortChange={() => {}} />);
    const button = screen.getByRole('button', { name: /name/i });
    expect(button.closest('th')).toBeInTheDocument();
  });

  it('cycles the sort when the header is activated', async () => {
    const onSortChange = vi.fn();
    render(
      <Table
        {...base}
        columns={sortable}
        sort={{ key: 'name', direction: 'asc' }}
        onSortChange={onSortChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /name/i }));
    expect(onSortChange).toHaveBeenCalledWith({ key: 'name', direction: 'desc' });
  });

  it('returns to the natural order on the third activation', async () => {
    const onSortChange = vi.fn();
    render(
      <Table
        {...base}
        columns={sortable}
        sort={{ key: 'name', direction: 'desc' }}
        onSortChange={onSortChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /name/i }));
    expect(onSortChange).toHaveBeenCalledWith(null);
  });

  it('starts a different column ascending rather than inheriting the old direction', async () => {
    // The helper is tested directly, but only a rendered click proves the
    // header hands over its OWN key and the CURRENT sort, rather than the
    // key of whichever column happens to be sorted.
    const onSortChange = vi.fn();
    const bothSortable: Column<Row>[] = [
      { key: 'name', header: 'Name', cell: (r) => r.name, sortable: true, primary: true },
      { key: 'seen', header: 'Last seen', cell: (r) => r.seen, sortable: true },
    ];
    render(
      <Table
        {...base}
        columns={bothSortable}
        sort={{ key: 'name', direction: 'desc' }}
        onSortChange={onSortChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /last seen/i }));
    expect(onSortChange).toHaveBeenCalledWith({ key: 'seen', direction: 'asc' });
  });

  it('renders plain text when a sortable column has nobody to report to', () => {
    // A control that reports to nobody is worse than no control.
    render(<Table {...base} columns={sortable} />);
    expect(screen.queryByRole('button', { name: /name/i })).toBeNull();
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('renders no button for a column that is not sortable', () => {
    render(<Table {...base} columns={sortable} onSortChange={() => {}} />);
    expect(screen.queryByRole('button', { name: /last seen/i })).toBeNull();
  });

  it("raises the sortable header label's contrast on hover", () => {
    // The hit target is the label, not the whole header cell. Without a hover
    // affordance, pointer users cannot tell where the actual target is. The
    // label moves to text/primary on hover, raising contrast against the band
    // in both light and dark modes.
    const css = readFileSync('src/components/Table/Table.module.css', 'utf8');
    expect(css).toMatch(/\.sortButton:hover\s*\{[^}]*color:\s*var\(--ap-color-text-primary\)/);
  });
});

describe('headerSelectionState', () => {
  it('is unchecked when nothing is selected', () => {
    expect(headerSelectionState(0, 3)).toEqual({ checked: false, indeterminate: false });
  });

  it('is mixed when the selection is partial', () => {
    // This is the state the drawing shows and the one that is forgotten when
    // a table is written by hand.
    expect(headerSelectionState(1, 3)).toEqual({ checked: false, indeterminate: true });
  });

  it('is checked when everything is selected', () => {
    expect(headerSelectionState(3, 3)).toEqual({ checked: true, indeterminate: false });
  });

  it('is unchecked rather than checked when there are no rows', () => {
    // Vacuously "all selected" would present a checked box over an empty
    // table, which invites a select-all that does nothing.
    expect(headerSelectionState(0, 0)).toEqual({ checked: false, indeterminate: false });
  });
});

describe('Table selection', () => {
  const selectable = {
    ...base,
    onSelectionChange: () => {},
    selected: new Set<string>(),
  };

  it('adds no selection column when nobody is listening', () => {
    render(<Table {...base} />);
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  it('gives every row checkbox a name of its own', () => {
    // Ten checkboxes named "Select row" are useless in a screen reader.
    render(<Table {...selectable} selectionLabel={(r) => `Select ${r.name}`} />);
    expect(screen.getByRole('checkbox', { name: 'Select Lisa Roberts' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Select Gary Martin' })).toBeInTheDocument();
  });

  it('numbers the row checkboxes when the caller gives no names', () => {
    render(<Table {...selectable} />);
    expect(screen.getByRole('checkbox', { name: 'Select row 1' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Select row 2' })).toBeInTheDocument();
  });

  it('asks for each row id once per render', () => {
    const getRowId = vi.fn((row: (typeof selectable.rows)[number]) => row.id);
    render(<Table {...selectable} getRowId={getRowId} />);
    expect(getRowId).toHaveBeenCalledTimes(selectable.rows.length);
  });

  it('reports the header checkbox as mixed on a partial selection', () => {
    render(<Table {...selectable} selected={new Set(['a'])} />);
    expect(screen.getByRole('checkbox', { name: /select all/i })).toBePartiallyChecked();
  });

  it('adds a row to the selection when its checkbox is activated', async () => {
    const onSelectionChange = vi.fn();
    render(<Table {...selectable} onSelectionChange={onSelectionChange} />);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select row 1' }));
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(['a']));
  });

  it('takes the id from getRowId and from nowhere else', async () => {
    // The shared fixture's ids are 'a' and 'b' at positions 0 and 1, so a
    // reversed fixture would still pass if the row position were used. A
    // getRowId that returns something derivable from neither the position
    // nor the row's own id field is what actually pins the contract.
    const onSelectionChange = vi.fn();
    render(
      <Table
        {...selectable}
        getRowId={(r) => `row:${r.id}`}
        onSelectionChange={onSelectionChange}
      />,
    );
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select row 1' }));
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(['row:a']));
  });

  it('keeps ids the caller holds for rows this table is not showing', async () => {
    // toggleRow already preserved them; toggleAll now does too, so the two
    // handlers agree about the same state.
    const onSelectionChange = vi.fn();
    render(
      <Table
        {...selectable}
        selected={new Set(['off-page'])}
        onSelectionChange={onSelectionChange}
      />,
    );
    await userEvent.click(screen.getByRole('checkbox', { name: /select all/i }));
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(['off-page', 'a', 'b']));
  });

  it('removes a row that was already selected', async () => {
    const onSelectionChange = vi.fn();
    render(
      <Table {...selectable} selected={new Set(['a', 'b'])} onSelectionChange={onSelectionChange} />,
    );
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select row 1' }));
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(['b']));
  });

  it('selects every row from the header', async () => {
    const onSelectionChange = vi.fn();
    render(<Table {...selectable} onSelectionChange={onSelectionChange} />);
    await userEvent.click(screen.getByRole('checkbox', { name: /select all/i }));
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(['a', 'b']));
  });

  it('clears the selection from the header when everything is selected', async () => {
    const onSelectionChange = vi.fn();
    render(
      <Table {...selectable} selected={new Set(['a', 'b'])} onSelectionChange={onSelectionChange} />,
    );
    await userEvent.click(screen.getByRole('checkbox', { name: /select all/i }));
    expect(onSelectionChange).toHaveBeenCalledWith(new Set());
  });

  it('marks the row for styling without claiming invalid ARIA', () => {
    // aria-selected is only valid under role="grid". On a plain table it is
    // invalid ARIA that reads as correct, so the checkbox carries the state
    // and the styling hangs off a data attribute.
    const { container } = render(<Table {...selectable} selected={new Set(['a'])} />);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows[0]).toHaveAttribute('data-selected', 'true');
    expect(rows[0]).not.toHaveAttribute('aria-selected');
    expect(rows[1]).not.toHaveAttribute('data-selected');
  });

  it('spans the selection column too in the empty state', () => {
    render(<Table {...selectable} rows={[]} />);
    expect(screen.getByText('No rows').closest('td')).toHaveAttribute('colspan', '3');
  });

  it('disables the select-all checkbox while loading', () => {
    // Prevents writing a stale Set when keepPreviousData shows old rows
    // that are no longer rendered. The keepPreviousData pattern is common.
    render(<Table {...selectable} loading />);
    const selectAll = screen.getByRole('checkbox', { name: /select all/i });
    expect(selectAll).toBeDisabled();
  });
});

describe('Table row action', () => {
  it('renders the action in a trailing column of its own', () => {
    const { container } = render(
      <Table {...base} rowAction={(r) => <button type="button">Edit {r.name}</button>} />,
    );
    expect(screen.getByRole('button', { name: 'Edit Lisa Roberts' })).toBeInTheDocument();
    const rows = container.querySelectorAll('tbody tr');
    const firstRowCells = rows[0]!.querySelectorAll('td');
    const lastCell = firstRowCells[firstRowCells.length - 1]!;
    expect(lastCell).toContainElement(screen.getByRole('button', { name: 'Edit Lisa Roberts' }));
  });

  it('gives the trailing header no visible label but keeps it announced', () => {
    // An unlabelled column header leaves the cells belonging to nothing.
    render(<Table {...base} rowAction={() => <button type="button">Edit</button>} />);
    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(3);
    expect(headers[2]).toHaveTextContent('Actions');
  });

  it('counts the action column in the empty state span', () => {
    render(<Table {...base} rows={[]} rowAction={() => null} />);
    expect(screen.getByText('No rows').closest('td')).toHaveAttribute('colspan', '3');
  });

  it('counts both extra columns when selection and an action are on together', () => {
    // The two are asserted one at a time above, and each alone gives 3, so
    // an implementation that counted either instead of both would pass those
    // and fail here.
    render(
      <Table
        {...base}
        rows={[]}
        onSelectionChange={() => {}}
        rowAction={() => null}
      />,
    );
    expect(screen.getByText('No rows').closest('td')).toHaveAttribute('colspan', '4');
  });
});

describe('Table loading', () => {
  it('reports itself busy', () => {
    const { container } = render(<Table {...base} loading />);
    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true');
  });

  it('keeps the headers so the layout does not jump when rows arrive', () => {
    render(<Table {...base} loading />);
    expect(screen.getAllByRole('columnheader')).toHaveLength(2);
  });

  it('replaces the body rather than dimming the rows', () => {
    // A table that dims stale rows while fetching is a different component
    // with a different contract.
    render(<Table {...base} loading />);
    expect(screen.queryByText('Lisa Roberts')).toBeNull();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('is not busy when it is not loading', () => {
    const { container } = render(<Table {...base} />);
    expect(container.firstElementChild).not.toHaveAttribute('aria-busy');
  });
});

describe('Table columns giving way', () => {
  const rules = (container: HTMLElement) => container.querySelector('style')!.textContent!;

  it('marks the primary column, and only the first one', () => {
    // Several primaries is a caller mistake that still has to render.
    const many: Column<Row>[] = [
      { key: 'name', header: 'Name', cell: (r) => r.name, primary: true },
      { key: 'seen', header: 'Last seen', cell: (r) => r.seen, primary: true },
    ];
    const { container } = render(<Table {...base} columns={many} />);
    expect(container.querySelectorAll('td[data-primary="true"]')).toHaveLength(2);
    expect(container.querySelectorAll('th[data-primary="true"]')).toHaveLength(1);
  });

  it('marks no column primary when none is declared', () => {
    const { container } = render(
      <Table {...base} columns={[{ key: 'seen', header: 'Last seen', cell: (r) => r.seen }]} />,
    );
    expect(container.querySelectorAll('[data-primary="true"]')).toHaveLength(0);
  });

  it('names a column’s header and every one of its cells with its key', () => {
    const { container } = render(<Table {...base} />);
    expect(container.querySelectorAll('[data-col="seen"]')).toHaveLength(3); // header + 2
    expect(container.querySelector('th[data-col="seen"]')).toHaveTextContent('Last seen');
  });

  it('writes its rules in place, as the root’s first child, for its own container', () => {
    const { container } = render(<Table {...base} />);
    const root = container.firstElementChild!;
    expect(root.firstElementChild!.tagName).toBe('STYLE');
    const scope = root.getAttribute('data-table')!;
    expect(scope).not.toBe('');
    expect(rules(container)).toContain(`[data-table="${scope}"] [data-col="seen"] { display: none; }`);
  });

  it('scopes its rules to itself, so two Tables do not touch each other', () => {
    const { container } = render(
      <>
        <Table {...base} caption="One" />
        <Table {...base} caption="Two" />
      </>,
    );
    const [one, two] = [...container.querySelectorAll('[data-table]')];
    const [a, b] = [one!.getAttribute('data-table'), two!.getAttribute('data-table')];
    expect(a).not.toBe(b);
    expect(one!.querySelector('style')!.textContent).not.toContain(`"${b}"`);
  });

  it('raises the sorted column: its rules change with the sort', () => {
    const three: Column<Row>[] = [
      { key: 'name', header: 'Name', cell: (r) => r.name, primary: true },
      { key: 'seen', header: 'Last seen', cell: (r) => r.seen },
      { key: 'id', header: 'Id', cell: (r) => r.id },
    ];
    const { container, rerender } = render(<Table {...base} columns={three} />);
    const unsorted = rules(container);
    rerender(<Table {...base} columns={three} sort={{ key: 'id', direction: 'asc' }} onSortChange={() => {}} />);
    const sorted = rules(container);
    // Unsorted, id leaves first (the widest step); sorted by id, seen does.
    expect(unsorted.indexOf('[data-col="id"] { display: none; }')).toBeLessThan(unsorted.indexOf('[data-col="seen"] { display: none; }'));
    expect(sorted.indexOf('[data-col="seen"] { display: none; }')).toBeLessThan(sorted.indexOf('[data-col="id"] { display: none; }'));
  });

  it('never hides the primary, and gives the selection, empty and loading cells no data-col, so no rule can reach them', () => {
    const { container } = render(<Table {...base} onSelectionChange={() => {}} />);
    expect(container.querySelector('td[data-primary="true"]')).toHaveAttribute('data-col', 'name');
    expect(rules(container)).not.toContain('[data-col="name"] { display: none; }');
    expect(container.querySelector(`td.${styles.selectCell}`)).not.toHaveAttribute('data-col');

    const empty = render(<Table {...base} rows={[]} />);
    expect(empty.container.querySelector(`td.${styles.empty}`)).not.toHaveAttribute('data-col');
    const loading = render(<Table {...base} loading />);
    expect(loading.container.querySelector(`td.${styles.loadingCell}`)).not.toHaveAttribute('data-col');
  });

  it('arrives in the server’s HTML: nothing runs after load to add it', () => {
    const html = renderToString(<Table {...base} />);
    // React writes a style's text raw, unescaped (checked 2026-09-24), so the CSS is as generated.
    expect(html).toMatch(/<style>[^<]*@container \(width < \d+px\)/);
    expect(html).toContain('data-table=');
  });

  it('lays the table out fixed, and no longer collapses it to a list', () => {
    const css = readCss('src/components/Table/Table.module.css');
    expect(block(css, '.table {')).toMatch(/table-layout:\s*fixed/);
    expect(css).not.toMatch(/@container/);
    expect(css).not.toContain('40rem');
  });

  it('wraps a cell’s text by default and truncates a column that asks', () => {
    const { container } = render(
      <Table {...base} columns={[columns[0]!, { ...columns[1]!, truncate: true }]} />,
    );
    expect(container.querySelector('td[data-col="seen"]')).toHaveClass(styles.truncate!);
    expect(container.querySelector('td[data-col="name"]')).not.toHaveClass(styles.truncate!);
    const css = readCss('src/components/Table/Table.module.css');
    expect(block(css, '.truncate {')).toMatch(/text-overflow:\s*ellipsis/);
    expect(block(css, '.td {')).toMatch(/overflow-wrap:\s*anywhere/);
  });
});

describe('Table dense: a bounded region, the selection bar and the footer', () => {
  const css = () => readFileSync('src/components/Table/Table.module.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

  it('keeps the density class and aria-busy on the root, and the role and name on the region inside it', () => {
    const { container } = render(<Table {...base} density="compact" loading className="mine" />);
    const root = container.firstElementChild!;
    expect(root).toHaveClass(styles.root!, styles.compact!, 'mine');
    expect(root).toHaveAttribute('aria-busy', 'true');
    const region = screen.getByRole('region', { name: 'Clients' });
    expect(root.contains(region)).toBe(true);
    expect(region).not.toBe(root);
  });

  it('bounds the region and pins the header when asked', () => {
    render(<Table {...base} stickyHeader maxHeight={320} />);
    const region = screen.getByRole('region') as HTMLElement;
    expect(region).toHaveClass(styles.bounded!);
    expect(region.style.getPropertyValue('--table-max-height')).toBe('320px');
    expect(region.querySelector('thead')).toHaveClass(styles.sticky!);
  });

  it('takes a CSS length for the height and pins nothing unless asked', () => {
    render(<Table {...base} maxHeight="50vh" />);
    const region = screen.getByRole('region') as HTMLElement;
    expect(region.style.getPropertyValue('--table-max-height')).toBe('50vh');
    expect(region.querySelector('thead')).not.toHaveClass(styles.sticky!);
  });

  it('shows the selection bar only with bulkActions and a selection', () => {
    const { rerender } = render(<Table {...base} selected={new Set(['a'])} onSelectionChange={() => {}} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    rerender(<Table {...base} selected={new Set()} onSelectionChange={() => {}} bulkActions={<button type="button">Export</button>} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    rerender(<Table {...base} selected={new Set(['a', 'b'])} onSelectionChange={() => {}} bulkActions={<button type="button">Export</button>} />);
    expect(screen.getByRole('status')).toHaveTextContent('2 selected');
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear selection' })).toBeInTheDocument();
  });

  it('hands the slot the selection and a way to clear it, and clears from its own button', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Table
        {...base}
        selected={new Set(['a'])}
        onSelectionChange={onChange}
        bulkActions={({ selected, clear }) => (
          <button type="button" onClick={clear}>
            Archive {selected.size}
          </button>
        )}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Archive 1' }));
    expect(onChange).toHaveBeenLastCalledWith(new Set());
    await user.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith(new Set());
  });

  it('names the bar and its count in the caller’s words', () => {
    render(
      <Table
        {...base}
        selected={new Set(['a'])}
        onSelectionChange={() => {}}
        bulkActions={<span>x</span>}
        bulkLabel={(n) => `${n} selecionados`}
        clearSelectionLabel="Limpar"
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('1 selecionados');
    expect(screen.getByRole('button', { name: 'Limpar' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: '1 selecionados' })).toBeInTheDocument();
  });

  it('gives the region room at its foot while the bar is shown, so the last row can scroll out from under it', () => {
    const { container, rerender } = render(<Table {...base} selected={new Set(['a'])} onSelectionChange={() => {}} bulkActions={<span>x</span>} />);
    expect(container.firstElementChild).toHaveClass(styles.withBar!);
    rerender(<Table {...base} selected={new Set()} onSelectionChange={() => {}} bulkActions={<span>x</span>} />);
    expect(container.firstElementChild).not.toHaveClass(styles.withBar!);
    const sheet = css();
    expect(sheet).toMatch(/\.withBar \{[^}]*--table-foot-room:/);
    expect(sheet).toMatch(/\.region \{[^}]*padding-block-end: var\(--table-foot-room, 0\)/);
  });

  it('renders the footer under the frame, outside the region', () => {
    render(<Table {...base} footer={<nav aria-label="Pages">pages</nav>} />);
    const footer = screen.getByRole('navigation', { name: 'Pages' });
    expect(screen.getByRole('region').contains(footer)).toBe(false);
    expect(footer.parentElement).toHaveClass(styles.footer!);
  });

  it('pins the header with a shadow for its line, since a collapsed border scrolls away', () => {
    const sheet = css();
    const sticky = sheet.slice(sheet.indexOf('.sticky .th {'));
    expect(sticky).toContain('position: sticky');
    expect(sticky).toContain('box-shadow: inset 0 calc(var(--ap-border-width-hairline) * -1)');
    expect(sheet).toMatch(/\.bounded \{[^}]*max-block-size: var\(--table-max-height\)/);
  });

  it('docks the bar to the foot of the viewport inside the root, and floats it as a panel', () => {
    const sheet = css();
    expect(sheet).toMatch(/\.dock \{[^}]*position: sticky/);
    expect(sheet).toMatch(/\.dock \{[^}]*bottom:/);
    expect(sheet).toMatch(/\.bar \{[^}]*var\(--ap-color-surface-overlay\)/);
    expect(sheet).toMatch(/\.bar \{[^}]*var\(--ap-elevation-lg\)/);
  });

  it('stripes a selected row at its start, and the other way in RTL', () => {
    const sheet = css();
    expect(sheet).toMatch(/\.tr\[data-selected='true'\] \.td:first-child \{[^}]*inset 3px 0 0 var\(--ap-color-interactive-accent\)/);
    expect(sheet).toMatch(/\.tr\[data-selected='true'\]:dir\(rtl\) \.td:first-child \{[^}]*inset -3px 0 0/);
  });
});

describe('current row', () => {
  const props = { caption: 'People', columns, rows, getRowId: (r: (typeof rows)[number]) => r.id };

  it('draws no button without onCurrentChange', () => {
    render(<Table {...props} />);
    expect(within(screen.getAllByRole('row')[1]!).queryByRole('button')).toBeNull();
  });

  it('wraps the primary cell in a plain button that reports the row', async () => {
    const onCurrentChange = vi.fn();
    render(<Table {...props} onCurrentChange={onCurrentChange} />);
    const button = screen.getByRole('button', { name: rows[1]!.name });
    expect(button).toHaveAttribute('type', 'button');
    await userEvent.click(button);
    expect(onCurrentChange).toHaveBeenCalledWith(rows[1]!.id);
  });

  it('marks the current row for the eye and for a screen reader', () => {
    render(<Table {...props} onCurrentChange={() => {}} currentId={rows[0]!.id} />);
    expect(screen.getByRole('button', { name: rows[0]!.name })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: rows[1]!.name })).not.toHaveAttribute('aria-current');
    expect(screen.getAllByRole('row')[1]).toHaveAttribute('data-current', 'true');
  });

  it('keeps the checkbox its own press', async () => {
    const onCurrentChange = vi.fn();
    render(<Table {...props} onCurrentChange={onCurrentChange} selected={new Set()} onSelectionChange={() => {}} />);
    await userEvent.click(screen.getAllByRole('checkbox')[1]!);
    expect(onCurrentChange).not.toHaveBeenCalled();
  });

  it('makes the whole width of the primary cell the button’s target, not only its words', () => {
    // `all: unset` leaves the button inline, a box as wide as the name and a
    // line tall. A block alone is not enough: a button shrinks to its content
    // even as a block, so it is given the cell's width too. The look stays unset.
    const rule = block(readCss('src/components/Table/Table.module.css'), '.current {');
    expect(rule).toMatch(/all:\s*unset;[\s\S]*display:\s*block;/);
    expect(rule).toMatch(/all:\s*unset;[\s\S]*inline-size:\s*100%;/);
  });

  it('draws current as a ring, not the selection fill, so a row can be both', () => {
    const css = readCss('src/components/Table/Table.module.css');
    const rule = block(css, ".tr[data-current='true'] {");
    expect(rule).toContain('outline');
    expect(rule).toContain('var(--ap-border-width-ring)');
    expect(rule).toContain('var(--ap-color-border-accent)');
    expect(rule).not.toContain('interactive-selected');
  });

  it('draws the ring on the row, not a per-cell first/last-child shadow, so RTL cannot lose a side', () => {
    // Physical left/right insets on :first-child/:last-child broke two ways:
    // wrong edge under :dir(rtl), and no match at all. An outline on the row
    // itself has neither failure mode, so no rule naming these selectors for
    // the current row should come back.
    const css = readCss('src/components/Table/Table.module.css');
    expect(css).not.toMatch(/\.tr\[data-current='true'\]\s*\.td/);
  });

  it('passes axe with a current and a selected row', async () => {
    const { container } = render(
      <Table {...props} onCurrentChange={() => {}} currentId={rows[0]!.id} selected={new Set([rows[0]!.id])} onSelectionChange={() => {}} />,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe('Table row actions', () => {
  const Pencil = () => <svg data-testid="edit-glyph" />;
  const Bin = () => <svg />;
  const edit = vi.fn();
  const actions = (r: Row) => [
    { id: 'edit', label: 'Edit', icon: <Pencil />, onSelect: () => edit(r.id) },
    { id: 'delete', label: 'Delete', icon: <Bin />, tone: 'danger' as const },
    { id: 'archive', label: 'Archive' },
  ];
  const inline = (row: number) => document.querySelectorAll('tbody tr')[row]!.querySelector('[data-actions="inline"]') as HTMLElement;
  const rules = () => document.querySelector('[data-table] > style')!.textContent!;

  it('shows the first two with an icon as buttons named by their label, and the rest in "⋯"', () => {
    render(<Table {...base} rowActions={actions} rowActionsLabel={(r) => `More actions for ${r.name}`} />);
    expect(within(inline(0)).getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(within(inline(0)).getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(within(inline(0)).getByRole('button', { name: 'More actions for Lisa Roberts' })).toHaveAttribute('aria-haspopup', 'menu');
    expect(within(inline(0)).queryByRole('button', { name: 'Archive' })).toBeNull();
  });

  it('keeps an action without an icon out of the row however many are inline', () => {
    render(<Table {...base} rowActions={actions} rowActionsInline={3} />);
    expect(within(inline(0)).getAllByRole('button')).toHaveLength(3); // Edit, Delete, "⋯"
  });

  it('calls the action from its button', async () => {
    render(<Table {...base} rowActions={actions} />);
    await userEvent.click(within(inline(1)).getByRole('button', { name: 'Edit' }));
    expect(edit).toHaveBeenCalledWith('b');
  });

  it('draws no "⋯" when every action fits inline, and names it "More actions" when not told', () => {
    render(<Table {...base} rowActions={(r) => actions(r).slice(0, 2)} />);
    expect(within(inline(0)).queryByRole('button', { name: 'More actions' })).toBeNull();
    const gathered = document.querySelector('tbody tr [data-actions="gathered"]') as HTMLElement;
    expect(within(gathered).getByRole('button', { name: 'More actions', hidden: true })).toBeInTheDocument();
  });

  it('gathers every action into one "⋯", hidden until the Table is narrow', () => {
    render(<Table {...base} rowActions={actions} />);
    expect(document.querySelectorAll('tbody [data-actions="gathered"]')).toHaveLength(2);
    expect(rules()).toMatch(/\[data-actions="gathered"\] \{ display: none; \}/);
    expect(rules()).toMatch(/@container \(width < \d+px\) \{\n[^}]*\[data-actions="inline"\] \{ display: none; \}/);
  });

  it('counts the most buttons any row shows for the column’s width, and at least one', () => {
    render(<Table {...base} rowActions={actions} />);
    expect(rules()).toContain('th[data-actions="column"] { width: 160px; }'); // Edit, Delete, "⋯"
  });

  it('gives an empty Table’s action column one button, and leaves a row with no actions empty', () => {
    const { container, rerender } = render(<Table {...base} rows={[]} rowActions={actions} />);
    expect(container.querySelector('style')!.textContent).toContain('th[data-actions="column"] { width: 72px; }');
    rerender(<Table {...base} rowActions={() => []} />);
    const cell = container.querySelector('tbody tr')!.lastElementChild!;
    expect(cell).toBeEmptyDOMElement();
  });

  it('takes rowAction or rowActions, not both', () => {
    // @ts-expect-error — one action column, filled one way
    render(<Table {...base} rowAction={() => null} rowActions={() => []} />);
  });
});
