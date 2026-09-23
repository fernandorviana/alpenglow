import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { useState } from 'react';
import { installDialogStub } from '@/test/dialog';
import { axeViolations } from '@/test/axe';
import { readCss } from '@/test/css';
import { CommandPalette, matchesCommand, type CommandGroup, type CommandItem } from './CommandPalette';
import { useCommandPaletteShortcut } from './useShortcut';

installDialogStub();

const css = readCss('src/components/CommandPalette/CommandPalette.module.css');

const GROUPS: CommandGroup[] = [
  {
    label: 'Go to',
    items: [
      { id: 'colour', label: 'Colour', description: 'Foundations', keywords: ['tokens', 'palette'] },
      { id: 'button', label: 'Button', description: 'Components', detail: 'Three variants, three sizes' },
      { id: 'legacy', label: 'Legacy tables', description: 'Components', disabled: true },
    ],
  },
  {
    label: 'Actions',
    items: [
      { id: 'theme', label: 'Switch to dark', shortcut: '⇧D', icon: <svg aria-hidden="true" /> },
      { id: 'copy', label: 'Copy install command', detail: 'npm install alpenglow' },
    ],
  },
];

const field = () => screen.getByRole<HTMLInputElement>('combobox', { name: 'Commands' });
const listbox = () => screen.getByRole('listbox', { name: 'Commands' });
const options = () => within(listbox()).queryAllByRole('option');
const active = () => document.getElementById(field().getAttribute('aria-activedescendant') ?? '');

function Harness(props: Partial<React.ComponentProps<typeof CommandPalette>> & { onSelect?: (item: CommandItem) => void }) {
  const [open, setOpen] = useState(true);
  return (
    <CommandPalette
      open={open}
      onClose={() => setOpen(false)}
      label="Commands"
      placeholder="Type a command"
      items={GROUPS}
      onSelect={props.onSelect ?? (() => {})}
      {...props}
    />
  );
}

async function show(props: Partial<React.ComponentProps<typeof CommandPalette>> = {}) {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  render(<Harness onSelect={onSelect} {...props} />);
  await act(() => new Promise((r) => setTimeout(r, 0)));
  return { user, onSelect };
}

afterEach(() => {
  delete (navigator as { platform?: string }).platform;
});

describe('the default filter', () => {
  it('reads the label and the keywords, folding case and accents, and keeps everything for nothing', () => {
    const item: CommandItem = { id: 'x', label: 'Élévation', keywords: ['shadow'] };
    expect(matchesCommand(item, '')).toBe(true);
    expect(matchesCommand(item, 'ELEV')).toBe(true);
    expect(matchesCommand(item, 'shad')).toBe(true);
    expect(matchesCommand(item, 'colour')).toBe(false);
  });
});

describe('the combobox', () => {
  it('is wired to the listbox, focused on open, and lists every group before anything is typed', async () => {
    await show();
    expect(document.activeElement).toBe(field());
    expect(field()).toHaveAttribute('aria-controls', listbox().id);
    expect(field()).toHaveAttribute('aria-expanded', 'true');
    expect(within(listbox()).getAllByRole('group').map((g) => g.getAttribute('aria-label'))).toEqual(['Go to', 'Actions']);
    expect(options()).toHaveLength(5);
    expect(screen.getByRole('dialog', { name: 'Commands' })).toBeInTheDocument();
  });

  it('draws the description, the detail, the icon and the shortcut', async () => {
    await show();
    const button = within(listbox()).getByRole('option', { name: /Button/ });
    expect(button).toHaveTextContent('Components');
    expect(button).toHaveTextContent('Three variants, three sizes');
    const theme = within(listbox()).getByRole('option', { name: /Switch to dark/ });
    expect(theme.querySelector('kbd')).toHaveTextContent('⇧D');
    expect(theme.querySelector('svg')).not.toBeNull();
  });

  it('sets a mono label in the mono class, for a token or a path', async () => {
    await show({ items: [{ label: 'Tokens', items: [{ id: 't', label: 'surface/raised', mono: true }] }] });
    expect(options()[0]!.className).toMatch(/mono/);
  });

  it('narrows as the reader types, drops a group that empties, and marks what was typed', async () => {
    const { user } = await show();
    await user.type(field(), 'col');
    expect(options().map((o) => o.textContent)).toEqual(['ColourFoundations']);
    expect(within(listbox()).getAllByRole('group')).toHaveLength(1);
    expect(options()[0]!.querySelector('mark')).toHaveTextContent('Col');
    await user.clear(field());
    await user.type(field(), 'install');
    // Found in the label, and marked in the detail too where it occurs there.
    expect(options()).toHaveLength(1);
    const marks = [...options()[0]!.querySelectorAll('mark')].map((m) => m.textContent);
    expect(marks).toEqual(['install', 'install']);
  });

  it('finds by keyword without marking, since the keyword is not shown', async () => {
    const { user } = await show();
    await user.type(field(), 'palette');
    expect(options().map((o) => o.textContent)).toEqual(['ColourFoundations']);
    expect(options()[0]!.querySelector('mark')).toBeNull();
  });

  it('leaves the narrowing to the caller with filter null', async () => {
    const { user } = await show({ filter: null });
    await user.type(field(), 'zzz');
    expect(options()).toHaveLength(5);
  });

  it('says so when nothing matches, handing over what was typed', async () => {
    const { user } = await show({ emptyText: (q) => `No command called “${q}”` });
    await user.type(field(), 'zzz');
    expect(screen.getByRole('status')).toHaveTextContent('No command called “zzz”');
    expect(field()).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows the loading text in place of a verdict', async () => {
    await show({ loading: true, loadingText: 'Fetching…', items: [] });
    expect(screen.getByRole('status')).toHaveTextContent('Fetching…');
  });

  it('is controlled by query when the caller wants it', async () => {
    const onQueryChange = vi.fn();
    const { user } = await show({ query: 'but', onQueryChange });
    expect(options()).toHaveLength(1);
    await user.type(field(), 'x');
    expect(onQueryChange).toHaveBeenLastCalledWith('butx');
    expect(field()).toHaveValue('but');
  });
});

