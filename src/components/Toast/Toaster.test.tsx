import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { Toaster, TOAST_LIMIT, toasterPlacements } from './Toaster';
import { toast, TOAST_DURATION, TOAST_DURATION_WITH_ACTION } from './store';
import styles from './Toast.module.css';
import { installPopoverStub } from '../../test/popover';
import { readCss, block } from '../../test/css';
import { axeViolations } from '../../test/axe';

installPopoverStub();

const regionOf = () => screen.getByRole('region', { name: 'Notifications' });
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const raise = (...args: Parameters<typeof toast>) => act(() => void toast(...args));

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  act(() => toast.dismiss());
  vi.useRealTimers();
});

describe('Toaster — the region', () => {
  it('is there, named and listening before any toast', () => {
    render(<Toaster />);
    const region = regionOf();
    expect(region).toHaveAttribute('popover', 'manual');
    // Open while empty: a closed popover is display: none, and a live region
    // that is not rendered is not listening when the first toast arrives.
    expect(region.style.display).toBe('block');
    expect(region.querySelector('[aria-live="polite"]')).toBeEmptyDOMElement();
  });

  it('is raised again when toasts begin, to sit above what opened since', () => {
    render(<Toaster />);
    const toggles: string[] = [];
    regionOf().addEventListener('beforetoggle', (event) => toggles.push((event as ToggleEvent).newState));
    raise('Saved');
    expect(toggles).toEqual(['closed', 'open']);
    // Every arrival, not only the first: a Dialog may have opened over an error that stayed.
    raise('Sent');
    expect(toggles).toEqual(['closed', 'open', 'closed', 'open']);
    expect(regionOf().style.display).toBe('block');
  });

  it('is not closed under the focus to be raised', () => {
    render(<Toaster />);
    raise('Saved', { duration: Infinity });
    act(() => screen.getByRole('button', { name: 'Dismiss' }).focus());
    const toggles: string[] = [];
    regionOf().addEventListener('beforetoggle', (event) => toggles.push((event as ToggleEvent).newState));
    raise('Sent');
    expect(toggles).toEqual([]);
  });

  it('takes its name, its placement and the name of the close', () => {
    render(<Toaster label="Avisos" placement="top-center" closeLabel="Fechar" />);
    raise('Guardado');
    expect(screen.getByRole('button', { name: 'Fechar' })).toBeInTheDocument();
    const region = screen.getByRole('region', { name: 'Avisos' });
    expect(region).toHaveClass(styles.region!, styles['top-center']!);
  });
});

