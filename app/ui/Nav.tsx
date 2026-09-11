'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Where the sidebar becomes a bar with a toggle. The stylesheet's narrow
 * block carries the same query; `Nav.test.tsx` reads it from here so the two
 * cannot drift apart.
 */
export const NARROW = '(max-width: 760px)';

const NAV = [
  {
    title: 'Start here',
    items: [
      { href: '/', label: 'Overview' },
      { href: '/why', label: 'Why Alpenglow' },
      { href: '/accessibility', label: 'Accessibility' },
      { href: '/decisions', label: 'Decisions' },
    ],
  },
  {
    title: 'Foundations',
    items: [
      { href: '/colour', label: 'Colour' },
      { href: '/typography', label: 'Typography' },
      { href: '/space', label: 'Space and shape' },
      { href: '/icons', label: 'Icons' },
    ],
  },
  {
    title: 'Components',
    items: [
      { href: '/avatar', label: 'Avatar and Loader' },
      { href: '/badge', label: 'Badge' },
      { href: '/button', label: 'Button' },
      { href: '/input', label: 'Input and Textarea' },
      { href: '/choice', label: 'Checkbox, Radio, Switch' },
      { href: '/date-picker', label: 'Date picker' },
      { href: '/dropdown-menu', label: 'Dropdown menu' },
      { href: '/select', label: 'Select' },
      { href: '/table', label: 'Table' },
    ],
  },
];

export function Nav() {
  const pathname = usePathname();
  const here = pathname.replace(/\/+$/, '') || '/';
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLElement>(null);

  // Following a link has to close the menu. Leaving it open would bury the page
  // the reader just asked for under the list they used to get there.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // On a narrow screen the open menu is fixed over the whole viewport. The
  // stylesheet does the covering; this is everything the stylesheet cannot do.
  useEffect(() => {
    if (!open) return;

    // The page under the overlay must neither scroll under a finger that meant
    // to scroll the menu, nor take focus from a Tab that meant to reach a link.
    // Everything beside the nav is under the overlay, so everything beside the
    // nav goes inert.
    document.documentElement.setAttribute('data-nav-open', '');
    const covered = [...(ref.current?.parentElement?.children ?? [])].filter(
      (el) => el !== ref.current,
    );
    for (const el of covered) el.setAttribute('inert', '');

    const close = () => setOpen(false);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);

    // Past the breakpoint the sidebar shows whatever `open` says, and the lock
    // and the inert page would outlive the overlay they were there for.
    const viewport = window.matchMedia(NARROW);
    const onViewport = (event: MediaQueryListEvent) => {
      if (!event.matches) close();
    };
    viewport.addEventListener('change', onViewport);

    return () => {
      document.documentElement.removeAttribute('data-nav-open');
      for (const el of covered) el.removeAttribute('inert');
      document.removeEventListener('keydown', onKey);
      viewport.removeEventListener('change', onViewport);
    };
  }, [open]);

  const current = NAV.flatMap((g) => g.items).find((i) => i.href === here);

  return (
    <nav className="sidebar" aria-label="Documentation" data-open={open} ref={ref}>
      <div className="sidebarHead">
        <div>
          <Link href="/" className="brand">
            Alpenglow
          </Link>
          <p className="brandNote">Theme: Eleonora</p>
        </div>

        {/* Shown only on narrow screens; the sidebar is always open on wider ones. */}
        <button
          type="button"
          className="navToggle"
          aria-expanded={open}
          aria-controls="nav-sections"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Close' : (current?.label ?? 'Menu')}
        </button>
      </div>

      <div className="navSections" id="nav-sections">
        {NAV.map((group) => (
          <div className="navGroup" key={group.title}>
            <p className="navTitle">{group.title}</p>
            <ul className="navList">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="navLink"
                    aria-current={here === item.href ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
