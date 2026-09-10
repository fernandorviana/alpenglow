import { readFileSync } from 'node:fs';
import { useState } from 'react';
import { renderToString } from 'react-dom/server';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import type { DateRange } from '../Calendar';
import { DatePicker, type DatePickerProps } from './DatePicker';
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
    // Focus lands from the queued `toggle`, not from opening itself, so this
    // waits for it rather than asserting straight after `openPanel`.
    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: /april 26, 2023/i })).toHaveFocus(),
    );
  });

  it('focuses the grid only once the panel has been shown', async () => {
    render(<DatePicker label="Appointment" value="2023-04-26" />);
    const trigger = screen.getByRole('button', { name: /change date/i });

    // Fakes only `setTimeout`, so the stub's queued `toggle` — a real
    // `setTimeout(0)` — is held, while everything else (React's own
    // scheduling included) keeps running on real timers.
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    try {
      fireEvent.click(trigger);

      // The discrete `beforetoggle` update has committed by now — the panel
      // is showing and the grid is mounted — but the queued `toggle` has not
      // fired, so the popover has not actually been shown by the platform
      // yet. Focus must not have moved to the grid at this point.
      const dayButton = within(screen.getByRole('dialog')).getByRole('button', {
        name: /april 26, 2023/i,
      });
      expect(dayButton).not.toHaveFocus();

      act(() => {
        vi.runAllTimers();
      });

      expect(dayButton).toHaveFocus();
    } finally {
      vi.useRealTimers();
    }
  });

  it('falls back to the first of the month when neither a value nor today is in it', async () => {
    render(<DatePicker label="Appointment" defaultMonth="2023-04-01" />);
    await openPanel();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /april 1, 2023/i })).toHaveFocus(),
    );
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
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /april 1, 2023/i })).toHaveFocus(),
    );

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
    // The free-text parse and its callback are gone; the mask reports reasons.
    expect(code).not.toContain('onParseError');
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

  it('lets an explicit aria-describedby win over the Field', () => {
    // As Input does: the caller is being more specific than the wrapper.
    render(
      <>
        <Field label="Appointment" description="From the Field.">
          <DatePicker label="Appointment" aria-describedby="own" />
        </Field>
        <p id="own">From the caller.</p>
      </>,
    );
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('From the caller.');
  });

  it('lets an explicit required win over the Field', () => {
    render(
      <Field label="Appointment" required>
        <DatePicker label="Appointment" required={false} />
      </Field>,
    );
    expect(screen.getByRole('textbox')).not.toBeRequired();
  });

  it('takes required as its own prop outside a Field', () => {
    render(<DatePicker label="Appointment" required />);
    expect(screen.getByRole('textbox')).toBeRequired();
  });

  it('submits the ISO date under its name, not the locale display text', () => {
    // pt-PT displays 26/04/2023. A native form gets the unambiguous value.
    const { container } = render(
      <form>
        <DatePicker label="Data" name="appointment" locale="pt-PT" value="2023-04-26" />
      </form>,
    );
    const form = container.querySelector('form')!;
    expect(new FormData(form).get('appointment')).toBe('2023-04-26');
    expect(screen.getByRole('textbox')).not.toHaveAttribute('name');
  });

  it('submits a range as an ISO 8601 interval', () => {
    const { container } = render(
      <form>
        <DatePicker
          label="Stay"
          mode="range"
          name="stay"
          value={{ start: '2023-02-20', end: '2023-03-03' }}
        />
      </form>,
    );
    expect(new FormData(container.querySelector('form')!).get('stay')).toBe(
      '2023-02-20/2023-03-03',
    );
  });

  it('submits an empty string under its name when there is no value', () => {
    const { container } = render(
      <form>
        <DatePicker label="Appointment" name="appointment" />
      </form>,
    );
    expect(new FormData(container.querySelector('form')!).get('appointment')).toBe('');
  });

  it('leaves the trigger inert in server HTML, so a click before hydration cannot open an empty panel', () => {
    // Native popovertarget would open the panel before React listens: `open`
    // stays false, the Calendar stays unmounted, and the panel shows empty.
    const html = renderToString(<DatePicker label="Any day" />);
    expect(html).not.toContain('popoverTarget');
  });

  it('submits nothing under its name when disabled', () => {
    const { container } = render(
      <form>
        <DatePicker label="Appointment" name="appointment" value="2023-04-26" disabled />
      </form>,
    );
    expect(new FormData(container.querySelector('form')!).has('appointment')).toBe(false);
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
    // Without this, the assertion after Escape passes even if the click
    // painted nothing.
    expect(bandedCells(dialog)).toHaveLength(1);

    await userEvent.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(bandedCells(dialog)).toHaveLength(0);

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('cancels a pending start on Escape from the pagination button, then closes on the next', async () => {
    render(<DatePicker label="Stay" mode="range" defaultMonth="2023-04-01" />);
    const trigger = await openPanel();
    const dialog = screen.getByRole('dialog');

    await userEvent.click(within(dialog).getByRole('button', { name: /april 10/i }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Next month' }));

    await userEvent.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('opens on the value it holds now, not the one it held when it last closed', async () => {
    function Controlled({ value }: { value: string }) {
      return <DatePicker label="Appointment" value={value} />;
    }
    const { rerender } = render(<Controlled value="2023-04-26" />);
    rerender(<Controlled value="2023-06-15" />);

    await openPanel(/change date/i);
    await waitFor(() =>
      expect(
        within(screen.getByRole('dialog')).getByRole('button', {
          name: 'Thursday, June 15, 2023',
        }),
      ).toHaveFocus(),
    );
  });

  it('keeps no grid in the DOM while closed', () => {
    render(<DatePicker label="Appointment" defaultMonth="2023-04-01" />);
    expect(document.querySelector('[role="grid"]')).toBeNull();
  });

  it('puts no grid in the server HTML, so no month reaches it', () => {
    expect(renderToString(<DatePicker label="Any day" />)).not.toContain('role="grid"');
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

  describe('a controlled range', () => {
    const committed = { start: '2023-04-03', end: '2023-04-05' };

    function Harness({ onSelect }: { onSelect: (next: unknown) => void }) {
      const [value, setValue] = useState<DateRange | null>(committed);
      return (
        <div>
          <DatePicker
            label="Stay"
            mode="range"
            value={value}
            onSelect={(next) => {
              onSelect(next);
              setValue(next as DateRange);
            }}
          />
          <button type="button">Elsewhere</button>
        </div>
      );
    }

    const cellFor = (dialog: HTMLElement, name: RegExp) =>
      within(dialog).getByRole('button', { name }).closest('td')!;

    it('leaves the value alone when Escape cancels a pending start', async () => {
      const onSelect = vi.fn();
      render(<Harness onSelect={onSelect} />);
      await openPanel(/change date/i);
      const dialog = screen.getByRole('dialog');

      await userEvent.click(within(dialog).getByRole('button', { name: /april 10/i }));
      expect(cellFor(dialog, /april 10/i).className).toContain(calendarStyles.inRange!);

      await userEvent.keyboard('{Escape}');
      expect(onSelect).not.toHaveBeenCalled();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(cellFor(dialog, /april 10/i).className).not.toContain(calendarStyles.inRange!);
    });

    it('leaves the value alone when a press outside closes on a pending start', async () => {
      const onSelect = vi.fn();
      render(<Harness onSelect={onSelect} />);
      const trigger = await openPanel(/change date/i);
      const name = trigger.getAttribute('aria-label');

      await userEvent.click(
        within(screen.getByRole('dialog')).getByRole('button', { name: /april 10/i }),
      );
      await userEvent.click(screen.getByRole('button', { name: 'Elsewhere' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(onSelect).not.toHaveBeenCalled();

      await openPanel(/change date/i);
      const banded = bandedCells(screen.getByRole('dialog')).map(
        (cell) => cell.querySelector('button')?.getAttribute('data-date'),
      );
      expect(banded).toEqual(['2023-04-03', '2023-04-04', '2023-04-05']);
      expect(trigger).toHaveAttribute('aria-label', name);
    });
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

describe('DatePicker typing', () => {
  /** A picker holding its own value, as a page would. */
  function Typed({
    initial = null,
    onSelect,
    ...props
  }: Omit<DatePickerProps, 'label' | 'value'> & { initial?: DatePickerProps['value'] }) {
    const [value, setValue] = useState(initial);
    return (
      <DatePicker
        label="Appointment"
        {...props}
        value={value}
        onSelect={(next) => {
          setValue(next);
          onSelect?.(next);
        }}
      />
    );
  }

  it('frames digits as they are typed, in the locale order and with its separator', async () => {
    const onSelect = vi.fn();
    render(<Typed locale="pt-PT" onSelect={onSelect} />);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, '12');
    expect(input).toHaveValue('12/');

    await userEvent.type(input, '022025');
    expect(input).toHaveValue('12/02/2025');
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('2025-02-12');
  });

  it('pads a first digit that cannot start its segment', async () => {
    render(<Typed locale="pt-PT" />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, '45');
    expect(input).toHaveValue('04/05/');
  });

  it('refuses a digit that would make the month impossible, and leaves the caret where it was', async () => {
    render(<Typed />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    await userEvent.type(input, '13');
    expect(input).toHaveValue('1');
    expect(input.selectionStart).toBe(1);
  });

  it('inserts nothing from a paste that would not fit, rather than shifting its digits', async () => {
    render(<Typed />);
    const input = screen.getByRole('textbox');
    await userEvent.click(input);
    await userEvent.paste('13022025');
    expect(input).toHaveValue('');
  });

  it('ignores a digit typed into a field that is already full', async () => {
    const onSelect = vi.fn();
    render(<Typed onSelect={onSelect} />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, '04262023');
    await userEvent.type(input, '1');
    expect(input).toHaveValue('04/26/2023');
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('never refuses a deletion, and lets the digits after it reflow', async () => {
    const onSelect = vi.fn();
    const onInvalid = vi.fn();
    render(
      <Typed locale="pt-PT" initial="2025-02-12" onSelect={onSelect} onInvalid={onInvalid} />,
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;
    // The caret sits after "12": Backspace removes the 2 of the day.
    await userEvent.type(input, '{Backspace}', { initialSelectionStart: 2, initialSelectionEnd: 2 });
    expect(input).toHaveValue('10/22/025');
    expect(input.selectionStart).toBe(1);
    expect(onSelect).not.toHaveBeenCalled();
    expect(onInvalid).not.toHaveBeenCalled();
  });

  it('deletes the digit before a separator on Backspace, rather than putting the separator back', async () => {
    render(<Typed locale="pt-PT" />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, '12');
    await userEvent.keyboard('{Backspace}');
    expect(input).toHaveValue('1');
  });

  it('reports an incomplete date on blur, and never while it is being typed', async () => {
    const onInvalid = vi.fn();
    render(<Typed onInvalid={onInvalid} />);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, '120');
    expect(input).toHaveValue('12/0');
    expect(onInvalid).not.toHaveBeenCalled();
    expect(input).not.toHaveAttribute('aria-invalid');

    await userEvent.tab();
    expect(onInvalid).toHaveBeenCalledWith('12/0', 'incomplete');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('evaluates on Enter without waiting for blur', async () => {
    const onInvalid = vi.fn();
    render(<Typed onInvalid={onInvalid} />);
    await userEvent.type(screen.getByRole('textbox'), '0426{Enter}');
    expect(onInvalid).toHaveBeenCalledWith('04/26/', 'incomplete');
  });

  it('flags a date that does not exist as soon as its last digit is in, and keeps the text', async () => {
    const onInvalid = vi.fn();
    const onSelect = vi.fn();
    render(<Typed onInvalid={onInvalid} onSelect={onSelect} />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, '02312025');
    expect(onInvalid).toHaveBeenCalledWith('02/31/2025', 'not-a-date');
    expect(onSelect).not.toHaveBeenCalled();
    expect(input).toHaveValue('02/31/2025');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('reports min, max and an unavailable day, in that order of priority', async () => {
    const onInvalid = vi.fn();
    const saturday = (date: string) => date === '2023-04-08';
    render(
      <Typed min="2023-04-03" max="2023-04-24" isDateUnavailable={saturday} onInvalid={onInvalid} />,
    );
    const input = screen.getByRole('textbox');

    await userEvent.type(input, '04012023');
    expect(onInvalid).toHaveBeenLastCalledWith('04/01/2023', 'before-min');

    await userEvent.clear(input);
    await userEvent.type(input, '04302023');
    expect(onInvalid).toHaveBeenLastCalledWith('04/30/2023', 'after-max');

    await userEvent.clear(input);
    await userEvent.type(input, '04082023');
    expect(onInvalid).toHaveBeenLastCalledWith('04/08/2023', 'unavailable');
  });

  it('emits null when the field is emptied and left', async () => {
    const onSelect = vi.fn();
    render(<Typed initial="2023-04-26" onSelect={onSelect} />);
    const input = screen.getByRole('textbox');
    await userEvent.clear(input);
    await userEvent.tab();
    expect(onSelect).toHaveBeenCalledWith(null);
    expect(input).toHaveValue('');
  });

  it('calls nothing when focus only passes through', async () => {
    const onSelect = vi.fn();
    const onInvalid = vi.fn();
    render(<Typed initial="2023-04-26" onSelect={onSelect} onInvalid={onInvalid} />);
    await userEvent.click(screen.getByRole('textbox'));
    await userEvent.tab();
    expect(onSelect).not.toHaveBeenCalled();
    expect(onInvalid).not.toHaveBeenCalled();
  });

  it('types a range, joining the two dates and ordering a reversed pair', async () => {
    const onSelect = vi.fn();
    render(<Typed mode="range" onSelect={onSelect} />);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, '04102023');
    expect(input).toHaveValue('04/10/2023 – ');
    expect(onSelect).not.toHaveBeenCalled();

    await userEvent.type(input, '04052023');
    expect(onSelect).toHaveBeenCalledWith({ start: '2023-04-05', end: '2023-04-10' });
    expect(input).toHaveValue('04/05/2023 – 04/10/2023');
  });

  it('deletes the last digit of the start on Backspace after the range separator', async () => {
    render(<Typed mode="range" />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, '04102023');
    await userEvent.keyboard('{Backspace}');
    expect(input).toHaveValue('04/10/202');
  });

  it('reports a range with only its start as incomplete on blur', async () => {
    const onInvalid = vi.fn();
    render(<Typed mode="range" onInvalid={onInvalid} />);
    await userEvent.type(screen.getByRole('textbox'), '04102023');
    await userEvent.tab();
    expect(onInvalid).toHaveBeenCalledWith('04/10/2023 – ', 'incomplete');
  });

  it('reads ISO that arrives whole, in the locale order', async () => {
    const onSelect = vi.fn();
    render(<Typed locale="pt-PT" onSelect={onSelect} />);
    const input = screen.getByRole('textbox');
    await userEvent.click(input);
    await userEvent.paste('2025-02-12');
    expect(onSelect).toHaveBeenCalledWith('2025-02-12');
    expect(input).toHaveValue('12/02/2025');
  });

  it('drops a draft when the value changes from outside', async () => {
    const { rerender } = render(<DatePicker label="Appointment" value="2023-04-26" />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, '{Backspace}');
    expect(input).toHaveValue('04/26/202');

    rerender(<DatePicker label="Appointment" value="2023-06-15" />);
    expect(input).toHaveValue('06/15/2023');
  });

  it('leaves an IME composition alone until it ends', () => {
    render(<Typed locale="pt-PT" />);
    const input = screen.getByRole('textbox');
    input.focus();
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: '１２' } });
    expect(input).toHaveValue('１２');
    fireEvent.compositionEnd(input);
    expect(input).toHaveValue('12/');
  });

  it('restores the pre-composition text when the mask refuses what the composition produced', () => {
    render(<Typed />);
    const input = screen.getByRole('textbox');
    input.focus();
    fireEvent.compositionStart(input);
    // Fullwidth 13: an impossible month, refused the same way ASCII 13 is.
    fireEvent.change(input, { target: { value: '１３' } });
    expect(input).toHaveValue('１３');
    fireEvent.compositionEnd(input);
    expect(input).toHaveValue('');
  });

  it('restores the digits already typed when a composition only inserts a non-digit', async () => {
    render(<Typed />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, '12');
    expect(input).toHaveValue('12/');
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: '12/／' } });
    expect(input).toHaveValue('12/／');
    fireEvent.compositionEnd(input);
    expect(input).toHaveValue('12/');
  });

  it('calls nothing when a composition is cancelled back to the text it started from', () => {
    const onSelect = vi.fn();
    const onInvalid = vi.fn();
    render(<Typed initial="2023-04-26" onSelect={onSelect} onInvalid={onInvalid} />);
    const input = screen.getByRole('textbox');
    input.focus();
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: '04/26/202３' } });
    fireEvent.change(input, { target: { value: '04/26/2023' } });
    fireEvent.compositionEnd(input);
    fireEvent.blur(input);
    expect(onSelect).not.toHaveBeenCalled();
    expect(onInvalid).not.toHaveBeenCalled();
  });

  it('does not evaluate the Enter that Chrome sends to commit an IME composition', () => {
    const onInvalid = vi.fn();
    render(<Typed onInvalid={onInvalid} />);
    const input = screen.getByRole('textbox');
    input.focus();
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: '１２' } });
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    expect(onInvalid).not.toHaveBeenCalled();
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('does not evaluate an Enter carrying keyCode 229 just after a composition ends', () => {
    const onInvalid = vi.fn();
    render(<Typed onInvalid={onInvalid} />);
    const input = screen.getByRole('textbox');
    input.focus();
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: '１２' } });
    fireEvent.compositionEnd(input);
    fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 });
    expect(onInvalid).not.toHaveBeenCalled();
  });

  it('keeps the caret where a mid-string insert began, not at the end, when the mask refuses it', async () => {
    render(<Typed initial="2023-04-26" />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    await userEvent.type(input, '5', { initialSelectionStart: 0, initialSelectionEnd: 0 });
    expect(input).toHaveValue('04/26/2023');
    expect(input.selectionStart).toBe(0);
  });

  it('replaces a mid-string selection, reflowing the segment after it and landing the caret past its separator', async () => {
    const onSelect = vi.fn();
    render(<Typed initial="2023-04-26" onSelect={onSelect} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    await userEvent.type(input, '9', { initialSelectionStart: 3, initialSelectionEnd: 5 });
    expect(input).toHaveValue('04/09/2023');
    expect(input.selectionStart).toBe(6);
    expect(onSelect).toHaveBeenCalledWith('2023-04-09');
  });

  it('takes its placeholder from the locale, compact, with its separator', () => {
    render(<DatePicker label="Data" locale="de-DE" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'DD.MM.YYYY');
  });

  it('does not mask or accept typing when read-only', async () => {
    render(<DatePicker label="Appointment" value="2023-04-26" readOnly />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, '01012020');
    expect(input).toHaveValue('04/26/2023');
  });

  it('shows the field text in the locale order, and names the trigger with the long form', () => {
    render(<DatePicker label="Appointment" value="2023-04-26" />);
    expect(screen.getByRole('textbox')).toHaveValue('04/26/2023');
    expect(
      screen.getByRole('button', { name: 'Change date, April 26, 2023' }),
    ).toBeInTheDocument();
  });

  it('opens the numeric keypad and keeps autofill out of the field', () => {
    render(<DatePicker label="Appointment" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('inputmode', 'numeric');
    expect(input).toHaveAttribute('autocomplete', 'off');
  });

  it('clears the draft and the invalid state on a calendar pick', async () => {
    const onSelect = vi.fn();
    render(<Typed defaultMonth="2023-04-01" onSelect={onSelect} />);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, '02312025');
    expect(input).toHaveAttribute('aria-invalid', 'true');

    await openPanel();
    await userEvent.click(screen.getByRole('button', { name: /april 26/i }));
    expect(onSelect).toHaveBeenCalledWith('2023-04-26');
    expect(input).toHaveValue('04/26/2023');
    expect(input).not.toHaveAttribute('aria-invalid');
  });
});
