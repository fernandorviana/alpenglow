import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { Nav } from '@ui/Nav';
import { ThemeToggle } from '@ui/ThemeToggle';
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
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH }} />
      </head>
      <body>
        <div className="shell">
          <Nav />
          <div className="main">
            <header className="topbar">
              <ThemeToggle />
            </header>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
