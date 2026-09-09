import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import userEvent from '@testing-library/user-event';
import { Table, nextSort, headerSelectionState } from './Table';
import type { Column } from './Table';
import styles from './Table.module.css';

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

  it('renders one col per column so widths do not fight the cells', () => {
    const { container } = render(
      <Table {...base} columns={[{ ...columns[0]!, width: '20rem' }, columns[1]!]} />,
    );
    const cols = container.querySelectorAll('colgroup col');
    expect(cols).toHaveLength(2);
    // toHaveStyle resolves rem through getComputedStyle, which would test
    // jsdom's unit conversion rather than the component. The contract is that
    // the caller's value reaches the col untouched, so read it back raw.
    expect(cols[0]!.getAttribute('style')).toContain('20rem');
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
  it('is comfortable by default — the density that was drawn', () => {
    const { container } = render(<Table {...base} />);
    expect(container.firstElementChild).toHaveClass(styles.comfortable!);
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

  it('reports the header checkbox as mixed on a partial selection', () => {
    render(<Table {...selectable} selected={new Set(['a'])} />);
    expect(screen.getByRole('checkbox', { name: /select all/i })).toHaveAttribute(
      'aria-checked',
      'mixed',
    );
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

describe('Table collapse', () => {
  it('marks the primary column, and only the first one', () => {
    // The drawing's mobile variant keeps the primary cell and drops the
    // rest. Several primaries is a caller mistake that still has to render.
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
      <Table
        {...base}
        columns={[{ key: 'seen', header: 'Last seen', cell: (r) => r.seen }]}
      />,
    );
    expect(container.querySelectorAll('[data-primary="true"]')).toHaveLength(0);
  });

  it('collapses on the container width, not the viewport', () => {
    // A table in a narrow sidebar should collapse on a wide screen, and it
    // is the container's width that decides. jsdom does not evaluate
    // container queries, so the rule is asserted against the source.
    const css = readFileSync('src/components/Table/Table.module.css', 'utf8');
    expect(css).toMatch(/container-type:\s*inline-size/);
    expect(css).toMatch(/@container\s*\(\s*max-width:\s*40rem\s*\)/);
  });

  it('keeps the selection, action, empty and loading cells when it collapses', () => {
    // The drawing's mobile frame has no selection column, so "primary cell
    // and row action only" is a complete reading of it and an incomplete
    // rule: selection is a feature the caller opted into, and hiding the
    // checkbox here would remove it on a phone rather than lay it out
    // differently. Empty and loading are excluded because they are the only
    // content those states have. jsdom does not evaluate container queries,
    // so the selector is asserted against the source.
    const css = readFileSync('src/components/Table/Table.module.css', 'utf8');
    const hide = css.match(/\.td:not\(\[data-primary='true'\]\)([^{]*)/)?.[1] ?? '';

    expect(hide).toContain(':not(.selectCell)');
    expect(hide).toContain(':not(.actionCell)');
    expect(hide).toContain(':not(.empty)');
    expect(hide).toContain(':not(.loadingCell)');
  });
});
