import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { density } from '@/tokens/density';
import DensityPage from './page';

describe('Density page', () => {
  it('lists every density token with both values', () => {
    render(<DensityPage />);
    for (const [name, v] of Object.entries(density)) {
      // An exact match, not a substring search: `row` is a literal prefix of
      // `row-header`, so a regex `density/${name}` against a row's full
      // accessible name would find both rows for `name === 'row'`. The
      // Token cell's own text is exactly `density/${name}`, and `getByText`'s
      // default string matcher requires the whole normalized text to equal
      // it — `density/row` alone never matches a cell reading
      // `density/row-header`.
      const cell = screen.getByText(`density/${name}`, { selector: '.tokenName' });
      const row = cell.closest('tr');
      expect(row).not.toBeNull();
      expect(row).toHaveTextContent(String(v.comfortable));
      expect(row).toHaveTextContent(String(v.compact));
    }
  });

  it('draws the compact specimen inside data-density', () => {
    const { container } = render(<DensityPage />);
    expect(container.querySelector('[data-density="compact"] table')).not.toBeNull();
  });
});
