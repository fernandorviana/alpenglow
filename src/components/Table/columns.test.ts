import { describe, it, expect } from 'vitest';
import {
  actionWidth,
  TOGGLE_SEPARATION,
  bulkCss,
  bulkWidth,
  columnCss,
  columnThresholds,
  minimumOf,
  rankColumns,
} from './columns';
import type { ColumnLayout } from './columns';

/** The Table page's Try it, reduced: a primary, two flexible columns and a fixed one, selection, three buttons inline. */
const tryIt: ColumnLayout = {
  columns: [
    { key: 'name' },
    { key: 'status' },
    { key: 'visits', width: 80 },
    { key: 'seen' },
  ],
  primaryKey: 'name',
  selection: true,
  inlineButtons: 3,
  gatheredButtons: 1,
};

describe('minimumOf', () => {
  it("is 96 unless told, 160 for the primary, and a fixed column's own width", () => {
    expect(minimumOf({ key: 'a' })).toBe(96);
    expect(minimumOf({ key: 'a' }, 'a')).toBe(160);
    expect(minimumOf({ key: 'a', minWidth: 120 })).toBe(120);
    // A fixed column does not shrink, so its minimum is its width and minWidth is ignored.
    expect(minimumOf({ key: 'a', width: 136, minWidth: 300 })).toBe(136);
  });
});

describe('actionWidth', () => {
  it("is the cell's padding, 40 a button and 4 between, and nothing without buttons", () => {
    expect(actionWidth(0)).toBe(0);
    expect(actionWidth(1)).toBe(72);
    expect(actionWidth(3)).toBe(160);
  });
});

describe('rankColumns', () => {
  it('keeps source order when no priority is given, and never ranks the primary', () => {
    const ranked = rankColumns([{ key: 'a' }, { key: 'b' }, { key: 'c' }], 'a');
    expect(ranked.map((c) => c.key)).toEqual(['b', 'c']);
  });

  it('puts columns with a priority first, lowest number first, ties in source order', () => {
    const ranked = rankColumns(
      [{ key: 'a' }, { key: 'b', priority: 2 }, { key: 'c', priority: 1 }, { key: 'd' }, { key: 'e', priority: 2 }],
      'a',
    );
    expect(ranked.map((c) => c.key)).toEqual(['c', 'b', 'e', 'd']);
  });

  it('raises the sorted column above every priority', () => {
    const ranked = rankColumns([{ key: 'a' }, { key: 'b', priority: 1 }, { key: 'c' }], 'a', 'c');
    expect(ranked.map((c) => c.key)).toEqual(['c', 'b']);
  });

  it('ignores a priority on the primary: it never leaves', () => {
    const ranked = rankColumns([{ key: 'a', priority: 9 }, { key: 'b' }], 'a');
    expect(ranked.map((c) => c.key)).toEqual(['b']);
  });
});

describe('columnThresholds', () => {
  it('adds the minimums up, the least important column leaving first', () => {
    // floor: frame 2 + selection 56 + one gathered button 72 + primary 160 = 290.
    // status +96 = 386, visits +80 = 466, seen +96 = 562.
    expect(columnThresholds(tryIt)).toEqual({
      gather: 650, // 562 with the three inline buttons (160) in place of the one (72)
      leave: [
        { key: 'seen', below: 562 },
        { key: 'visits', below: 466 },
        { key: 'status', below: 386 },
      ],
      floor: 290,
    });
  });

  it('has nothing to gather when the inline actions are already one button', () => {
    expect(columnThresholds({ ...tryIt, inlineButtons: 1 }).gather).toBeUndefined();
  });

  it('counts no selection and no action column when there are none', () => {
    const t = columnThresholds({ ...tryIt, selection: false, inlineButtons: 0, gatheredButtons: 0 });
    expect(t.floor).toBe(162);
    expect(t.gather).toBeUndefined();
  });

  it('keeps the sorted column to the last', () => {
    const t = columnThresholds({ ...tryIt, sortKey: 'seen' });
    expect(t.leave.map((l) => l.key)).toEqual(['visits', 'status', 'seen']);
  });

  it('with no primary, everything can leave and the floor is the extras', () => {
    const t = columnThresholds({ ...tryIt, primaryKey: undefined });
    expect(t.floor).toBe(130);
    expect(t.leave.at(-1)).toEqual({ key: 'name', below: 226 });
  });
});

