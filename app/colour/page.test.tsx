import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { theme, type ThemeTokenName } from '@/tokens/theme';
import { tokenId } from '@ui/slug';
import Page from './page';

vi.mock('next/navigation', () => ({ usePathname: () => '/colour' }));

describe('the Colour page', () => {
  it('gives every token row an id the search can land on', () => {
    // A token hit points at `/colour#surface-raised`; the target is in the
    // token's row, not the group heading above it, so a reader lands on the
    // value. The package Table draws the row, so the id is on the name in
    // its first cell rather than on the <tr>.
    const { container } = render(<Page />);
    for (const token of Object.keys(theme) as ThemeTokenName[]) {
      const target = container.querySelector(`#${tokenId(token)}`);
      expect(target, token).not.toBeNull();
      const row = target?.closest('tr');
      expect(row, token).not.toBeNull();
      expect(row?.querySelector('td')?.contains(target!), token).toBe(true);
      expect(target?.textContent).toBe(token.split('/').slice(1).join('/'));
    }
  });
});
