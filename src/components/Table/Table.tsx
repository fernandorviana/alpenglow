import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { isValidElement, useId } from 'react';
import { Button } from '../Button/Button';
import { Checkbox } from '../Checkbox/Checkbox';
import { Loader } from '../Loader/Loader';
import { BulkBar } from './BulkBar';
import { columnCss } from './columns';
import type { DropdownMenuAction } from '../DropdownMenu/rows';
import { RowActions, inlineButtonCount } from './RowActions';
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
  /**
   * Fixed, in px: the column keeps this width and leaves whole. Left out, the
   * column is flexible and shares what the fixed ones leave, in proportion
   * to its minimum.
   */
  width?: number;
  /** A flexible column's narrowest, padding included, before it leaves. Defaults to 96; 160 for the primary. */
  minWidth?: number;
  /** 1 is the most important. Left out, source order: the last column leaves first. */
  priority?: number;
  /** One line with an ellipsis instead of wrapping, for a dense column of names or types. */
  truncate?: boolean;
  /** Never leaves, and names the row. First one in source order wins. */
  primary?: boolean;
};

export type TableBaseProps<Row> = {
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
   * "Clear selection", on one row. Only with `onSelectionChange`. A list of
   * menu actions is drawn as a row's: those with an icon as buttons while
   * the bar has room, the rest in "⋯", and all of them in one "⋯" when it
   * has not; a checkable one (`checked`) is a Switch while it fits and a
   * checkbox row in "⋯" when it does not. Nodes are the caller's and cannot
   * gather: they scroll sideways inside their slot rather than wrap.
   */
  bulkActions?: BulkActions | ((api: BulkActionsApi) => BulkActions);
  /** With a list: how many actions with an icon show as buttons while there is room. Defaults to 5, as drawn. */
  bulkActionsInline?: number;
  /** With a list: the bar's "⋯" button's name. Defaults to "More actions". */
  bulkActionsLabel?: string;
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
};

/** One action column, filled one way: actions for a menu, or a render prop for what a menu cannot hold. */
type RowActionProps<Row> =
  | {
      /** The trailing action column as a render prop: counted as one 40 button wide. */
      rowAction?: (row: Row) => ReactNode;
      rowActions?: never;
      rowActionsInline?: never;
      rowActionsLabel?: never;
    }
  | {
      rowAction?: never;
      /** The row's actions: the first `rowActionsInline` with an icon as buttons, the rest in "⋯". */
      rowActions?: (row: Row) => DropdownMenuAction[];
      /** How many actions with an icon show as buttons while there is room. Defaults to 2. */
      rowActionsInline?: number;
      /** The "⋯" button's name. Defaults to "More actions". */
      rowActionsLabel?: (row: Row) => string;
    };

export type TableProps<Row> = TableBaseProps<Row> & RowActionProps<Row> & Omit<HTMLAttributes<HTMLDivElement>, 'children'>;

export type BulkActionsApi = { selected: ReadonlySet<string>; clear: () => void };

/** What the selection bar holds: a menu's actions, which gather into "⋯", or the caller's own nodes. */
export type BulkActions = DropdownMenuAction[] | ReactNode;

/**
 * A list of menu actions rather than nodes: an array of plain objects, each
 * with an id. React renders no plain object, so a node is never one, and an
 * empty list is nothing either way.
 */
function isActions(value: unknown): value is DropdownMenuAction[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === 'object' && item !== null && !Array.isArray(item) && !isValidElement(item) && 'id' in item)
  );
}

/**
 * A real table, named, with scoped headers and fixed-layout columns that
 * give way by rank as the Table's own width shrinks, plus controlled
 * sorting, selection, and row actions. The component sorts, selects and
 * actions nothing itself: it reports intent and renders what it is given.
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
  rowActions,
  rowActionsInline = 2,
  rowActionsLabel,
  loading,
  stickyHeader = false,
  maxHeight,
  bulkActions,
  bulkActionsInline = 5,
  bulkActionsLabel = 'More actions',
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
  // Asked for once a render: the buttons the rows show set the action
  // column's width, and the cells draw the same lists.
  const actionsOf = rowActions ? rows.map((row) => rowActions(row)) : undefined;
  const hasActions = action !== undefined || actionsOf !== undefined;
  // A spread over every row's count would hand Math.max one argument per
  // row, which a long enough table can push past the engine's argument
  // limit; reduce has no such ceiling.
  const inlineButtons = actionsOf
    ? actionsOf.reduce((most, list) => Math.max(most, inlineButtonCount(list, rowActionsInline)), 1)
    : action ? 1 : 0;
  const gatheredButtons = hasActions ? 1 : 0;
  const columnCount = columns.length + (onSelect ? 1 : 0) + (hasActions ? 1 : 0);

  // First in source order wins. Zero is the common case for a table with no
  // column that must be kept from leaving, so it is not an error.
  const primaryKey = columns.find((column) => column.primary)?.key;

  // The bar only with a selection and someone to act on it. Clear is the
  // bar's own: the Table owns the selection, so emptying it is not a thing
  // every caller should write.
  const clear = onSelect ? () => onSelect(new Set()) : undefined;
  const bar = clear && bulkActions !== undefined && selectedIds.size > 0 ? bulkLabel(selectedIds.size) : undefined;
  // Asked once a render, while the bar is shown.
  const given = bar && clear ? (typeof bulkActions === 'function' ? bulkActions({ selected: selectedIds, clear }) : bulkActions) : undefined;
  const bulkList = isActions(given) ? given : undefined;

  // One scope per Table, so its rules touch no other Table on the page.
  const scope = useId();
  const css = columnCss(scope, {
    columns,
    primaryKey,
    sortKey: sort?.key,
    selection: onSelect !== undefined,
    inlineButtons,
    gatheredButtons,
  });

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
      className={[styles.root, styles[density ?? 'auto'], bar && styles.withBar, className].filter(Boolean).join(' ')}
      aria-busy={loading || undefined}
      data-table={scope}
    >
      {/* In place, not hoisted with href and precedence: React never removes
          a hoisted sheet, so an earlier sort's rules would stay and keep
          hiding. Here it changes with the Table and leaves with it. */}
      <style>{css}</style>
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
                  data-col={column.key}
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
                      {/* Truncates on its own so the mark beside it, fixed
                          width, is never what gives way. */}
                      <span className={styles.sortLabel}>{column.header}</span>
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
            {hasActions && (
              <th scope="col" className={`${styles.th} ${styles.actionCell}`} data-actions="column">
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
                      className={[styles.td, column.truncate && styles.truncate].filter(Boolean).join(' ')}
                      data-col={column.key}
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
                  {hasActions && (
                    <td className={`${styles.td} ${styles.actionCell}`}>
                      {actionsOf ? (
                        <RowActions
                          actions={actionsOf[index]!}
                          inline={rowActionsInline}
                          label={rowActionsLabel?.(row) ?? 'More actions'}
                          gather={inlineButtons > gatheredButtons}
                        />
                      ) : (
                        action?.(row)
                      )}
                    </td>
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
        <BulkBar
          scope={scope}
          label={bar}
          actions={bulkList}
          nodes={isActions(given) ? undefined : given}
          inline={bulkActionsInline}
          moreLabel={bulkActionsLabel}
          clearLabel={clearSelectionLabel}
          onClear={clear}
        />
      )}
      {footer !== undefined && <div className={styles.footer}>{footer}</div>}
    </div>
  );
}
