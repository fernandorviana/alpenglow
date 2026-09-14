import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { theme, type ThemeTokenName } from '@/tokens/theme';
import { tokenId } from '@ui/slug';
import Page from './page';

vi.mock('next/navigation', () => ({ usePathname: () => '/colour' }));

describe('the Colour page', () => {
  it('gives every token row an id the search can land on', () => {
    // A token hit points at `/colour#surface-raised`; the row is the target,
    // not the group heading above it, so a reader lands on the value.
    const { container } = render(<Page />);
    for (const token of Object.keys(theme) as ThemeTokenName[]) {
      const row = container.querySelector(`#${tokenId(token)}`);
      expect(row, token).not.toBeNull();
      expect(row?.tagName).toBe('TR');
    }
  });
});
