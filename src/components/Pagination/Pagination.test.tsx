import { useState } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Pagination } from './Pagination';
import type { PaginationProps } from './Pagination';
import styles from './Pagination.module.css';
import { installPopoverStub } from '../../test/popover';
import { readCss, block } from '../../test/css';
import { axeViolations } from '../../test/axe';

installPopoverStub();

const nav = () => screen.getByRole('navigation', { name: 'Pagination' });
const pageButton = (n: number) => within(nav()).getByRole('button', { name: `Page ${n}` });
const combobox = () => screen.getByRole('combobox', { name: 'Results per page' });
const listbox = () => screen.getByRole('listbox', { hidden: true });
const isOpen = () => listbox().style.display === 'block';

/** Controlled, as a caller would hold it. */
function Held(props: Partial<PaginationProps> & { onPage?: (n: number) => void; onSize?: (n: number) => void }) {
  const { onPage, onSize, ...rest } = props;
  const [page, setPage] = useState(rest.page ?? 1);
  const [size, setSize] = useState(rest.pageSize ?? 10);
  return (
    <Pagination
      total={72}
      {...rest}
      page={page}
      pageSize={size}
      onPageChange={(n) => {
        setPage(n);
        onPage?.(n);
      }}
      onPageSizeChange={(n) => {
        setSize(n);
        onSize?.(n);
      }}
    />
  );
}

describe('Pagination — the pages', () => {
  it('is a named nav of buttons, with the current page marked', () => {
    render(<Pagination page={8} pageCount={24} onPageChange={() => {}} />);
    expect(within(nav()).getAllByRole('listitem')).toHaveLength(9);
    expect(pageButton(8)).toHaveAttribute('aria-current', 'page');
    expect(pageButton(7)).not.toHaveAttribute('aria-current');
    expect(within(nav()).getAllByText('…')).toHaveLength(2);
    expect(within(nav()).queryByRole('button', { name: '…' })).toBeNull();
  });

  it('tells the caller, and not for the page it is on', () => {
    const onPageChange = vi.fn();
    render(<Pagination page={2} pageCount={5} onPageChange={onPageChange} />);
    fireEvent.click(pageButton(4));
    fireEvent.click(pageButton(2));
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    fireEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(onPageChange.mock.calls).toEqual([[4], [3], [1]]);
  });

  it('keeps an arrow at an end in the tab order, disabled in name only', () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} pageCount={3} onPageChange={onPageChange} />);
    const previous = screen.getByRole('button', { name: 'Previous page' });
    // Not `disabled`: pressing Next onto the last page would drop the focus.
    expect(previous).toHaveAttribute('aria-disabled', 'true');
    expect(previous).not.toBeDisabled();
    fireEvent.click(previous);
    expect(onPageChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Next page' })).not.toHaveAttribute('aria-disabled');
  });

  it('clamps a page that is not there', () => {
    render(<Pagination page={99} pageCount={3} onPageChange={() => {}} />);
    expect(pageButton(3)).toHaveAttribute('aria-current', 'page');
  });

  it('says the page it has come to, politely', () => {
    render(<Held />);
    fireEvent.click(pageButton(3));
    expect(screen.getByRole('status')).toHaveTextContent('Page 3');
  });

  it('renders links with hrefFor, and still tells the caller', () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} pageCount={3} onPageChange={onPageChange} hrefFor={(n) => `?page=${n}`} />);
    const link = within(nav()).getByRole('link', { name: 'Page 2' });
    expect(link).toHaveAttribute('href', '?page=2');
    link.addEventListener('click', (event) => event.preventDefault());
    fireEvent.click(link);
    expect(onPageChange).toHaveBeenCalledWith(2);
    // An end has nowhere to go, so it is not a link.
    expect(screen.getByRole('button', { name: 'Previous page' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('hands each page to a router’s link, with its name, its href and its click', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        page={1}
        pageCount={3}
        onPageChange={onPageChange}
        hrefFor={(n) => `?page=${n}`}
        renderLink={({ children, ...props }) => (
          <a data-router="yes" {...props}>
            {children}
          </a>
        )}
      />,
    );
    const link = within(nav()).getByRole('link', { name: 'Page 2' });
    expect(link).toHaveAttribute('data-router', 'yes');
    expect(link).toHaveAttribute('href', '?page=2');
    link.addEventListener('click', (event) => event.preventDefault());
    fireEvent.click(link);
    expect(onPageChange).toHaveBeenCalledWith(2);
    // The ends are buttons, and the router is not asked for them.
    expect(screen.getByRole('button', { name: 'Previous page' })).not.toHaveAttribute('data-router');
  });

  it('leaves a new tab out of it: a modified click on a link does not page this list', () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} pageCount={3} onPageChange={onPageChange} hrefFor={(n) => `?page=${n}`} />);
    const link = within(nav()).getByRole('link', { name: 'Page 2' });
    link.addEventListener('click', (event) => event.preventDefault());
    fireEvent.click(link, { metaKey: true });
    fireEvent.click(link, { ctrlKey: true });
    fireEvent.click(link, { button: 1 });
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('treats a page that is not a number as the first', () => {
    render(<Held page={Number.NaN} />);
    expect(pageButton(1)).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('status')).toHaveTextContent('Page 1');
  });

  it('can be told not to announce, for the second of two on one list', () => {
    render(<Pagination page={1} pageCount={3} onPageChange={() => {}} announce={false} />);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('takes its words', () => {
    render(
      <Pagination
        page={1}
        pageCount={3}
        onPageChange={() => {}}
        label="Paginação"
        previousLabel="Anterior"
        nextLabel="Seguinte"
        pageLabel={(n) => `Página ${n}`}
      />,
    );
    const pages = screen.getByRole('navigation', { name: 'Paginação' });
    expect(within(pages).getByRole('button', { name: 'Página 2' })).toBeInTheDocument();
    expect(within(pages).getByRole('button', { name: 'Seguinte' })).toBeInTheDocument();
  });
});

