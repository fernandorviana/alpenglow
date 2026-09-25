import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Page from './page';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: () => {} }),
  useSearchParams: () => new URLSearchParams(),
}));

// jsdom has no matchMedia; the theme toggle inside the shared nav asks it.
window.matchMedia = (query: string) =>
  ({ matches: false, media: query, addEventListener: () => {}, removeEventListener: () => {} }) as unknown as MediaQueryList;

/**
 * "Gaps in the set" and "From the domain" lay out icon + name pairs on a
 * `minmax(140px, 1fr)` auto-fill grid, each pair a flex row with no explicit
 * basis on either child. A name longer than the row's leftover width shrinks
 * the icon along with it — measured on the live site, `UserVerifiedOutline`
 * rendered at ~8px instead of the drawn 20. `flex-shrink: 0` on the icon
 * keeps it at its declared size and lets the name wrap or truncate instead.
 */
const DRAWN_ICON_NAMES = [
  'ChevronSmallDown',
  'ChevronSmallRight',
  'AiSparkle',
  'TextHeading',
  'BrushFreehand',
  'Angle',
  'MarkUnread',
  'UserVerified',
  'UserVerifiedOutline',
  'Resources',
  'Services',
  'WaitingRoom',
  'Availability',
  'UserMedic',
  'StressBreathEditor',
] as const;

describe('the drawn-icon grids', () => {
  it('keeps every icon at its declared size: the svg beside each name never shrinks', () => {
    const { container } = render(<Page />);
    // Scoped to `.alias` (the Grid's own label) rather than `getByText`: the
    // page also mentions `UserVerified` and `UserVerifiedOutline` in prose,
    // as `<code>`, which is a second, unrelated match for the same text.
    const aliases = [...container.querySelectorAll('.alias')].filter((el) =>
      (DRAWN_ICON_NAMES as readonly string[]).includes(el.textContent ?? ''),
    );
    expect(aliases.map((el) => el.textContent).sort()).toEqual([...DRAWN_ICON_NAMES].sort());
    for (const label of aliases) {
      const svg = label.previousElementSibling;
      const name = label.textContent;
      expect(svg?.tagName.toLowerCase(), name!).toBe('svg');
      expect((svg as HTMLElement).style.flexShrink, name!).toBe('0');
    }
  });
});
