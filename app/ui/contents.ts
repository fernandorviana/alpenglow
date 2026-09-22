/**
 * The site's table of contents, in reading order.
 *
 * Not `sitemap.ts`: Next reads any file of that name under `app/` as the
 * `sitemap.xml` metadata route, `app/ui/` included, and the build fails on
 * the missing default export. Nothing checks that before `next build`.
 *
 * Four sections, each with a page of its own that presents the pages inside
 * it. One list serves three components: the rail draws the sections, the
 * drawer draws the pages of the section the reader is in, and the pager at
 * the foot of every page walks it flat — section page first, then its pages
 * — so "next" after the last page of one section is the next section's page.
 * A page that is not here has no neighbours, no drawer and no place in the
 * overlay, which is the same thing.
 */
export type NavItem = { href: string; label: string };
export type NavGroup = {
  title: string;
  /** The section's own page, which presents the pages below. */
  href: string;
  /** What the section holds, in one line, for the home page's section cards. */
  blurb: string;
  items: readonly NavItem[];
};

export const NAV: readonly NavGroup[] = [
  {
    title: 'Start here',
    href: '/',
    blurb: 'The name, what is measured, and the decisions that look like mistakes.',
    items: [
      { href: '/why', label: 'Why Alpenglow' },
      { href: '/accessibility', label: 'Accessibility' },
      { href: '/decisions', label: 'Decisions' },
    ],
  },
  {
    title: 'Developers',
    href: '/develop',
    blurb: 'The package in a Next.js or Vite app, its Tailwind theme, and the dark mode switch.',
    items: [
      { href: '/install', label: 'Install' },
      { href: '/tailwind', label: 'Tailwind' },
      { href: '/dark-mode', label: 'Dark mode' },
    ],
  },
  {
    title: 'Foundations',
    href: '/foundations',
    blurb: 'Colour, elevation, type, space and icons — the tokens every component is built from.',
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
    href: '/components',
    blurb: 'Twenty-seven components, each with its states measured in both modes.',
    items: [
      { href: '/accordion', label: 'Accordion' },
      { href: '/alert', label: 'Alert' },
      { href: '/avatar', label: 'Avatar and Loader' },
      { href: '/badge', label: 'Badge' },
      { href: '/breadcrumb', label: 'Breadcrumb' },
      { href: '/button', label: 'Button' },
      { href: '/card', label: 'Card' },
      { href: '/input', label: 'Input and Textarea' },
      { href: '/choice', label: 'Checkbox, Radio, Switch' },
      { href: '/combobox', label: 'Combobox' },
      { href: '/date-picker', label: 'Date picker' },
      { href: '/dialog', label: 'Dialog' },
      { href: '/drawer', label: 'Drawer' },
      { href: '/dropdown-menu', label: 'Dropdown menu' },
      { href: '/empty-state', label: 'Empty state' },
      { href: '/filters', label: 'Filters' },
      { href: '/link', label: 'Link' },
      { href: '/pagination', label: 'Pagination' },
      { href: '/popover', label: 'Popover' },
      { href: '/progress', label: 'Progress' },
      { href: '/select', label: 'Select' },
      { href: '/skeleton', label: 'Skeleton' },
      { href: '/table', label: 'Table' },
      { href: '/tabs', label: 'Tabs' },
      { href: '/tag', label: 'Tag' },
      { href: '/toast', label: 'Toast' },
      { href: '/tooltip', label: 'Tooltip' },
    ],
  },
];

/** A section's own page, as a page: it is the section's name in the pager and the narrow bar. */
export const sectionPage = (group: NavGroup): NavItem => ({ href: group.href, label: group.title });

/** Every page, in reading order: each section's page, then the pages inside it. */
export const PAGES: readonly NavItem[] = NAV.flatMap((group) => [sectionPage(group), ...group.items]);

/** `/button/` and `/button` are one page; the export writes the first. */
export const route = (pathname: string) => pathname.replace(/\/+$/, '') || '/';

/** The section `pathname` is in — by its own route or one of its pages — or `undefined`. */
export function sectionOf(pathname: string): NavGroup | undefined {
  const here = route(pathname);
  return NAV.find((group) => group.href === here || group.items.some((item) => item.href === here));
}

/** The pages either side of `pathname` in reading order; `undefined` at each end. */
export function neighbours(pathname: string): { previous?: NavItem; next?: NavItem } {
  const at = PAGES.findIndex((page) => page.href === route(pathname));
  if (at === -1) return {};
  return { previous: PAGES[at - 1], next: PAGES[at + 1] };
}

/**
 * What the palette offers before anything is typed, after the reader's own
 * recent destinations. Chosen by hand — the site is static and has no
 * analytics at runtime to rank by — and held to `PAGES` by `Search.test.tsx`.
 */
export const SUGGESTED: readonly string[] = ['/install', '/button', '/colour', '/decisions', '/dark-mode'];
