'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Search as SearchIcon } from '@carbon/icons-react';
import { Dialog } from '@/components/Dialog';
import { Input } from '@/components/Input';
import { useHydrated } from '@/components/useHydrated';
import { PAGES, SUGGESTED, sectionOf } from '../contents';
import { group, search, type Hit, type Index, type Range } from './index';
import { loadIndex } from './load';
import { readRecent, remember, type Recent } from './recent';

/**
 * The site's search: an item at the head of the rail, ⌘K / Ctrl+K from
 * anywhere, and the palette both open — the system's own Dialog and Input,
 * which is the point of a portfolio piece. One combobox: the field keeps
 * focus, the arrows move an active row, Enter follows it.
 *
 * Suggestions only, no inline completion. The M3 site fills its field with
 * the first suggestion; editing the field's value under the reader's
 * fingers is the class of bug the date mask fought (IME, Android's
 * `Unidentified` keys, paste), and the list gives the same answer without it.
 */

type Row = {
  id: string;
  href: string;
  title: string;
  crumb: string;
  mono: boolean;
  ranges: Range[];
  excerpt?: { text: string; ranges: Range[] };
};
type Section = { label: string; rows: Row[] };

const rowOf = (hit: Hit, id: string): Row => ({
  id,
  href: hit.entry.href,
  title: hit.entry.title,
  // A section page's own sections would read "Developers › Developers".
  crumb:
    hit.entry.kind === 'page' || hit.entry.page === hit.entry.section
      ? hit.entry.section
      : `${hit.entry.section} › ${hit.entry.page}`,
  mono: hit.entry.kind === 'token' || hit.entry.kind === 'prop',
  ranges: hit.ranges,
  excerpt: hit.excerpt,
});

const recentRow = (r: Recent, id: string): Row => ({ id, href: r.href, title: r.title, crumb: r.crumb, mono: false, ranges: [] });

const suggestedRows = (id: string): Row[] =>
  SUGGESTED.flatMap((href, i) => {
    const page = PAGES.find((p) => p.href === href);
    return page ? [{ id: `${id}-s${i}`, href, title: page.label, crumb: sectionOf(href)?.title ?? '', mono: false, ranges: [] }] : [];
  });

/** `text` with `ranges` wrapped in <mark>. */
function marked(text: string, ranges: Range[]): ReactNode {
  if (ranges.length === 0) return text;
  const parts: ReactNode[] = [];
  let at = 0;
  ranges.forEach(([start, end], i) => {
    if (start > at) parts.push(text.slice(at, start));
    parts.push(<mark key={i}>{text.slice(start, end)}</mark>);
    at = end;
  });
  if (at < text.length) parts.push(text.slice(at));
  return parts;
}

