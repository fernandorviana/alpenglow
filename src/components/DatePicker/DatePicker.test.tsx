import { readFileSync } from 'node:fs';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { DatePicker } from './DatePicker';
import { Field } from '../Field';
import calendarStyles from '../Calendar/Calendar.module.css';
import { installPopoverStub } from '../../test/popover';

installPopoverStub();

// `import.meta.url` is not a file URL under the jsdom environment these
// component tests run in, so resolve from the repository root instead.
const source = () => readFileSync('src/components/DatePicker/DatePicker.tsx', 'utf8');

// Comments are prose and measurements, not paint — stripped here so a test
// counting literals or token names does not also count what a comment cites.
const stylesheet = () =>
  readFileSync('src/components/DatePicker/DatePicker.module.css', 'utf8').replace(
    /\/\*[\s\S]*?\*\//g,
    '',
  );

/**
 * Clicks the trigger and waits for the popover's `toggle` event to have
 * arrived. The stub queues that event with `setTimeout(0)`, as the platform
 * does, so `aria-expanded` and focus-on-open both land after the click's own
 * promise has already resolved — asserting either one straight after the
 * click would race the queued event instead of testing this component.
 */
async function openPanel(name: string | RegExp = 'Choose date') {
  const trigger = screen.getByRole('button', { name });
  await userEvent.click(trigger);
  await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
  return trigger;
}

/** The band classes `Calendar` paints on a pending or committed range. */
function bandedCells(container: HTMLElement) {
  return within(container)
    .getAllByRole('gridcell')
    .filter(
      (cell) =>
        cell.className.includes(calendarStyles.rangeStart!) ||
        cell.className.includes(calendarStyles.rangeMiddle!) ||
        cell.className.includes(calendarStyles.rangeEnd!),
    );
}

