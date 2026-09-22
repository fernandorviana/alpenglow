import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { Filters } from './Filters';
import type { FilterField, FilterValue } from './Filters';
import styles from './Filters.module.css';
import { installPopoverStub } from '../../test/popover';
import { readCss, block } from '../../test/css';
import { axeViolations } from '../../test/axe';

installPopoverStub();

const css = readCss('src/components/Filters/Filters.module.css');

const fields: FilterField[] = [
  {
    key: 'status',
    label: 'Status',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'pending', label: 'Invite pending' },
    ],
  },
  {
    key: 'role',
    label: 'Role',
    options: [
      { value: 'owner', label: 'Owner' },
      { value: 'admin', label: 'Admin' },
    ],
  },
];

const value: FilterValue[] = [{ key: 'status', values: ['active', 'pending'] }];

describe('Filters — the bar', () => {
  it('is a group named Filters, with a chip for each field that has a value', () => {
    render(<Filters fields={fields} value={value} onChange={() => {}} />);
    const group = screen.getByRole('group', { name: 'Filters' });
    expect(group).toHaveClass(styles.filters!);
    const chip = within(group).getByRole('button', { name: 'Status is Active or Invite pending' });
    expect(chip).toHaveAttribute('aria-haspopup', 'dialog');
    expect(within(group).getByRole('button', { name: 'Remove Status filter' })).toBeInTheDocument();
  });

  it('says the words the caller gives', () => {
    render(
      <Filters
        fields={fields}
        value={value}
        onChange={() => {}}
        describe={(field, chosen) => `${field.label}: ${chosen.map((o) => o.label).join(', ')}`}
      />,
    );
    expect(screen.getByRole('button', { name: 'Status: Active, Invite pending' })).toBeInTheDocument();
  });

  it('ignores a value whose field or option it does not know', () => {
    render(
      <Filters fields={fields} value={[{ key: 'nowhere', values: ['x'] }, { key: 'status', values: ['gone'] }]} onChange={() => {}} />,
    );
    expect(screen.queryByRole('button', { name: /Remove/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  it('removes a chip, and reports the rest', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Filters fields={fields} value={[...value, { key: 'role', values: ['admin'] }]} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Remove Status filter' }));
    expect(onChange).toHaveBeenLastCalledWith([{ key: 'role', values: ['admin'] }]);
  });

  it('clears everything, and offers Clear only with something to clear', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<Filters fields={fields} value={value} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
    rerender(<Filters fields={fields} value={[]} onChange={onChange} />);
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  it('takes its labels from the caller', () => {
    render(<Filters fields={fields} value={value} onChange={() => {}} label="Filtros" addLabel="Adicionar" clearLabel="Limpar" />);
    expect(screen.getByRole('group', { name: 'Filtros' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adicionar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Limpar' })).toBeInTheDocument();
  });
});

describe('Filters — adding and changing', () => {
  it('adds a filter: the fields, then a field’s values, and a check reports the new value', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Filters fields={fields} value={[]} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Add filter' }));
    const panel = screen.getByRole('dialog', { name: 'Add filter' });
    expect(within(panel).queryByRole('checkbox')).not.toBeInTheDocument();
    await user.click(within(panel).getByRole('button', { name: 'Role' }));
    expect(within(panel).getByRole('button', { name: 'Role' })).toHaveAttribute('aria-pressed', 'true');
    const group = within(panel).getByRole('group', { name: 'Role' });
    await user.click(within(group).getByRole('checkbox', { name: 'Admin' }));
    expect(onChange).toHaveBeenLastCalledWith([{ key: 'role', values: ['admin'] }]);
  });

  it('keeps the order of the fields in the value, and of the options in a field', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Filters fields={fields} value={[{ key: 'role', values: ['admin'] }]} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Add filter' }));
    const panel = screen.getByRole('dialog', { name: 'Add filter' });
    await user.click(within(panel).getByRole('button', { name: 'Role' }));
    await user.click(within(panel).getByRole('checkbox', { name: 'Owner' }));
    expect(onChange).toHaveBeenLastCalledWith([{ key: 'role', values: ['owner', 'admin'] }]);
  });

  it('keeps a value it does not know, after the known ones', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Filters fields={fields} value={[{ key: 'status', values: ['gone', 'active'] }]} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Status is Active' }));
    await user.click(within(screen.getByRole('dialog', { name: 'Status' })).getByRole('checkbox', { name: 'Inactive' }));
    expect(onChange).toHaveBeenLastCalledWith([{ key: 'status', values: ['active', 'inactive', 'gone'] }]);
  });

  it('opens a chip’s values from its words, and unchecking the last one drops the field', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Filters fields={fields} value={[{ key: 'role', values: ['admin'] }, ...value]} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Role is Admin' }));
    const panel = screen.getByRole('dialog', { name: 'Role' });
    const admin = within(panel).getByRole('checkbox', { name: 'Admin' });
    expect(admin).toBeChecked();
    expect(within(panel).getByRole('checkbox', { name: 'Owner' })).not.toBeChecked();
    await user.click(admin);
    expect(onChange).toHaveBeenLastCalledWith(value);
  });

  it('has no axe violations, closed and open', async () => {
    const user = userEvent.setup();
    const { container } = render(<Filters fields={fields} value={value} onChange={() => {}} />);
    expect(await axeViolations(container)).toEqual([]);
    await user.click(screen.getByRole('button', { name: 'Add filter' }));
    await user.click(within(screen.getByRole('dialog', { name: 'Add filter' })).getByRole('button', { name: 'Status' }));
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe('Filters — stylesheet', () => {
  it('frames the bar as the drawing does and gives the chips the Tag', () => {
    const bar = block(css, '.filters {');
    expect(bar).toContain('var(--ap-color-surface-raised)');
    expect(bar).toContain('var(--ap-color-border-subtle)');
    expect(bar).toContain('var(--ap-radius-xl)');
  });

  it('makes the words a button that looks like words, with a ring of its own', () => {
    const words = block(css, '.words {');
    expect(words).toContain('font: inherit');
    expect(words).toContain('background: none');
    expect(block(css, '.words:focus-visible {')).toContain('outline:');
  });
});
