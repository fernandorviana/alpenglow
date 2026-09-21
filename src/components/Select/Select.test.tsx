import { useState } from 'react';
import { renderToString } from 'react-dom/server';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Select } from './Select';
import type { SelectProps } from './Select';
import { first, flatten, last, match, step } from '../listbox/options';
import type { SelectEntry } from '../listbox/options';
import rows from '../listbox/OptionList.module.css';
import { Field } from '../Field/Field';
import styles from './Select.module.css';
import control from '../control.module.css';
import floating from '../floating.module.css';
import { NATIVE_POPOVER, installPopoverStub } from '../../test/popover';
import { readCss, block } from '../../test/css';
import { axeViolations } from '../../test/axe';

installPopoverStub();

const css = readCss('src/components/Select/Select.module.css');
const rowCss = readCss('src/components/listbox/OptionList.module.css');

const STAFF: SelectEntry[] = [
  {
    label: 'On shift',
    options: [
      { value: 'amanda', label: 'Amanda Hall', start: <i data-testid="avatar-amanda" /> },
      { value: 'jonathan', label: 'Jonathan Young', description: 'Until 18:00' },
    ],
  },
  { label: 'Away', options: [{ value: 'sandra', label: 'Sandra Brown', disabled: true }] },
  { value: 'ashley', label: 'Ashley Brooks' },
];

function Staff(props: Partial<SelectProps>) {
  return <Select aria-label="Staff" options={STAFF} placeholder="Choose someone" {...props} />;
}

const field = () => screen.getByRole('combobox', { name: /Staff/ });
const listbox = () => screen.getByRole('listbox', { hidden: true });
const option = (name: string | RegExp) => within(listbox()).getByRole('option', { name, hidden: true });
const opened = () => waitFor(() => expect(field()).toHaveAttribute('aria-expanded', 'true'));
const closed = () => waitFor(() => expect(field()).toHaveAttribute('aria-expanded', 'false'));
const active = () => document.getElementById(field().getAttribute('aria-activedescendant') ?? '');

describe('Select — the helpers', () => {
  const options = flatten(STAFF);

  it('opens groups out in reading order', () => {
    expect(options.map((o) => o.value)).toEqual(['amanda', 'jonathan', 'sandra', 'ashley']);
  });

  it('steps over what cannot be chosen, and stops at the ends', () => {
    expect(step(options, 1, 1)).toBe(3);
    expect(step(options, 3, -1)).toBe(1);
    expect(step(options, 3, 1)).toBe(3);
    expect(step(options, 0, -1)).toBe(0);
    expect(first(options)).toBe(0);
    expect(last(options)).toBe(3);
  });

  it('finds the next label by its first letter, wrapping, never one that is disabled', () => {
    expect(match(options, -1, 'a')).toBe(0);
    expect(match(options, 0, 'A')).toBe(3);
    expect(match(options, 3, 'a')).toBe(0);
    expect(match(options, -1, 's')).toBe(-1);
  });
});

describe('Select — structure', () => {
  it('stubs the popover API only because jsdom lacks it', () => {
    expect(NATIVE_POPOVER).toBe(false);
  });

  it('is a button that is a combobox for a listbox on the floating surface', () => {
    render(<Staff />);
    expect(field().tagName).toBe('BUTTON');
    expect(field()).toHaveAttribute('type', 'button');
    expect(field()).toHaveAttribute('aria-haspopup', 'listbox');
    expect(field()).toHaveAttribute('aria-expanded', 'false');
    expect(field()).toHaveAttribute('aria-controls', listbox().id);
    expect(field()).toHaveClass(control.control!, control.md!);
    expect(listbox()).toHaveAttribute('popover', 'auto');
    expect(listbox()).toHaveClass(floating.floating!, styles.list!);
  });

  it('shows the placeholder until something is chosen, and then the choice with what stands before it', () => {
    const { rerender } = render(<Staff />);
    expect(field()).toHaveTextContent('Choose someone');
    expect(field().querySelector(`.${styles.placeholder}`)).not.toBeNull();
    rerender(<Staff value="amanda" />);
    expect(field()).toHaveTextContent('Amanda Hall');
    expect(within(field()).getByTestId('avatar-amanda')).toBeInTheDocument();
    expect(field().querySelector(`.${styles.placeholder}`)).toBeNull();
  });

  it('shows content in place of the label, in the field and in the list, and keeps the label for the name', () => {
    render(
      <Select
        aria-label="Service"
        value="90792"
        options={[{ value: '90792', label: '90792 - Therapeutic exercises', content: <><strong>90792</strong> - Therapeutic exercises</> }]}
      />,
    );
    expect(screen.getByRole('combobox').querySelector('strong')).toHaveTextContent('90792');
    expect(screen.getByRole('option', { hidden: true }).querySelector('strong')).toHaveTextContent('90792');
  });

  it('groups are named groups, and what cannot be chosen says so', () => {
    render(<Staff />);
    const groups = within(listbox()).getAllByRole('group', { hidden: true });
    expect(groups).toHaveLength(2);
    expect(document.getElementById(groups[0]!.getAttribute('aria-labelledby')!)).toHaveTextContent('On shift');
    expect(option('Sandra Brown')).toHaveAttribute('aria-disabled', 'true');
    expect(option(/Jonathan Young/)).toHaveTextContent('Until 18:00');
  });

  it('marks the chosen option, and only it, with aria-selected and the check', () => {
    render(<Staff value="jonathan" />);
    expect(option(/Jonathan Young/)).toHaveAttribute('aria-selected', 'true');
    expect(option('Amanda Hall')).toHaveAttribute('aria-selected', 'false');
    expect(listbox().querySelectorAll(`.${rows.check}`)).toHaveLength(1);
    expect(option(/Jonathan Young/).querySelector(`.${rows.check}`)).not.toBeNull();
  });

  it('submits its value through a hidden input, only when named', () => {
    const { container, rerender } = render(<Staff value="ashley" />);
    expect(container.querySelector('input')).toBeNull();
    rerender(<Staff value="ashley" name="staff" />);
    const hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement;
    expect(hidden.name).toBe('staff');
    expect(hidden.value).toBe('ashley');
  });

  it('leaves the button inert in server HTML, so a press before hydration cannot open the list behind React', () => {
    expect(renderToString(<Staff />)).not.toMatch(/popovertarget/i);
  });

  it('is disabled as a button is', () => {
    render(<Staff disabled />);
    expect(field()).toBeDisabled();
    expect(field()).toHaveClass(control.disabled!);
  });
});

