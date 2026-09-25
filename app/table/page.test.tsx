import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { readCss } from '@/test/css';
import { installPopoverStub } from '@/test/popover';
import { toast } from '@/components/Toast';
import Page from './page';

vi.mock('@/components/Toast', async (original) => ({
  ...(await original<typeof import('@/components/Toast')>()),
  toast: vi.fn(),
}));

// jsdom has no matchMedia; the page's specimens ask it.
window.matchMedia = (query: string) =>
  ({ matches: false, media: query, addEventListener: () => {}, removeEventListener: () => {} }) as unknown as MediaQueryList;

/**
 * The demo's row action was a docs button, "⋯", that did nothing, on a page
 * that says a row's actions belong in a menu. The Try it table takes the
 * Table's own `rowActions`: Edit and Delete as icon buttons while there is
 * room, Archive in the menu, all three gathered into "⋯" before any column
 * leaves — and each one does something when chosen.
 */
describe('the Table page’s Try it', () => {
  it('gives each row real actions through rowActions: buttons, a menu, and something that happens', async () => {
    render(<Page />);
    const table = screen.getAllByRole('region', { name: 'Clients' })[0]!;
    // Sorted by client: Aoife Byrne is first.
    const edits = within(table).getAllByRole('button', { name: 'Edit' });
    expect(edits).toHaveLength(4);
    expect(within(table).getAllByRole('button', { name: 'Delete' })).toHaveLength(4);
    expect(within(table).getAllByRole('button', { name: 'More actions for Aoife Byrne' }).length).toBeGreaterThan(0);

    await userEvent.click(edits[0]!);
    expect(toast).toHaveBeenCalledWith(expect.stringContaining('Aoife Byrne'));
  });

  it('takes a deleted row out of the list, and its toast’s Undo puts it back where it was', async () => {
    // "Deleted Aoife Byrne" with Aoife Byrne still in the table was a toast
    // saying what had not happened.
    vi.mocked(toast).mockClear();
    render(<Page />);
    const table = () => screen.getAllByRole('region', { name: 'Clients' })[0]!;
    const names = () => within(table()).getAllByRole('checkbox', { name: /^Select (?!all)/ }).map((c) => c.getAttribute('aria-label'));
    expect(names()).toEqual(['Select Aoife Byrne', 'Select Gary Martin', 'Select Lisa Roberts', 'Select Sanjay Choudhary']);

    await userEvent.click(within(table()).getAllByRole('button', { name: 'Delete' })[0]!);
    expect(names()).toEqual(['Select Gary Martin', 'Select Lisa Roberts', 'Select Sanjay Choudhary']);
    expect(toast).toHaveBeenLastCalledWith('Deleted Aoife Byrne', { action: { label: 'Undo', onClick: expect.any(Function) } });

    const [, options] = vi.mocked(toast).mock.lastCall!;
    act(() => options!.action!.onClick());
    expect(names()).toEqual(['Select Aoife Byrne', 'Select Gary Martin', 'Select Lisa Roberts', 'Select Sanjay Choudhary']);
  });

  it('keeps no docs button of its own for a row, and no rule for one', () => {
    expect(readCss('app/docs.css')).not.toMatch(/\.rowAction\b/);
    const pages = readdirSync('app', { recursive: true, encoding: 'utf8' }).filter((f) => f.endsWith('.tsx') && !f.endsWith('.test.tsx'));
    expect(pages.filter((f) => /className="rowAction"/.test(readFileSync(join('app', f), 'utf8')))).toEqual([]);
  });
});

/**
 * The dense demo's selection bar. The drawn Switch, "Show only selected", is
 * a checkable action: the Switch in the bar while it fits, and a checkbox row
 * in "⋯" when the bar has no room. Which one shows is the rules' (jsdom reads
 * no container query); both are there, and both change the same state.
 */
describe('the Table page’s dense demo', () => {
  installPopoverStub();

  const staff = () => screen.getByRole('region', { name: 'Staff' });
  const bar = () => screen.getByRole('group', { name: /selected$/ });

  async function pickTwo() {
    const boxes = within(staff()).getAllByRole('checkbox', { name: /^Select (?!all)/ });
    await userEvent.click(boxes[0]!);
    await userEvent.click(boxes[1]!);
  }

  it('draws Show only selected as the Switch in the bar, and it narrows the rows to the selection', async () => {
    render(<Page />);
    await pickTwo();
    const inline = bar().querySelector('[data-bulk="inline"]') as HTMLElement;
    const toggle = within(inline).getByRole('switch', { name: 'Show only selected' });
    expect(toggle).not.toBeChecked();
    await userEvent.click(toggle);
    expect(within(staff()).getAllByRole('checkbox', { name: /^Select (?!all)/ })).toHaveLength(2);
    expect(within(bar().querySelector('[data-bulk="inline"]') as HTMLElement).getByRole('switch', { name: 'Show only selected' })).toBeChecked();
  });

  it('tucks it into "⋯" as a checkbox row with the same state and the same words', async () => {
    render(<Page />);
    await pickTwo();
    const hidden = { hidden: true };
    const tucked = () => bar().querySelector('[data-bulk="tucked"]') as HTMLElement;
    await userEvent.click(within(tucked()).getByRole('button', { name: 'More actions', ...hidden }));
    const row = within(tucked()).getByRole('menuitemcheckbox', { name: 'Show only selected', ...hidden });
    expect(row).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(row);
    expect(within(staff()).getAllByRole('checkbox', { name: /^Select (?!all)/ })).toHaveLength(2);
    expect(within(tucked()).getByRole('menuitemcheckbox', { name: 'Show only selected', ...hidden })).toHaveAttribute('aria-checked', 'true');
  });
});
