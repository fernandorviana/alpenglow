import { createRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Select } from './Select';
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

describe('Select', () => {
  it('is reachable by its label and reports the chosen value', async () => {
    render(
      <>
        <label htmlFor="service">Service</label>
        <Select id="service">
          <Services />
        </Select>
      </>,
    );
    const select = screen.getByLabelText('Service');
    await userEvent.selectOptions(select, 'follow-up');
    expect(select).toHaveValue('follow-up');
  });

  describe('placeholder', () => {
    it('is offered but cannot be chosen', () => {
      render(
        <Select aria-label="Service" placeholder="Choose a service">
          <Services />
        </Select>,
      );
      const empty = screen.getByRole('option', { name: 'Choose a service' });
      expect(empty).toBeDisabled();
      expect(empty).toHaveValue('');
    });

    it('is not rendered when none is given', () => {
      render(
        <Select aria-label="Service">
          <Services />
        </Select>,
      );
      expect(screen.getAllByRole('option')).toHaveLength(3);
    });
  });

  it('works uncontrolled', async () => {
    render(
      <Select aria-label="Service" defaultValue="assessment">
        <Services />
      </Select>,
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
        <Select aria-label="Service" value={value} onChange={(e) => setValue(e.target.value)}>
          <Services />
        </Select>
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
      <Select aria-label="Service" onChange={onChange}>
        <Services />
      </Select>,
    );
    await userEvent.selectOptions(screen.getByLabelText('Service'), 'follow-up');
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('does not open when disabled', async () => {
    const onChange = vi.fn();
    render(
      <Select aria-label="Service" disabled onChange={onChange}>
        <Services />
      </Select>,
    );
    expect(screen.getByLabelText('Service')).toBeDisabled();
    await userEvent.click(screen.getByLabelText('Service'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('sets aria-invalid when invalid', () => {
    render(
      <Select aria-label="Service" invalid>
        <Services />
      </Select>,
    );
    expect(screen.getByLabelText('Service')).toHaveAttribute('aria-invalid', 'true');
  });

  it('takes its label, description and invalid state from a Field', () => {
    render(
      <Field label="Service" error="Choose a service before continuing.">
        <Select placeholder="Choose a service">
          <Services />
        </Select>
      </Field>,
    );
    const select = screen.getByLabelText('Service');
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select).toHaveAccessibleDescription('Choose a service before continuing.');
  });

  it('hides the chevron from assistive technology', () => {
    // It repeats what the select role already says.
    const { container } = render(
      <Select aria-label="Service">
        <Services />
      </Select>,
    );
    const svg = container.querySelector('svg');
    expect(svg?.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('forwards a ref to the select', () => {
    const ref = createRef<HTMLSelectElement>();
    render(
      <Select aria-label="Service" ref={ref}>
        <Services />
      </Select>,
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
        <Select aria-label="Service" name="service" defaultValue="follow-up">
          <Services />
        </Select>
        <button type="submit">Save</button>
      </form>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