describe('Select — in a Field', () => {
  it('takes its name, its description, its error and required from the Field', () => {
    render(
      <Field label="Staff" description="Who takes the appointment" error="Choose someone" required>
        <Select options={STAFF} />
      </Field>,
    );
    const select = screen.getByRole('combobox', { name: /Staff/ });
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select).toHaveAttribute('aria-required', 'true');
    expect(select).toHaveAccessibleDescription(/Who takes the appointment/);
    expect(select).toHaveClass(control.invalid!);
  });
});

describe('Select — the pointer', () => {
  it('opens on a press, makes the option under the pointer active, and chooses on a press', async () => {
    const onChange = vi.fn();
    render(<Staff onChange={onChange} />);
    await userEvent.click(field());
    await opened();
    await userEvent.hover(option('Ashley Brooks'));
    expect(active()).toBe(option('Ashley Brooks'));
    expect(option('Ashley Brooks')).toHaveClass(rows.active!);
    await userEvent.click(option('Ashley Brooks'));
    await closed();
    expect(onChange).toHaveBeenCalledWith('ashley');
    expect(field()).toHaveTextContent('Ashley Brooks');
  });

  it('does not choose what is disabled, and says nothing when the choice is the one it had', async () => {
    const onChange = vi.fn();
    render(<Staff defaultValue="amanda" onChange={onChange} />);
    await userEvent.click(field());
    await opened();
    await userEvent.click(option('Sandra Brown'));
    await closed();
    await userEvent.click(field());
    await opened();
    await userEvent.click(option('Amanda Hall'));
    await closed();
    expect(onChange).not.toHaveBeenCalled();
    expect(field()).toHaveTextContent('Amanda Hall');
  });

  it('keeps the focus on the button through a press in the list', async () => {
    render(<Staff />);
    await userEvent.click(field());
    await opened();
    await userEvent.click(option('Ashley Brooks'));
    expect(field()).toHaveFocus();
  });
});