describe('columnCss', () => {
  const css = columnCss('t', tryIt);
  const root = '[data-table="t"]';

  it('keeps the table as wide as what never leaves, so below it the region scrolls', () => {
    expect(css).toContain(`${root} table { min-width: 288px; }`);
  });

  it('gives a fixed column its px once, and leaves the primary without a width so it takes the rest', () => {
    expect(css).toContain(`${root} th[data-col="visits"] { width: 80px; }`);
    expect(css).toContain(`${root} th[data-col="name"] { width: auto; }`);
    expect(css).not.toMatch(/th\[data-col="name"\] \{ width: calc/);
  });

  it('shares what is left among the flexible columns in proportion to their minimums', () => {
    // Inline: taken = 2 + 56 + 160 + 80 = 298; shares = 160 + 96 + 96 = 352.
    expect(css).toContain(`${root} th[data-col="status"] { width: calc((100cqi - 298px) * 96 / 352); }`);
    // Gathered: taken = 2 + 56 + 72 + 80 = 210.
    expect(css).toContain(`${root} th[data-col="status"] { width: calc((100cqi - 210px) * 96 / 352); }`);
  });

  it('sizes the action column inline, then gathered', () => {
    expect(css).toContain(`${root} th[data-actions="column"] { width: 160px; }`);
    expect(css).toContain(`${root} th[data-actions="column"] { width: 72px; }`);
  });

  it('shows the inline actions until they gather, then the one "⋯"', () => {
    expect(css).toContain(`${root} [data-actions="gathered"] { display: none; }`);
    const gather = css.slice(css.indexOf('@container (width < 650px)'));
    expect(gather).toContain(`${root} [data-actions="inline"] { display: none; }`);
    expect(gather).toContain(`${root} [data-actions="gathered"] { display: inline-flex; }`);
  });

  it('hides each column below its threshold, the widest step first so the narrower ones win', () => {
    const at = (n: number) => css.indexOf(`@container (width < ${n}px)`);
    expect(at(650)).toBeGreaterThan(-1);
    expect(at(650)).toBeLessThan(at(562));
    expect(at(562)).toBeLessThan(at(466));
    expect(at(466)).toBeLessThan(at(386));
    expect(css.slice(at(562), at(466))).toContain(`${root} [data-col="seen"] { display: none; }`);
    expect(css.slice(at(386))).toContain(`${root} [data-col="status"] { display: none; }`);
  });

  it("never hides the primary", () => {
    expect(css).not.toContain('[data-col="name"] { display: none; }');
  });

  it('writes no action column rule when there is none', () => {
    expect(columnCss('t', { ...tryIt, inlineButtons: 0, gatheredButtons: 0 })).not.toContain('data-actions');
  });

  it("escapes a quote or a backslash in a key or the scope, so the selector stays valid", () => {
    const odd = columnCss('a"b', { ...tryIt, columns: [{ key: 'name' }, { key: 'x"y\\z' }] });
    expect(odd).toContain('[data-table="a\\"b"]');
    expect(odd).toContain('[data-col="x\\"y\\\\z"]');
  });

  it('escapes a newline in a key as the CSS escape \\a, since a literal one would break the string token', () => {
    const odd = columnCss('t', { ...tryIt, columns: [{ key: 'name' }, { key: 'a\nb' }] });
    expect(odd).toContain('[data-col="a\\a b"]');
  });
});

describe('bulkWidth', () => {
  it("is 32 a button, the bar's sm, and 4 between, and nothing without buttons", () => {
    expect(bulkWidth(0)).toBe(0);
    expect(bulkWidth(1)).toBe(32);
    expect(bulkWidth(3)).toBe(104);
  });
});

describe('bulkCss', () => {
  const root = '[data-table="t"]';
  const buttons = (n: number) => ({ inlineButtons: n, toggleWidth: 0, tuckedButtons: 0 });

  it('sizes the slot to its inline buttons, and lets it give way to one "⋯"', () => {
    expect(bulkCss('t', buttons(3))).toContain(`${root} [data-bulk="slot"] { width: 104px; min-width: 32px; }`);
  });

  it('shows the inline actions until the slot is narrower than they are, then the one "⋯"', () => {
    const css = bulkCss('t', buttons(3));
    expect(css).toContain(`${root} [data-bulk="gathered"] { display: none; }`);
    const gather = css.slice(css.indexOf('@container (width < 104px) {'));
    expect(gather.length).toBeLessThan(css.length);
    expect(gather).toContain(`${root} [data-bulk="inline"] { display: none; }`);
    expect(gather).toContain(`${root} [data-bulk="gathered"] { display: inline-flex; }`);
    expect(css).not.toContain('tucked');
  });

  it('writes no gathering for one button, which is already as few as there can be', () => {
    const css = bulkCss('t', buttons(1));
    expect(css).toContain(`${root} [data-bulk="slot"] { width: 32px; min-width: 32px; }`);
    expect(css).not.toContain('@container');
    expect(css).not.toContain('gathered');
  });

  it('holds the Switches beside the buttons while the slot has room for both, then tucks them into "⋯", then gathers', () => {
    // Export and Archive inline; "Show only selected" measured at 177; tucked,
    // the two buttons and a "⋯" that holds the Switch as a checkbox row.
    const css = bulkCss('t', { inlineButtons: 2, toggleWidth: 177, tuckedButtons: 3 });
    const widest = bulkWidth(2) + TOGGLE_SEPARATION + 177;
    expect(TOGGLE_SEPARATION).toBe(33);
    expect(css).toContain(`${root} [data-bulk="slot"] { width: ${widest}px; min-width: 32px; }`);
    expect(css).toContain(`${root} [data-bulk="tucked"] { display: none; }`);
    const at = (n: number) => css.indexOf(`@container (width < ${n}px) {`);
    expect(at(widest)).toBeGreaterThan(-1);
    expect(at(104)).toBeGreaterThan(at(widest));
    const tuck = css.slice(at(widest), at(104));
    expect(tuck).toContain(`${root} [data-bulk="inline"] { display: none; }`);
    expect(tuck).toContain(`${root} [data-bulk="tucked"] { display: inline-flex; }`);
    const gather = css.slice(at(104));
    expect(gather).toContain(`${root} [data-bulk="tucked"] { display: none; }`);
    expect(gather).toContain(`${root} [data-bulk="gathered"] { display: inline-flex; }`);
  });

  it('tucks a Switch that stands alone into a "⋯" of its own, with nothing further to gather', () => {
    const css = bulkCss('t', { inlineButtons: 0, toggleWidth: 150, tuckedButtons: 1 });
    expect(css).toContain(`${root} [data-bulk="slot"] { width: 150px; min-width: 32px; }`);
    expect(css).toContain('@container (width < 150px)');
    expect(css).not.toContain('gathered');
  });

  it("never names the row actions' attribute, so neither set of rules reaches the other", () => {
    expect(bulkCss('t', buttons(3))).not.toContain('data-actions');
    expect(columnCss('t', tryIt)).not.toContain('data-bulk');
  });
});
