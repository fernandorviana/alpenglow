import { createRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('is labelled by its own text, with no id needed', () => {
    // The input is wrapped in the label, so a checkbox cannot ship unlabelled
    // by forgetting to wire htmlFor.
    render(<Checkbox>Send a reminder</Checkbox>);
    expect(screen.getByRole('checkbox', { name: 'Send a reminder' })).toBeInTheDocument();
  });

  it('toggles when the label text is clicked, not just the box', async () => {
    render(<Checkbox>Send a reminder</Checkbox>);
    await userEvent.click(screen.getByText('Send a reminder'));
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('toggles with the space key', async () => {
    render(<Checkbox>Send a reminder</Checkbox>);
    await userEvent.tab();
    await userEvent.keyboard(' ');
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('includes the description in its accessible description', () => {
    render(<Checkbox description="They will get an email the day before.">Send a reminder</Checkbox>);
    const box = screen.getByRole('checkbox');
    // The name is the label alone; the description is announced separately.
    expect(box).toHaveAccessibleName('Send a reminder');
    expect(box).toHaveAccessibleDescription('They will get an email the day before.');
  });

  describe('indeterminate', () => {
    it('sets the DOM property, which has no HTML attribute', () => {
      render(<Checkbox indeterminate>All services</Checkbox>);
      expect(screen.getByRole('checkbox')).toHaveProperty('indeterminate', true);
    });

    it('reports itself as mixed through the property alone, with no aria-checked to override it', () => {
      // HTML-AAM maps the indeterminate property to mixed. A literal
      // aria-checked="mixed" would outrank the native state, and go on saying
      // mixed after a click has made the box checked.
      render(<Checkbox indeterminate>All services</Checkbox>);
      const box = screen.getByRole('checkbox');
      expect(box).toBePartiallyChecked();
      expect(box).not.toHaveAttribute('aria-checked');
    });

    it('stays mixed after a click while the prop still says so', async () => {
      // The browser clears the property on activation. The prop is the
      // caller's statement of the state, so the box must not drift from it
      // when the caller does not re-render.
      render(<Checkbox indeterminate>All services</Checkbox>);
      const box = screen.getByRole('checkbox');
      await userEvent.click(box);
      expect(box).toHaveProperty('indeterminate', true);
    });

    it('clears the property when it stops being mixed', () => {
      const { rerender } = render(<Checkbox indeterminate>All</Checkbox>);
      rerender(<Checkbox indeterminate={false}>All</Checkbox>);
      expect(screen.getByRole('checkbox')).toHaveProperty('indeterminate', false);
    });
  });

  it('does not toggle when disabled', async () => {
    const onChange = vi.fn();
    render(<Checkbox disabled onChange={onChange}>Send a reminder</Checkbox>);
    await userEvent.click(screen.getByText('Send a reminder'));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('works as a controlled input', async () => {
    function Controlled() {
      const [on, setOn] = useState(false);
      return (
        <Checkbox checked={on} onChange={(e) => setOn(e.target.checked)}>
          Send a reminder
        </Checkbox>
      );
    }
    render(<Controlled />);
    const box = screen.getByRole('checkbox');
    await userEvent.click(box);
    expect(box).toBeChecked();
    await userEvent.click(box);
    expect(box).not.toBeChecked();
  });

  it('forwards a ref to the input', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Checkbox ref={ref}>Send a reminder</Checkbox>);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('participates in a form under its name', async () => {
    const onSubmit = vi.fn((e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      expect(new FormData(e.currentTarget).get('reminder')).toBe('yes');
    });
    render(
      <form onSubmit={onSubmit}>
        <Checkbox name="reminder" value="yes" defaultChecked>
          Send a reminder
        </Checkbox>
        <button type="submit">Save</button>
      </form>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
