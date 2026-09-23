'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search as SearchIcon } from '@carbon/icons-react';
import { CommandPalette, useCommandPaletteShortcut } from '@/components/CommandPalette';
import type { CommandGroup, CommandItem } from '@/components/CommandPalette';
import { PAGES, SUGGESTED, sectionOf } from '../contents';
import { group, search, type Hit, type Index } from './index';
import { loadIndex } from './load';
import { readRecent, remember, type Recent } from './recent';

/**
 * The site's search: an item at the head of the rail, ⌘K / Ctrl+K from
 * anywhere, and the package's CommandPalette — the pattern graduated on
 * 2026-09-23, this file being what stays the site's: the index, what is
 * suggested, what was recent, and where a row leads.
 *
 * A row's id carries its group and its href, so a page that is both recent
 * and suggested is two rows, and the chosen one is followed by its href.
 */

const rowOf = (hit: Hit, prefix: string): CommandItem => ({
  id: `${prefix}${hit.entry.href}`,
  label: hit.entry.title,
  // A section page's own sections would read "Developers › Developers".
  description:
    hit.entry.kind === 'page' || hit.entry.page === hit.entry.section
      ? hit.entry.section
      : `${hit.entry.section} › ${hit.entry.page}`,
  mono: hit.entry.kind === 'token' || hit.entry.kind === 'prop',
  detail: hit.excerpt?.text,
});

const recentRow = (r: Recent): CommandItem => ({ id: `r:${r.href}`, label: r.title, description: r.crumb });

const SUGGESTED_ROWS: CommandItem[] = SUGGESTED.flatMap((href) => {
  const page = PAGES.find((p) => p.href === href);
  return page ? [{ id: `s:${href}`, label: page.label, description: sectionOf(href)?.title ?? '' }] : [];
});

/** The href a row's id carries, after its group's prefix. */
const hrefOf = (item: CommandItem) => item.id.slice(item.id.indexOf(':') + 1);

export function Search() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState<Index | 'failed' | null>(null);
  const [recent, setRecent] = useState<Recent[]>([]);

  const show = () => {
    setRecent(readRecent());
    setOpen(true);
  };
  const hint = useCommandPaletteShortcut(show);

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

  const q = query.trim();
  const loaded = index !== null && index !== 'failed' ? index : undefined;
  const hits = loaded && q ? search(loaded, q) : [];

  const suggested: CommandGroup = { label: 'Suggested', items: SUGGESTED_ROWS };
  const idle: CommandGroup[] = recent.length ? [{ label: 'Recent', items: recent.map(recentRow) }, suggested] : [suggested];

  let items: CommandGroup[];
  let status: string | undefined;
  if (!q) {
    items = idle;
  } else if (!loaded) {
    items = idle;
    status = index === 'failed' ? 'The index did not load.' : 'Loading the index…';
  } else if (hits.length === 0) {
    items = [suggested];
    status = `Nothing mentions “${q}”.`;
  } else {
    let n = 0;
    items = group(hits).map((g) => ({ label: g.section, items: g.hits.map((hit) => rowOf(hit, `h${n++}:`)) }));
  }

  // A failed load is forgotten on close, so the next open tries again —
  // `load.ts` forgets the rejection for the same reason.
  const close = () => {
    setOpen(false);
    if (index === 'failed') setIndex(null);
  };

  const go = (item: CommandItem) => {
    const href = hrefOf(item);
    setRecent(remember({ href, title: item.label, crumb: item.description ?? '' }));
    close();
    setQuery('');
    router.push(href);
  };

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
        title={hint ? `Search — ${hint}` : undefined}
      >
        <span className="railPill">
          <SearchIcon size={24} aria-hidden="true" />
        </span>
        <span className="railLabel">Search</span>
      </button>

      <CommandPalette
        open={open}
        onClose={close}
        label="Search"
        placeholder="Pages, sections, tokens, props"
        icon={<SearchIcon size={20} />}
        items={items}
        filter={null}
        query={query}
        onQueryChange={setQuery}
        status={status}
        onSelect={go}
      />
    </>
  );
}
