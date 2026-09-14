/**
 * The matcher. Pure: an index in, hits out, no DOM, so every rule is a unit
 * test and an engine could replace it without the palette noticing.
 *
 * Twenty-three pages and some 250 entries do not need BM25. A term matches
 * a word by prefix, with one typo allowed from four characters; a hit's
 * score is the best field each term landed in, weighted so a page title
 * outranks a token, a token a section, a section the labels, and the labels
 * the body — where a term counts for more the more it is said and the
 * shorter the section. Ties fall to reading order, so the same query always
 * gives the same list.
 */

export type Kind = 'page' | 'section' | 'token' | 'prop';

export type Entry = {
  kind: Kind;
  /** Where Enter goes: a route, with a hash for everything but a page. */
  href: string;
  /** The row's first line. */
  title: string;
  /** The section's title and the page's label, for the breadcrumb. */
  section: string;
  page: string;
  /** The intro, the section's text, the use note, or the type — the lowest weight, excerpted for section hits. */
  body: string;
  /** Position in reading order, the tie-break. */
  order: number;
};

export type Index = { entries: Entry[] };

/** Half-open, in UTF-16 units of the text it marks. */
export type Range = [start: number, end: number];

export type Hit = {
  entry: Entry;
  score: number;
  /** What to mark in the title. */
  ranges: Range[];
  /** Present only when no term matched the title. */
  excerpt?: { text: string; ranges: Range[] };
};

export type Group = { section: string; hits: Hit[] };

export const LIMIT = 8;
/** At three characters one edit matches too much of the vocabulary. */
export const TYPO_FROM = 4;
/** Characters of body around a match. */
export const WINDOW = 100;

const TITLE_WEIGHT: Record<Kind, number> = { page: 10, token: 9, prop: 9, section: 6 };
const LABEL_WEIGHT = 4;
const BODY_WEIGHT = 1;

const WHOLE = 1;
const PREFIX = 0.7;
const TYPO = 0.4;

/**
 * One character in, one character out, always: a position found in the
 * folded text slices the original. `…` decomposes to three dots and `ﬁ` to
 * two letters, so a character whose fold changes length keeps its first
 * folded character instead.
 */
function foldChar(ch: string): string {
  const f = ch.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
  if (f.length === ch.length) return f;
  return ch.length === 1 && f.length > 1 ? f[0]! : ch;
}

export const fold = (text: string) => Array.from(text, foldChar).join('');

type Word = { text: string; start: number };

/** Letters and digits, with the `/`, `-`, `.` and `:` that join a token, a route or a ratio. */
const WORD = /[a-z0-9/.:\-]+/g;
const EDGE = /^[/.:\-]+|[/.:\-]+$/g;
const JOIN = /[/.:\-]/;

/**
 * The words of `text`, folded, each with where it starts; after a word a
 * `/`, `-`, `.` or `:` divides, its pieces too, at their own positions — so
 * `raised` finds `surface/raised` and marks the right characters.
 */
export function words(text: string): Word[] {
  const out: Word[] = [];
  for (const m of fold(text).matchAll(WORD)) {
    const lead = m[0].match(/^[/.:\-]+/)?.[0].length ?? 0;
    const word = m[0].replace(EDGE, '');
    if (!word) continue;
    const start = m.index + lead;
    out.push({ text: word, start });
    if (JOIN.test(word)) {
      for (const piece of word.matchAll(/[^/.:\-]+/g)) out.push({ text: piece[0], start: start + piece.index });
    }
  }
  return out;
}

/** The query's terms: its words, whole — `surface/raised` stays one term. */
export const terms = (query: string) =>
  [...fold(query).matchAll(WORD)].map((m) => m[0].replace(EDGE, '')).filter(Boolean);

/** Whether `a` is one substitution, insertion, deletion or adjacent swap away from `b`. */
export function oneEdit(a: string, b: string): boolean {
  if (a === b) return false;
  if (a.length === b.length) {
    const diff: number[] = [];
    for (let i = 0; i < a.length && diff.length <= 2; i++) if (a[i] !== b[i]) diff.push(i);
    if (diff.length === 1) return true;
    if (diff.length !== 2 || diff[1] !== diff[0]! + 1) return false;
    return a[diff[0]!] === b[diff[1]!] && a[diff[1]!] === b[diff[0]!];
  }
  if (Math.abs(a.length - b.length) !== 1) return false;
  const [short, long] = a.length < b.length ? [a, b] : [b, a];
  let i = 0;
  while (i < short.length && short[i] === long[i]) i++;
  return short.slice(i) === long.slice(i + 1);
}

type Match = { quality: number; word?: Word };

