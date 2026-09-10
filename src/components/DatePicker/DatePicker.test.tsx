import { readFileSync } from 'node:fs';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { DatePicker } from './DatePicker';
import { Field } from '../Field';

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

describe('DatePicker', () => {
  it('opens the calendar from the trigger button', async () => {
    render(<DatePicker label="Appointment" defaultMonth="2023-04-01" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Choose date' }));
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
    await userEvent.click(screen.getByRole('button', { name: /change date/i }));
    // Scoped to the dialog: the trigger's own name is "Change date, April 26,
    // 2023" once a value is set, and it also matches this regex.
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('button', { name: /april 26, 2023/i })).toHaveFocus();
  });

  it('falls back to the first of the month when neither a value nor today is in it', async () => {
    render(<DatePicker label="Appointment" defaultMonth="2023-04-01" />);
    await userEvent.click(screen.getByRole('button', { name: 'Choose date' }));
    expect(screen.getByRole('button', { name: /april 1, 2023/i })).toHaveFocus();
  });

  it('closes on Escape and gives focus back to the trigger', async () => {
    render(<DatePicker label="Appointment" defaultMonth="2023-04-01" />);
    const trigger = screen.getByRole('button', { name: 'Choose date' });
    await userEvent.click(trigger);

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
    await userEvent.click(screen.getByRole('button', { name: 'Choose date' }));
    await userEvent.click(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on a single-mode selection and reports it', async () => {
    const onSelect = vi.fn();
    render(
      <DatePicker label="Appointment" defaultMonth="2023-04-01" onSelect={onSelect} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Choose date' }));
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
    await userEvent.click(screen.getByRole('button', { name: 'Choose date' }));

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
    const input = screen.getByLabelText('Appointment');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  // --- Rulings for Task 8 ---------------------------------------------------

  it('cycles Tab within the dialog and wraps at both ends', async () => {
    render(<DatePicker label="Appointment" defaultMonth="2023-04-01" />);
    await userEvent.click(screen.getByRole('button', { name: 'Choose date' }));
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
    await userEvent.click(screen.getByRole('button', { name: 'Choose date' }));
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
  });

  it('carries no colour literal except the alpha-black shadow primitives', () => {
    const css = stylesheet();
    const literals = css.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(literals).toEqual([]);
    expect(css).not.toMatch(/\b(?:rgb|rgba|hsl|hsla)\(/);
    const primitives = css.match(/--ap-(gray|brand|red|green|yellow|blue|alpha)-[\w-]+/g) ?? [];
    expect(primitives).toEqual(['--ap-alpha-black-08', '--ap-alpha-black-16']);
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
});
