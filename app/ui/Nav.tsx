'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  {
    title: 'Start here',
    items: [
      { href: '/', label: 'Overview' },
      { href: '/decisions', label: 'Decisions' },
    ],
  },
  {
    title: 'Foundations',
    items: [
      { href: '/colour', label: 'Colour' },
      { href: '/typography', label: 'Typography' },
      { href: '/space', label: 'Space and shape' },
    ],
  },
  {
    title: 'Components',
    items: [
      { href: '/button', label: 'Button' },
      { href: '/input', label: 'Input and Textarea' },
    ],
  },
];

export function Nav() {
  const pathname = usePathname();
  const here = pathname.replace(/\/+$/, '') || '/';
  const [open, setOpen] = useState(false);

  // Following a link has to close the menu. Leaving it open would bury the page
  // the reader just asked for under the list they used to get there.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const current = NAV.flatMap((g) => g.items).find((i) => i.href === here);

  return (
    <nav className="sidebar" aria-label="Documentation">
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

      <div className="navSections" id="nav-sections" data-open={open}>
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
