import { createRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { NativeSelect } from './NativeSelect';
import { Field } from '../Field/Field';

function Services() {
  return (
    <>
      <option value="consult">Consultation</option>
      <option value="follow-up">Follow-up</option>
      <option value="assessment">Assessment</option>
    </>
  );
}

describe('NativeSelect', () => {
  it('is reachable by its label and reports the chosen value', async () => {
    render(
      <>
        <label htmlFor="service">Service</label>
        <NativeSelect id="service">
          <Services />
        </NativeSelect>
      </>,
    );
    const select = screen.getByLabelText('Service');
    await userEvent.selectOptions(select, 'follow-up');
    expect(select).toHaveValue('follow-up');
  });

  describe('placeholder', () => {
    it('is offered but cannot be chosen', () => {
      render(
        <NativeSelect aria-label="Service" placeholder="Choose a service">
          <Services />
        </NativeSelect>,
      );
      const empty = screen.getByRole('option', { name: 'Choose a service' });
      expect(empty).toBeDisabled();
      expect(empty).toHaveValue('');
    });

    it('is not rendered when none is given', () => {
      render(
        <NativeSelect aria-label="Service">
          <Services />
        </NativeSelect>,
      );
      expect(screen.getAllByRole('option')).toHaveLength(3);
    });
  });

  it('works uncontrolled', async () => {
    render(
      <NativeSelect aria-label="Service" defaultValue="assessment">
        <Services />
      </NativeSelect>,
    );
    const select = screen.getByLabelText('Service');
    expect(select).toHaveValue('assessment');
    await userEvent.selectOptions(select, 'consult');
    expect(select).toHaveValue('consult');
  });

  it('works controlled', async () => {
    function Controlled() {
      const [value, setValue] = useState('consult');
      return (
        <NativeSelect aria-label="Service" value={value} onChange={(e) => setValue(e.target.value)}>
          <Services />
        </NativeSelect>
      );
    }
    render(<Controlled />);
    const select = screen.getByLabelText('Service');
    await userEvent.selectOptions(select, 'assessment');
    expect(select).toHaveValue('assessment');
  });

  it('calls the caller onChange as well as tracking its own value', async () => {
    const onChange = vi.fn();
    render(
      <NativeSelect aria-label="Service" onChange={onChange}>
        <Services />
      </NativeSelect>,
    );
    await userEvent.selectOptions(screen.getByLabelText('Service'), 'follow-up');
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('does not open when disabled', async () => {
    const onChange = vi.fn();
    render(
      <NativeSelect aria-label="Service" disabled onChange={onChange}>
        <Services />
      </NativeSelect>,
    );
    expect(screen.getByLabelText('Service')).toBeDisabled();
    await userEvent.click(screen.getByLabelText('Service'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('sets aria-invalid when invalid', () => {
    render(
      <NativeSelect aria-label="Service" invalid>
        <Services />
      </NativeSelect>,
    );
    expect(screen.getByLabelText('Service')).toHaveAttribute('aria-invalid', 'true');
  });

  it('takes its label, description and invalid state from a Field', () => {
    render(
      <Field label="Service" error="Choose a service before continuing.">
        <NativeSelect placeholder="Choose a service">
          <Services />
        </NativeSelect>
      </Field>,
    );
    const select = screen.getByLabelText('Service');
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select).toHaveAccessibleDescription('Choose a service before continuing.');
  });

  it('hides the chevron from assistive technology', () => {
    // It repeats what the select role already says.
    const { container } = render(
      <NativeSelect aria-label="Service">
        <Services />
      </NativeSelect>,
    );
    const svg = container.querySelector('svg');
    expect(svg?.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('forwards a ref to the select', () => {
    const ref = createRef<HTMLSelectElement>();
    render(
      <NativeSelect aria-label="Service" ref={ref}>
        <Services />
      </NativeSelect>,
    );
    expect(ref.current).toBeInstanceOf(HTMLSelectElement);
  });

  it('participates in a form under its name', async () => {
    const onSubmit = vi.fn((e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      expect(new FormData(e.currentTarget).get('service')).toBe('follow-up');
    });
    render(
      <form onSubmit={onSubmit}>
        <NativeSelect aria-label="Service" name="service" defaultValue="follow-up">
          <Services />
        </NativeSelect>
        <button type="submit">Save</button>
      </form>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