describe('DatePicker', () => {
  it('opens the calendar from the trigger button', async () => {
    render(<DatePicker label="Appointment" defaultMonth="2023-04-01" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await openPanel();
    expect(screen.getByRole('dialog', { name: 'Appointment' })).toBeInTheDocument();
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('names the trigger with the chosen date once there is one', () => {
    // "Change date, April 26, 2023" — the button confirms the value to a
    // screen reader user without them having to read the field.
    render(<DatePicker label="Appointment" value="2023-04-26" />);
    expect(
      screen.getByRole('button', { name: 'Change date, April 26, 2023' }),
    ).toBeInTheDocument();
  });

  it('puts focus on the selected day when it opens', async () => {
    render(<DatePicker label="Appointment" value="2023-04-26" />);
    await openPanel(/change date/i);
    // Scoped to the dialog: the trigger's own name is "Change date, April 26,
    // 2023" once a value is set, and it also matches this regex.
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('button', { name: /april 26, 2023/i })).toHaveFocus();
  });

  it('falls back to the first of the month when neither a value nor today is in it', async () => {
    render(<DatePicker label="Appointment" defaultMonth="2023-04-01" />);
    await openPanel();
    expect(screen.getByRole('button', { name: /april 1, 2023/i })).toHaveFocus();
  });

  it('closes on Escape and gives focus back to the trigger', async () => {
    render(<DatePicker label="Appointment" defaultMonth="2023-04-01" />);
    const trigger = await openPanel();

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes when a pointer press lands outside it', async () => {
    render(
      <div>
        <DatePicker label="Appointment" defaultMonth="2023-04-01" />
        <button type="button">Elsewhere</button>
      </div>,
    );
    await openPanel();
    await userEvent.click(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on a single-mode selection and reports it', async () => {
    const onSelect = vi.fn();
    render(
      <DatePicker label="Appointment" defaultMonth="2023-04-01" onSelect={onSelect} />,
    );
    await openPanel();
    await userEvent.click(screen.getByRole('button', { name: /april 26/i }));

    expect(onSelect).toHaveBeenCalledWith('2023-04-26');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('stays open through the first click of a range and closes on the second', async () => {
    const onSelect = vi.fn();
    render(
      <DatePicker
        label="Stay"
        mode="range"
        defaultMonth="2023-04-01"
        onSelect={onSelect}
      />,
    );
    await openPanel();

    await userEvent.click(screen.getByRole('button', { name: /april 10/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /april 14/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onSelect).toHaveBeenLastCalledWith({ start: '2023-04-10', end: '2023-04-14' });
  });

  it('does not open when disabled', async () => {
    render(<DatePicker label="Appointment" disabled />);
    await userEvent.click(screen.getByRole('button', { name: 'Choose date' }), {
      pointerEventsCheck: 0,
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('takes its id and its invalid state from a surrounding Field', () => {
    render(
      <Field label="Appointment" error="Pick a date">
        <DatePicker label="Appointment" />
      </Field>,
    );
    // Scoped to the input: the panel now stays mounted while closed, and its
    // own `aria-label={label}` matches "Appointment" by the same query.
    const input = screen.getByLabelText('Appointment', { selector: 'input' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  // --- Rulings for Task 8 ---------------------------------------------------

  it('cycles Tab within the dialog and wraps at both ends', async () => {
    render(<DatePicker label="Appointment" defaultMonth="2023-04-01" />);
    await openPanel();
    expect(screen.getByRole('button', { name: /april 1, 2023/i })).toHaveFocus();

    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Previous month' })).toHaveFocus();

    await userEvent.tab({ shift: true });
    expect(screen.getByRole('button', { name: /april 1, 2023/i })).toHaveFocus();
  });

  it('dismisses without restoring focus when focus leaves the subtree', async () => {
    render(
      <div>
        <DatePicker label="Appointment" defaultMonth="2023-04-01" />
        <button type="button">Elsewhere</button>
      </div>,
    );
    await openPanel();
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    act(() => {
      screen.getByRole('button', { name: 'Elsewhere' }).focus();
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Elsewhere' })).toHaveFocus();
  });

  it('reaches for neither Date nor a raw Intl formatter', () => {
    const code = source();
    expect(code).not.toContain('new Intl.DateTimeFormat');
    expect(code).not.toContain('Date.');
    // The panel is placed by CSS anchor positioning now, not by measuring the
    // viewport by hand.
    expect(code).not.toContain('getBoundingClientRect');
    expect(code).not.toContain('innerHeight');
  });

  it('carries no colour literal, no primitive token, and paints the panel entirely from tokens', () => {
    const css = stylesheet();
    const literals = css.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(literals).toEqual([]);
    expect(css).not.toMatch(/\b(?:rgb|rgba|hsl|hsla)\(/);

    const primitives = css.match(/--ap-(gray|brand|red|green|yellow|blue|alpha|ink)-[\w-]+/g) ?? [];
    expect(primitives).toEqual([]);

    // The top-layer decision: the elevation token, not a hand-rolled shadow,
    // and CSS anchor positioning bound to this instance's own anchor name.
    expect(css).toContain('box-shadow: var(--ap-elevation-md)');
    expect(css).toContain('position-anchor: var(--picker-anchor)');
    expect(css).toContain('position-area');
    expect(css).toMatch(/position-try-fallbacks:[^;]*flip-block/);

    // Written twice, as the menu's is: once for the system preference, once
    // for an explicit theme choice.
    const media = css.includes('@media (prefers-color-scheme: dark)');
    const attr = css.includes(":root[data-theme='dark']");
    expect(media && attr).toBe(true);
    const borderColour = css.split('border-color: var(--ap-color-border-default)').length - 1;
    expect(borderColour).toBe(2);
  });

  it('names a bare input with the label when there is no surrounding Field', () => {
    render(<DatePicker label="Appointment" />);
    expect(screen.getByRole('textbox', { name: 'Appointment' })).toBeInTheDocument();
  });

  it('takes required from a surrounding Field', () => {
    render(
      <Field label="Appointment" required>
        <DatePicker label="Appointment" />
      </Field>,
    );
    expect(screen.getByRole('textbox')).toBeRequired();
  });

  it('does not open when read-only', async () => {
    render(<DatePicker label="Appointment" value="2023-04-26" readOnly />);
    await userEvent.click(screen.getByRole('button', { name: /change date/i }), {
      pointerEventsCheck: 0,
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  // --- Rulings for Task 8b: the top layer -----------------------------------

  it('puts the panel in the top layer as a manual popover anchored to the field', () => {
    render(<DatePicker label="Appointment" defaultMonth="2023-04-01" />);
    const trigger = screen.getByRole('button', { name: 'Choose date' });
    const dialog = document.querySelector('[role="dialog"]')!;

    expect(dialog).toHaveAttribute('popover', 'manual');
    expect(trigger).toHaveAttribute('popovertarget', dialog.id);

    const anchorName = trigger.parentElement!.style.getPropertyValue('anchor-name');
    expect(anchorName).not.toBe('');
    expect((dialog as HTMLElement).style.getPropertyValue('--picker-anchor')).toBe(anchorName);
  });

  it('cancels a pending range start on the first Escape and closes on the second', async () => {
    render(<DatePicker label="Stay" mode="range" defaultMonth="2023-04-01" />);
    const trigger = await openPanel();
    const dialog = screen.getByRole('dialog');

    await userEvent.click(within(dialog).getByRole('button', { name: /april 10/i }));

    await userEvent.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(bandedCells(dialog)).toHaveLength(0);

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('opens on the resolved month again after closing', async () => {
    render(<DatePicker label="Appointment" defaultMonth="2023-04-01" />);
    await openPanel();
    const dialog = screen.getByRole('dialog');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Next month' }));
    expect(within(dialog).getByRole('grid', { name: /may 2023/i })).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await openPanel();
    expect(
      within(screen.getByRole('dialog')).getByRole('grid', { name: /april 2023/i }),
    ).toBeInTheDocument();
  });

  it('discards a half-made range when the panel closes', async () => {
    render(
      <div>
        <DatePicker label="Stay" mode="range" defaultMonth="2023-04-01" />
        <button type="button">Elsewhere</button>
      </div>,
    );
    await openPanel();
    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /april 10/i }));

    await userEvent.click(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await openPanel();
    expect(bandedCells(screen.getByRole('dialog'))).toHaveLength(0);
  });

  it('imports the popover stub rather than defining its own', () => {
    // Built from two pieces rather than written whole: written whole, the
    // literal would appear in this very file's source and always match it.
    const definesShowPopover = ['HTMLElement.prototype', 'showPopover ='].join('.');
    const own = readFileSync('src/components/DatePicker/DatePicker.test.tsx', 'utf8');
    const menu = readFileSync('src/components/DropdownMenu/DropdownMenu.test.tsx', 'utf8');
    for (const text of [own, menu]) {
      expect(text).toContain("from '../../test/popover'");
      expect(text).not.toContain(definesShowPopover);
    }
  });
});
