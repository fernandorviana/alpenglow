import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Layers, LAYERS } from './Layers';
import { resolve, contrast } from '@/tokens/contrast';
import type { ThemeTokenName } from '@/tokens/theme';

/**
 * The diagram has one contract that nothing else would catch: it must be
 * indifferent to the palette. The palette is an open decision, and a drawing
 * with a hex in it would be stranded the day that decision lands. So every
 * paint attribute in the rendered SVG has to be a theme token — the same
 * discipline the components keep, checked the same way Button's test checks
 * its stylesheet: by reading the output, not the intent.
 */

// The spec calls for neutral tokens only — no accent colour in the diagram.
const TOKEN = /^var\(--ap-color-(surface|border|text)-[a-z0-9-]+\)$/;

// `var(--ap-color-surface-sunken)` → `surface/sunken`
const tokenOf = (paint: string): ThemeTokenName =>
  paint.replace(/^var\(--ap-color-/, '').replace(/\)$/, '').replace('-', '/') as ThemeTokenName;

describe('Layers', () => {
  it('paints every fill and stroke with a theme token, never a literal', () => {
    const { container } = render(<Layers />);
    const painted = container.querySelectorAll('[fill], [stroke]');
    expect(painted.length).toBeGreaterThan(0);
    for (const el of painted) {
      for (const attr of ['fill', 'stroke'] as const) {
        const value = el.getAttribute(attr);
        if (value === null || value === 'none') continue;
        expect(value, `<${el.tagName}> ${attr}`).toMatch(TOKEN);
      }
    }
    // Paint via the `style` prop would slip past the attribute query above —
    // guard against it directly.
    const styled = container.querySelectorAll('[style]');
    for (const el of styled) {
      const style = el.getAttribute('style') ?? '';
      expect(style, `<${el.tagName}> style`).not.toMatch(/(fill|stroke)\s*:/);
    }
  });

  it('names the six layers bottom to top for a reader who cannot see it', () => {
    render(<Layers />);
    const label = (screen.getByRole('img').getAttribute('aria-label') ?? '').toLowerCase();
    // The array is drawn top-down; the label reads the landscape up from the
    // bedrock, the way the page explains it.
    const positions = [...LAYERS].reverse().map((l) => label.indexOf(l.name.toLowerCase()));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it('draws Paths dashed and nothing else, because no pattern exists yet', () => {
    const { container } = render(<Layers />);
    const dashed = container.querySelectorAll('[stroke-dasharray]');
    expect(dashed).toHaveLength(1);
    expect(dashed[0]!.closest('[data-layer]')?.getAttribute('data-layer')).toBe('paths');
  });

  it('labels every band in visible text, not only in the drawing', () => {
    render(<Layers />);
    for (const layer of LAYERS) {
      expect(screen.getByText(layer.name)).toBeInTheDocument();
    }
  });

  it('carries the architecture line as its caption', () => {
    render(<Layers />);
    expect(screen.getByText('Clarity, layer by layer.')).toBeInTheDocument();
  });

  it('keeps every stroke and every label at 3:1 or better against the card, in both modes', () => {
    // Area fills are exempt: each is outlined by a stroke that carries the
    // shape, and no surface token clears 3:1 as a fill on a white card in
    // light. Strokes and text are the channels that draw the picture.
    const { container } = render(<Layers />);
    const paints = new Set<string>();
    for (const el of container.querySelectorAll('[stroke]')) {
      const v = el.getAttribute('stroke');
      if (v && v !== 'none') paints.add(v);
    }
    for (const el of container.querySelectorAll('text[fill]')) paints.add(el.getAttribute('fill')!);
    expect(paints.size).toBeGreaterThan(0);
    for (const mode of ['light', 'dark'] as const) {
      const card = resolve('surface/raised', mode);
      for (const paint of paints) {
        expect(contrast(resolve(tokenOf(paint), mode), card), `${paint} on surface/raised, ${mode}`).toBeGreaterThanOrEqual(3);
      }
    }
  });
});
