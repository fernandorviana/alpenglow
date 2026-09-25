/**
 * Which of the Table's columns are shown at which width of the Table itself,
 * and how wide each one is. Pure: the Table writes what `columnCss` returns
 * into a `<style>` of its own, so nothing is measured, nothing waits for
 * JavaScript, and the rules arrive in the server's HTML.
 *
 * A column shrinks to its minimum, then leaves whole, the least important
 * first; the row's actions gather into "⋯" before any column leaves; the
 * primary, selection and action columns never do. Spec:
 * docs/superpowers/specs/2026-09-24-table-responsive-columns-design.md.
 */

/** `spacing/1100`: a column's minimum when it declares none. */
export const DEFAULT_MIN_WIDTH = 96;
/** `spacing/1300`: the primary column's, which carries the row's name. */
export const PRIMARY_MIN_WIDTH = 160;
/** The selection column as drawn; `.selectCell` in Table.module.css says it too. */
export const SELECTION_WIDTH = 56;
/** The frame's hairline, once on each side: the root is the container, the table sits inside the frame. */
export const FRAME_BORDER = 2;
/** An action button, the comfortable control. Compact's 32 is counted as 40, so compact has room to spare. */
export const ACTION_BUTTON = 40;
/** `spacing/050` between action buttons. */
export const ACTION_GAP = 4;
/** The action cell's inline padding at comfortable, `spacing/200` on each side. */
export const ACTION_PADDING = 32;
/** A button in the selection bar: `sm`, the size of the bar's own Clear. */
export const BULK_BUTTON = 32;

export type ColumnSizing = {
  key: string;
  /** Fixed: keeps this width in px and leaves whole. */
  width?: number;
  /** A flexible column's border box at its narrowest, in px. */
  minWidth?: number;
  /** 1 is the most important. */
  priority?: number;
};

export type ColumnLayout = {
  columns: readonly ColumnSizing[];
  /** Never leaves. */
  primaryKey?: string;
  /** Raised above every priority while sorted, so the column a reader ordered by stays. */
  sortKey?: string;
  selection: boolean;
  /** Buttons in the action cell while the actions are inline; 0 with no action column. */
  inlineButtons: number;
  /** Buttons once the actions gather into "⋯": 1, or 0 with no action column. */
  gatheredButtons: number;
};

export type Thresholds = {
  /** Below this container width the inline actions gather. Absent when there is nothing to gather. */
  gather?: number;
  /** The columns that can leave, least important first, each with the width below which it is hidden. */
  leave: { key: string; below: number }[];
  /** What never leaves, with the actions gathered. Below it the region scrolls sideways. */
  floor: number;
};

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

export function minimumOf(column: ColumnSizing, primaryKey?: string): number {
  return column.width ?? column.minWidth ?? (column.key === primaryKey ? PRIMARY_MIN_WIDTH : DEFAULT_MIN_WIDTH);
}

export function actionWidth(buttons: number): number {
  return buttons > 0 ? ACTION_PADDING + buttons * ACTION_BUTTON + (buttons - 1) * ACTION_GAP : 0;
}

/**
 * The columns that can leave, most important first: the sorted one, then
 * those with a priority, lowest first, then those without, in source order.
 * Ties keep source order.
 */
export function rankColumns(columns: readonly ColumnSizing[], primaryKey?: string, sortKey?: string): ColumnSizing[] {
  const order = (column: ColumnSizing, index: number) =>
    [column.key === sortKey ? 0 : 1, column.priority ?? Number.POSITIVE_INFINITY, index] as const;
  return columns
    .map((column, index) => ({ column, order: order(column, index) }))
    .filter(({ column }) => column.key !== primaryKey)
    // Infinity minus Infinity is NaN, which is falsy: two columns with no
    // priority fall through to their source order.
    .sort((a, b) => a.order[0] - b.order[0] || a.order[1] - b.order[1] || a.order[2] - b.order[2])
    .map(({ column }) => column);
}

/** Everything around the columns: the frame, the selection column, the action column. */
function extras(layout: ColumnLayout, buttons: number): number {
  return FRAME_BORDER + (layout.selection ? SELECTION_WIDTH : 0) + actionWidth(buttons);
}

/**
 * A set of columns fits when the container holds the extras, the fixed
 * widths and the flexible minimums. Each flexible column's share is in
 * proportion to its minimum (see `columnCss`), so the plain sum is enough.
 */
export function columnThresholds(layout: ColumnLayout): Thresholds {
  const { columns, primaryKey, sortKey, inlineButtons, gatheredButtons } = layout;
  const stay = columns.filter((column) => column.key === primaryKey);
  const floor = extras(layout, gatheredButtons) + sum(stay.map((column) => minimumOf(column, primaryKey)));
  let need = floor;
  const leave = rankColumns(columns, primaryKey, sortKey).map((column) => {
    need += minimumOf(column, primaryKey);
    return { key: column.key, below: need };
  });
  const gather =
    inlineButtons > gatheredButtons ? need - actionWidth(gatheredButtons) + actionWidth(inlineButtons) : undefined;
  return { gather, leave: leave.reverse(), floor };
}

/**
 * A quoted, escaped attribute value, so any key or id makes a valid selector.
 * A literal newline would otherwise break the string token outright, not
 * just the selector's meaning, so it gets its own CSS escape, `\a` plus the
 * trailing space that ends it, rather than a backslash a browser would only
 * read as escaping the character after it.
 */
const quoted = (value: string) => `"${value.replace(/["\\]/g, '\\$&').replace(/\n/g, '\\a ')}"`;

const query = (below: number, rules: string[]) => `@container (width < ${below}px) {\n${rules.join('\n')}\n}`;