describe('the keyboard', () => {
  it('moves with the arrows, wrapping and skipping a disabled row, and with Home and End once a row is active', async () => {
    const { user } = await show();
    expect(active()).toBeNull();
    await user.keyboard('{ArrowDown}');
    expect(active()).toHaveTextContent('Colour');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    // Legacy tables is disabled: from Button the arrow lands on Switch to dark.
    expect(active()).toHaveTextContent('Switch to dark');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(active()).toHaveTextContent('Colour');
    await user.keyboard('{ArrowUp}');
    expect(active()).toHaveTextContent('Copy install command');
    await user.keyboard('{Home}');
    expect(active()).toHaveTextContent('Colour');
    await user.keyboard('{End}');
    expect(active()).toHaveTextContent('Copy install command');
  });

  it('leaves Home and End to the caret until a row is active', async () => {
    const { user } = await show();
    await user.type(field(), 'col');
    field().setSelectionRange(3, 3);
    await user.keyboard('{Home}');
    expect(active()).toBeNull();
    expect(field().selectionStart).toBe(0);
  });

  it('starts a new query with no row active', async () => {
    const { user } = await show();
    await user.keyboard('{ArrowDown}');
    expect(active()).not.toBeNull();
    await user.type(field(), 'b');
    expect(active()).toBeNull();
  });

  it('follows the active row on Enter, or the first that can be chosen when none is active', async () => {
    const { user, onSelect } = await show();
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'colour' }));
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(onSelect).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'button' }));
    await user.type(field(), 'legacy');
    await user.keyboard('{Enter}');
    // The only row left is disabled: nothing is chosen.
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('leaves the Enter of an IME composition alone', async () => {
    const { onSelect } = await show();
    fireEvent.keyDown(field(), { key: 'Enter', isComposing: true });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('keeps Escape from the document, so a listener elsewhere does not also act', async () => {
    await show();
    const outside = vi.fn();
    document.addEventListener('keydown', outside);
    fireEvent.keyDown(field(), { key: 'Escape' });
    document.removeEventListener('keydown', outside);
    expect(outside).not.toHaveBeenCalled();
  });
});

describe('the pointer', () => {
  it('follows a row on click without taking focus from the field, and hover moves the active row', async () => {
    const { user, onSelect } = await show();
    const button = within(listbox()).getByRole('option', { name: /Button/ });
    fireEvent.mouseMove(button);
    expect(active()).toBe(button);
    const press = fireEvent.mouseDown(button);
    expect(press, 'mousedown default prevented').toBe(false);
    await user.click(button);
    expect(onSelect).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'button' }));
  });

  it('does not make a disabled row active, and refuses its click', async () => {
    const { user, onSelect } = await show();
    const legacy = within(listbox()).getByRole('option', { name: /Legacy/ });
    fireEvent.mouseMove(legacy);
    expect(active()).toBeNull();
    await user.click(legacy);
    expect(onSelect).not.toHaveBeenCalled();
    expect(legacy).toHaveAttribute('aria-disabled', 'true');
  });
});

describe('the shortcut hook', () => {
  function Opener() {
    const [count, setCount] = useState(0);
    const hint = useCommandPaletteShortcut(() => setCount((n) => n + 1));
    return (
      <button type="button" aria-keyshortcuts="Meta+K Control+K" title={hint}>
        Open {count}
      </button>
    );
  }

  it('opens on ⌘K and on Ctrl+K, not with Alt, and says the platform’s hint', () => {
    Object.defineProperty(navigator, 'platform', { value: 'MacIntel', configurable: true });
    render(<Opener />);
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    fireEvent.keyDown(document, { key: 'K', ctrlKey: true });
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true, altKey: true });
    fireEvent.keyDown(document, { key: 'k' });
    expect(screen.getByRole('button')).toHaveTextContent('Open 2');
    expect(screen.getByRole('button')).toHaveAttribute('title', '⌘K');
  });

  it('says Ctrl K elsewhere', () => {
    Object.defineProperty(navigator, 'platform', { value: 'Win32', configurable: true });
    render(<Opener />);
    expect(screen.getByRole('button')).toHaveAttribute('title', 'Ctrl K');
  });
});

describe('the stylesheet', () => {
  it('reaches no class by descent, and marks by weight rather than a fill', () => {
    expect(css).not.toMatch(/\.list \.option|\.option \.label/);
    expect(css).toMatch(/\.mark \{[^}]*background: none/);
    expect(css).toMatch(/\.dialog \{ margin-top: 12vh; \}/);
    // On a phone the description wraps under the label rather than taking the row.
    expect(css).toMatch(/@media \(max-width: 480px\) \{\s*\.option \{ flex-wrap: wrap; \}/);
  });
});

describe('axe', () => {
  it('finds nothing in the open palette, full and empty', async () => {
    const { user } = await show();
    expect(await axeViolations(document.body)).toEqual([]);
    await user.type(field(), 'zzz');
    expect(await axeViolations(document.body)).toEqual([]);
  });
});
