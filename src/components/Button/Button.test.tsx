import { readFileSync } from 'node:fs';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';
import styles from './Button.module.css';

describe('Button', () => {
  it('renders its label', () => {
    render(<Button>Save changes</Button>);
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
  });

  it('defaults to type="button"', async () => {
    // A bare <button> inside a form defaults to type="submit". Defaulting to
    // "button" stops a decorative button from silently submitting the form.
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button>Cancel</Button>
      </form>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('still allows an explicit submit button', async () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit">Save</Button>
      </form>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  describe('loading', () => {
    it('marks the button busy and blocks activation', async () => {
      const onClick = vi.fn();
      render(<Button loading onClick={onClick}>Save</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toBeDisabled();

      await userEvent.click(button);
      expect(onClick).not.toHaveBeenCalled();
    });

    it('keeps the label in the document so the button does not resize', () => {
      // The label is hidden with opacity, not removed. Taking it out of the
      // flow would make the button jump width the moment it starts loading.
      render(<Button loading>Save changes</Button>);
      expect(screen.getByRole('button')).toHaveTextContent('Save changes');
    });

    it('is not busy when idle', () => {
      render(<Button>Save</Button>);
      expect(screen.getByRole('button')).not.toHaveAttribute('aria-busy');
    });

    /**
     * A loading button is `disabled` so it cannot be activated twice, which puts
     * it in reach of every `:disabled` paint rule. It once repainted grey the
     * moment it started loading — and since the spinner takes `currentColor`,
     * the spinner went grey with it. Five tones, one loading state, no way to
     * tell which button was working.
     *
     * The spinner has no colour of its own by design: it inherits the label's,
     * and those are already proven — `interactive/on-*` against every fill state
     * for solid, `text/*` against every surface for outline and ghost. That only
     * holds while a loading button keeps its own label colour, so this reads the
     * stylesheet and refuses any disabled rule that would repaint one.
     */
    it('is never repainted by a disabled rule', () => {
      // `import.meta.url` is not a file URL under the jsdom environment these
      // component tests run in, so resolve from the repository root instead.
      const css = readFileSync('src/components/Button/Button.module.css', 'utf8');
      const paints = /(^|[\s;{])(background|color|border-color)\s*:/;

      const offenders = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)]
        .filter(([, , body]) => paints.test(body!))
        // A selector list is split first. Checked whole, one guarded branch
        // would vouch for an unguarded one sitting beside it — which is exactly
        // how the first version of this test passed against the bug it exists
        // to catch.
        .flatMap(([, selector]) => selector!.split(',').map((part) => part.trim()))
        .filter(Boolean)
        // `:not(...)` is stripped before looking for `:disabled`, so the hover
        // and active rules — scoped with `:not(:disabled)` — are not mistaken
        // for the disabled rules they exclude.
        .filter((part) => /:disabled|\[aria-disabled/.test(part.replace(/:not\([^)]*\)/g, '')))
        .filter((part) => !part.includes(':not(.loading)'));

      expect(offenders).toEqual([]);
    });
  });

  describe('the press', () => {
    const css = readFileSync('src/components/Button/Button.module.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({
      selector: selector!.trim(),
      body: body!.replace(/\s+/g, ' ').trim(),
    }));

    it('gives way by 0.96, and never further', () => {
      // 0.96 is what the hand reads as a press; below 0.95 it reads as a
      // flinch. The rule is scoped away from disabled, which covers loading.
      const press = rules.find((r) => r.selector === '.button:active:not(:disabled)');
      expect(press?.body).toMatch(/transform: scale\(0\.96\)/);
    });

    it('is a colour change alone under reduced motion', () => {
      const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
      expect(reduced).toMatch(/\.button:active:not\(:disabled\)\s*\{\s*transform: none;/);
    });
  });

  it('does not fire onClick when disabled', async () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Delete</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('fires onClick when enabled', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Delete</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  describe('icons', () => {
    it('hides decorative icons from assistive technology', () => {
      render(
        <Button iconStart={<svg data-testid="start" />} iconEnd={<svg data-testid="end" />}>
          Filter
        </Button>,
      );
      // The accessible name must come from the label alone, not the icons.
      expect(screen.getByRole('button')).toHaveAccessibleName('Filter');
      expect(screen.getByTestId('start').parentElement).toHaveAttribute('aria-hidden', 'true');
      expect(screen.getByTestId('end').parentElement).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('forwards a ref to the underlying button', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Save</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('merges a caller className rather than replacing its own', () => {
    render(<Button className="custom">Save</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom');
    expect(button).toHaveClass(styles.button!);
  });

  it('applies variant, tone and size classes', () => {
    // Asserted through the CSS-module map rather than literal names, so the
    // test checks the contract and not the bundler's hashing scheme.
    render(<Button variant="outline" tone="danger" size="lg">Delete</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass(styles.outline!, styles.danger!, styles.lg!);
    expect(button).not.toHaveClass(styles.solid!);
  });

  it('passes through arbitrary button attributes', () => {
    render(<Button aria-label="Close dialog" data-testid="x" />);
    expect(screen.getByTestId('x')).toHaveAccessibleName('Close dialog');
  });
});