describe('Pagination — the summary', () => {
  it('is absent without a total and a page size', () => {
    const { container } = render(<Pagination page={1} pageCount={3} onPageChange={() => {}} />);
    expect(container.querySelector(`.${styles.summary}`)).toBeNull();
  });

  it('says what is in view, which on the last page is not the page size', () => {
    const { container } = render(<Held page={8} />);
    expect(container.querySelector(`.${styles.summary}`)).toHaveTextContent('per page · 71–72 of 72');
    expect(combobox()).toHaveValue('10');
  });

  it('shows the size as text when it cannot be changed', () => {
    render(<Pagination page={1} total={72} pageSize={10} onPageChange={() => {}} />);
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.getByText('10').tagName).toBe('STRONG');
  });

  it('works out the pages from the total', () => {
    render(<Pagination page={1} total={72} pageSize={10} onPageChange={() => {}} />);
    expect(pageButton(8)).toBeInTheDocument();
    expect(within(nav()).queryByRole('button', { name: 'Page 9' })).toBeNull();
  });

  it('reports nothing as 0 of 0, on one page', () => {
    const { container } = render(<Pagination page={1} total={0} pageSize={10} onPageChange={() => {}} />);
    expect(container.querySelector(`.${styles.summary}`)).toHaveTextContent('0 of 0');
    expect(pageButton(1)).toHaveAttribute('aria-current', 'page');
  });

  it('hands the caller the parts, for a sentence in another order', () => {
    const { container } = render(
      <Held
        summary={({ size, from, to, total }) => (
          <>
            {from} a {to} de {total}, {size} por página
          </>
        )}
      />,
    );
    // The field's closed list is between the two halves, in the DOM and nowhere else.
    expect(container.querySelector(`.${styles.summary}`)).toHaveTextContent(/^1 a 10 de 72, .*por página$/);
    expect(combobox()).toBeInTheDocument();
  });
});

