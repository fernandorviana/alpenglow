import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { Frame } from './FrameView';

vi.mock('next/navigation', () => ({ usePathname: () => '/screen/', useRouter: () => ({ push: () => {}, prefetch: () => {} }) }));

const frameOf = () => screen.getByTitle(/Ridge Physio/) as HTMLIFrameElement;

beforeEach(() => window.history.replaceState(null, '', '/screen/'));
afterEach(() => vi.unstubAllGlobals());

describe('Frame', () => {
  it('draws the three switches and an iframe at the chosen width', () => {
    render(<Frame count={11} />);
    expect(screen.getByRole('radiogroup', { name: 'Width' })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Density' })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Mode' })).toBeInTheDocument();
    expect(frameOf()).toHaveAttribute('width', '1440');
    expect(screen.getByText('11 components, 0 local values')).toBeInTheDocument();
  });

  it('says the full screen opens in a new tab and carries the combination', async () => {
    render(<Frame count={11} />);
    await userEvent.click(screen.getByRole('radio', { name: 'Compact' }));
    const link = screen.getByRole('link', { name: /^Open full screen ?\(opens in a new tab\)$/ });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('href')).toContain('density=compact');
  });

  it('keeps the combination in its own query, and a section’s anchor with it', async () => {
    window.history.replaceState(null, '', '/screen/#composition');
    render(<Frame count={11} />);
    await userEvent.click(screen.getByRole('radio', { name: '768' }));
    expect(window.location.search).toBe('?width=768');
    expect(window.location.hash).toBe('#composition');
    expect(frameOf()).toHaveAttribute('width', '768');
  });

  it('loads the frame once, from the combination it was opened with', async () => {
    window.history.replaceState(null, '', '/screen/?density=compact&width=375');
    render(<Frame count={11} />);
    expect(screen.getByRole('radio', { name: 'Compact' })).toBeChecked();
    // Width is the iframe's own size, never in its src.
    expect(frameOf().getAttribute('src')).toBe('/screen/full/?density=compact');
    await userEvent.click(screen.getByRole('radio', { name: 'Dark' }));
    await userEvent.click(screen.getByRole('radio', { name: '1024' }));
    expect(frameOf().getAttribute('src')).toBe('/screen/full/?density=compact');
  });

  it('builds the frame’s src under the site’s base path', () => {
    window.history.replaceState(null, '', '/alpenglow/screen/?theme=dark');
    render(<Frame count={11} />);
    expect(frameOf().getAttribute('src')).toBe('/alpenglow/screen/full/?theme=dark');
  });

  it('sends mode and density to the frame, to its own origin only', async () => {
    render(<Frame count={11} />);
    const post = vi.spyOn(frameOf().contentWindow!, 'postMessage');
    await userEvent.click(screen.getByRole('radio', { name: 'Dark' }));
    expect(post).toHaveBeenLastCalledWith({ type: 'alpenglow:frame', density: 'comfortable', theme: 'dark' }, window.location.origin);
  });

  it('ignores a theme message from anything but its own frame', () => {
    render(<Frame count={11} />);
    act(() => {
      window.dispatchEvent(new MessageEvent('message', { origin: window.location.origin, data: { type: 'alpenglow:frame-theme', theme: 'dark' } }));
    });
    expect(screen.getByRole('radio', { name: 'Light' })).toBeChecked();
  });

  it('follows the frame when its own palette switches the mode', () => {
    render(<Frame count={11} />);
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', { origin: window.location.origin, source: frameOf().contentWindow, data: { type: 'alpenglow:frame-theme', theme: 'dark' } }),
      );
    });
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
  });

  it('scales a width that does not fit its column, and says so', () => {
    let report: ((entries: { contentRect: { width: number } }[]) => void) | undefined;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(cb: typeof report) {
          report = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
    render(<Frame count={11} />);
    expect(screen.queryByText(/Shown at/)).toBeNull();
    act(() => report!([{ contentRect: { width: 720 } }]));
    expect(screen.getByText('Shown at 50%')).toBeInTheDocument();
    expect(frameOf().style.transform).toBe('scale(0.5)');
  });
});
