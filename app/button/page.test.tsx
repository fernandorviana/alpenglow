import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { readCss, block } from '@/test/css';
import Page from './page';

/**
 * The page's dialog footer — Keep editing, Save draft, Confirm booking —
 * wrapped at 320 and 375 and left "Confirm booking", the action the footer
 * is for, alone on a second row. Below `xs` the three stack full width, the
 * way the xs Dialog's footer does: in reading order, the first on top, as
 * drawn (Modals, Size=xs, 608:10569: Cancel over Save).
 */
describe('the Button page', () => {
  it('stacks the dialog footer’s three actions full width below xs, in reading order', () => {
    render(<Page />);
    const keep = screen.getByRole('button', { name: 'Keep editing' });
    const footer = keep.parentElement!;
    expect(footer).toHaveClass('footerExample');
    expect([...footer.children].map((b) => b.textContent)).toEqual(['Keep editing', 'Save draft', 'Confirm booking']);

    // Every `@media (width < 30rem)` block in the sheet, and the one that names the example.
    const css = readCss('app/docs.css');
    const narrow = css
      .split('@media (width < 30rem)')
      .slice(1)
      .map((rest) => block(`@media${rest}`, '@media'))
      .find((body) => body.includes('.footerExample'));
    expect(narrow).toBeDefined();
    const rule = block(narrow!, '.footerExample');
    expect(rule).toMatch(/flex-direction: column/);
    expect(rule).toMatch(/align-items: stretch/);
    // The xs Dialog's 8 between stacked actions.
    expect(rule).toMatch(/gap: var\(--ap-spacing-100\)/);
    expect(rule).not.toMatch(/column-reverse|order:/);
  });
});
