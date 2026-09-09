import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { Table } from './Table';
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

  it('shows the caption when asked', () => {
    render(<Table {...base} captionVisible />);
    expect(screen.getByText('Clients')).not.toHaveClass('ap-sr-only');
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
