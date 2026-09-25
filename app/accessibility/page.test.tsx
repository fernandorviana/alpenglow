import { render, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Page from './page';

vi.mock('next/navigation', () => ({ usePathname: () => '/accessibility' }));

describe('the Accessibility page', () => {
  it('lets a worst-case table’s token name break after its slash and nowhere else', () => {
    // Held to one line, `interactive/on-accent` left no room on a 320 screen
    // for the "Light, worst case" header, which was cut to "LIGHT, WO…".
    const { getByRole } = render(<Page />);
    const table = within(getByRole('region', { name: 'Button labels, on the accent fills' }));
    const cell = table.getByText((_, el) => el?.classList.contains('wraps') === true && el.textContent === 'interactive/on-accent');
    const parts = [...cell.children];
    expect(parts.map((part) => part.tagName)).toEqual(['SPAN', 'WBR', 'SPAN']);
    expect(parts[0]).toHaveClass('unbroken');
    expect(parts[0]).toHaveTextContent('interactive/');
    expect(parts[2]).toHaveClass('unbroken');
    expect(parts[2]).toHaveTextContent('on-accent');
  });
});
