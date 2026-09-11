import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Input } from './Input';

describe('Input', () => {
  it('is reachable by its label', () => {
    render(
      <>
        <label htmlFor="email">Email address</label>
        <Input id="email" />
      </>,
    );
    expect(screen.getByLabelText('Email address')).toBeInstanceOf(HTMLInputElement);
  });

  it('accepts typing and reports the value', async () => {
    render(<Input aria-label="Client name" />);
    const field = screen.getByLabelText('Client name');
    await userEvent.type(field, 'Leonor');
    expect(field).toHaveValue('Leonor');
  });

  describe('invalid', () => {
    it('sets aria-invalid so assistive technology hears the state', () => {
      render(<Input aria-label="Email" invalid />);
      expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    });

    it('leaves the attribute off when valid, rather than setting it false', () => {
      // aria-invalid="false" is noise; absent is the correct resting state.
      render(<Input aria-label="Email" />);
      expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-invalid');
    });

    it('can be described by an error message', () => {
      render(
        <>
          <Input aria-label="Email" invalid aria-describedby="err" />
          <p id="err">Enter a valid email address.</p>
        </>,
      );
      expect(screen.getByLabelText('Email')).toHaveAccessibleDescription(
        'Enter a valid email address.',
      );
    });
  });

  it('does not accept input when disabled', async () => {
    const onChange = vi.fn();
    render(<Input aria-label="Email" disabled onChange={onChange} />);
    await userEvent.type(screen.getByLabelText('Email'), 'hello');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('is readable but not editable when read-only', async () => {
    render(<Input aria-label="Reference" readOnly defaultValue="APT-4821" />);
    const field = screen.getByLabelText('Reference');
    await userEvent.type(field, 'x');
    expect(field).toHaveValue('APT-4821');
  });

  it('hides decorative icons from the accessible name', () => {
    render(<Input aria-label="Search" iconStart={<svg data-testid="glass" />} />);
    expect(screen.getByLabelText('Search')).toHaveAccessibleName('Search');
    expect(screen.getByTestId('glass').parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('forwards a ref to the input, not the wrapper', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input aria-label="Email" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('keeps `size` as a visual scale rather than the HTML character count', () => {
    // The HTML attribute would render a 40-character-wide box.
    render(<Input aria-label="Email" size="sm" />);
    expect(screen.getByLabelText('Email')).not.toHaveAttribute('size');
  });

  it('passes through native attributes', () => {
    render(<Input aria-label="Email" type="email" required placeholder="you@example.com" />);
    const field = screen.getByLabelText('Email');
    expect(field).toHaveAttribute('type', 'email');
    expect(field).toBeRequired();
    expect(field).toHaveAttribute('placeholder', 'you@example.com');
  });
});
