import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Field } from './Field';
import { Input } from '../Input/Input';
import { Textarea } from '../Textarea/Textarea';

describe('Field', () => {
  it('connects the label to the control without an id from the caller', async () => {
    render(
      <Field label="Email address">
        <Input type="email" />
      </Field>,
    );
    const control = screen.getByLabelText('Email address');
    await userEvent.type(control, 'a@b.co');
    expect(control).toHaveValue('a@b.co');
  });

  it('announces the description with the control', () => {
    render(
      <Field label="Email address" description="We only use it for reminders.">
        <Input />
      </Field>,
    );
    expect(screen.getByLabelText('Email address')).toHaveAccessibleDescription(
      'We only use it for reminders.',
    );
  });

  describe('error', () => {
    it('marks the control invalid and announces the message', () => {
      render(
        <Field label="Email address" error="Enter an address that includes an @.">
          <Input />
        </Field>,
      );
      const control = screen.getByLabelText('Email address');
      expect(control).toHaveAttribute('aria-invalid', 'true');
      expect(control).toHaveAccessibleDescription('Enter an address that includes an @.');
    });

    it('keeps the description alongside the error', () => {
      // Help text usually still applies when the value is wrong, and often
      // explains why — dropping it at the moment it is most useful is a bug.
      render(
        <Field
          label="Email address"
          description="We only use it for reminders."
          error="Enter an address that includes an @."
        >
          <Input />
        </Field>,
      );
      expect(screen.getByLabelText('Email address')).toHaveAccessibleDescription(
        'We only use it for reminders. Enter an address that includes an @.',
      );
    });

    it('renders no message and no invalid state when there is no error', () => {
      render(
        <Field label="Email address">
          <Input />
        </Field>,
      );
      expect(screen.getByLabelText('Email address')).not.toHaveAttribute('aria-invalid');
    });
  });

  it('marks the control required, not just the label', () => {
    render(
      <Field label="Email address" required>
        <Input />
      </Field>,
    );
    expect(screen.getByLabelText(/Email address/)).toBeRequired();
  });

  it('lets a control override what the field supplies', () => {
    // The caller is being more specific than the wrapper, so the caller wins.
    render(
      <Field label="Email address" error="Field says invalid">
        <Input invalid={false} />
      </Field>,
    );
    expect(screen.getByLabelText('Email address')).not.toHaveAttribute('aria-invalid');
  });

  it('works with Textarea', () => {
    render(
      <Field label="Consultation notes" error="Notes are required.">
        <Textarea />
      </Field>,
    );
    const control = screen.getByLabelText('Consultation notes');
    expect(control).toBeInstanceOf(HTMLTextAreaElement);
    expect(control).toHaveAttribute('aria-invalid', 'true');
    expect(control).toHaveAccessibleDescription('Notes are required.');
  });

  it('gives each field its own ids when several are on a page', () => {
    render(
      <>
        <Field label="First name">
          <Input />
        </Field>
        <Field label="Last name">
          <Input />
        </Field>
      </>,
    );
    const first = screen.getByLabelText('First name');
    const last = screen.getByLabelText('Last name');
    expect(first.id).not.toBe(last.id);
  });
});

describe('controls without a Field', () => {
  it('still work on their own', async () => {
    render(<Input aria-label="Search" />);
    const control = screen.getByLabelText('Search');
    await userEvent.type(control, 'Leonor');
    expect(control).toHaveValue('Leonor');
    expect(control).not.toHaveAttribute('aria-describedby');
  });
});
