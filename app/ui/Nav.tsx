'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Code, Cube, Home, Layers } from '@carbon/icons-react';
import { media } from '@/tokens/scale';
import { NAV, PAGES, route, sectionOf } from './contents';
import { ThemeToggle } from './ThemeToggle';
import { Search } from './search/Search';

/**
 * Where the sidebar becomes a bar with a toggle. The stylesheet's narrow
 * block carries the same query; `Nav.test.tsx` reads it from here so the two
 * cannot drift apart. `md`, 768.
 */
export const NARROW = media.down.md;

/**
 * One icon per section, keyed by the section's route. Carbon, like every
 * icon on the site; the four were chosen for what the section holds — the
 * start, code, the layers under the components, and the components as a
 * solid — not for a set they belong to, because Carbon has no such set.
 */
const ICONS: Record<string, ComponentType<{ size?: number; 'aria-hidden'?: 'true' }>> = {
  '/': Home,
  '/develop': Code,
  '/foundations': Layers,
  '/components': Cube,
};

/**
 * Two bars on a wide screen, the shape of the Material 3 site: a rail with
 * the four sections, and beside it a drawer with the pages of the section
 * the reader is in. On a narrow screen both give way to one bar with a
 * toggle, and the open menu lists every section and page — the reader on a
 * phone should not need two taps to reach a page in another section.
 */
export function Nav() {
  const pathname = usePathname();
  const here = route(pathname);
  const section = sectionOf(here);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLElement>(null);

  // Following a link has to close the menu. Leaving it open would bury the page
  // the reader just asked for under the list they used to get there.
  //
  // It closes during the render that sees the new route, not in an effect after
  // it: an effect commits the new page under the open menu and then renders
  // again to close it, which is what the React Compiler's lint rejects.
  // Deriving `open` from the route the menu was opened on (`openOn ===
  // pathname`) looks simpler and is wrong — Back to that route opens the menu
  // again, over the page. `Nav.test.tsx` fails on it.
  const [seen, setSeen] = useState(pathname);
  if (seen !== pathname) {
    setSeen(pathname);
    setOpen(false);
  }

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

  const current = PAGES.find((i) => i.href === here);

  /**
   * The section's mark in the rail and the overlay: `page` on the section's
   * own page, `location` on any page inside it — the reader is in the section
   * without being on its page, which is what `location` is for.
   */
  const inSection = (href: string) =>
    here === href ? 'page' : section?.href === href ? 'location' : undefined;

  return (
    <nav className="sidebar" aria-label="Documentation" data-open={open} ref={ref}>
      {/* The rail. On a narrow screen its list is gone and its foot — the
          theme toggle — is laid out by the bar's grid instead: the toggle is
          one element, placed by the stylesheet in either bar. */}
      <div className="rail">
        {/* The search at the head of the rail, where the M3 site keeps its
            own: a rail item on a wide screen, a row of the open menu on a
            narrow one — one element, placed by the stylesheet, like the
            brand and the toggle. */}
        <Search />
        <ul className="railList" aria-label="Sections">
          {NAV.map((group) => {
            const Icon = ICONS[group.href];
            return (
              <li key={group.href}>
                <Link href={group.href} className="railLink" aria-current={inSection(group.href)}>
                  <span className="railPill">{Icon && <Icon size={24} aria-hidden="true" />}</span>
                  <span className="railLabel">{group.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* At the foot of the rail on a wide screen, where the M3 site keeps
            its own; at the foot of the open menu on a narrow one. */}
        <div className="sidebarTheme">
          <ThemeToggle />
        </div>
      </div>

      {/* The drawer: the brand, then the pages of the section the reader is
          in, its own page first. No caption naming the section — the rail
          beside it already does, with the section's pill filled. A route no
          section lists gets the brand alone rather than a wrong section. */}
      <div className="drawer">
        <div className="sidebarBrand">
          <Link href="/" className="brand">
            Alpenglow
          </Link>
          <p className="brandNote">Theme: Eleonora</p>
        </div>

        {section && (
          <div className="drawerNav">
            <ul className="navList" aria-label={section.title}>
              <li>
                <Link
                  href={section.href}
                  className="navLink"
                  aria-current={here === section.href ? 'page' : undefined}
                >
                  Overview
                </Link>
              </li>
              {section.items.map((item) => (
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
        )}
      </div>

      {/* Shown only on narrow screens; the rail and drawer are always open on wider ones. */}
      <button
        type="button"
        className="navToggle"
        aria-expanded={open}
        aria-controls="nav-sections"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? 'Close' : (current?.label ?? 'Menu')}
      </button>

      {/* The open menu on a narrow screen: every section and every page, the
          section's title being the link to its page. */}
      <div className="navSections" id="nav-sections">
        {NAV.map((group) => (
          <div className="navGroup" key={group.href}>
            <Link href={group.href} className="navTitle navTitleLink" aria-current={inSection(group.href)}>
              {group.title}
            </Link>
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