describe('Pagination — the page size', () => {
  it('is an editable combobox that suggests and does not filter', () => {
    render(<Held />);
    const field = combobox();
    expect(field).toHaveAttribute('aria-autocomplete', 'none');
    expect(field).toHaveAttribute('aria-expanded', 'false');
    expect(field).toHaveAttribute('aria-controls', listbox().id);
    expect(field).toHaveAttribute('inputmode', 'numeric');
    expect(field).not.toHaveAttribute('type', 'number');
    expect(within(listbox()).getAllByRole('option', { hidden: true }).map((o) => o.textContent)).toEqual(['10', '25', '50', '100']);
  });

  it('opens on an arrow at the size in use, moves, wraps, and Enter takes the option', () => {
    const onSize = vi.fn();
    render(<Held onSize={onSize} />);
    const field = combobox();
    act(() => field.focus());
    fireEvent.keyDown(field, { key: 'ArrowDown' });
    expect(isOpen()).toBe(true);
    expect(field).toHaveAttribute('aria-expanded', 'true');
    const options = within(listbox()).getAllByRole('option');
    expect(field).toHaveAttribute('aria-activedescendant', options[0]!.id);
    fireEvent.keyDown(field, { key: 'ArrowUp' });
    expect(field).toHaveAttribute('aria-activedescendant', options[3]!.id);
    fireEvent.keyDown(field, { key: 'ArrowDown' });
    fireEvent.keyDown(field, { key: 'ArrowDown' });
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(onSize).toHaveBeenCalledWith(25);
    expect(isOpen()).toBe(false);
    expect(field).toHaveValue('25');
  });

  it('takes what was typed, not an option highlighted before the typing', () => {
    const onSize = vi.fn();
    render(<Held onSize={onSize} />);
    fireEvent.keyDown(combobox(), { key: 'ArrowDown' });
    fireEvent.change(combobox(), { target: { value: '17' } });
    expect(combobox()).not.toHaveAttribute('aria-activedescendant');
    fireEvent.keyDown(combobox(), { key: 'Enter' });
    expect(onSize).toHaveBeenCalledWith(17);
  });

  it('offers nothing above the ceiling, and with nothing to offer is a plain field', () => {
    const { unmount } = render(<Held maxPageSize={50} />);
    expect(within(listbox()).getAllByRole('option', { hidden: true }).map((o) => o.textContent)).toEqual(['10', '25', '50']);
    unmount();
    const { container } = render(<Held pageSizeOptions={[]} />);
    fireEvent.keyDown(combobox(), { key: 'ArrowDown' });
    expect(isOpen()).toBe(false);
    expect(combobox()).not.toHaveAttribute('aria-activedescendant');
    expect(container.querySelector(`.${styles.sizeChevron}`)).toBeNull();
  });

  it('Alt and an arrow shows the list and chooses nothing', () => {
    render(<Held />);
    fireEvent.keyDown(combobox(), { key: 'ArrowDown', altKey: true });
    expect(isOpen()).toBe(true);
    expect(combobox()).not.toHaveAttribute('aria-activedescendant');
  });

  it('takes a typed number on Enter, digits only', () => {
    const onSize = vi.fn();
    render(<Held onSize={onSize} />);
    fireEvent.change(combobox(), { target: { value: '1e7-' } });
    expect(combobox()).toHaveValue('17');
    fireEvent.keyDown(combobox(), { key: 'Enter' });
    expect(onSize).toHaveBeenCalledWith(17);
  });

  it('commits on leaving', () => {
    const onSize = vi.fn();
    render(<Held onSize={onSize} />);
    act(() => combobox().focus());
    fireEvent.change(combobox(), { target: { value: '30' } });
    fireEvent.blur(combobox());
    expect(onSize).toHaveBeenCalledWith(30);
  });

  it('puts the old value back for nothing, for zero, and tells no one', () => {
    const onSize = vi.fn();
    render(<Held onSize={onSize} />);
    for (const junk of ['', '0', '000']) {
      fireEvent.change(combobox(), { target: { value: junk } });
      fireEvent.keyDown(combobox(), { key: 'Enter' });
      expect(combobox(), junk).toHaveValue('10');
    }
    expect(onSize).not.toHaveBeenCalled();
  });

  it('stops at the ceiling', () => {
    const onSize = vi.fn();
    render(<Held onSize={onSize} maxPageSize={50} />);
    fireEvent.change(combobox(), { target: { value: '999' } });
    // No more digits than the ceiling has.
    expect(combobox()).toHaveValue('99');
    fireEvent.keyDown(combobox(), { key: 'Enter' });
    expect(onSize).toHaveBeenCalledWith(50);
  });

  it('Esc closes the list, then puts the typing back, and only then is anyone else’s', () => {
    render(<Held />);
    const field = combobox();
    fireEvent.change(field, { target: { value: '33' } });
    fireEvent.keyDown(field, { key: 'ArrowDown', altKey: true });
    const press = () => {
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
      act(() => void field.dispatchEvent(event));
      return event.defaultPrevented;
    };
    expect(press()).toBe(true);
    expect(isOpen()).toBe(false);
    expect(field).toHaveValue('33');
    expect(press()).toBe(true);
    expect(field).toHaveValue('10');
    expect(press()).toBe(false);
  });

  it('a press on an option takes it and keeps the focus in the field', () => {
    const onSize = vi.fn();
    render(<Held onSize={onSize} />);
    fireEvent.keyDown(combobox(), { key: 'ArrowDown', altKey: true });
    const option = within(listbox()).getByRole('option', { name: '50' });
    const down = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    option.dispatchEvent(down);
    expect(down.defaultPrevented).toBe(true);
    fireEvent.click(option);
    expect(onSize).toHaveBeenCalledWith(50);
    expect(within(listbox()).getByRole('option', { name: '50', hidden: true })).toHaveAttribute('aria-selected', 'true');
  });

  it('keeps the reader’s place when the size changes', () => {
    const onPage = vi.fn();
    render(<Held page={5} onPage={onPage} />);
    // Rows 41–50 are in view. At 25 a page, row 41 is on page 2.
    fireEvent.change(combobox(), { target: { value: '25' } });
    fireEvent.keyDown(combobox(), { key: 'Enter' });
    expect(onPage).toHaveBeenCalledWith(2);
    expect(pageButton(2)).toHaveAttribute('aria-current', 'page');
  });

  it('is spans all the way down, so it can stand in a paragraph', () => {
    // A ul inside a p is closed early by the HTML parser: the server's markup
    // and React's disagree, which only the browser showed.
    const { container } = render(<Held />);
    const size = container.querySelector(`.${styles.size}`)!;
    expect([...size.querySelectorAll('*')].filter((el) => !['SPAN', 'INPUT', 'svg', 'path'].includes(el.tagName))).toEqual([]);
  });

  it('is as wide as its digits', () => {
    const { container } = render(<Held />);
    const size = container.querySelector(`.${styles.size}`) as HTMLElement;
    expect(size.style.getPropertyValue('--page-size-digits')).toBe('2');
    fireEvent.change(combobox(), { target: { value: '100' } });
    expect(size.style.getPropertyValue('--page-size-digits')).toBe('3');
  });
});