/** The best word for `term`: a whole word, else the first it prefixes, else — from TYPO_FROM — the first one edit away. */
function best(term: string, ws: Word[]): Match {
  let prefix: Word | undefined;
  for (const w of ws) {
    if (w.text === term) return { quality: WHOLE, word: w };
    if (!prefix && w.text.startsWith(term)) prefix = w;
  }
  if (prefix) return { quality: PREFIX, word: prefix };
  if (term.length >= TYPO_FROM) {
    for (const w of ws) if (oneEdit(term, w.text)) return { quality: TYPO, word: w };
  }
  return { quality: 0 };
}

/** Half the body weight is gone by this many characters: a term is a bigger part of a short section than of a long one. */
const HALF_LENGTH = 2000;

/**
 * How much of the body the term is: more mentions count for more, a longer
 * body for less. Four mentions in a short section beat one in a long one,
 * and the whole factor stays under a label match — at most 1.75 against the
 * label's 2.8 for a prefix.
 */
function share(term: string, ws: Word[], length: number): number {
  // One mention per position: `surface/raised` and its piece `surface` start
  // at the same character and are one word of the body, not two.
  const at = new Set<number>();
  for (const w of ws) if (w.text.startsWith(term)) at.add(w.start);
  const n = at.size;
  const mentions = 1 + 0.25 * Math.min(Math.max(n - 1, 0), 3);
  return mentions / (1 + length / HALF_LENGTH);
}

/** The characters to mark for a match: the term's length for a whole word or a prefix, the word's for a typo. */
const range = (term: string, m: Match): Range => [
  m.word!.start,
  m.word!.start + (m.quality === TYPO ? m.word!.text.length : term.length),
];

function merge(ranges: Range[]): Range[] {
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const out: Range[] = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else out.push([r[0], r[1]]);
  }
  return out;
}

type Fields = { title: Word[]; labels: Word[]; body: Word[] };

// Tokenised once per entry, not once per keystroke.
const fields = new WeakMap<Entry, Fields>();
function fieldsOf(entry: Entry): Fields {
  let f = fields.get(entry);
  if (!f) {
    f = { title: words(entry.title), labels: words(`${entry.section} ${entry.page}`), body: words(entry.body) };
    fields.set(entry, f);
  }
  return f;
}

/**
 * Up to WINDOW characters of `body` around `at`, cut on word boundaries with
 * an ellipsis at each cut end, and the terms marked inside it.
 */
function excerpt(body: string, at: Word, ts: string[]): { text: string; ranges: Range[] } {
  let start = Math.max(0, at.start - Math.floor(WINDOW * 0.4));
  let end = Math.min(body.length, start + WINDOW);
  if (start > 0) {
    const space = body.indexOf(' ', start);
    if (space !== -1 && space < at.start) start = space + 1;
  }
  if (end < body.length) {
    const space = body.lastIndexOf(' ', end);
    if (space > at.start + at.text.length) end = space;
  }
  const lead = start > 0 ? '…' : '';
  const text = lead + body.slice(start, end) + (end < body.length ? '…' : '');
  const ws = words(body.slice(start, end));
  const ranges: Range[] = [];
  for (const term of ts) {
    const m = best(term, ws);
    if (m.word) {
      const [s, e] = range(term, m);
      ranges.push([s + lead.length, e + lead.length]);
    }
  }
  return { text, ranges: merge(ranges) };
}

export function search(index: Index, query: string, limit = LIMIT): Hit[] {
  const ts = terms(query);
  if (ts.length === 0) return [];

  const hits: Hit[] = [];
  for (const entry of index.entries) {
    const f = fieldsOf(entry);
    let score = 0;
    let titled = false;
    let inBody: Word | undefined;
    const ranges: Range[] = [];

    for (const term of ts) {
      const t = best(term, f.title);
      const l = best(term, f.labels);
      const b = best(term, f.body);
      const s = Math.max(
        t.quality * TITLE_WEIGHT[entry.kind],
        l.quality * LABEL_WEIGHT,
        b.quality * BODY_WEIGHT * (b.quality === TYPO ? 1 : share(term, f.body, entry.body.length)),
      );
      if (s === 0) {
        score = 0;
        break;
      }
      score += s;
      if (t.word) {
        titled = true;
        ranges.push(range(term, t));
      } else if (b.word && !inBody) {
        inBody = b.word;
      }
    }
    if (score === 0) continue;

    const hit: Hit = { entry, score, ranges: merge(ranges) };
    if (!titled && inBody) hit.excerpt = excerpt(entry.body, inBody, ts);
    hits.push(hit);
  }

  hits.sort((a, b) => b.score - a.score || a.entry.order - b.entry.order);
  return hits.slice(0, limit);
}

/** Hits by section, sections in the order their best hit appears; the eight shown never change. */
export function group(hits: Hit[]): Group[] {
  const out: Group[] = [];
  for (const hit of hits) {
    const g = out.find((g) => g.section === hit.entry.section);
    if (g) g.hits.push(hit);
    else out.push({ section: hit.entry.section, hits: [hit] });
  }
  return out;
}
