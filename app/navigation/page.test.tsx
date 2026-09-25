import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Page from './page';

vi.mock('next/navigation', () => ({
  usePathname: () => '/navigation',
  useRouter: () => ({ push: () => {} }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('the Navigation page', () => {
  it('puts Try it in a specimen that scrolls sideways, so a phone scrolls to the bar’s actions instead of losing them', () => {
    // The bar is 636 wide with its five actions; a specimen that clipped it
    // cut everything after Create at 375 and 320.
    const { container } = render(<Page />);
    const bar = container.querySelector('header')!;
    const scroller = bar.closest('.sidewaysScroll');
    expect(scroller).not.toBeNull();
    expect(scroller!.parentElement).toHaveClass('sideways', 'specimen');
    expect(scroller).toContainElement(screen.getByRole('navigation', { name: 'Main' }));
  });
});
