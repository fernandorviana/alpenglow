import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { Button } from '../Button/Button';
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
  /** Left out, the row follows `data-density`; `comfortable` or `compact` fixes it. */
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
  /**
   * Pins the header while the region scrolls. The region scrolls vertically
   * only with `maxHeight`: sticky is held by the nearest scrolling ancestor,
   * and the frame already scrolls sideways, so a header cannot stick to the
   * page.
   */
  stickyHeader?: boolean;
  /** A length; the region scrolls vertically past it. */
  maxHeight?: number | string;
  /**
   * With a selection, a bar floats at the foot with the count, this, and
   * "Clear selection". Only with `onSelectionChange`.
   */
  bulkActions?: ReactNode | ((api: BulkActionsApi) => ReactNode);
  /** The count in words. */
  bulkLabel?: (count: number) => string;
  clearSelectionLabel?: string;
  /** Under the frame: a Pagination. */
  footer?: ReactNode;
  /**
   * The row being looked at, as opposed to the rows chosen by checkbox. Its
   * primary cell's button carries `aria-current`; the row is drawn with the
   * Scheduler's ring for its selected card.
   */
  currentId?: string | null;
  /**
   * Makes the primary cell a button that reports its row. The primary cell's
   * content must then be plain — text, an Avatar — and hold nothing
   * interactive of its own, or a button would sit inside a button.
   */
  onCurrentChange?: (id: string) => void;
} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>;

export type BulkActionsApi = { selected: ReadonlySet<string>; clear: () => void };

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
  density,
  empty = 'No rows',
  sort,
  onSortChange,
  selected,
  onSelectionChange,
  selectionLabel,
  rowAction,
  loading,
  stickyHeader = false,
  maxHeight,
  bulkActions,
  bulkLabel = (count) => `${count} selected`,
  clearSelectionLabel = 'Clear selection',
  footer,
  currentId,
  onCurrentChange,
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

  // First in source order wins. Zero is the common case for a table nobody
  // expects to collapse, so it is not an error.
  const primaryKey = columns.find((column) => column.primary)?.key;

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

  // The bar only with a selection and someone to act on it. Clear is the
  // bar's own: the Table owns the selection, so emptying it is not a thing
  // every caller should write.
  const clear = onSelect ? () => onSelect(new Set()) : undefined;
  const bar = clear && bulkActions !== undefined && selectedIds.size > 0 ? bulkLabel(selectedIds.size) : undefined;

  return (
    <div
      {...rest}
      className={[styles.root, styles[density ?? 'auto'], bar && styles.withBar, className].filter(Boolean).join(' ')}
      aria-busy={loading || undefined}
    >
      <div className={styles.frame}>
      <div
        className={[styles.region, maxHeight !== undefined && styles.bounded].filter(Boolean).join(' ')}
        role="region"
        aria-label={caption}
        tabIndex={0}
        style={
          maxHeight === undefined
            ? undefined
            : ({ '--table-max-height': typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight } as CSSProperties)
        }
      >
      <table className={styles.table}>
        <caption className={captionVisible ? styles.caption : 'ap-sr-only'}>
          {caption}
        </caption>

        <colgroup>
          {onSelect && <col style={{ width: '56px' }} />}
          {columns.map((column) => (
            <col key={column.key} style={column.width ? { width: column.width } : undefined} />
          ))}
        </colgroup>

        <thead className={[styles.thead, stickyHeader && styles.sticky].filter(Boolean).join(' ')}>
          <tr>
            {toggleAll && (
              <th scope="col" className={`${styles.th} ${styles.selectCell}`}>
                {/* Disabled while loading because it writes a Set derived from rows
                    that may be stale (the common keepPreviousData pattern). Sorting
                    stays live because it only reports intent. */}
                <Checkbox
                  aria-label="Select all rows"
                  checked={head.checked}
                  indeterminate={head.indeterminate}
                  onChange={toggleAll}
                  disabled={loading}
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
                  data-primary={column.key === primaryKey ? 'true' : undefined}
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
              const id = ids[index]!;
              const isSelected = selectedIds.has(id);
              const isCurrent = currentId === id;

              return (
                <tr
                  key={id}
                  className={styles.tr}
                  data-selected={isSelected ? 'true' : undefined}
                  data-current={isCurrent ? 'true' : undefined}
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
                      data-primary={column.key === primaryKey ? 'true' : undefined}
                    >
                      {column.key === primaryKey && onCurrentChange ? (
                        <button
                          type="button"
                          className={styles.current}
                          aria-current={isCurrent ? 'true' : undefined}
                          onClick={() => onCurrentChange(id)}
                        >
                          {column.cell(row)}
                        </button>
                      ) : (
                        column.cell(row)
                      )}
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
      </div>
      {bar && clear && (
        <div className={styles.dock}>
          <div className={styles.bar} role="group" aria-label={bar}>
            <span className={styles.count} role="status">
              {bar}
            </span>
            <span className={styles.divider} aria-hidden="true" />
            <div className={styles.bulk}>
              {typeof bulkActions === 'function' ? bulkActions({ selected: selectedIds, clear }) : bulkActions}
            </div>
            <span className={styles.divider} aria-hidden="true" />
            <Button variant="outline" tone="neutral" size="sm" onClick={clear}>
              {clearSelectionLabel}
            </Button>
          </div>
        </div>
      )}
      {footer !== undefined && <div className={styles.footer}>{footer}</div>}
    </div>
  );
}
