import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { breakpoint, minViewport } from '@/tokens/scale';
import { layout } from '@/tokens/layout';
import Page from './page';

describe('the Layout page', () => {
  it('has one row per breakpoint, from the scale', () => {
    render(<Page />);
    const table = screen.getByRole('table', { name: 'Breakpoints' });
    for (const [name, px] of Object.entries(breakpoint)) {
      const row = within(table).getByRole('row', { name: new RegExp(`^${name} `) });
      expect(row).toHaveTextContent(`${px / 16}rem`);
      expect(row).toHaveTextContent(`${px}px`);
    }
    expect(screen.getByText(new RegExp(`${minViewport}px`))).toBeInTheDocument();
  });

  it('has the margin and gap in their three modes', () => {
    render(<Page />);
    const table = screen.getByRole('table', { name: 'Layout tokens' });
    const margin = within(table).getByRole('row', { name: /layout\/margin/ });
    expect(margin).toHaveTextContent(`${layout.margin.narrow}px`);
    expect(margin).toHaveTextContent(`${layout.margin.medium}px`);
    expect(margin).toHaveTextContent(`${layout.margin.wide}px`);
  });

  it('links the layering rule to its decision', () => {
    render(<Page />);
    expect(screen.getByRole('link', { name: /no z-index tokens/i })).toHaveAttribute('href', '/decisions#no-z-index-tokens');
  });

});
