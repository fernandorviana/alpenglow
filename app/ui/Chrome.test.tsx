import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

const path = vi.hoisted(() => ({ current: '/' }));
vi.mock('next/navigation', () => ({ usePathname: () => path.current }));

import { Chrome } from './Chrome';

const draw = () =>
  render(
    <Chrome skip={<a href="#content">Skip</a>} nav={<nav aria-label="Site" />} footer={<footer />}>
      <p>Page</p>
    </Chrome>,
  );

describe('Chrome', () => {
  it('draws the rail, the column and main around a page', () => {
    path.current = '/button/';
    draw();
    expect(screen.getByRole('navigation', { name: 'Site' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('Page');
  });

  it('draws the page alone on the full screen, trailing slash or not', () => {
    for (const p of ['/screen/full', '/screen/full/']) {
      path.current = p;
      const { unmount } = draw();
      expect(screen.queryByRole('navigation', { name: 'Site' })).toBeNull();
      expect(screen.getByText('Page')).toBeInTheDocument();
      unmount();
    }
  });
});
