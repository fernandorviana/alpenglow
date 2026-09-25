import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { axeViolations } from '@/test/axe';
import { readCss, block } from '@/test/css';
import { CodeBlock } from './CodeBlock';

/**
 * A code window on the site: the code, exactly; a file name over it when it
 * is a file; a button that copies it; and the colour, from the tokenizer,
 * without a letter added or lost.
 */
describe('CodeBlock', () => {
  const code = "import { Button } from 'alpenglow';\n\n<Button>Save</Button>";

  it('renders the code, letter for letter, in a pre', () => {
    const { container } = render(<CodeBlock code={code} lang="tsx" />);
    expect(container.querySelector('pre code')).toHaveTextContent(code, { normalizeWhitespace: false });
    expect(container.querySelector('pre code')!.textContent).toBe(code);
  });

  it('still bars the code with its language and no line numbers when it has no title', () => {
    // No file name to show, but the language is never optional (`lang` is a
    // required prop) — the bar shows it alone, so the button always has a
    // bar to sit on instead of floating over the first line.
    const { container } = render(<CodeBlock code={code} lang="tsx" />);
    expect(screen.getByRole('figure')).toBeInTheDocument();
    const header = container.querySelector('.codeHeader');
    expect(header).not.toBeNull();
    expect(header).toHaveTextContent('TSX');
    expect(container.querySelector('.codeTitle')).toBeNull();
    expect(container.querySelector('.codeNumbered')).toBeNull();
  });

  it('puts the copy button on the bar, not floating over the code, whether or not there is a title', () => {
    for (const el of [
      render(<CodeBlock code={code} lang="tsx" />).container,
      render(<CodeBlock code={code} lang="tsx" title="app/page.tsx" />).container,
    ]) {
      const header = el.querySelector('.codeHeader');
      expect(header?.querySelector('.codeCopy')).not.toBeNull();
    }
  });

  it('names a file in its caption, with the language, and numbers the lines', () => {
    const { container } = render(<CodeBlock code={code} lang="tsx" title="app/page.tsx" />);
    // The figure is named by its caption in the browser (HTML-AAM); the
    // test library does not compute that, so the caption is asserted itself.
    expect(container.querySelector('figcaption')).toHaveTextContent('TSX');
    expect(container.querySelector('figcaption')).toHaveTextContent('app/page.tsx');
    expect(container.querySelector('.codeNumbered')).not.toBeNull();
    expect(container.querySelectorAll('.codeLine')).toHaveLength(3);
  });

  it('keeps the line numbers out of the text, so a copy has none', () => {
    const { container } = render(<CodeBlock code={code} lang="tsx" title="app/page.tsx" />);
    expect(container.querySelector('pre')!.textContent).toBe(code);
  });

  it('paints the tokens by kind', () => {
    const { container } = render(<CodeBlock code={code} lang="tsx" />);
    const keyword = container.querySelector('.tokKeyword');
    expect(keyword).toHaveTextContent('import');
    expect(container.querySelector('.tokString')).toHaveTextContent("'alpenglow'");
  });

  describe('the copy button', () => {
    const writeText = vi.fn(() => Promise.resolve());
    afterEach(() => {
      writeText.mockClear();
      vi.useRealTimers();
    });

    it('copies the code and says so, then offers again two seconds later', async () => {
      vi.useFakeTimers();
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
      render(<CodeBlock code={code} lang="tsx" />);

      const button = screen.getByRole('button', { name: 'Copy code' });
      await act(async () => {
        fireEvent.click(button);
      });
      expect(writeText).toHaveBeenCalledWith(code);
      expect(screen.getByRole('button', { name: 'Copied' })).toBe(button);
      expect(screen.getByText('Copied', { selector: '[aria-live]' })).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(screen.getByRole('button', { name: 'Copy code' })).toBe(button);
    });
  });

  it('has no axe violation, with a title and without', async () => {
    const { container } = render(
      <>
        <CodeBlock code={code} lang="tsx" />
        <CodeBlock code={code} lang="tsx" title="app/page.tsx" />
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe('the code block stylesheet', () => {
  const css = readCss('app/docs.css');

  it('draws the block as a raised card with a hairline, so it has an edge in dark', () => {
    const rule = block(css, '.codeBlock {');
    expect(rule).toMatch(/background: var\(--ap-color-surface-raised\)/);
    expect(rule).toMatch(/border: var\(--ap-border-width-hairline\) solid var\(--ap-color-border-subtle\)/);
    expect(rule).toMatch(/border-radius: var\(--ap-radius-2xl\)/);
  });

  it('scrolls a long line inside the block', () => {
    expect(block(css, '.codeBlock pre {')).toMatch(/overflow-x: auto/);
  });

  it('has no bare-pre padding hack: every block has its header bar now, so the button never needs the pre to make room for it', () => {
    expect(css).not.toContain(':not(:has(.codeHeader))');
  });

  it('draws the line numbers from CSS and keeps them out of a selection', () => {
    const rule = block(css, '.codeNumbered .codeLine::before {');
    expect(rule).toMatch(/content: counter\(line\)/);
    expect(rule).toMatch(/user-select: none/);
  });

  it('paints every token kind with a text token of the theme', () => {
    for (const kind of ['Comment', 'Keyword', 'String', 'Punctuation']) {
      expect(block(css, `.tok${kind} {`)).toMatch(/color: var\(--ap-color-text-[a-z]+\)/);
    }
  });
});