describe('Select — the keyboard', () => {
  it.each(['{ArrowDown}', '{ArrowUp}', '{Enter}', ' '])('opens on %s at the chosen option', async (key) => {
    render(<Staff defaultValue="jonathan" />);
    field().focus();
    await userEvent.keyboard(key);
    await opened();
    expect(active()).toBe(option(/Jonathan Young/));
    expect(field()).toHaveFocus();
  });

  it('opens at the first option that can be chosen when nothing is', async () => {
    render(<Staff />);
    field().focus();
    await userEvent.keyboard('{ArrowDown}');
    await opened();
    expect(active()).toBe(option('Amanda Hall'));
  });

  it('moves with the arrows over what is disabled, stops at the ends, and goes to them with Home and End', async () => {
    render(<Staff />);
    field().focus();
    await userEvent.keyboard('{ArrowDown}');
    await opened();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(active()).toBe(option('Ashley Brooks'));
    await userEvent.keyboard('{ArrowDown}');
    expect(active()).toBe(option('Ashley Brooks'));
    await userEvent.keyboard('{Home}');
    expect(active()).toBe(option('Amanda Hall'));
    await userEvent.keyboard('{End}');
    expect(active()).toBe(option('Ashley Brooks'));
  });

  it('chooses with Enter, and with Space', async () => {
    const onChange = vi.fn();
    render(<Staff onChange={onChange} />);
    field().focus();
    await userEvent.keyboard('{ArrowDown}');
    await opened();
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await closed();
    expect(onChange).toHaveBeenLastCalledWith('jonathan');
    await userEvent.keyboard(' ');
    await opened();
    await userEvent.keyboard('{End} ');
    await closed();
    expect(onChange).toHaveBeenLastCalledWith('ashley');
  });

  it('chooses the active option on Tab and lets the focus go on', async () => {
    const onChange = vi.fn();
    render(
      <>
        <Staff onChange={onChange} />
        <button>After</button>
      </>,
    );
    field().focus();
    await userEvent.keyboard('{ArrowDown}');
    await opened();
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.tab();
    expect(onChange).toHaveBeenCalledWith('jonathan');
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('closes on Esc with nothing chosen, and keeps the Esc from whatever is around it', async () => {
    const onChange = vi.fn();
    const around = vi.fn();
    render(
      <div onKeyDown={around}>
        <Staff onChange={onChange} />
      </div>,
    );
    field().focus();
    await userEvent.keyboard('{ArrowDown}');
    await opened();
    around.mockClear();
    await userEvent.keyboard('{ArrowDown}{Escape}');
    await closed();
    expect(onChange).not.toHaveBeenCalled();
    expect(around.mock.calls.filter(([event]) => event.key === 'Escape')).toEqual([]);
  });

  it('finds an option by its first letter, open or closed', async () => {
    render(<Staff />);
    field().focus();
    await userEvent.keyboard('j');
    await opened();
    expect(active()).toBe(option(/Jonathan Young/));
    await userEvent.keyboard('a');
    expect(active()).toBe(option('Ashley Brooks'));
    await userEvent.keyboard('a');
    expect(active()).toBe(option('Amanda Hall'));
  });
});

describe('Select — in a form', () => {
  it('goes back to its default when the form is reset', async () => {
    render(
      <form>
        <Staff name="staff" defaultValue="amanda" />
        <button type="reset">Reset</button>
      </form>,
    );
    await userEvent.click(field());
    await opened();
    await userEvent.click(option('Ashley Brooks'));
    await closed();
    expect(field()).toHaveTextContent('Ashley Brooks');
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(field()).toHaveTextContent('Amanda Hall');
    expect((document.querySelector('input[name="staff"]') as HTMLInputElement).value).toBe('amanda');
  });
});

describe('Select — the list follows the keyboard, not the pointer', () => {
  it('scrolls the active option into view for an arrow, and not for the pointer', async () => {
    const scrolled = vi.fn();
    Element.prototype.scrollIntoView = scrolled;
    render(<Staff />);
    await userEvent.click(field());
    await opened();
    scrolled.mockClear();
    await userEvent.hover(option('Ashley Brooks'));
    expect(scrolled).not.toHaveBeenCalled();
    field().focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(scrolled).toHaveBeenCalled();
  });

  it('does not throw when two keys arrive before the platform has said it is open', async () => {
    render(<Staff />);
    field().focus();
    // Both in one task: `open` is still false for the second.
    await userEvent.keyboard('{ArrowDown>}{/ArrowDown}{ArrowDown>}{/ArrowDown}');
    await opened();
  });
});

describe('Select — controlled', () => {
  it('shows the value it is given and asks for the next one', async () => {
    function Controlled() {
      const [value, setValue] = useState('amanda');
      return <Staff value={value} onChange={setValue} />;
    }
    render(<Controlled />);
    await userEvent.click(field());
    await opened();
    await userEvent.click(option('Ashley Brooks'));
    await closed();
    expect(field()).toHaveTextContent('Ashley Brooks');
  });
});

describe('Select — stylesheet', () => {
  it('tells the chosen option by a check in the accent, and the active one by the wash', () => {
    expect(block(rowCss, '.check {')).toContain('color: var(--ap-color-text-accent)');
    expect(block(rowCss, '.option.active {')).toContain('var(--ap-color-interactive-wash-hover)');
    expect(rowCss).not.toMatch(/aria-selected[^{]*\{/);
    expect(rowCss + css).not.toContain(':hover');
  });

  it('is never narrower than its field, scrolls when it is long, and sets nothing the floating surface sets', () => {
    const list = block(css, '.list {');
    expect(list).toContain('min-inline-size: anchor-size(width)');
    expect(list).toContain('--floating-overflow: hidden auto');
    // Capped by rows alone: capped to the room it has, it would never flip.
    expect(list).not.toMatch(/max-block-size:[^;]*100%/);
    expect(list).not.toMatch(/(^|\s)(position|inset|background|box-shadow|border|margin|overflow)\s*:/);
  });

  it('paints the chevron in the accent, as drawn', () => {
    expect(block(css, '.chevron {')).toContain('color: var(--ap-color-text-accent)');
  });
});

describe('Select — axe', () => {
  it('has no violations, closed or open', async () => {
    const { container } = render(
      <main>
        <Field label="Staff">
          <Select options={STAFF} defaultValue="amanda" />
        </Field>
      </main>,
    );
    expect(await axeViolations(container)).toEqual([]);
    await userEvent.click(screen.getByRole('combobox'));
    await waitFor(() => expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true'));
    expect(await axeViolations(container)).toEqual([]);
  });
});
