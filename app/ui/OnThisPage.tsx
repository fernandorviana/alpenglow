'use client';

import { useEffect, useMemo, useState } from 'react';

export type Section = { id: string; label: string };

/**
 * A heading has "passed" once its top is within this much of the viewport's
 * top edge: the reader's eye is on the section's first lines, not on the
 * heading itself, by the time the heading has reached the page's top padding.
 */
const PASSED = 96;

/** The last section whose heading has passed the top of the viewport; the first before any has. */
function currentSection(ids: readonly string[]) {
  let current = ids[0];
  for (const id of ids) {
    const heading = document.getElementById(id);
    if (heading && heading.getBoundingClientRect().top <= PASSED) current = id;
  }
  return current;
}

/**
 * The sections of the page beside the prose, with the one the reader is in
 * marked. On the static HTML nothing is marked; the mark arrives with
 * hydration, from the scroll position, and follows the reader from there.
 *
 * The position is read on `scroll` rather than through an IntersectionObserver:
 * a page has a dozen headings at most, and "the last heading above the fold"
 * is one pass over them, with an answer that is the same whether the reader
 * arrived by scrolling, by a hash, or by resizing the window.
 */
export function OnThisPage({ sections }: { sections: readonly Section[] }) {
  const [current, setCurrent] = useState<string | undefined>(undefined);

  // The page rebuilds `sections` on every render, so the listeners key on the
  // ids as text and are attached once per page, not once per render.
  const key = sections.map((s) => s.id).join('\n');
  const ids = useMemo(() => key.split('\n').filter(Boolean), [key]);

  useEffect(() => {
    if (ids.length === 0) return;
    const update = () => setCurrent(currentSection(ids));
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [ids]);

  if (sections.length === 0) return null;

  return (
    <nav className="onThisPage" aria-label="On this page">
      <p className="onThisPageTitle">On this page</p>
      <ul className="onThisPageList">
        {sections.map(({ id, label }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className="onThisPageLink"
              aria-current={current === id ? 'location' : undefined}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
