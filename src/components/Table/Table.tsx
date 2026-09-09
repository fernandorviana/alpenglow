import type { HTMLAttributes, ReactNode } from 'react';
import { Checkbox } from '../Checkbox/Checkbox';
import { Loader } from '../Loader/Loader';
import styles from './Table.module.css';

export type SortDirection = 'asc' | 'desc';
export type Sort = { key: string; direction: SortDirection };
export type ColumnAlign = 'start' | 'center' | 'end';
export type TableDensity = 'comfortable' | 'compact';

/**
 * asc → desc → none.
 *
 * The drawing shows a caret but says nothing about the cycle. Three states
 * rather than two, because returning to the natural order is useful and a
 * two-state cycle gives the caller no way back.
 */
export function nextSort(current: Sort | null | undefined, key: string): Sort | null {
  if (!current || current.key !== key) return { key, direction: 'asc' };
  if (current.direction === 'asc') return { key, direction: 'desc' };
  return null;
}

/**
 * The header checkbox is derived, never passed in. The drawing shows the
 * mixed state; deriving it is what stops it being wrong.
 *
 * No rows means unchecked rather than vacuously checked — a checked box over
 * an empty table invites a select-all that does nothing.
 */
export function headerSelectionState(
  selectedCount: number,
  rowCount: number,
): { checked: boolean; indeterminate: boolean } {
  if (rowCount === 0 || selectedCount === 0) return { checked: false, indeterminate: false };
  if (selectedCount >= rowCount) return { checked: true, indeterminate: false };
  return { checked: false, indeterminate: true };
}

const ARIA_SORT = { asc: 'ascending', desc: 'descending' } as const;

export type Column<Row> = {
  /** Stable identifier, and the value reported as the sort key. */
  key: string;
  header: ReactNode;
  /** Whatever should appear in the cell. */
  cell: (row: Row) => ReactNode;
  /** Defaults to 'start'. Use 'end' for numbers. */
  align?: ColumnAlign;
  sortable?: boolean;
  /** Any CSS width. Applied via <col>, so it does not fight the cells. */
  width?: string;
  /** Survives the collapse to a list. First one in source order wins. */
  primary?: boolean;
};

export type TableProps<Row> = {
  /** Required. Rendered as a visually hidden <caption> unless captionVisible. */
  caption: string;
  captionVisible?: boolean;
  columns: Column<Row>[];
  rows: Row[];
  getRowId: (row: Row) => string;
  /** Shown in place of rows when `rows` is empty. Defaults to "No rows". */
  empty?: ReactNode;
  density?: TableDensity;
  sort?: Sort | null;
  onSortChange?: (next: Sort | null) => void;
  selected?: ReadonlySet<string>;
  onSelectionChange?: (next: Set<string>) => void;
  /** Accessible name for a row's checkbox. Defaults to `Select row {n}`. */
  selectionLabel?: (row: Row) => string;
  /** The trailing action column from the drawing. */
  rowAction?: (row: Row) => ReactNode;
  loading?: boolean;
} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>;

/**
 * A real table, named, with scoped headers and a column group, plus
 * controlled sorting, selection, and row actions. The component sorts, selects
 * and actions nothing itself: it reports intent and renders what it is given.
 *
 * Selection state lives in the checkboxes, not in `aria-selected` — that
 * attribute is only valid on rows under `role="grid"`, so on a plain table it
 * is invalid ARIA that reads as correct. Styling hangs off `data-selected`.
 *
 * When loading is true, the body is replaced with a single spanning cell
 * holding a Loader, and the header is kept so the layout does not jump.
 */