export function Search() {
  const router = useRouter();
  const hydrated = useHydrated();
  const id = useId();
  const listId = `${id}-list`;
  const field = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(-1);
  const [index, setIndex] = useState<Index | 'failed' | null>(null);
  const [recent, setRecent] = useState<Recent[]>([]);

  // A new query starts with no row active. Derived in the render that sees
  // the change, as Nav closes on a route change, not in an effect after it.
  const [seen, setSeen] = useState(query);
  if (seen !== query) {
    setSeen(query);
    setActive(-1);
  }

  const show = () => {
    setRecent(readRecent());
    setOpen(true);
  };

  // Loaded on the first open, not on mount: a reader who never searches never
  // fetches the chunk. State is set from the promise, never in the effect body.
  useEffect(() => {
    if (!open || index !== null) return;
    let stale = false;
    loadIndex().then(
      (loaded) => {
        if (!stale) setIndex(loaded);
      },
      () => {
        if (!stale) setIndex('failed');
      },
    );
    return () => {
      stale = true;
    };
  }, [open, index]);

  // Both modifiers on every platform: a Mac with a PC keyboard, or the
  // reverse, should not be stranded. While open, the dialog is already there.
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setRecent(readRecent());
        setOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const q = query.trim();
  const loaded = index !== null && index !== 'failed' ? index : undefined;
  const hits = loaded && q ? search(loaded, q) : [];

  const suggested: Section = { label: 'Suggested', rows: suggestedRows(id) };
  const idle: Section[] = recent.length
    ? [{ label: 'Recent', rows: recent.map((r, i) => recentRow(r, `${id}-r${i}`)) }, suggested]
    : [suggested];

  let sections: Section[];
  let status: ReactNode = null;
  if (!q) {
    sections = idle;
  } else if (!loaded) {
    sections = idle;
    status = index === 'failed' ? 'The index did not load.' : 'Loading the index…';
  } else if (hits.length === 0) {
    sections = [suggested];
    status = <>Nothing mentions &ldquo;{q}&rdquo;.</>;
  } else {
    let n = 0;
    sections = group(hits).map((g) => ({ label: g.section, rows: g.hits.map((hit) => rowOf(hit, `${id}-h${n++}`)) }));
  }

  const flat = sections.flatMap((s) => s.rows);
  const activeRow = active >= 0 ? flat[active] : undefined;
  const activeId = activeRow?.id;

  // A failed load is forgotten on close, so the next open tries again —
  // `load.ts` forgets the rejection for the same reason.
  const close = () => {
    setOpen(false);
    if (index === 'failed') setIndex(null);
  };

  const go = (row: Row) => {
    setRecent(remember({ href: row.href, title: row.title, crumb: row.crumb }));
    close();
    setQuery('');
    router.push(row.href);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // The Enter that commits an IME composition is the composition's, not
    // the list's; taken as "follow the first row" it navigates mid-word.
    if (event.nativeEvent.isComposing) return;
    // Esc closes the dialog through its own `cancel`. It must not also reach
    // the Nav's document listener, which would close the narrow-screen menu
    // the reader used to get here.
    if (event.key === 'Escape') {
      event.stopPropagation();
      return;
    }
    const last = flat.length - 1;
    if (last < 0) return;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActive(active >= last ? 0 : active + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActive(active <= 0 ? last : active - 1);
        break;
      // Home and End are the caret's until a row is active; then the list's.
      case 'Home':
        if (active >= 0) {
          event.preventDefault();
          setActive(0);
        }
        break;
      case 'End':
        if (active >= 0) {
          event.preventDefault();
          setActive(last);
        }
        break;
      case 'Enter':
        event.preventDefault();
        go(activeRow ?? flat[0]!);
        break;
    }
  };

  // Keep the active row in view as the arrows move it. jsdom has no layout
  // and no scrollIntoView, hence the guard. Keyed by the id: the row objects
  // are rebuilt every render.
  useEffect(() => {
    if (activeId) document.getElementById(activeId)?.scrollIntoView?.({ block: 'nearest' });
  }, [activeId]);

  const mac = hydrated && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <>
      {/* A rail item, not a field: the rail's pill and caption, so the
          four sections and the search read as one set. The shortcut is a
          title — the caption has one line and the M3 rail says "Search"
          alone — and it waits for hydration, because it reads the platform. */}
      <button
        type="button"
        className="railLink railSearch"
        onClick={show}
        aria-keyshortcuts="Meta+K Control+K"
        title={hydrated ? `Search — ${mac ? '⌘K' : 'Ctrl K'}` : undefined}
      >
        <span className="railPill">
          <SearchIcon size={24} aria-hidden="true" />
        </span>
        <span className="railLabel">Search</span>
      </button>

      <Dialog open={open} onClose={close} title="Search" size="md" initialFocus={field} className="searchDialog">
        <Input
          ref={field}
          size="lg"
          iconStart={<SearchIcon size={20} />}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={flat.length > 0}
          aria-controls={listId}
          aria-activedescendant={activeId}
          aria-label="Search the documentation"
          placeholder="Pages, sections, tokens, props"
          autoComplete="off"
          spellCheck={false}
        />
        {status && (
          <p className="searchStatus" role="status">
            {status}
          </p>
        )}
        <div role="listbox" id={listId} aria-label="Results" className="searchList">
          {sections.map((section) => (
            <div key={section.label} role="group" aria-label={section.label} className="searchGroup">
              <div className="searchGroupTitle" aria-hidden="true">
                {section.label}
              </div>
              {section.rows.map((row) => {
                const at = flat.indexOf(row);
                return (
                  <div
                    key={row.id}
                    id={row.id}
                    role="option"
                    aria-selected={at === active}
                    className={row.mono ? 'searchOption searchMono' : 'searchOption'}
                    onMouseMove={() => {
                      if (active !== at) setActive(at);
                    }}
                    // The field keeps focus; a press on a row must not take it.
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => go(row)}
                  >
                    <span className="searchTitle">{marked(row.title, row.ranges)}</span>
                    <span className="searchCrumb">{row.crumb}</span>
                    {row.excerpt && <span className="searchExcerpt">{marked(row.excerpt.text, row.excerpt.ranges)}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </Dialog>
    </>
  );
}
