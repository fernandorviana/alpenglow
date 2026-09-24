import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Textarea } from './Textarea';
import control from '../control.module.css';
import { readCss, block } from '@/test/css';

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

  it('does not carry the bare inner-field class — that class zeroes background, border and padding, which is right for Input\'s inner element but strips the box off Textarea, which has no wrapper to carry it instead', () => {
    render(<Textarea aria-label="Notes" />);
    const classes = screen.getByLabelText('Notes').className.split(' ');
    expect(classes).not.toContain(control.field);
    expect(classes).toContain(control.control);
  });

  it('carries the invalid class, so the border and fill turn to the danger tokens', () => {
    render(<Textarea aria-label="Notes" invalid />);
    expect(screen.getByLabelText('Notes').className.split(' ')).toContain(control.invalid);
  });
});

describe('Textarea.module.css', () => {
  const css = readCss('src/components/Textarea/Textarea.module.css');
  const rule = block(css, '.textarea {');

  it('pads to the drawn inset — 12px block, 16px inline — with the spacing scale', () => {
    expect(rule).toMatch(/padding:\s*var\(--ap-spacing-150\)\s*var\(--ap-spacing-200\)/);
  });

  it('starts at the drawn height', () => {
    expect(rule).toMatch(/min-height:\s*144px/);
  });

  it('draws its own focus ring rather than the browser default, and lets go of resize on the horizontal axis only', () => {
    expect(rule).toMatch(/outline:\s*none/);
    expect(rule).toMatch(/resize:\s*vertical/);
  });

  it('does not redeclare font-family, color or letter-spacing — control.module.css already sets those on the same element, as an author rule, which beats the UA textarea default regardless of stylesheet order; a second declaration here would only fight .control instead of fighting the browser, the same failure mode 89b3d8c fixed for width and margin-left', () => {
    expect(rule).not.toMatch(/(?:^|[\s;])(?:font(?:-family)?|color|letter-spacing)\s*:/);
  });

  it('colours its own placeholder — .field::placeholder is gone along with .field, and .control has no placeholder rule of its own', () => {
    expect(css).toMatch(/\.textarea::placeholder\s*\{[^}]*color:\s*var\(--ap-color-text-placeholder\)/);
    expect(block(css, '.textarea::placeholder {')).toMatch(/opacity:\s*1/);
  });
});
