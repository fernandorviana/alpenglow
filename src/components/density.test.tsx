import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { readCss, block } from '@/test/css';
import { Button } from './Button';
import { Input } from './Input';
import { NativeSelect } from './NativeSelect';
import { Select } from './Select';
import { Combobox } from './Combobox';
import { DatePicker } from './DatePicker';
import control from './control.module.css';
import button from './Button/Button.module.css';

/**
 * Density reaches a control only when the caller left the size to it. An
 * explicit size is a decision about that control and stays; `md` must not
 * read the token, or a compact region would shrink a control someone sized.
 */

const box = (el: HTMLElement) => el.closest(`.${control.control}`) as HTMLElement;

describe('a control with no size follows density', () => {
  it('Input', () => {
    render(<Input aria-label="Name" />);
    expect(box(screen.getByRole('textbox'))).toHaveClass(control.auto!);
  });
  it('NativeSelect', () => {
    render(<NativeSelect aria-label="Kind"><option>A</option></NativeSelect>);
    expect(box(screen.getByRole('combobox'))).toHaveClass(control.auto!);
  });
  it('Select', () => {
    render(<Select aria-label="Kind" options={[{ value: 'a', label: 'A' }]} />);
    expect(screen.getByRole('combobox')).toHaveClass(control.auto!);
  });
  it('Combobox', () => {
    render(<Combobox aria-label="Client" options={[{ value: 'a', label: 'A' }]} />);
    expect(box(screen.getByRole('combobox'))).toHaveClass(control.auto!);
  });
  it('DatePicker', () => {
    render(<DatePicker label="Date" />);
    expect(box(screen.getByRole('textbox'))).toHaveClass(control.auto!);
  });
  it('Button', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveClass(button.auto!);
  });
});

describe('an explicit size wins', () => {
  it.each(['sm', 'md', 'lg'] as const)('Input size=%s', (size) => {
    render(<Input aria-label="Name" size={size} />);
    const el = box(screen.getByRole('textbox'));
    expect(el).toHaveClass(control[size]!);
    expect(el).not.toHaveClass(control.auto!);
  });
  it.each(['sm', 'md', 'lg'] as const)('Button size=%s', (size) => {
    render(<Button size={size}>Save</Button>);
    const el = screen.getByRole('button', { name: 'Save' });
    expect(el).toHaveClass(button[size]!);
    expect(el).not.toHaveClass(button.auto!);
  });
});

describe('the stylesheets', () => {
  it('derives the auto control’s padding from the token, so 40 is md and 32 is sm', () => {
    const auto = block(readCss('src/components/control.module.css'), '.auto {');
    expect(auto).toContain('min-height: var(--ap-density-control);');
    expect(auto).toMatch(
      /padding-block:\s*calc\(\(var\(--ap-density-control\) - var\(--ap-text-body-md-line-height\) - 2 \* var\(--ap-border-width-hairline\)\) \/ 2\);/,
    );
  });

  it('keeps md a literal 40, so an explicit size never reads the token', () => {
    expect(block(readCss('src/components/control.module.css'), '.md {')).toContain('min-height: 40px;');
    expect(block(readCss('src/components/Button/Button.module.css'), '.md {')).toContain('height: 40px;');
  });

  it('gives the auto button the token’s height', () => {
    expect(block(readCss('src/components/Button/Button.module.css'), '.auto {')).toContain('height: var(--ap-density-control);');
  });
});
