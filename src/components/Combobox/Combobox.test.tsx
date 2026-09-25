import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Combobox } from './Combobox';
import type { ComboboxMultipleProps, ComboboxSingleProps } from './Combobox';
import { contains, filterEntries, fold } from '../listbox/options';
import type { SelectEntry } from '../listbox/options';
import { Field } from '../Field/Field';
import styles from './Combobox.module.css';
import tag from '../Tag/Tag.module.css';
import rows from '../listbox/OptionList.module.css';
import control from '../control.module.css';
import floating from '../floating.module.css';
import { NATIVE_POPOVER, installPopoverStub } from '../../test/popover';
import { readCss, block } from '../../test/css';
import { axeViolations } from '../../test/axe';

installPopoverStub();

const css = readCss('src/components/Combobox/Combobox.module.css');

const TEAM: SelectEntry[] = [
  { value: 'anthony', label: 'Anthony Jackson', start: <i data-testid="avatar-anthony" /> },
  { value: 'brian', label: 'Brian Stewart' },
  { value: 'charles', label: 'Charles Griffin', disabled: true },
  { value: 'elizabeth', label: 'Elizabeth Hall' },
  { value: 'lea', label: 'Léa Martin' },
];

const One = (props: Partial<ComboboxSingleProps>) => <Combobox aria-label="Patient" options={TEAM} placeholder="Find someone" {...props} />;
const Many = (props: Partial<ComboboxMultipleProps>) => <Combobox multiple aria-label="My team" options={TEAM} {...props} />;

const field = () => screen.getByRole('combobox');
const listbox = () => screen.getByRole('listbox', { hidden: true });
const options = () => within(listbox()).queryAllByRole('option', { hidden: true });
const option = (name: string | RegExp) => within(listbox()).getByRole('option', { name, hidden: true });
const active = () => document.getElementById(field().getAttribute('aria-activedescendant') ?? '');
const isOpen = () => listbox().style.display === 'block';

describe('Combobox — the helpers', () => {
  it('folds case and accents one character for one', () => {
    expect(fold('Léa MARTIN')).toBe('lea martin');
    expect(fold('Léa').length).toBe(3);
  });

  it('finds what was typed anywhere in a label', () => {
    expect(contains({ value: 'x', label: 'Sandra Brown' }, 'and')).toBe(true);
    expect(contains({ value: 'x', label: 'Léa Martin' }, 'LEA')).toBe(true);
    expect(contains({ value: 'x', label: 'Léa Martin' }, 'zz')).toBe(false);
  });

  it('keeps groups in place and drops the ones left empty', () => {
    const grouped: SelectEntry[] = [
      { label: 'A', options: [{ value: '1', label: 'Anna' }] },
      { label: 'B', options: [{ value: '2', label: 'Bob' }] },
    ];
    expect(filterEntries(grouped, (o) => o.label === 'Bob')).toEqual([{ label: 'B', options: [{ value: '2', label: 'Bob' }] }]);
  });
});

describe('Combobox — structure', () => {
  it('stubs the popover API only because jsdom lacks it', () => {
    expect(NATIVE_POPOVER).toBe(false);
  });

  it('is a text field that is a combobox for a listbox on the floating surface', () => {
    render(<One />);
    expect(field().tagName).toBe('INPUT');
    expect(field()).toHaveAttribute('aria-autocomplete', 'list');
    expect(field()).toHaveAttribute('aria-expanded', 'false');
    expect(field()).toHaveAttribute('aria-controls', listbox().id);
    expect(field()).toHaveAttribute('autocomplete', 'off');
    expect(field().parentElement).toHaveClass(control.control!, control.auto!, styles.box!);
    expect(listbox()).toHaveAttribute('popover', 'manual');
    expect(listbox()).toHaveClass(floating.floating!, styles.list!);
  });

  it('shows the chosen label and what stands before it, and the placeholder without one', () => {
    const { rerender } = render(<One />);
    expect(field()).toHaveValue('');
    expect(field()).toHaveAttribute('placeholder', 'Find someone');
    rerender(<One value="anthony" />);
    expect(field()).toHaveValue('Anthony Jackson');
    // Before the value in the field, and before the option in the list.
    expect(within(field().parentElement!).getAllByTestId('avatar-anthony')).toHaveLength(2);
    expect(field().parentElement!.querySelector(`.${styles.start}`)).not.toBeNull();
  });

  it('takes its name, description, error and required from a Field', () => {
    render(
      <Field label="Patient" description="Name or record number" error="Choose a patient" required>
        <Combobox options={TEAM} />
      </Field>,
    );
    const input = screen.getByRole('combobox', { name: /Patient/ });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).toHaveAccessibleDescription(/Name or record number/);
  });
});