export function Table<Row>({
  caption,
  captionVisible = false,
  columns,
  rows,
  getRowId,
  density = 'comfortable',
  empty = 'No rows',
  sort,
  onSortChange,
  selected,
  onSelectionChange,
  selectionLabel,
  rowAction,
  loading,
  className,
  ...rest
}: TableProps<Row>) {
  // Aliased to a const so the compiler carries the narrowing into the two
  // closures below. The same reason the sort handler is bound this way: an
  // assertion at the call site would only be the author claiming what the
  // compiler can prove.
  const onSelect = onSelectionChange;
  const action = rowAction;
  const selectedIds = selected ?? new Set<string>();
  const ids = rows.map(getRowId);
  const head = headerSelectionState(
    ids.filter((id) => selectedIds.has(id)).length,
    ids.length,
  );
  const columnCount = columns.length + (onSelect ? 1 : 0) + (action ? 1 : 0);

  const toggleRow = onSelect
    ? (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        onSelect(next);
      }
    : undefined;

  // Scoped to the rows actually rendered, like toggleRow: ids the caller is
  // holding for rows this table is not showing survive a select-all. The
  // alternative throws away a filtered or paginated caller's other pages on
  // one click, and would make the two handlers disagree about the same state.
  const toggleAll = onSelect
    ? () => {
        const next = new Set(selectedIds);
        for (const id of ids) {
          if (head.checked) next.delete(id);
          else next.add(id);
        }
        onSelect(next);
      }
    : undefined;

  return (
    <div
      {...rest}
      className={[styles.wrap, styles[density], className].filter(Boolean).join(' ')}
      role="region"
      aria-label={caption}
      tabIndex={0}
      aria-busy={loading || undefined}
    >
      <table className={styles.table}>
        <caption className={captionVisible ? undefined : 'ap-sr-only'}>{caption}</caption>

        <colgroup>
          {onSelect && <col style={{ width: '56px' }} />}
          {columns.map((column) => (
            <col key={column.key} style={column.width ? { width: column.width } : undefined} />
          ))}
        </colgroup>

        <thead>
          <tr>
            {toggleAll && (
              <th scope="col" className={`${styles.th} ${styles.selectCell}`}>
                <Checkbox
                  aria-label="Select all rows"
                  checked={head.checked}
                  indeterminate={head.indeterminate}
                  onChange={toggleAll}
                />
              </th>
            )}
            {columns.map((column) => {
              // `sortable` without a handler degrades to plain text: a control
              // that reports to nobody is worse than no control. Binding the
              // handler to a const rather than to a boolean is what lets the
              // compiler carry that narrowing into the click closure, so the
              // call site needs no non-null assertion.
              const onSort = column.sortable ? onSortChange : undefined;
              const sorted = sort?.key === column.key ? sort : null;

              return (
                <th
                  key={column.key}
                  scope="col"
                  className={styles.th}
                  data-align={column.align ?? 'start'}
                  aria-sort={sorted ? ARIA_SORT[sorted.direction] : undefined}
                >
                  {onSort ? (
                    <button
                      type="button"
                      className={styles.sortButton}
                      onClick={() => onSort(nextSort(sort, column.key))}
                    >
                      {column.header}
                      <span
                        className={styles.sortMark}
                        aria-hidden="true"
                        data-direction={sorted?.direction ?? 'none'}
                      />
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
            {action && (
              <th scope="col" className={`${styles.th} ${styles.actionCell}`}>
                <span className="ap-sr-only">Actions</span>
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr className={styles.tr}>
              <td
                className={`${styles.td} ${styles.loadingCell}`}
                colSpan={columnCount}
              >
                <Loader label="Loading rows" />
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr className={styles.tr}>
              <td className={`${styles.td} ${styles.empty}`} colSpan={columnCount}>
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => {
              const id = getRowId(row);
              const isSelected = selectedIds.has(id);

              return (
                <tr
                  key={id}
                  className={styles.tr}
                  data-selected={isSelected ? 'true' : undefined}
                >
                  {toggleRow && (
                    <td className={`${styles.td} ${styles.selectCell}`}>
                      <Checkbox
                        aria-label={selectionLabel?.(row) ?? `Select row ${index + 1}`}
                        checked={isSelected}
                        onChange={() => toggleRow(id)}
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={styles.td}
                      data-align={column.align ?? 'start'}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                  {action && (
                    <td className={`${styles.td} ${styles.actionCell}`}>{action(row)}</td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
