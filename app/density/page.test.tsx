import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { density } from '@/tokens/density';
import DensityPage from './page';

describe('Density page', () => {
  it('lists every density token with both values', () => {
    render(<DensityPage />);
    for (const [name, v] of Object.entries(density)) {
      const row = screen.getByRole('row', { name: new RegExp(`density/${name}`) });
      expect(row).toHaveTextContent(String(v.comfortable));
      expect(row).toHaveTextContent(String(v.compact));
    }
  });

  it('draws the compact specimen inside data-density', () => {
    const { container } = render(<DensityPage />);
    expect(container.querySelector('[data-density="compact"] table')).not.toBeNull();
  });
});
