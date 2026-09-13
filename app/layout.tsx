import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { Footer } from '@ui/Footer';
import { Nav } from '@ui/Nav';
import { SkipLink } from '@ui/SkipLink';
import { InlineScript } from '@ui/InlineScript';
import '@/styles/tokens.css';
import './docs.css';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Alpenglow',
  description:
    'A design system for dense, data-heavy interfaces. Light and dark, with every contrast ratio measured rather than assumed.',
};

/**
 * Applies the stored theme before the browser paints.
 *
 * The site is statically exported, so the served HTML carries no theme
 * attribute. Without this, a viewer who has chosen dark would see one frame of
 * light while React hydrates.
 *
 * Not `next/script` with `beforeInteractive`: in the App Router that queues the
 * code for the Next.js runtime to run, which is after the first paint.
 */
const NO_FLASH = `
try {
  var c = localStorage.getItem('alpenglow-theme');
  if (c === 'light' || c === 'dark') document.documentElement.setAttribute('data-theme', c);
} catch (e) {}
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head>
        <InlineScript html={NO_FLASH} />
      </head>
      <body>
        <SkipLink />
        <div className="shell">
          <Nav />
          {/* The page and the footer share a column beside the sidebar, so the
              footer runs to the width of the page rather than under the
              sidebar, and the nav's narrow-screen overlay covers both: it makes
              every sibling of its own inert, and this column is the sibling.
              The footer is outside `main` because `contentinfo` is a landmark
              only there. */}
          <div className="column">
            <main className="main" id="content" tabIndex={-1}>
              {children}
            </main>
            <Footer />
          </div>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
