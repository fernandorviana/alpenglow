import type { HTMLAttributes, ReactNode } from 'react';
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
} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>;

/**
 * Sorting and selection arrive in later tasks. What is here is the part that
 * has to be right before anything else matters: a real table, named, with
 * scoped headers and a column group.
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
  className,
  ...rest
}: TableProps<Row>) {
  return (
    <div
      {...rest}
      className={[styles.wrap, styles[density], className].filter(Boolean).join(' ')}
      role="region"
      aria-label={caption}
      tabIndex={0}
    >
      <table className={styles.table}>
        <caption className={captionVisible ? undefined : 'ap-sr-only'}>{caption}</caption>

        <colgroup>
          {columns.map((column) => (
            <col key={column.key} style={column.width ? { width: column.width } : undefined} />
          ))}
        </colgroup>

        <thead>
          <tr>
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
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr className={styles.tr}>
              <td className={`${styles.td} ${styles.empty}`} colSpan={columns.length}>
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={getRowId(row)} className={styles.tr}>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={styles.td}
                    data-align={column.align ?? 'start'}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
