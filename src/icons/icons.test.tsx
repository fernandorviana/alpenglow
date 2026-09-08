import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import * as Icons from './icons';
import { iconNames } from './icons';

const components = iconNames.map((name) => [name, Icons[name]] as const);

describe('custom icons', () => {
  it('exports every icon it claims to', () => {
    for (const [name, Component] of components) {
      expect(Component, name).toBeTypeOf('function');
    }
  });

  it.each(components)('%s renders a square 16-unit viewBox', (_name, Component) => {
    const { container } = render(<Component />);
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('viewBox', '0 0 16 16');
    expect(svg).toHaveAttribute('width', '16');
    expect(svg).toHaveAttribute('height', '16');
  });

  it.each(components)('%s is hidden from assistive technology', (_name, Component) => {
    // An icon beside a label repeats it; an icon alone needs the control around
    // it to carry the name. Either way the svg itself should not be announced.
    const { container } = render(<Component />);
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
  });

  it.each(components)('%s scales from one size prop', (_name, Component) => {
    const { container } = render(<Component size={32} />);
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  it.each(components)('%s draws something', (_name, Component) => {
    const { container } = render(<Component />);
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThan(0);
    for (const path of paths) {
      expect(path.getAttribute('d')?.length ?? 0).toBeGreaterThan(10);
    }
  });

  it('paints from currentColor, so an icon takes the colour beside it', () => {
    // UserVerified is the exception: it is two-colour and binds to tokens.
    for (const [name, Component] of components) {
      if (name === 'UserVerified') continue;
      const { container } = render(<Component />);
      for (const path of container.querySelectorAll('path')) {
        expect(path.getAttribute('fill'), name).toBe('currentColor');
      }
    }
  });

  it('binds the two-colour icon to tokens rather than baking its colours', () => {
    const { container } = render(<Icons.UserVerified />);
    const fills = [...container.querySelectorAll('path')].map((p) => p.getAttribute('fill'));
    expect(fills).toEqual([
      'var(--ap-color-interactive-accent)',
      'var(--ap-color-interactive-on-accent)',
    ]);
    // No literal hex survived the export.
    for (const fill of fills) expect(fill).not.toMatch(/^#/);
  });

  it('passes extra props through to the svg', () => {
    const { container } = render(<Icons.WaitingRoom className="custom" data-testid="x" />);
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveClass('custom');
    expect(svg).toHaveAttribute('data-testid', 'x');
  });
});
