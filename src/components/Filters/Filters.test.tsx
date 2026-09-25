import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterAll, beforeAll, describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { Filters } from './Filters';
import type { FilterField, FilterValue } from './Filters';
import styles from './Filters.module.css';
import { Dialog } from '../Dialog/Dialog';
import { Drawer } from '../Drawer/Drawer';
import { TOOLTIP_OPEN_DELAY } from '../Tooltip/Tooltip';
import { installPopoverStub } from '../../test/popover';
import { installDialogStub } from '../../test/dialog';
import { readCss, block } from '../../test/css';
import { axeViolations } from '../../test/axe';

installPopoverStub();

const css = readCss('src/components/Filters/Filters.module.css');

const fields: FilterField[] = [
  {
    key: 'status',
    label: 'Status',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'pending', label: 'Invite pending' },
    ],
  },
  {
    key: 'role',
    label: 'Role',
    options: [
      { value: 'owner', label: 'Owner' },
      { value: 'admin', label: 'Admin' },
    ],
  },
];

const value: FilterValue[] = [{ key: 'status', values: ['active', 'pending'] }];

describe('Filters — the bar', () => {
  it('is a group named Filters, with a chip for each field that has a value', () => {
    render(<Filters fields={fields} value={value} onChange={() => {}} />);
    const group = screen.getByRole('group', { name: 'Filters' });
    expect(group).toHaveClass(styles.filters!);
    const chip = within(group).getByRole('button', { name: 'Status is Active or Invite pending' });
    expect(chip).toHaveAttribute('aria-haspopup', 'dialog');
    expect(within(group).getByRole('button', { name: 'Remove Status filter' })).toBeInTheDocument();
  });

  it('says the words the caller gives', () => {
    render(
      <Filters
        fields={fields}
        value={value}
        onChange={() => {}}
        describe={(field, chosen) => `${field.label}: ${chosen.map((o) => o.label).join(', ')}`}
      />,
    );
    expect(screen.getByRole('button', { name: 'Status: Active, Invite pending' })).toBeInTheDocument();
  });

  it('ignores a value whose field or option it does not know', () => {
    render(
      <Filters fields={fields} value={[{ key: 'nowhere', values: ['x'] }, { key: 'status', values: ['gone'] }]} onChange={() => {}} />,
    );
    expect(screen.queryByRole('button', { name: /Remove/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  it('removes a chip, and reports the rest', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Filters fields={fields} value={[...value, { key: 'role', values: ['admin'] }]} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Remove Status filter' }));
    expect(onChange).toHaveBeenLastCalledWith([{ key: 'role', values: ['admin'] }]);
  });

  it('clears everything, and offers Clear only with something to clear', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<Filters fields={fields} value={value} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
    rerender(<Filters fields={fields} value={[]} onChange={onChange} />);
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  it('takes its labels from the caller', () => {
    render(<Filters fields={fields} value={value} onChange={() => {}} label="Filtros" addLabel="Adicionar" clearLabel="Limpar" />);
    expect(screen.getByRole('group', { name: 'Filtros' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adicionar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Limpar' })).toBeInTheDocument();
  });
});

describe('Filters — adding and changing', () => {
  it('adds a filter: the fields, then a field’s values, and a check reports the new value', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Filters fields={fields} value={[]} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Add filter' }));
    const panel = screen.getByRole('dialog', { name: 'Add filter' });
    expect(within(panel).queryByRole('checkbox')).not.toBeInTheDocument();
    await user.click(within(panel).getByRole('button', { name: 'Role' }));
    expect(within(panel).getByRole('button', { name: 'Role' })).toHaveAttribute('aria-pressed', 'true');
    const group = within(panel).getByRole('group', { name: 'Role' });
    await user.click(within(group).getByRole('checkbox', { name: 'Admin' }));
    expect(onChange).toHaveBeenLastCalledWith([{ key: 'role', values: ['admin'] }]);
  });

  it('keeps the order of the fields in the value, and of the options in a field', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Filters fields={fields} value={[{ key: 'role', values: ['admin'] }]} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Add filter' }));
    const panel = screen.getByRole('dialog', { name: 'Add filter' });
    await user.click(within(panel).getByRole('button', { name: 'Role' }));
    await user.click(within(panel).getByRole('checkbox', { name: 'Owner' }));
    expect(onChange).toHaveBeenLastCalledWith([{ key: 'role', values: ['owner', 'admin'] }]);
  });

  it('keeps a value it does not know, after the known ones', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Filters fields={fields} value={[{ key: 'status', values: ['gone', 'active'] }]} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Status is Active' }));
    await user.click(within(screen.getByRole('dialog', { name: 'Status' })).getByRole('checkbox', { name: 'Inactive' }));
    expect(onChange).toHaveBeenLastCalledWith([{ key: 'status', values: ['active', 'inactive', 'gone'] }]);
  });

  it('opens a chip’s values from its words, and unchecking the last one drops the field', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Filters fields={fields} value={[{ key: 'role', values: ['admin'] }, ...value]} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Role is Admin' }));
    const panel = screen.getByRole('dialog', { name: 'Role' });
    const admin = within(panel).getByRole('checkbox', { name: 'Admin' });
    expect(admin).toBeChecked();
    expect(within(panel).getByRole('checkbox', { name: 'Owner' })).not.toBeChecked();
    await user.click(admin);
    expect(onChange).toHaveBeenLastCalledWith(value);
  });

  it('has no axe violations, closed and open', async () => {
    const user = userEvent.setup();
    const { container } = render(<Filters fields={fields} value={value} onChange={() => {}} />);
    expect(await axeViolations(container)).toEqual([]);
    await user.click(screen.getByRole('button', { name: 'Add filter' }));
    await user.click(within(screen.getByRole('dialog', { name: 'Add filter' })).getByRole('button', { name: 'Status' }));
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe('Filters — stylesheet', () => {
  it('frames the bar as the drawing does and gives the chips the Tag', () => {
    const bar = block(css, '.filters {');
    expect(bar).toContain('var(--ap-color-surface-raised)');
    expect(bar).toContain('var(--ap-color-border-subtle)');
    expect(bar).toContain('var(--ap-radius-xl)');
  });

  it('flows the label and the chips on the bar’s own rows, with nothing that grows to fill one', () => {
    // A box around the chips that took `flex: 1 1 auto` filled every row it
    // was on, so the label sat alone above it and Clear alone below it: three
    // rows at 375, four at 320. With no box of its own, a chip sits beside
    // the label when it fits.
    expect(block(css, '.chips {')).toMatch(/display:\s*contents/);
    expect(css).not.toMatch(/flex:\s*1 1 auto/);
    // 12 after the label, 8 between chips, as drawn, with one gap for the bar.
    expect(block(css, '\n.filters {')).toMatch(/gap:\s*var\(--ap-spacing-100\)/);
    expect(block(css, '\n.label {')).toMatch(/margin-inline-end:\s*var\(--ap-spacing-050\)/);
  });

  it('keeps Clear with the "+", after the last chip, so it never stands on a row alone', () => {
    render(<Filters fields={fields} value={value} onChange={() => {}} />);
    const add = screen.getByRole('button', { name: 'Add filter' });
    const clear = screen.getByRole('button', { name: 'Clear' });
    // One box holds both, and it wraps whole: Clear goes to a new row only
    // with the "+" beside it.
    const controls = add.closest(`.${styles.controls}`)!;
    expect(controls).not.toBeNull();
    expect(controls).toContainElement(clear);
    expect(add.compareDocumentPosition(clear) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const box = block(css, '\n.controls {');
    expect(box).toMatch(/display:\s*flex/);
    expect(box).not.toMatch(/flex-wrap:\s*wrap/);
    // It takes what is left of its row, so Clear sits at the bar's end, as drawn.
    expect(box).toMatch(/flex:\s*1 0 auto/);
    expect(block(css, '\n.clear {')).toMatch(/margin-inline-start:\s*auto/);
    expect(clear).toHaveClass(styles.clear!);
    // The chips come before it, in their own order.
    const chip = screen.getByRole('button', { name: 'Status is Active or Invite pending' });
    expect(chip.compareDocumentPosition(controls) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('is never wider than the row it is put in: a long chip ends its words in an ellipsis', () => {
    // Two chips in the scheduling screen's day bar at 320 made the bar 355
    // wide and the page scroll: a flex item's least width is its content's.
    expect(block(css, '\n.filters {')).toMatch(/min-width:\s*0/);
    const words = block(css, '.words {');
    expect(words).toMatch(/max-width:\s*100%/);
    expect(words).toMatch(/overflow:\s*hidden/);
    expect(words).toMatch(/text-overflow:\s*ellipsis/);
    expect(words).toMatch(/white-space:\s*nowrap/);
  });

  it('says a chip’s whole words in a Tooltip while they are cut short, and opens no Tooltip while they are not', () => {
    // The words are a focusable button, so the system's Tooltip is how the
    // rest of them is seen: on hover and on keyboard focus. It names the
    // button with the same words, so the name does not change. Measured:
    // cut short is the button's scroll width past its own, read again when
    // the observer says the button's size has changed.
    // jsdom has no layout: its widths are Element's, and these shadow them.
    let cut = true;
    let resized: (() => void) | undefined;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          resized = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, get() { return cut ? 300 : 120; } });
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get() { return 120; } });
    try {
      const { rerender } = render(<Filters fields={fields} value={value} onChange={() => {}} />);
      const chip = screen.getByRole('button', { name: 'Status is Active or Invite pending' });
      expect(chip).toHaveAttribute('data-truncated', 'true');
      const tip = document.getElementById(chip.getAttribute('aria-labelledby')!.split(' ').pop()!)!;
      expect(tip).toHaveAttribute('role', 'tooltip');
      expect(tip).toHaveTextContent('Status is Active or Invite pending');
      fireEvent.keyDown(document.body, { key: 'Tab' });
      act(() => chip.focus());
      expect(tip.style.display).toBe('block');
      act(() => chip.blur());
      // Fewer words, and the button's size changes with them.
      cut = false;
      rerender(<Filters fields={fields} value={[{ key: 'status', values: ['active'] }]} onChange={() => {}} />);
      act(() => resized!());
      const whole = screen.getByRole('button', { name: 'Status is Active' });
      // The same button: the Tooltip stays in the tree, so it is never
      // remounted under the focus; it only opens on nothing.
      expect(whole).toBe(chip);
      expect(whole).not.toHaveAttribute('data-truncated');
      fireEvent.keyDown(document.body, { key: 'Tab' });
      act(() => whole.focus());
      expect(tip.style.display).not.toBe('block');
      // No rule hides a shown panel: hidden, it would still be a shown popover.
      expect(css).not.toMatch(/\[role=.tooltip.\][^{]*\{[^}]*display:\s*none/);
    } finally {
      vi.unstubAllGlobals();
      Reflect.deleteProperty(HTMLElement.prototype, 'scrollWidth');
      Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
    }
  });

  it('makes the words a button that looks like words, with a ring of its own', () => {
    const words = block(css, '.words {');
    expect(words).toContain('font: inherit');
    expect(words).toContain('background: none');
    expect(block(css, '.words:focus-visible {')).toContain('outline:');
  });
});

/**
 * A chip whose words are whole has nothing for its Tooltip to say, so the
 * Tooltip never opens. Opened and hidden by a rule, as it was, the panel was
 * still a shown popover: a Drawer that finds `:popover-open` inside it leaves
 * the Esc to it, the Tooltip's document handler cancelled that Esc, and a
 * Dialog's close request never came — the first Esc on a chip did nothing
 * that could be seen, in either. And a hover on a whole chip closed a real
 * tooltip elsewhere, the one open at a time.
 */
describe('Filters — a chip whose words are whole', () => {
  installDialogStub();

  // jsdom's selector engine has no :popover-open. The stub marks a shown
  // popover with an inline `display: block`, and this reads that mark where
  // the Drawer asks the platform, as a browser would answer.
  const querySelector = Element.prototype.querySelector;
  beforeAll(() => {
    Element.prototype.querySelector = function (this: Element, selectors: string) {
      if (selectors !== ':popover-open') return querySelector.call(this, selectors);
      return [...this.querySelectorAll<HTMLElement>('[popover]')].find((el) => el.style.display === 'block') ?? null;
    } as typeof Element.prototype.querySelector;
  });
  afterAll(() => {
    Element.prototype.querySelector = querySelector;
  });

  /** Focus as the keyboard gives it: jsdom's :focus-visible follows the last input it saw. */
  const tabTo = (element: HTMLElement) => {
    fireEvent.keyDown(document.body, { key: 'Tab' });
    act(() => element.focus());
  };

  const bar = <Filters fields={fields} value={[{ key: 'role', values: ['owner'] }]} onChange={() => {}} />;
  const chip = () => screen.getByRole('button', { name: 'Role is Owner' });
  const tipOf = (button: HTMLElement) => document.getElementById(button.getAttribute('aria-labelledby')!.split(' ').pop()!)!;

  it('never shows its Tooltip, on hover or on keyboard focus', () => {
    vi.useFakeTimers();
    try {
      render(bar);
      const words = chip();
      expect(words).not.toHaveAttribute('data-truncated');
      fireEvent.pointerEnter(words.parentElement!, { pointerType: 'mouse' });
      act(() => void vi.advanceTimersByTime(TOOLTIP_OPEN_DELAY * 2));
      expect(tipOf(words).style.display).not.toBe('block');
      tabTo(words);
      expect(tipOf(words).style.display).not.toBe('block');
      expect(document.body.querySelector(':popover-open')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('inside a Drawer, the first Esc closes the Drawer', () => {
    const onClose = vi.fn();
    render(
      <Drawer open onClose={onClose} title="Staff">
        {bar}
      </Drawer>,
    );
    tabTo(chip());
    fireEvent.keyDown(chip(), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('inside a Dialog, the first Esc is a close request', () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose} title="Staff">
        {bar}
      </Dialog>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Staff' });
    tabTo(chip());
    // The platform's part, which the stub leaves out: an Esc nothing
    // cancelled becomes `cancel` on the open modal dialog.
    if (fireEvent.keyDown(chip(), { key: 'Escape' })) fireEvent(dialog, new Event('cancel', { cancelable: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
