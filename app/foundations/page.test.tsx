import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { block, readCss } from '@/test/css';
import { DIVERGING } from '@ui/chart';
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
 * The Data visualisation card's picture, `.chartRamp`, is a CSS grid of
 * empty `<span>`s inside `.cardVisual`, which is `display: grid; place-items:
 * center`. `place-items: center` sizes a grid item to its own content
 * instead of stretching it to the track — and empty spans have no content,
 * so the ramp measured 0 wide at every viewport, in both modes. The same
 * markup on /data-vis never showed the bug because there `.chartRamp` is a
 * block child, not a centered grid item.
 */
describe('the data-visualisation card picture', () => {
  const css = readCss('app/docs.css');

  it('gives .chartRamp its own inline size, so it has something to be centered at', () => {
    const body = block(css, '.chartRamp {');
    expect(body).toMatch(/inline-size:\s*100%/);
  });

  it('stretches the ramp across the card visual instead of centering it to its own (empty) content size', () => {
    const body = block(css, '.cardVisual > .chartRamp {');
    expect(body).toMatch(/justify-self:\s*stretch/);
  });

  it('renders one span per diverging step on the card', () => {
    const { container } = render(<Page />);
    const ramp = container.querySelector('.chartRamp');
    expect(ramp).not.toBeNull();
    expect(ramp!.querySelectorAll('span')).toHaveLength(DIVERGING.length);
  });
});
