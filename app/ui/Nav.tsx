'use client';

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
  { title: 'Components', items: [{ href: '/button', label: 'Button' }] },
];

export function Nav() {
  const pathname = usePathname();
  const here = pathname.replace(/\/+$/, '') || '/';

  return (
    <nav className="sidebar" aria-label="Documentation">
      <Link href="/" className="brand">
        Alpenglow
      </Link>
      <p className="brandNote">Theme: Eleonora</p>

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
    </nav>
  );
}