describe('Combobox — typing', () => {
  it('opens, narrows the list to what holds what was typed, and makes the best match active', async () => {
    render(<One />);
    await userEvent.type(field(), 'ar');
    expect(isOpen()).toBe(true);
    expect(options().map((o) => o.textContent)).toEqual(['Brian Stewart', 'Charles Griffin', 'Léa Martin']);
    // The first that can be chosen: not the disabled one.
    expect(active()).toBe(option('Brian Stewart'));
  });

  it('shows what was typed in the label, by weight, whatever the accents', async () => {
    render(<One />);
    await userEvent.type(field(), 'lea');
    const found = option('Léa Martin').querySelector(`.${rows.found}`);
    expect(found).toHaveTextContent('Léa');
  });

  it('chooses the best match on Enter, shows it, and closes', async () => {
    const onChange = vi.fn();
    render(<One onChange={onChange} />);
    await userEvent.type(field(), 'eliz{Enter}');
    expect(onChange).toHaveBeenCalledWith('elizabeth');
    expect(field()).toHaveValue('Elizabeth Hall');
    expect(isOpen()).toBe(false);
  });

  it('says so when nothing is left, in the caller’s words if given', async () => {
    const { rerender } = render(<One />);
    await userEvent.type(field(), 'zzz');
    expect(options()).toHaveLength(0);
    expect(listbox()).toHaveTextContent('No results');
    rerender(<One emptyText={(q) => `No patients match “${q}”`} />);
    expect(listbox()).toHaveTextContent('No patients match “zzz”');
  });

  it('puts the choice back when the field is left with something typed that chose nothing', async () => {
    const onChange = vi.fn();
    render(
      <>
        <One defaultValue="brian" onChange={onChange} />
        <button>After</button>
      </>,
    );
    await userEvent.click(field());
    await userEvent.clear(field());
    await userEvent.type(field(), 'zzz');
    await userEvent.tab();
    expect(field()).toHaveValue('Brian Stewart');
    expect(onChange).not.toHaveBeenCalled();
    expect(isOpen()).toBe(false);
  });

  it('leaves the Enter that commits an IME composition alone', async () => {
    const onChange = vi.fn();
    render(<One onChange={onChange} />);
    await userEvent.type(field(), 'eliz');
    fireEvent.keyDown(field(), { key: 'Enter', isComposing: true });
    expect(onChange).not.toHaveBeenCalled();
    expect(isOpen()).toBe(true);
  });

  it('hands what is typed to a caller that fetches, shows its options as they are, and says it is loading', async () => {
    const onInputChange = vi.fn();
    const { rerender } = render(<One filter={null} onInputChange={onInputChange} loading />);
    await userEvent.type(field(), 'zz');
    expect(onInputChange).toHaveBeenLastCalledWith('zz');
    expect(listbox()).toHaveTextContent('Loading…');
    rerender(<One filter={null} onInputChange={onInputChange} />);
    expect(options()).toHaveLength(TEAM.length);
  });
});

