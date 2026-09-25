import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { block, readCss } from '@/test/css';
import { axeViolations } from '@/test/axe';
import { Sideways } from './Sideways';

/**
 * A specimen drawn wider than a phone scrolls sideways inside its own box,
 * and a fade on each side where more of it waits says so. jsdom has no
 * layout, so the scroller's sizes are set by hand.
 */

type Sizes = { scrollWidth: number; clientWidth: number; scrollLeft?: number };

function sized(el: HTMLElement, { scrollWidth, clientWidth, scrollLeft = 0 }: Sizes) {
  Object.defineProperty(el, 'scrollWidth', { configurable: true, value: scrollWidth });
  Object.defineProperty(el, 'clientWidth', { configurable: true, value: clientWidth });
  Object.defineProperty(el, 'scrollLeft', { configurable: true, writable: true, value: scrollLeft });
}

/** A ResizeObserver whose callback the test calls, as the browser would on a change of size. */
function observeByHand() {
  let report: (() => void) | undefined;
  const observed: Element[] = [];
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(cb: () => void) {
        report = cb;
      }
      observe(el: Element) {
        observed.push(el);
      }
      disconnect() {}
    },
  );
  return { resize: () => act(() => report!()), observed };
}

afterEach(() => vi.unstubAllGlobals());

const parts = (container: HTMLElement) => {
  const frame = container.firstElementChild as HTMLElement;
  const scroller = frame.querySelector<HTMLElement>('.sidewaysScroll')!;
  return { frame, scroller };
};

