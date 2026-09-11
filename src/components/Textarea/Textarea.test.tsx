import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Textarea } from './Textarea';

describe('Textarea', () => {
  it('is reachable by its label and accepts multiline text', async () => {
    render(
      <>
        <label htmlFor="notes">Consultation notes</label>
        <Textarea id="notes" />
      </>,
    );
    const field = screen.getByLabelText('Consultation notes');
    await userEvent.type(field, 'First line{enter}Second line');
    expect(field).toHaveValue('First line\nSecond line');
  });

  it('starts at a fixed height rather than a row count', () => {
    // rows would size the box from the font that happens to load; the drawn
    // component has one height and keeps it.
    render(<Textarea aria-label="Notes" />);
    expect(screen.getByLabelText('Notes')).not.toHaveAttribute('rows');
  });

  it('sets aria-invalid when invalid', () => {
    render(<Textarea aria-label="Notes" invalid />);
    expect(screen.getByLabelText('Notes')).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not accept input when disabled', async () => {
    const onChange = vi.fn();
    render(<Textarea aria-label="Notes" disabled onChange={onChange} />);
    await userEvent.type(screen.getByLabelText('Notes'), 'hello');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('forwards a ref', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea aria-label="Notes" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });
});