describe('Combobox — found by the review', () => {
  it('keeps the active option by its value when the options change under it', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<One filter={null} onChange={onChange} />);
    field().focus();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(active()).toBe(option('Brian Stewart'));
    // A fetch comes back with other rows, Brian no longer second.
    rerender(<One filter={null} onChange={onChange} options={[TEAM[4]!, TEAM[3]!, TEAM[1]!]} />);
    expect(active()).toBe(option('Brian Stewart'));
    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('brian');
  });

  it('takes the choice away when the field is emptied and left', async () => {
    const onChange = vi.fn();
    render(
      <>
        <One defaultValue="brian" onChange={onChange} />
        <button>After</button>
      </>,
    );
    await userEvent.click(field());
    await userEvent.clear(field());
    await userEvent.tab();
    expect(onChange).toHaveBeenCalledWith('');
    expect(field()).toHaveValue('');
  });

  it('folds a character that lowercases to two without moving what follows', () => {
    expect(Array.from(fold('İzmir Ana')).length).toBe(Array.from('İzmir Ana').length);
  });

  it('goes back to its default when its form is reset', async () => {
    render(
      <form>
        <Many name="team" defaultValue={['anthony']} />
        <button type="reset">Reset</button>
      </form>,
    );
    await userEvent.click(field());
    await userEvent.click(option('Brian Stewart'));
    expect(screen.getByRole('status')).toHaveTextContent('2 selected');
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByRole('status')).toHaveTextContent('1 selected');
  });
});

describe('Combobox — the keyboard', () => {
  it('opens on Down at the first option and on Up at the last, and Alt+Down opens with nothing active', async () => {
    render(<One />);
    field().focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(active()).toBe(option('Anthony Jackson'));
    await userEvent.keyboard('{Escape}{ArrowUp}');
    expect(active()).toBe(option('Léa Martin'));
    await userEvent.keyboard('{Escape}{Alt>}{ArrowDown}{/Alt}');
    expect(isOpen()).toBe(true);
    expect(active()).toBeNull();
  });

  it('moves past what is disabled, and leaves Home and End to the caret until an option is active', async () => {
    render(<One />);
    await userEvent.type(field(), 'a');
    // Typing made the best match active, so Home and End are the list's.
    await userEvent.keyboard('{End}');
    expect(active()).toBe(option('Léa Martin'));
    await userEvent.keyboard('{Home}{ArrowDown}{ArrowDown}');
    expect(active()).toBe(option('Elizabeth Hall'));
  });

  it('closes on the first Esc, puts back what was typed over on the second, and keeps both from what is around it', async () => {
    const around = vi.fn();
    render(
      <div onKeyDown={around} role="presentation">
        <One defaultValue="brian" />
      </div>,
    );
    await userEvent.click(field());
    await userEvent.clear(field());
    await userEvent.type(field(), 'eli');
    around.mockClear();
    await userEvent.keyboard('{Escape}');
    expect(isOpen()).toBe(false);
    expect(field()).toHaveValue('eli');
    await userEvent.keyboard('{Escape}');
    expect(field()).toHaveValue('Brian Stewart');
    expect(around.mock.calls.filter(([event]) => event.key === 'Escape')).toEqual([]);
    // A third is nobody's here, and goes on.
    await userEvent.keyboard('{Escape}');
    expect(around.mock.calls.filter(([event]) => event.key === 'Escape')).toHaveLength(1);
  });
});