/**
 * The rules for one Table, scoped to `[data-table=scope]`: a base for the
 * widest state, then a container query for each step down, widest first so
 * a narrower one, later in the sheet, wins. The container is the Table's
 * root, so `cqi` is a hundredth of the root's width.
 */
export function columnCss(scope: string, layout: ColumnLayout): string {
  const { columns, primaryKey, sortKey, inlineButtons, gatheredButtons } = layout;
  const root = `[data-table=${quoted(scope)}]`;
  const cells = (key: string) => `${root} [data-col=${quoted(key)}]`;
  const head = (key: string) => `${root} th[data-col=${quoted(key)}]`;
  const stay = columns.filter((column) => column.key === primaryKey);
  const ranked = rankColumns(columns, primaryKey, sortKey);
  const { gather, leave, floor } = columnThresholds(layout);

  /**
   * The widths while `shown` are shown, most important first, and the action
   * cell holds `buttons`. The first flexible column — the primary, or else
   * the most important — has no width and takes what is left, so a bounded
   * region's scrollbar comes off it instead of pushing the table past its
   * frame. The others share in proportion to their minimums.
   */
  const widths = (shown: ColumnSizing[], buttons: number) => {
    const fixed = shown.filter((column) => column.width !== undefined);
    const flexible = shown.filter((column) => column.width === undefined);
    const taken = extras(layout, buttons) + sum(fixed.map((column) => column.width!));
    const shares = sum(flexible.map((column) => minimumOf(column, primaryKey)));
    const rules = flexible.map((column, index) =>
      index === 0
        ? `${head(column.key)} { width: auto; }`
        : `${head(column.key)} { width: calc((100cqi - ${taken}px) * ${minimumOf(column, primaryKey)} / ${shares}); }`,
    );
    if (buttons > 0) rules.push(`${root} th[data-actions="column"] { width: ${actionWidth(buttons)}px; }`);
    return rules;
  };

  const all = [...stay, ...ranked];
  const rules = [
    `${root} table { min-width: ${floor - FRAME_BORDER}px; }`,
    ...all.filter((column) => column.width !== undefined).map((column) => `${head(column.key)} { width: ${column.width}px; }`),
    ...widths(all, gather !== undefined ? inlineButtons : gatheredButtons),
  ];
  if (gather !== undefined) {
    rules.push(
      `${root} [data-actions="gathered"] { display: none; }`,
      query(gather, [
        `${root} [data-actions="inline"] { display: none; }`,
        `${root} [data-actions="gathered"] { display: inline-flex; }`,
        ...widths(all, gatheredButtons),
      ]),
    );
  }
  leave.forEach(({ key, below }, index) => {
    const shown = [...stay, ...ranked.slice(0, ranked.length - index - 1)];
    rules.push(query(below, [`${cells(key)} { display: none; }`, ...widths(shown, gatheredButtons)]));
  });
  return rules.join('\n');
}

/** The selection bar's buttons in a row, 4 apart, with no cell around them. */
export function bulkWidth(buttons: number): number {
  return buttons > 0 ? buttons * BULK_BUTTON + (buttons - 1) * ACTION_GAP : 0;
}

/**
 * Between the bar's buttons and its Switches while both are inline: a hairline
 * divider with 16 on each side, as the bar's own dividers have — 4 of the
 * buttons' gap and `spacing/150` of margin.
 */
export const TOGGLE_SEPARATION = 2 * ACTION_GAP + 2 * 12 + 1;

export type BulkLayout = {
  /** Buttons while everything is inline: the actions with an icon, and "⋯" for the rest. */
  inlineButtons: number;
  /** The Switches' width, measured in the page (they hold words); 0 with none. */
  toggleWidth: number;
  /** Buttons once the Switches are tucked into "⋯": the actions with an icon, and that "⋯". 0 with none. */
  tuckedButtons: number;
};

/**
 * The selection bar's actions, gathered the way a row's are: drawn more than
 * once, the rules showing one. The row's gather by the Table's width, since
 * everything else in a row is counted; the bar holds words — the count,
 * Clear, a Switch's label — whose width nothing here knows, so its actions
 * gather by the width of their own slot. The slot is as wide as the widest
 * set and a container; it is the only part of the bar that gives way.
 * Narrower than everything inline, the Switches are tucked into "⋯" as
 * checkbox rows and the buttons stay; narrower than those, one "⋯" holds
 * all. `data-bulk`, not the rows' `data-actions`, so neither set of rules
 * reaches the other.
 */
export function bulkCss(scope: string, { inlineButtons, toggleWidth, tuckedButtons }: BulkLayout): string {
  const root = `[data-table=${quoted(scope)}]`;
  const hide = (set: string) => `${root} [data-bulk="${set}"] { display: none; }`;
  const show = (set: string) => `${root} [data-bulk="${set}"] { display: inline-flex; }`;
  const toggles = toggleWidth > 0;
  const widest = bulkWidth(inlineButtons) + (toggles ? (inlineButtons > 0 ? TOGGLE_SEPARATION : 0) + toggleWidth : 0);
  const rules = [`${root} [data-bulk="slot"] { width: ${widest}px; min-width: ${bulkWidth(1)}px; }`];
  if (toggles) rules.push(hide('tucked'), query(widest, [hide('inline'), show('tucked')]));
  const least = toggles ? tuckedButtons : inlineButtons;
  if (least > 1) {
    rules.push(
      hide('gathered'),
      query(bulkWidth(least), [hide('inline'), ...(toggles ? [hide('tucked')] : []), show('gathered')]),
    );
  }
  return rules.join('\n');
}
