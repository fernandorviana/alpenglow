/**
 * The site's table of contents, in reading order.
 *
 * One list serves two components: the sidebar draws it in groups, and the
 * pager at the foot of every page walks it flat, so "next" after the last
 * page of one group is the first page of the next. A page that is not here
 * has no neighbours and no place in the sidebar, which is the same thing.
 */
export type NavItem = { href: string; label: string };
export type NavGroup = { title: string; items: readonly NavItem[] };

export const NAV: readonly NavGroup[] = [
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
    title: 'Developers',
    items: [
      { href: '/install', label: 'Install' },
      { href: '/tailwind', label: 'Tailwind' },
      { href: '/dark-mode', label: 'Dark mode' },
    ],
  },
  {
    title: 'Foundations',
    items: [
      { href: '/colour', label: 'Colour' },
      { href: '/elevation', label: 'Elevation and states' },
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
      { href: '/dialog', label: 'Dialog' },
      { href: '/dropdown-menu', label: 'Dropdown menu' },
      { href: '/select', label: 'Select' },
      { href: '/table', label: 'Table' },
    ],
  },
];

/** Every page, in reading order. */
export const PAGES: readonly NavItem[] = NAV.flatMap((group) => group.items);

/** `/button/` and `/button` are one page; the export writes the first. */
export const route = (pathname: string) => pathname.replace(/\/+$/, '') || '/';

/** The pages either side of `pathname` in reading order; `undefined` at each end. */
export function neighbours(pathname: string): { previous?: NavItem; next?: NavItem } {
  const at = PAGES.findIndex((page) => page.href === route(pathname));
  if (at === -1) return {};
  return { previous: PAGES[at - 1], next: PAGES[at + 1] };
}
