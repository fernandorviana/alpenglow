import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Page from './page';

vi.mock('next/navigation', () => ({
  usePathname: () => '/components',
  useRouter: () => ({ push: () => {} }),
  useSearchParams: () => new URLSearchParams(),
}));

// A phone: every `width <` query matches, no `width >=` one does.
window.matchMedia = (query: string) =>
  ({
    matches: /width </.test(query),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }) as unknown as MediaQueryList;

/**
 * The Navigation card's picture is a SideNav at rest. Below md a SideNav
 * becomes a sheet the TopBar opens, closed until then, so on a phone the
 * picture was an empty well. The picture is the rail at every width.
 */
describe('the Components page', () => {
  it('draws the Navigation card’s side nav on a phone, not a closed sheet', () => {
    render(<Page />);
    const card = screen.getByRole('link', { name: 'Navigation' }).closest('.card')!;
    const picture = card.querySelector('.cardVisual') as HTMLElement;
    expect(picture.querySelector('dialog')).toBeNull();
    const nav = within(picture).getByRole('navigation', { name: 'Example' });
    expect(within(nav).getAllByRole('link').map((a) => a.textContent)).toEqual(['Home', 'Calendar']);
  });
});
