/**
 * Which pages a pagination shows.
 *
 * Seven places at most with the defaults, so the arrows at either end never
 * move as the reader pages: `boundaries` pages at each end, `siblings` each
 * side of the current one, and a gap where pages are skipped. The four drawn
 * shapes — 1 2 3, 1 2 3 4 5 … 24, 1 … 20 21 22 23 24, 1 … 7 8 9 … 24 — are
 * this function at 1 and 1.
 *
 * A gap never hides a single page: where it would, the page is shown, since
 * "…" in place of "2" saves nothing and costs a press.
 */
export type PageItem = number | 'gap-start' | 'gap-end';

const range = (from: number, to: number) => Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);

export function pageItems(page: number, count: number, siblings = 1, boundaries = 1): PageItem[] {
  if (count < 1) return [];
  const current = Math.min(Math.max(1, page), count);

  // Everything fits: both boundaries, both gaps' places, the current and its siblings.
  if (count <= 2 * boundaries + 2 * siblings + 3) return range(1, count);

  const start = range(1, boundaries);
  const end = range(count - boundaries + 1, count);

  // The window slides with the current page, and stops short of each end so
  // the number of places stays the same.
  const from = Math.max(Math.min(current - siblings, count - boundaries - 2 * siblings - 1), boundaries + 2);
  const to = Math.min(Math.max(current + siblings, boundaries + 2 * siblings + 2), count - boundaries - 1);

  return [
    ...start,
    from > boundaries + 2 ? 'gap-start' : boundaries + 1,
    ...range(from, to),
    to < count - boundaries - 1 ? 'gap-end' : count - boundaries,
    ...end,
  ];
}