describe('Sideways', () => {
  it('holds its content in a scroller inside the frame, which takes the class and the style', () => {
    const { container, getByText } = render(
      <Sideways label="The bar" className="specimen" style={{ padding: 0 }}>
        <p>the bar</p>
      </Sideways>,
    );
    const { frame, scroller } = parts(container);
    expect(frame).toHaveClass('sideways', 'specimen');
    expect(frame.style.padding).toBe('0px');
    expect(scroller.parentElement).toBe(frame);
    expect(scroller).toContainElement(getByText('the bar'));
    expect(getByText('the bar').parentElement).toHaveClass('sidewaysContent');
  });

  it('is a named region the keyboard reaches, whatever is inside it', () => {
    // A region with nothing focusable in it could not be scrolled from the
    // keyboard at all; with a name, a reader hears what it is.
    const { getByRole } = render(
      <Sideways label="Try it: the top bar and the side nav">
        <p>no controls</p>
      </Sideways>,
    );
    const region = getByRole('region', { name: 'Try it: the top bar and the side nav' });
    expect(region).toHaveClass('sidewaysScroll');
    expect(region).toHaveAttribute('tabindex', '0');
  });

  it('shows no fade when the content fits', () => {
    const { resize } = observeByHand();
    const { container } = render(<Sideways label="The bar">content</Sideways>);
    const { frame, scroller } = parts(container);
    sized(scroller, { scrollWidth: 600, clientWidth: 600 });
    resize();
    expect(frame).not.toHaveAttribute('data-more-start');
    expect(frame).not.toHaveAttribute('data-more-end');
  });

  it('shows the end’s fade while more waits there, and the start’s once it has scrolled', () => {
    const { resize } = observeByHand();
    const { container } = render(<Sideways label="The bar">content</Sideways>);
    const { frame, scroller } = parts(container);
    sized(scroller, { scrollWidth: 636, clientWidth: 375 });
    resize();
    expect(frame).toHaveAttribute('data-more-end');
    expect(frame).not.toHaveAttribute('data-more-start');

    scroller.scrollLeft = 100;
    fireEvent.scroll(scroller);
    expect(frame).toHaveAttribute('data-more-start');
    expect(frame).toHaveAttribute('data-more-end');

    scroller.scrollLeft = 261;
    fireEvent.scroll(scroller);
    expect(frame).toHaveAttribute('data-more-start');
    expect(frame).not.toHaveAttribute('data-more-end');
  });

  it('reads a right-to-left scroll, which runs negative from the start', () => {
    const { resize } = observeByHand();
    const { container } = render(<Sideways label="The bar">content</Sideways>);
    const { frame, scroller } = parts(container);
    sized(scroller, { scrollWidth: 636, clientWidth: 375, scrollLeft: -261 });
    resize();
    expect(frame).toHaveAttribute('data-more-start');
    expect(frame).not.toHaveAttribute('data-more-end');
  });

  it('watches the scroller and its content, since either can change the overflow', () => {
    const { observed } = observeByHand();
    const { container } = render(<Sideways label="The bar">content</Sideways>);
    const { scroller } = parts(container);
    expect(observed).toEqual([scroller, scroller.firstElementChild]);
  });

  it('renders without a ResizeObserver, as under the axe suite, and has no violations', async () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const { container } = render(
      <Sideways label="The bar">
        <button type="button">Create</button>
      </Sideways>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe('Sideways — stylesheet', () => {
  const css = readCss('app/docs.css');

  it('scrolls inside its own box, never the page’s, and keeps the content’s own width', () => {
    expect(block(css, '.sidewaysScroll {')).toContain('overflow-x: auto;');
    expect(block(css, '.sidewaysContent {')).toContain('min-inline-size: max-content;');
    const frame = block(css, '.sideways {');
    expect(frame).toContain('overflow: hidden;');
    expect(frame).toContain('position: relative;');
    expect(frame).toContain('isolation: isolate;');
  });

  it('rings the scroller inside the frame, which clips anything outside, and the fades step off the ring', () => {
    // The site's ring sits 2 outside; the frame's overflow: hidden would cut it.
    const ring = block(css, '.sidewaysScroll:focus-visible {');
    expect(ring).toContain('outline: var(--ap-border-width-ring) solid var(--ap-color-border-focus);');
    expect(ring).toContain('outline-offset: calc(var(--ap-border-width-ring) * -1);');
    expect(ring).toContain('border-radius: inherit;');
    // The fades are laid over the scroller: focused, they move in by the ring.
    const focused = block(css, '.sideways:has(.sidewaysScroll:focus-visible)::before,\n.sideways:has(.sidewaysScroll:focus-visible)::after {');
    expect(focused).toContain('inset-block: var(--ap-border-width-ring);');
    expect(focused).not.toMatch(/(^|\s)inset:/);
    // Each from its own edge: `inset` would pin both, and a fixed width then
    // sends the end's fade to the start.
    expect(css).toMatch(
      /\n\.sideways:has\(\.sidewaysScroll:focus-visible\)::before \{ inset-inline-start: var\(--ap-border-width-ring\); \}/,
    );
    expect(css).toMatch(
      /\n\.sideways:has\(\.sidewaysScroll:focus-visible\)::after \{ inset-inline-end: var\(--ap-border-width-ring\); \}/,
    );
  });

  it('paints its fades in the colour the specimen gives it, surface/raised when it gives none', () => {
    // A fade is the specimen's background running out; on a specimen that
    // paints surface/base, a surface/raised fade was a pale band in light.
    const fades = [...css.matchAll(/background: linear-gradient\(to (right|left), ([^;]*)\);/g)].filter(([rule]) => /sideways|surface-raised/.test(rule));
    expect(fades.map(([, to]) => to).sort()).toEqual(['left', 'right']);
    for (const [, , stops] of fades) expect(stops).toBe('var(--sideways-fade, var(--ap-color-surface-raised)), transparent');
  });

  it('lays the fades over the scroller, hidden until a side has more, and never in the pointer’s way', () => {
    const fades = block(css, '.sideways::before,\n.sideways::after {');
    expect(fades).toContain('position: absolute;');
    expect(fades).toContain('pointer-events: none;');
    expect(fades).toContain('opacity: 0;');
    expect(block(css, '.sideways[data-more-start]::before,\n.sideways[data-more-end]::after {')).toContain('opacity: 1;');
  });
});
