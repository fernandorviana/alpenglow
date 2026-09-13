import Link from 'next/link';
import pkg from '../../package.json';

/**
 * The links a reader needs that the sidebar cannot hold.
 *
 * The sidebar lists the pages and nothing else, so until now the site said
 * nowhere where the package is, where the source is, or what licence either
 * comes under — a visitor who arrived on a component page had to guess at the
 * URL. Those links live here, once, at the foot of every page.
 *
 * Read from `package.json` rather than written out, for the same reason the
 * Install page reads the version from it: a site that promises measured
 * numbers cannot point at a repository the package does not name.
 * `repository.url` is npm's `git+….git` form, which a browser will not open.
 */
const REPOSITORY = pkg.repository.url.replace(/^git\+/, '').replace(/\.git$/, '');
const NPM = `https://www.npmjs.com/package/${pkg.name}`;
const LICENCE = `${REPOSITORY}/blob/main/LICENSE`;
const CARBON = 'https://carbondesignsystem.com/elements/icons/library/';
const INTER = 'https://rsms.me/inter/';

type FooterLink = { href: string; label: string };
type FooterGroup = { title: string; links: readonly FooterLink[] };

/**
 * Three groups: what to install, what the system claims about itself, and
 * where both live. Every internal link is a page the sidebar lists —
 * `Footer.test.tsx` holds them to that, so a footer link cannot outlive the
 * page it points at.
 */
export const FOOTER: readonly FooterGroup[] = [
  {
    title: 'The package',
    links: [
      { href: '/install', label: 'Install' },
      { href: '/tailwind', label: 'Tailwind' },
      { href: '/dark-mode', label: 'Dark mode' },
      { href: NPM, label: 'npm' },
    ],
  },
  {
    title: 'The system',
    links: [
      { href: '/why', label: 'Why Alpenglow' },
      { href: '/accessibility', label: 'Accessibility' },
      { href: '/decisions', label: 'Decisions' },
    ],
  },
  {
    title: 'The source',
    links: [
      { href: REPOSITORY, label: 'Repository' },
      { href: pkg.bugs, label: 'Issues' },
      { href: LICENCE, label: `${pkg.license} licence` },
    ],
  },
];

/** A site page routes through Next; anything else is a plain link out. */
function FooterAnchor({ href, label }: FooterLink) {
  if (href.startsWith('/')) {
    return (
      <Link href={href} className="footerLink">
        {label}
      </Link>
    );
  }
  return (
    <a href={href} className="footerLink">
      {label}
    </a>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="footerInner">
        <div className="footerBrand">
          <p className="footerName">Alpenglow</p>
          <p className="footerNote">
            A design system for dense, data-heavy interfaces. The site is built from the system it
            documents: every colour on this page is one of its tokens.
          </p>
        </div>

        <div className="footerGroups">
          {FOOTER.map((group) => (
            <div className="footerGroup" key={group.title}>
              <p className="footerTitle">{group.title}</p>
              <ul className="footerList">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <FooterAnchor {...link} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* The version is the package's own, so the foot of the site and the
          Install page cannot disagree. No year: a copyright line with a stale
          year is the cheapest way to look unmaintained. */}
      <p className="footerColophon">
        Alpenglow {pkg.version} · {pkg.author} · Icons from{' '}
        <a href={CARBON} className="footerLink">
          IBM Carbon
        </a>
        , Apache 2.0 · Set in{' '}
        <a href={INTER} className="footerLink">
          Inter
        </a>
      </p>
    </footer>
  );
}
