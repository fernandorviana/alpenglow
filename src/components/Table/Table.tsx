import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Table.module.css';

export type SortDirection = 'asc' | 'desc';
export type Sort = { key: string; direction: SortDirection };
export type ColumnAlign = 'start' | 'center' | 'end';
export type TableDensity = 'comfortable' | 'compact';

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
  empty = 'No rows',
  className,
  ...rest
}: TableProps<Row>) {
  return (
    <div
      {...rest}
      className={[styles.wrap, className].filter(Boolean).join(' ')}
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
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={styles.th}
                data-align={column.align ?? 'start'}
              >
                {column.header}
              </th>
            ))}
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