describe('Pagination — the stylesheet', () => {
  const css = readCss('src/components/Pagination/Pagination.module.css');

  it('marks the current page with the accent bar and a stronger number', () => {
    expect(block(css, '.item.current::after')).toContain('var(--ap-color-border-accent)');
    expect(block(css, '.item.current {')).toContain('var(--ap-color-text-primary)');
    expect(block(css, '.gap {')).toContain('var(--ap-color-text-secondary)');
  });

  it('lets a place give way to 24 and no further, from a width and not a basis', () => {
    // With `flex-basis: 40px` every place collapsed to its least: the nav is
    // sized by its content and a basis is not content. Only the browser showed it.
    const place = block(css, '.place {');
    expect(place).toMatch(/\bwidth:\s*var\(--ap-spacing-500\)/);
    expect(place).toMatch(/min-width:\s*var\(--ap-spacing-300\)/);
    expect(place).toMatch(/flex:\s*0 1 auto/);
  });

  it('turns the carets over under rtl', () => {
    expect(css).toMatch(/\.item\.previous:dir\(rtl\) svg/);
    expect(css).toMatch(/\.item\.next:dir\(rtl\) svg/);
  });

  it('shows the size can be changed at rest: no rule hides the chevron until hover', () => {
    expect(block(css, '.sizeChevron {')).not.toMatch(/opacity|visibility|display:\s*none/);
    expect(css).not.toMatch(/:hover\s+\.sizeChevron|\.size:hover\s*>/);
  });

  it('sizes the field in ch over tabular figures', () => {
    const field = block(css, '.sizeInput {');
    expect(field).toMatch(/width:\s*calc\(var\(--page-size-digits\) \* 1ch\)/);
    expect(field).toContain('tabular-nums');
  });

  it('places the list as the menu is placed, and says where it goes without anchors', () => {
    const list = block(css, '.sizeList {');
    expect(list).toMatch(/position-anchor:\s*var\(--page-size-anchor\)/);
    expect(list).toMatch(/inset:\s*auto/);
    expect(block(css, '@supports not (anchor-name: --a)')).toMatch(/margin:\s*auto/);
  });

  it('never reaches a classed part by descent, but for the theme’s own dark rule', () => {
    const headers = [...css.matchAll(/(^|\})\s*([^{}@]+)\{/g)].flatMap(([, , header]) => header!.split(','));
    const descending = headers
      .map((h) => h.trim())
      .filter((h) => !h.startsWith(':root'))
      .filter((h) => /\.[\w-]+\S*\s+[>+~]?\s*\./.test(h));
    expect(descending).toEqual([]);
  });
});

describe('Pagination — axe', () => {
  it('pages alone, and with the summary, closed and open', async () => {
    const { container } = render(
      <>
        <Pagination page={8} pageCount={24} onPageChange={() => {}} />
        <Held label="Results" />
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
    fireEvent.keyDown(combobox(), { key: 'ArrowDown' });
    expect(await axeViolations(container)).toEqual([]);
  });
});
