import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Radio } from './Radio';

describe('Radio', () => {
  it('is labelled by its own text', () => {
    render(<Radio name="mode">In person</Radio>);
    expect(screen.getByRole('radio', { name: 'In person' })).toBeInTheDocument();
  });

  it('keeps the description out of its name and adds it to any it was given', () => {
    // Outside the label, as in Checkbox, or the two run together into one long
    // name. A caller's own aria-describedby is kept, not replaced.
    render(
      <>
        <p id="hint">Choose how the client attends.</p>
        <Radio name="mode" description="At the clinic." aria-describedby="hint">
          In person
        </Radio>
      </>,
    );
    const radio = screen.getByRole('radio');
    expect(radio).toHaveAccessibleName('In person');
    expect(radio).toHaveAccessibleDescription('Choose how the client attends. At the clinic.');
  });

  it('lets only one option in a group be selected', async () => {
    render(
      <fieldset>
        <legend>Appointment type</legend>
        <Radio name="mode" value="person">In person</Radio>
        <Radio name="mode" value="video">Video call</Radio>
      </fieldset>,
    );
    await userEvent.click(screen.getByRole('radio', { name: 'In person' }));
    expect(screen.getByRole('radio', { name: 'In person' })).toBeChecked();

    await userEvent.click(screen.getByRole('radio', { name: 'Video call' }));
    expect(screen.getByRole('radio', { name: 'Video call' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'In person' })).not.toBeChecked();
  });

  it('moves selection with the arrow keys, as a radio group should', async () => {
    render(
      <fieldset>
        <legend>Appointment type</legend>
        <Radio name="mode" value="person">In person</Radio>
        <Radio name="mode" value="video">Video call</Radio>
      </fieldset>,
    );
    await userEvent.click(screen.getByRole('radio', { name: 'In person' }));
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: 'Video call' })).toBeChecked();
  });

  it('does not select when disabled', async () => {
    render(<Radio name="mode" disabled>In person</Radio>);
    await userEvent.click(screen.getByText('In person'));
    expect(screen.getByRole('radio')).not.toBeChecked();
  });

  it('forwards a ref to the input', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Radio name="mode" ref={ref}>In person</Radio>);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