describe('Combobox — the pointer', () => {
  it('opens on a press, chooses on a press, and keeps the focus in the field', async () => {
    const onChange = vi.fn();
    render(<One onChange={onChange} />);
    await userEvent.click(field());
    expect(isOpen()).toBe(true);
    await userEvent.click(option('Elizabeth Hall'));
    expect(onChange).toHaveBeenCalledWith('elizabeth');
    expect(field()).toHaveFocus();
    expect(isOpen()).toBe(false);
  });

  it('marks the chosen option with the check, as the Select does', async () => {
    render(<One defaultValue="brian" />);
    await userEvent.click(field());
    expect(option('Brian Stewart')).toHaveAttribute('aria-selected', 'true');
    expect(option('Brian Stewart').querySelector(`.${rows.check}`)).not.toBeNull();
    expect(listbox().querySelectorAll(`.${rows.box}`)).toHaveLength(0);
  });

  it('clears with its button when it is clearable, and puts the focus back', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<One defaultValue="brian" onChange={onChange} />);
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
    rerender(<One defaultValue="brian" onChange={onChange} clearable />);
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onChange).toHaveBeenCalledWith('');
    expect(field()).toHaveValue('');
    expect(field()).toHaveFocus();
  });
});

describe('Combobox — many', () => {
  it('shows each choice as a tag, a checkbox before every option, and says the listbox takes many', () => {
    render(<Many defaultValue={['anthony', 'lea']} />);
    expect(screen.getByText('Anthony Jackson', { selector: `.${tag.label}` })).toBeInTheDocument();
    expect(screen.getByText('Léa Martin', { selector: `.${tag.label}` })).toBeInTheDocument();
    expect(listbox()).toHaveAttribute('aria-multiselectable', 'true');
    expect(listbox().querySelectorAll(`.${rows.box}`)).toHaveLength(TEAM.length);
    expect(option('Anthony Jackson')).toHaveAttribute('aria-selected', 'true');
    // The box is a picture: the option is what is chosen and named.
    expect(option('Anthony Jackson').querySelector(`.${rows.box}`)).toHaveClass(rows.boxOn!);
    expect(option('Anthony Jackson').querySelector(`.${rows.box}`)).toHaveAttribute('aria-hidden', 'true');
    expect(option('Brian Stewart').querySelector(`.${rows.box}`)).not.toHaveClass(rows.boxOn!);
    expect(listbox().querySelector('input')).toBeNull();
  });

  it('adds and takes away with a press, keeps the list open, and clears what was typed', async () => {
    const onChange = vi.fn();
    render(<Many onChange={onChange} />);
    await userEvent.type(field(), 'bri');
    await userEvent.click(option('Brian Stewart'));
    expect(onChange).toHaveBeenLastCalledWith(['brian']);
    expect(isOpen()).toBe(true);
    expect(field()).toHaveValue('');
    await userEvent.click(option('Brian Stewart'));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('takes the last tag away on Backspace in an empty field, and any tag with its button', async () => {
    const onChange = vi.fn();
    render(<Many defaultValue={['anthony', 'brian', 'lea']} onChange={onChange} />);
    field().focus();
    await userEvent.keyboard('{Backspace}');
    expect(onChange).toHaveBeenLastCalledWith(['anthony', 'brian']);
    await userEvent.click(screen.getByRole('button', { name: 'Remove Anthony Jackson' }));
    expect(onChange).toHaveBeenLastCalledWith(['brian']);
  });

  it('keeps the tags’ buttons out of the tab order, and the clear button in it', async () => {
    render(
      <>
        <Many defaultValue={['anthony', 'brian']} />
        <button>After</button>
      </>,
    );
    field().focus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Clear' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('has a row for all of them that is mixed, checked or not, and leaves out what cannot be chosen', async () => {
    const onChange = vi.fn();
    render(<Many selectAllLabel="All" defaultValue={['anthony']} onChange={onChange} />);
    await userEvent.click(field());
    expect(option('All')).toHaveAttribute('aria-checked', 'mixed');
    await userEvent.click(option('All'));
    expect(onChange).toHaveBeenLastCalledWith(['anthony', 'brian', 'elizabeth', 'lea']);
    expect(option('All')).toHaveAttribute('aria-selected', 'true');
    await userEvent.click(option('All'));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('hides the row for all while something is typed, since it would not mean the ones in view', async () => {
    render(<Many selectAllLabel="All" />);
    await userEvent.type(field(), 'a');
    expect(within(listbox()).queryByRole('option', { name: 'All', hidden: true })).toBeNull();
  });

  it('says how many are chosen, clears them all, and submits one hidden input for each', async () => {
    const { container } = render(<Many name="team" defaultValue={['anthony', 'lea']} />);
    expect(screen.getByRole('status')).toHaveTextContent('2 selected');
    expect([...container.querySelectorAll<HTMLInputElement>('input[type="hidden"]')].map((i) => [i.name, i.value])).toEqual([
      ['team', 'anthony'],
      ['team', 'lea'],
    ]);
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByRole('status')).toHaveTextContent('0 selected');
    expect(container.querySelectorAll('input[type="hidden"]')).toHaveLength(0);
  });

  it('follows a controlled value', async () => {
    function Controlled() {
      const [team, setTeam] = useState<string[]>(['brian']);
      return <Many value={team} onChange={setTeam} />;
    }
    render(<Controlled />);
    await userEvent.click(field());
    await userEvent.click(option('Elizabeth Hall'));
    expect(screen.getByText('Elizabeth Hall', { selector: `.${tag.label}` })).toBeInTheDocument();
  });
});

describe('Combobox — stylesheet', () => {
  it('grows with its tags, and sets nothing on the list that the floating surface sets', () => {
    expect(block(css, '.box.many {')).toContain('flex-wrap: wrap');
    const list = block(css, '.list {');
    expect(list).toContain('min-inline-size: anchor-size(width)');
    expect(list).toContain('--floating-overflow: hidden auto');
    expect(list).not.toMatch(/max-block-size:[^;]*100%/);
    expect(list).not.toMatch(/(^|\s)(position|inset|background|box-shadow|border|margin|overflow)\s*:/);
  });

  it('hands its tags the raised surface, since on the field a tag’s own fill is the field’s', () => {
    expect(block(css, '\n.tag {')).toContain('--tag-fill: var(--ap-color-surface-raised)');
  });

  it('gives the clear button the least a target may be, and a ring', () => {
    expect(block(css, '\n.clear {')).toContain('width: var(--ap-spacing-300)');
    expect(block(css, '.clear:focus-visible {')).toContain('var(--ap-color-border-focus)');
  });

  it('sets --alpenglow-field-min-width on .input instead of overriding min-width, so control.module.css cannot outrank it when chunk order differs in production', () => {
    // .input's element also carries control.module.css's .field, which
    // sets flex: 1 for every caller. Overriding min-width from
    // Combobox.module.css at equal specificity is decided by whichever
    // stylesheet's chunk loads last — which next dev and the production
    // build do not agree on. Bridging the value through a custom property
    // that only .field declares removes the conflict instead of winning
    // it (the audit's step-3 css-order check caught this: the input
    // squeezed onto the tags' last line in production instead of wrapping
    // to its own).
    const input = block(css, '.input {');
    expect(input).not.toMatch(/(?:^|[\s;])min-width\s*:/);
    expect(input).toMatch(/--alpenglow-field-min-width:\s*var\(--ap-spacing-800\)/);

    const controlCss = readCss('src/components/control.module.css');
    expect(block(controlCss, '.field {')).toMatch(/min-width:\s*var\(--alpenglow-field-min-width,\s*0\)/);
  });
});

describe('Combobox — axe', () => {
  it('has no violations, one or many, closed or open', async () => {
    const { container } = render(
      <main>
        <Field label="Patient">
          <Combobox options={TEAM} defaultValue="brian" clearable />
        </Field>
        <Field label="My team">
          <Combobox multiple options={TEAM} defaultValue={['anthony', 'lea']} selectAllLabel="All" />
        </Field>
      </main>,
    );
    expect(await axeViolations(container)).toEqual([]);
    await userEvent.click(screen.getByRole('combobox', { name: /My team/ }));
    expect(await axeViolations(container)).toEqual([]);
  });
});