describe('Toaster — a toast', () => {
  it('shows the message, says its tone in words, and can always be dismissed', () => {
    render(<Toaster />);
    raise('Appointment saved', { tone: 'success' });
    const item = screen.getByText('Appointment saved').closest('[data-toast]')!;
    expect(item).toHaveTextContent('Success: Appointment saved');
    expect(item.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    fireEvent.click(within(item as HTMLElement).getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText('Appointment saved')).not.toBeInTheDocument();
  });

  it('has no icon and no spoken tone when neutral', () => {
    render(<Toaster />);
    raise('Link copied');
    const item = screen.getByText('Link copied').closest('[data-toast]')!;
    expect(item.querySelector(`.${styles.icon}`)).toBeNull();
    expect(item).toHaveTextContent(/^Link copied$/);
  });

  it('interrupts only for an error', () => {
    render(<Toaster />);
    raise('Saved', { tone: 'success' });
    raise('Could not send the invite', { tone: 'danger' });
    expect(screen.getByRole('alert')).toHaveTextContent('Error: Could not send the invite');
    expect(screen.getByText('Saved').closest('[data-toast]')).not.toHaveAttribute('role');
  });

  it('runs its action and goes', () => {
    const onClick = vi.fn();
    render(<Toaster />);
    raise('Appointment deleted', { action: { label: 'Undo', onClick } });
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Appointment deleted')).not.toBeInTheDocument();
  });

  it('goes even when its action throws', () => {
    render(<Toaster />);
    raise('Deleted', {
      action: {
        label: 'Undo',
        onClick: () => {
          throw new Error('no');
        },
      },
    });
    const button = screen.getByRole('button', { name: 'Undo' });
    // React reports a handler's error to the window; jsdom would log it.
    const quiet = (event: ErrorEvent) => event.preventDefault();
    window.addEventListener('error', quiet);
    fireEvent.click(button);
    window.removeEventListener('error', quiet);
    expect(screen.queryByText('Deleted')).not.toBeInTheDocument();
  });

  it(`shows ${TOAST_LIMIT} and keeps the rest waiting`, () => {
    render(<Toaster />);
    for (const n of [1, 2, 3, 4]) raise(`Toast ${n}`, { duration: Infinity });
    expect(screen.queryByText('Toast 4')).not.toBeInTheDocument();
    fireEvent.click(within(screen.getByText('Toast 1').closest('[data-toast]') as HTMLElement).getByRole('button'));
    expect(screen.getByText('Toast 4')).toBeInTheDocument();
  });

  it('updates in place when the id is one already showing', () => {
    render(<Toaster />);
    raise('Uploading', { id: 'upload' });
    raise('Uploaded', { id: 'upload', tone: 'success' });
    expect(screen.queryByText('Uploading')).not.toBeInTheDocument();
    expect(screen.getAllByText('Uploaded')).toHaveLength(1);
  });
});

describe('Toaster — the clock', () => {
  it('goes after five seconds, ten with an action, and never for an error', () => {
    render(<Toaster />);
    raise('Plain');
    raise('With action', { action: { label: 'Undo', onClick: () => {} } });
    raise('Broken', { tone: 'danger' });
    advance(TOAST_DURATION - 1);
    expect(screen.getByText('Plain')).toBeInTheDocument();
    advance(1);
    expect(screen.queryByText('Plain')).not.toBeInTheDocument();
    advance(TOAST_DURATION_WITH_ACTION - TOAST_DURATION);
    expect(screen.queryByText('With action')).not.toBeInTheDocument();
    advance(60_000);
    expect(screen.getByText('Broken')).toBeInTheDocument();
  });

  it('a toast arriving does not restart the ones showing', () => {
    render(<Toaster />);
    raise('First');
    advance(TOAST_DURATION - 100);
    raise('Second');
    advance(100);
    expect(screen.queryByText('First')).not.toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('an update restarts its clock', () => {
    render(<Toaster />);
    raise('Uploading', { id: 'upload' });
    advance(TOAST_DURATION - 100);
    raise('Uploaded', { id: 'upload' });
    advance(TOAST_DURATION - 100);
    expect(screen.getByText('Uploaded')).toBeInTheDocument();
    advance(100);
    expect(screen.queryByText('Uploaded')).not.toBeInTheDocument();
  });

  it('stops under the pointer and starts again from the whole duration', () => {
    render(<Toaster />);
    raise('Saved');
    advance(TOAST_DURATION - 100);
    fireEvent.pointerEnter(regionOf());
    advance(60_000);
    expect(screen.getByText('Saved')).toBeInTheDocument();
    fireEvent.pointerLeave(regionOf());
    advance(TOAST_DURATION - 1);
    expect(screen.getByText('Saved')).toBeInTheDocument();
    advance(1);
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });

  it('stops while focus is inside', () => {
    render(<Toaster />);
    raise('Saved');
    act(() => screen.getByRole('button', { name: 'Dismiss' }).focus());
    advance(60_000);
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('stops while the document is hidden', () => {
    render(<Toaster />);
    raise('Saved');
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    act(() => void document.dispatchEvent(new Event('visibilitychange')));
    advance(60_000);
    expect(screen.getByText('Saved')).toBeInTheDocument();
    hidden.mockReturnValue(false);
    act(() => void document.dispatchEvent(new Event('visibilitychange')));
    advance(TOAST_DURATION);
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
    hidden.mockRestore();
  });

  it('lets go when a focused toast is dismissed with nowhere to send the focus', () => {
    render(<Toaster />);
    raise('First', { duration: Infinity });
    raise('Second');
    const first = screen.getByText('First').closest('[data-toast]') as HTMLElement;
    const dismiss = within(first).getByRole('button', { name: 'Dismiss' });
    act(() => dismiss.focus());
    fireEvent.click(dismiss);
    advance(TOAST_DURATION);
    expect(screen.queryByText('Second')).not.toBeInTheDocument();
  });

  it('is not left held when the last toast is dismissed under the pointer', () => {
    render(<Toaster />);
    raise('First');
    fireEvent.pointerEnter(regionOf());
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    raise('Second');
    advance(TOAST_DURATION);
    expect(screen.queryByText('Second')).not.toBeInTheDocument();
  });
});

describe('Toaster — the keyboard', () => {
  it('F6 focuses the newest toast, and Esc dismisses it and gives focus back', () => {
    render(
      <>
        <button type="button">Save</button>
        <Toaster />
      </>,
    );
    const save = screen.getByRole('button', { name: 'Save' });
    act(() => save.focus());
    raise('Older', { duration: Infinity });
    raise('Newer', { duration: Infinity });

    fireEvent.keyDown(document.body, { key: 'F6' });
    const newer = screen.getByText('Newer').closest<HTMLElement>('[data-toast]')!;
    expect(newer).toHaveFocus();

    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    act(() => void newer.dispatchEvent(escape));
    expect(escape.defaultPrevented).toBe(true);
    expect(screen.queryByText('Newer')).not.toBeInTheDocument();
    expect(screen.getByText('Older')).toBeInTheDocument();
    expect(save).toHaveFocus();
  });

  it('gives F6 back to the browser once focus is among the toasts', () => {
    render(<Toaster />);
    raise('Could not save', { tone: 'danger' });
    fireEvent.keyDown(document.body, { key: 'F6' });
    const again = new KeyboardEvent('keydown', { key: 'F6', bubbles: true, cancelable: true });
    document.activeElement!.dispatchEvent(again);
    expect(again.defaultPrevented).toBe(false);
  });

  it('leaves F6 with a modifier, and F6 with nothing showing, to the browser', () => {
    render(<Toaster />);
    const idle = new KeyboardEvent('keydown', { key: 'F6', bubbles: true, cancelable: true });
    document.body.dispatchEvent(idle);
    expect(idle.defaultPrevented).toBe(false);

    raise('Saved');
    const modified = new KeyboardEvent('keydown', { key: 'F6', ctrlKey: true, bubbles: true, cancelable: true });
    document.body.dispatchEvent(modified);
    expect(modified.defaultPrevented).toBe(false);
  });

  it('gives focus back after the close button too', () => {
    render(
      <>
        <button type="button">Save</button>
        <Toaster />
      </>,
    );
    const save = screen.getByRole('button', { name: 'Save' });
    act(() => save.focus());
    raise('Saved');
    const dismiss = screen.getByRole('button', { name: 'Dismiss' });
    act(() => dismiss.focus());
    fireEvent.click(dismiss);
    expect(save).toHaveFocus();
  });
});

describe('Toaster — the stylesheet', () => {
  const css = readCss('src/components/Toast/Toast.module.css');

  it('clears the UA popover box and places itself', () => {
    const region = block(css, '.region {');
    expect(region).toMatch(/position:\s*fixed/);
    expect(region).toMatch(/inset:\s*auto/);
    expect(region).toMatch(/border:\s*0/);
    for (const placement of toasterPlacements) expect(css).toContain(`.region.${placement}`);
  });

  it('is the inverse surface with the text that belongs on it', () => {
    const rule = block(css, '.toast {');
    expect(rule).toContain('var(--ap-color-surface-inverse)');
    expect(rule).toContain('var(--ap-color-text-inverse)');
    expect(rule).toContain('var(--ap-elevation-lg)');
  });

  it('rings in currentColor: border/focus is 1.64:1 on this surface in dark', () => {
    expect(block(css, '.toast:focus-visible')).toMatch(/outline:[^;]*currentColor/);
    expect(css).not.toContain('--ap-color-border-focus');
  });

  it('never reaches a part by descent', () => {
    const headers = [...css.matchAll(/(^|\})\s*([^{}@]+)\{/g)].flatMap(([, , header]) => header!.split(','));
    const descending = headers.map((h) => h.trim()).filter((h) => /\.[\w-]+\s+[.>+~]?\s*\./.test(h));
    expect(descending).toEqual([]);
  });

  it('keeps the fade and drops the travel under reduced motion', () => {
    expect(block(css, '@media (prefers-reduced-motion: no-preference)')).toContain('translate');
    const reduced = block(css, '@media (prefers-reduced-motion: reduce)');
    expect(block(reduced, '.toast {')).toMatch(/transition:\s*opacity/);
    expect(block(reduced, '.toast {')).not.toContain('translate');
  });
});

describe('Toaster — axe', () => {
  it('empty, and with every tone and an action', async () => {
    vi.useRealTimers();
    const { container } = render(<Toaster />);
    expect(await axeViolations(container)).toEqual([]);
    raise('Saved', { tone: 'success', action: { label: 'Undo', onClick: () => {} } });
    raise('Could not send', { tone: 'danger' });
    raise('Link copied');
    expect(await axeViolations(container)).toEqual([]);
  });
});
