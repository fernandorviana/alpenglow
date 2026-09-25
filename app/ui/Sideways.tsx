'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

/**
 * A specimen drawn wider than a phone — an app's top bar with its actions —
 * scrolls sideways inside its own box, never the page's, and keeps its drawn
 * width rather than being squeezed or cut. A fade on each side where more of
 * it waits is the cue. Which sides is measured, not guessed from a
 * breakpoint: whether it overflows depends on the content as much as on the
 * width, and CSS cannot ask. Without a measurement, as on the server, no fade
 * shows and the scroll still works.
 */
export function Sideways({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState({ start: false, end: false });

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const measure = () => {
      // From 0 at the start: negative in a right-to-left page.
      const from = Math.abs(el.scrollLeft);
      const start = from > 1;
      const end = from + el.clientWidth < el.scrollWidth - 1;
      setMore((m) => (m.start === start && m.end === end ? m : { start, end }));
    };
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    // jsdom has no ResizeObserver, and the page is rendered there by the axe suite.
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure);
    observer?.observe(el);
    if (el.firstElementChild) observer?.observe(el.firstElementChild);
    return () => {
      el.removeEventListener('scroll', measure);
      observer?.disconnect();
    };
  }, []);

  return (
    <div
      className={['sideways', className].filter(Boolean).join(' ')}
      style={style}
      data-more-start={more.start || undefined}
      data-more-end={more.end || undefined}
    >
      <div ref={scroller} className="sidewaysScroll">
        <div className="sidewaysContent">{children}</div>
      </div>
    </div>
  );
}
