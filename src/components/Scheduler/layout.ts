/**
 * Lanes for events that overlap.
 *
 * Events that overlap, directly or through a chain, form a cluster; within
 * it each event takes the first lane whose last event ended by the event's
 * start, and the cluster's width is divided by its lanes. The cascade drawn
 * in the week with several people is not replicated: at a third card the
 * cascade hides the first one's time (the spec's decision 9).
 */

export type Span = { start: number; end: number };

export type Lane = { lane: number; lanes: number };

/** One entry per item, in the items' own order. An item that ends before it starts is given a minute. */
export function lanes(items: readonly Span[]): Lane[] {
  const order = items
    .map((item, index) => ({ index, start: item.start, end: Math.max(item.end, item.start + 1) }))
    .sort((a, b) => a.start - b.start || b.end - a.end);

  const out: Lane[] = items.map(() => ({ lane: 0, lanes: 1 }));
  let members: number[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -Infinity;

  const close = () => {
    for (const index of members) out[index]!.lanes = laneEnds.length;
    members = [];
    laneEnds = [];
  };

  for (const item of order) {
    if (item.start >= clusterEnd) close();
    let lane = laneEnds.findIndex((end) => end <= item.start);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = item.end;
    out[item.index]!.lane = lane;
    members.push(item.index);
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  close();
  return out;
}
