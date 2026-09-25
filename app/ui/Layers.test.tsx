import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { readCss, block } from '@/test/css';
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

/** The picture as drawn: the one `role="img"` that is an SVG. */
const drawing = () => screen.getAllByRole('img').find((el) => el.tagName.toLowerCase() === 'svg')!;
/** The same six bands as HTML, for a figure narrower than 30rem. */
const stack = () => screen.getAllByRole('img').find((el) => el.tagName.toLowerCase() !== 'svg')!;

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
    const label = (drawing().getAttribute('aria-label') ?? '').toLowerCase();
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
      expect(within(drawing()).getByText(layer.name)).toBeInTheDocument();
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

  it('is also a stack of the six bands in HTML, named as the drawing is', () => {
    // At 320 the 640-wide drawing is scaled to 0.4 and its labels are 4–6px.
    // Below 30rem of its own width the figure shows the same bands as text at
    // its own size instead: one picture or the other, never both, so a screen
    // reader meets the same name at every width.
    render(<Layers />);
    expect(drawing()).toBeInTheDocument();
    expect(stack()).toBeInTheDocument();
    expect(stack().tagName.toLowerCase()).not.toBe('svg');
    expect(stack().querySelector('svg')).toBeNull();
    expect(stack().getAttribute('aria-label')).toBe(drawing().getAttribute('aria-label'));
    // Top to bottom, as the landscape stands: crest first, bedrock last, each
    // with the file it maps to.
    const bands = [...stack().querySelectorAll('[data-band]')];
    expect(bands.map((b) => b.getAttribute('data-band'))).toEqual(LAYERS.map((l) => l.id));
    LAYERS.forEach((layer, i) => {
      expect(bands[i]).toHaveTextContent(layer.name);
      expect(bands[i]).toHaveTextContent(layer.code);
    });
  });

  it('shows the stack instead of the drawing below 30rem of its own width', () => {
    const { container } = render(<Layers />);
    const figure = container.querySelector('figure')!;
    expect(figure).toHaveClass('layers');
    expect(drawing()).toHaveClass('layersDrawing');
    expect(stack()).toHaveClass('layersStack');

    const css = readCss('app/docs.css');
    // A container query, not a media query: the figure answers its own width.
    expect(block(css, '.layers {')).toMatch(/container-type: inline-size/);
    expect(block(css, '.layersStack {')).toMatch(/display: none/);
    const narrow = block(css, '@container (width < 30rem)');
    expect(block(narrow, '.layersDrawing')).toMatch(/display: none/);
    expect(block(narrow, '.layersStack')).toMatch(/display: (grid|flex|block)/);
  });

  it('paints the stack in neutral theme tokens, its text at 3:1 or better on the card', () => {
    // The stack is painted by the stylesheet, not by attributes, so the
    // attribute guards above cannot see it: the same two lines, read from
    // the rules instead.
    const rules = [...readCss('app/docs.css').matchAll(/([^{}]*\.layers[A-Z][^{}]*)\{([^{}]*)\}/g)].map(
      ([, selector, body]) => ({ selector: selector!.trim(), body: body! }),
    );
    expect(rules.length).toBeGreaterThan(0);
    let texts = 0;
    for (const { selector, body } of rules) {
      expect(body, selector).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i);
      for (const [paint] of body.matchAll(/var\(--ap-color-[a-z0-9-]+\)/g)) expect(paint, selector).toMatch(TOKEN);
      const color = body.match(/(?:^|[;{\s])color: (var\([^)]+\))/)?.[1];
      if (!color) continue;
      texts++;
      for (const mode of ['light', 'dark'] as const) {
        expect(contrast(resolve(tokenOf(color), mode), resolve('surface/raised', mode)), `${selector} ${mode}`).toBeGreaterThanOrEqual(3);
      }
    }
    expect(texts).toBeGreaterThan(0);
  });
});
