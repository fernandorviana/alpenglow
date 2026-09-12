import { act, render, screen } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { OnThisPage } from './OnThisPage';

/**
 * The list of a page's sections, and which one the reader is in. jsdom has
 * no layout, so where each heading sits is stubbed: the component asks each
 * heading for its box and reads the last one that has passed the top of the
 * viewport as current.
 */

const SECTIONS = [
  { id: 'try-it', label: 'Try it' },
  { id: 'sizes', label: 'Sizes' },
  { id: 'states', label: 'States' },
];

/** Puts the headings in the document, each at `top` px from the viewport's top. */
function placeHeadings(tops: Record<string, number>) {
  for (const { id } of SECTIONS) {
    const h2 = document.createElement('h2');
    h2.id = id;
    h2.getBoundingClientRect = () => ({ top: tops[id]! }) as DOMRect;
    document.body.append(h2);
  }
}

afterEach(() => {
  document.body.innerHTML = '';
});

const current = () => screen.queryByRole('link', { current: 'location' });

describe('OnThisPage', () => {
  it('links to every section, in order', () => {
    render(<OnThisPage sections={SECTIONS} />);
    const links = screen.getAllByRole('link');
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['#try-it', '#sizes', '#states']);
    expect(links.map((a) => a.textContent)).toEqual(['Try it', 'Sizes', 'States']);
  });

  it('is a navigation landmark named for what it holds', () => {
    render(<OnThisPage sections={SECTIONS} />);
    expect(screen.getByRole('navigation', { name: 'On this page' })).toBeInTheDocument();
  });

  it('renders nothing for a page with no sections', () => {
    const { container } = render(<OnThisPage sections={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('marks the last section whose heading has passed the top', () => {
    placeHeadings({ 'try-it': -400, sizes: -20, states: 300 });
    render(<OnThisPage sections={SECTIONS} />);
    expect(current()).toHaveTextContent('Sizes');
  });

  it('marks the first section before any heading has passed', () => {
    // At the top of the page nothing has scrolled by, and a list with no
    // current item reads as broken rather than as "you are at the start".
    placeHeadings({ 'try-it': 200, sizes: 600, states: 900 });
    render(<OnThisPage sections={SECTIONS} />);
    expect(current()).toHaveTextContent('Try it');
  });

  it('follows the scroll', () => {
    const tops: Record<string, number> = { 'try-it': 200, sizes: 600, states: 900 };
    placeHeadings(tops);
    render(<OnThisPage sections={SECTIONS} />);
    expect(current()).toHaveTextContent('Try it');

    for (const id of Object.keys(tops)) {
      document.getElementById(id)!.getBoundingClientRect = () => ({ top: tops[id]! - 950 }) as DOMRect;
    }
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(current()).toHaveTextContent('States');
  });
});
