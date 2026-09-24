import { readFileSync } from 'node:fs';
import { createRef } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { block, readCss } from '@/test/css';
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
      const press = rules.find((r) => r.selector === ".button:active:not(:disabled):not([aria-disabled='true'])");
      expect(press?.body).toMatch(/transform: scale\(0\.96\)/);
    });

    it('is a colour change alone under reduced motion', () => {
      const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
      expect(reduced).toMatch(/\.button:active:not\(:disabled\):not\(\[aria-disabled='true'\]\)\s*\{\s*transform: none;/);
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

describe('Button — with an href it is a link that looks like a button', () => {
  it('is an anchor with the button’s classes and no type', () => {
    render(
      <Button href="/signup" variant="outline" size="lg">
        Create account
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Create account' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/signup');
    expect(link).toHaveClass(styles.button!, styles.outline!, styles.lg!);
    expect(link).not.toHaveAttribute('type');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('stays a button without one, as before', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'button');
  });

  it('passes anchor props and an anchor’s ref', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <Button href="/report.pdf" ref={ref} download target="_blank" rel="noreferrer">
        Report
      </Button>,
    );
    expect(ref.current).toBe(screen.getByRole('link'));
    expect(ref.current).toHaveAttribute('target', '_blank');
    expect(ref.current).toHaveAttribute('download');
  });

  it.each([
    ['disabled', { disabled: true }],
    ['loading', { loading: true }],
  ])('%s, it has no href, cannot be focused or pressed, and still says it is a link', async (_, props) => {
    const onClick = vi.fn();
    render(
      <Button href="/signup" onClick={onClick} {...props}>
        Create account
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Create account' });
    expect(link).not.toHaveAttribute('href');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    await userEvent.tab();
    expect(link).not.toHaveFocus();
    await userEvent.click(link);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('drops whatever would make a disabled link answer', async () => {
    const onKeyDown = vi.fn();
    render(
      <Button href="/x" disabled tabIndex={0} onKeyDown={onKeyDown} data-kept="yes">
        Go
      </Button>,
    );
    const link = screen.getByRole('link');
    expect(link).not.toHaveAttribute('tabindex');
    expect(link).toHaveAttribute('data-kept', 'yes');
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    expect(onKeyDown).not.toHaveBeenCalled();
  });

  it('takes an href that may be undefined, and is a button when it is', () => {
    const maybe = undefined as string | undefined;
    render(<Button href={maybe}>Row</Button>);
    expect(screen.getByRole('button', { name: 'Row' })).toBeInTheDocument();
  });

  it('is busy while loading, and only then', () => {
    const { rerender } = render(
      <Button href="/x" loading>
        Go
      </Button>,
    );
    expect(screen.getByRole('link')).toHaveAttribute('aria-busy', 'true');
    rerender(
      <Button href="/x" disabled>
        Go
      </Button>,
    );
    expect(screen.getByRole('link')).not.toHaveAttribute('aria-busy');
  });

  it('hands a router’s link everything, and does not call it while disabled', () => {
    const router = vi.fn(({ children, ...props }) => (
      <a data-router="yes" {...props}>
        {children}
      </a>
    ));
    const { rerender } = render(
      <Button href="/routed" render={router}>
        Routed
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Routed' });
    expect(link).toHaveAttribute('data-router', 'yes');
    expect(link).toHaveAttribute('href', '/routed');
    expect(link).toHaveClass(styles.button!);

    router.mockClear();
    rerender(
      <Button href="/routed" render={router} disabled>
        Routed
      </Button>,
    );
    expect(router).not.toHaveBeenCalled();
    expect(screen.getByRole('link')).not.toHaveAttribute('data-router');
  });

  it('treats aria-disabled as disabled everywhere the stylesheet asks', () => {
    const css = readFileSync('src/components/Button/Button.module.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(css).not.toMatch(/:not\(:disabled\)(?!:not\(\[aria-disabled='true'\]\))/);
    expect(css).toContain(".button:disabled,\n.button[aria-disabled='true'] {");
    expect(css).toContain(".ghost[aria-disabled='true']:not(.loading)");
    expect(css).toMatch(/a\.button,\s*a\.button:hover,\s*a\.button:focus-visible \{\s*text-decoration: none;/);
  });
});

describe('Button — icon only', () => {
  it('draws the icon alone, hidden, and takes its name from aria-label', () => {
    render(<Button icon={<svg data-testid="glyph" />} aria-label="Confirm" />);
    const button = screen.getByRole('button', { name: 'Confirm' });
    expect(button).toHaveClass(styles.iconOnly!);
    expect(within(button).getByTestId('glyph').parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps its name as a link too', () => {
    render(<Button href="/next" icon={<svg />} aria-label="Next page" />);
    expect(screen.getByRole('link', { name: 'Next page' })).toHaveClass(styles.iconOnly!);
  });

  it('does not compile without a name, or with a label beside the icon', () => {
    // @ts-expect-error — an icon says nothing to a screen reader
    render(<Button icon={<svg />} />);
    // @ts-expect-error — an icon-only button draws no label
    render(<Button icon={<svg />} aria-label="Add">Add</Button>);
  });

  it('is square at every size and density: no padding, one to one, after the sizes it overrides', () => {
    // jsdom has no layout, so the rule is read: the height is the size's or
    // the density's, and aspect-ratio makes the width follow it.
    const css = readCss('src/components/Button/Button.module.css');
    const rule = block(css, '.iconOnly {');
    expect(rule).toMatch(/aspect-ratio:\s*1\b/);
    expect(rule).toMatch(/padding-inline:\s*0\b/);
    expect(css.indexOf('.iconOnly {')).toBeGreaterThan(css.indexOf('.lg {'));
  });
});
