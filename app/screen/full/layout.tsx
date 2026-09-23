import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/** The page is a client component and cannot export metadata; its segment's layout does. */
export const metadata: Metadata = {
  title: 'A scheduling day — Alpenglow',
  robots: { index: false },
};

export default function FullScreenLayout({ children }: { children: ReactNode }) {
  return children;
}
