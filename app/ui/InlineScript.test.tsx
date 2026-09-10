import { render } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { InlineScript } from './InlineScript';

/**
 * The component says two different things on purpose, and each half fails
 * quietly. Lose the server's JavaScript and the theme lands a frame late on
 * every load; lose the client's data block and every page logs React's script
 * warning again. Neither shows up in a typecheck.
 */

const html = "document.documentElement.setAttribute('data-theme', 'dark')";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('InlineScript', () => {
  it('is served as JavaScript, so the browser runs it while parsing', () => {
    // No window is how the component knows it is on the server.
    vi.stubGlobal('window', undefined);
    const markup = renderToStaticMarkup(<InlineScript html={html} />);

    expect(markup).toContain('type="text/javascript"');
    expect(markup).toContain(html);
  });

  it('is rendered on the client as a data block, which React does not warn about', () => {
    // The warning itself cannot be asserted here: it lives in the React that
    // Next.js bundles, not in the react-dom these tests run against. A
    // `text/plain` type is what keeps that React quiet, so the type is checked.
    const { container } = render(<InlineScript html={html} />);

    expect(container.querySelector('script')).toHaveAttribute('type', 'text/plain');
  });
});
