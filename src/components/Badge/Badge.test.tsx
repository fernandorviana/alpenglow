import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from './Badge';
import styles from './Badge.module.css';

describe('Badge', () => {
  it('renders its label', () => {
    render(<Badge>Confirmed</Badge>);
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
  });

  it('carries no role — it is text with a background, not a control', () => {
    // Giving it a role would announce a button or a status that never changes.
    const { container } = render(<Badge>Confirmed</Badge>);
    expect(container.firstElementChild?.hasAttribute('role')).toBe(false);
  });

  it('keeps the label readable when only a dot marks the tone', () => {
    // The dot is decoration. Colour and a coloured circle both fail the same
    // people, so the word has to carry the meaning on its own.
    render(<Badge tone="success" dot>Confirmed</Badge>);
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
  });

  it('hides the dot and the icon from assistive technology', () => {
    const { container, rerender } = render(<Badge dot>Confirmed</Badge>);
    expect(container.querySelector(`.${styles.dot}`)).toHaveAttribute('aria-hidden', 'true');

    rerender(<Badge icon={<svg data-testid="tick" />}>Confirmed</Badge>);
    expect(screen.getByTestId('tick').parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows the dot rather than the icon when both are given', () => {
    // Two marks before one word is noise; the dot is the more compact of them.
    render(<Badge dot icon={<svg data-testid="tick" />}>Confirmed</Badge>);
    expect(screen.queryByTestId('tick')).not.toBeInTheDocument();
  });

  it('applies tone and size', () => {
    const { container } = render(<Badge tone="danger" size="sm">Overdue</Badge>);
    expect(container.firstElementChild).toHaveClass(styles.danger!, styles.sm!);
  });

  it('defaults to the neutral tone at medium', () => {
    const { container } = render(<Badge>Draft</Badge>);
    expect(container.firstElementChild).toHaveClass(styles.neutral!, styles.md!);
  });

  it('passes through attributes and merges className', () => {
    const { container } = render(
      <Badge className="custom" title="Appointment status">Confirmed</Badge>,
    );
    const el = container.firstElementChild!;
    expect(el).toHaveClass('custom', styles.badge!);
    expect(el).toHaveAttribute('title', 'Appointment status');
  });
});
