import { createRef, useState } from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { Drawer, DRAWER_WIDTH, DRAWER_NARROW } from './Drawer';
import type { DrawerProps } from './Drawer';
import styles from './Drawer.module.css';
import { NATIVE_POPOVER, installPopoverStub } from '../../test/popover';
import { readCss, block } from '../../test/css';
import { axeViolations } from '../../test/axe';

installPopoverStub();

const css = readCss('src/components/Drawer/Drawer.module.css');

function Appointment(props: Partial<DrawerProps>) {
  return (
    <Drawer open onClose={() => {}} title="New appointment" {...props}>
      {props.children ?? <input aria-label="Patient" />}
    </Drawer>
  );
}

function Page(props: Partial<DrawerProps>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      <Appointment {...props} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

const handle = () => screen.getByRole('separator', { name: 'Resize' });

describe('Drawer — structure', () => {
  it('stubs the popover API only because jsdom lacks it', () => {
    expect(NATIVE_POPOVER).toBe(false);
  });

  it('renders nothing while closed', () => {
    const { container } = render(<Appointment open={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('over the content is a manual popover and a dialog that is not modal, named by its title', () => {
    render(<Appointment />);
    const panel = screen.getByRole('dialog', { name: 'New appointment' });
    expect(panel).toHaveAttribute('popover', 'manual');
    expect(panel).not.toHaveAttribute('aria-modal');
    expect(panel).toHaveClass(styles.drawer!, styles.layered!, styles.end!, styles.md!);
    expect(panel).not.toHaveClass(styles.flow!);
    // The stub's mark of a popover that was shown.
    expect(panel.style.display).toBe('block');
  });

  it('beside the content is a region in the flow, with no popover', () => {
    render(<Appointment mode="inline" size="lg" side="start" />);
    const panel = screen.getByRole('region', { name: 'New appointment' });
    expect(panel).not.toHaveAttribute('popover');
    expect(panel).toHaveClass(styles.flow!, styles.start!, styles.lg!);
    expect(panel).not.toHaveClass(styles.layered!);
  });

  it('takes its side from the writing direction: under dir="rtl" the start is still the start', () => {
    // The classes name the logical side, and the stylesheet places each with a
    // logical inset, so in a right-to-left page the start panel is on the right
    // without a class or a rule of its own.
    const { unmount } = render(
      <div dir="rtl">
        <Appointment side="start" />
      </div>,
    );
    const start = screen.getByRole('dialog', { name: 'New appointment' });
    expect(start).toHaveClass(styles.layered!, styles.start!);
    expect(start).not.toHaveClass(styles.end!);
    unmount();

    render(
      <div dir="rtl">
        <Appointment side="end" />
      </div>,
    );
    const end = screen.getByRole('dialog', { name: 'New appointment' });
    expect(end).toHaveClass(styles.layered!, styles.end!);
    expect(end).not.toHaveClass(styles.start!);

    expect(block(css, '.layered.start {')).toContain('inset-inline-start: 0');
    expect(block(css, '.layered.end {')).toContain('inset-inline-end: 0');
    expect(css).not.toMatch(/(^|[\s;{-])(left|right)\s*:/);
  });

  it('expanded, either kind is over the page', () => {
    render(<Appointment mode="inline" expanded onExpandedChange={() => {}} />);
    const panel = screen.getByRole('dialog', { name: 'New appointment' });
    expect(panel).toHaveAttribute('popover', 'manual');
    expect(panel).toHaveClass(styles.layered!, styles.expanded!);
  });

  it('takes a header in the title’s place, and then its name from aria-label', () => {
    render(<Appointment header={<button>Confirmed</button>} aria-label="Appointment" />);
    const panel = screen.getByRole('dialog', { name: 'Appointment' });
    expect(panel).not.toHaveAttribute('aria-labelledby');
    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.getByRole('button', { name: 'Confirmed' })).toBeInTheDocument();
  });

  it('has a footer only with actions, and the caller’s header actions before its own', () => {
    const { rerender } = render(<Appointment />);
    expect(document.querySelector(`.${styles.footer}`)).toBeNull();
    rerender(<Appointment actions={<button>Save</button>} headerActions={<button>More</button>} onExpandedChange={() => {}} />);
    expect(document.querySelector(`.${styles.footer}`)).toContainElement(screen.getByRole('button', { name: 'Save' }));
    const names = [...document.querySelectorAll(`.${styles.headerActions} button`)].map((b) => b.getAttribute('aria-label') ?? b.textContent);
    expect(names).toEqual(['More', 'Expand', 'Close']);
  });

  it('has no axe violations, either kind', async () => {
    const { container, unmount } = render(<Appointment resizable onExpandedChange={() => {}} actions={<button>Save</button>} />);
    expect(await axeViolations(container)).toEqual([]);
    unmount();
    const inline = render(<Appointment mode="inline" resizable />);
    expect(await axeViolations(inline.container)).toEqual([]);
  });
});

/** A window that says whether it is narrower than `md`, as the SideNav's tests do. */
function mockMedia(matches: boolean) {
  const listeners = new Set<() => void>();
  const state = { matches };
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    get matches() {
      return query === DRAWER_NARROW && state.matches;
    },
    media: query,
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  }));
  return {
    set(next: boolean) {
      state.matches = next;
      act(() => listeners.forEach((fn) => fn()));
    },
  };
}

function Beside(props: Partial<DrawerProps>) {
  return (
    <div style={{ display: 'flex' }}>
      <main aria-label="Calendar">The week</main>
      <Appointment mode="inline" {...props} />
    </div>
  );
}

describe('Drawer — inline, on a phone', () => {
  // jsdom has no matchMedia; the tests above run as a wide window does.
  afterEach(() => {
    delete (window as { matchMedia?: unknown }).matchMedia;
  });

  it('asks at md, the line the SideNav becomes a sheet at', () => {
    expect(DRAWER_NARROW).toBe('(width < 48rem)');
    mockMedia(false);
    render(<Beside />);
    expect(window.matchMedia).toHaveBeenCalledWith(DRAWER_NARROW);
  });

  it('below md is over the content, as overlay is, and the content is not narrowed', () => {
    mockMedia(true);
    render(<Beside onExpandedChange={() => {}} />);
    const panel = screen.getByRole('dialog', { name: 'New appointment' });
    expect(panel).toHaveAttribute('popover', 'manual');
    expect(panel).toHaveClass(styles.drawer!, styles.layered!, styles.end!, styles.md!);
    // `.flow` is the only class that takes room in the row; `.layered` is
    // fixed in the top layer, so the content keeps the whole row.
    expect(panel).not.toHaveClass(styles.flow!);
    expect(block(css, '\n.layered {')).toContain('position: fixed');
    expect(panel.style.display).toBe('block');
    expect(panel).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Expand' })).toBeInTheDocument();
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('from md up is beside the content, as before', () => {
    mockMedia(false);
    render(<Beside />);
    const panel = screen.getByRole('region', { name: 'New appointment' });
    expect(panel).not.toHaveAttribute('popover');
    expect(panel).toHaveClass(styles.flow!);
    expect(panel).not.toHaveClass(styles.layered!);
  });

  it('follows the window across md while it is open', () => {
    const media = mockMedia(false);
    render(<Beside />);
    expect(screen.getByRole('region', { name: 'New appointment' })).toHaveClass(styles.flow!);
    media.set(true);
    const over = screen.getByRole('dialog', { name: 'New appointment' });
    expect(over).toHaveClass(styles.layered!);
    expect(over.style.display).toBe('block');
    media.set(false);
    expect(screen.getByRole('region', { name: 'New appointment' })).toHaveClass(styles.flow!);
  });

  it('leaves the overlay Drawer as it is, at any width', () => {
    mockMedia(false);
    render(<Appointment />);
    expect(screen.getByRole('dialog', { name: 'New appointment' })).toHaveClass(styles.layered!);
  });
});

describe('Drawer — closing', () => {
  it('tells the caller and does not close itself', async () => {
    const onClose = vi.fn();
    render(<Appointment onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('Esc from inside calls onClose; from the page it does not', async () => {
    const onClose = vi.fn();
    render(
      <>
        <button>Outside</button>
        <Appointment onClose={onClose} />
      </>,
    );
    screen.getByRole('button', { name: 'Outside' }).focus();
    await userEvent.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
    screen.getByLabelText('Patient').focus();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('leaves alone an Esc that something inside has handled', async () => {
    const onClose = vi.fn();
    render(
      <Appointment onClose={onClose}>
        <input aria-label="Patient" onKeyDown={(e) => e.key === 'Escape' && e.preventDefault()} />
      </Appointment>,
    );
    screen.getByLabelText('Patient').focus();
    await userEvent.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('a press outside does nothing', async () => {
    const onClose = vi.fn();
    render(
      <>
        <button>Outside</button>
        <Appointment onClose={onClose} />
      </>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Outside' }));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('Drawer — focus', () => {
  it('goes to the panel, and back to what had it', async () => {
    render(<Page />);
    const opener = screen.getByRole('button', { name: 'Open' });
    await userEvent.click(opener);
    expect(screen.getByRole('dialog')).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(opener).toHaveFocus());
  });

  it('goes to initialFocus when given', async () => {
    const ref = createRef<HTMLInputElement>();
    render(<Page initialFocus={ref} children={<input ref={ref} aria-label="Patient" />} />);
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByLabelText('Patient')).toHaveFocus();
  });

  it('does not take the focus back from where the reader has gone', async () => {
    function Live() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <button onClick={() => setOpen(false)}>Another slot</button>
          <Appointment open={open} />
        </>
      );
    }
    render(<Live />);
    const other = screen.getByRole('button', { name: 'Another slot' });
    await userEvent.click(other);
    await new Promise((r) => setTimeout(r, 10));
    expect(other).toHaveFocus();
  });
});

describe('Drawer — focus, after a Dialog that closes with it', () => {
  // The button of a dialog that has just closed is still the active element
  // until the next frame. jsdom has no checkVisibility, so it is given one.
  it('takes as lost a focus that is on something no longer rendered', async () => {
    function Asked() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Open</button>
          <button ref={(el) => void (el && (el.checkVisibility = () => false))} onClick={() => setOpen(false)}>
            Leave
          </button>
          <Appointment open={open} />
        </>
      );
    }
    render(<Asked />);
    const opener = screen.getByRole('button', { name: 'Open' });
    await userEvent.click(opener);
    await userEvent.click(screen.getByRole('button', { name: 'Leave' }));
    await waitFor(() => expect(opener).toHaveFocus());
  });
});

describe('Drawer — expand', () => {
  it('has the button only with its handler', () => {
    render(<Appointment />);
    expect(screen.queryByRole('button', { name: 'Expand' })).toBeNull();
  });

  it('asks the caller, and is named for what it will do', async () => {
    const onExpandedChange = vi.fn();
    const { rerender } = render(<Appointment onExpandedChange={onExpandedChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Expand' }));
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    rerender(<Appointment expanded onExpandedChange={onExpandedChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Collapse' }));
    expect(onExpandedChange).toHaveBeenLastCalledWith(false);
  });

  it('hides the handle while expanded', () => {
    render(<Appointment resizable expanded onExpandedChange={() => {}} />);
    expect(screen.queryByRole('separator')).toBeNull();
  });
});

describe('Drawer — resize', () => {
  it('has no handle unless asked for', () => {
    render(<Appointment />);
    expect(screen.queryByRole('separator')).toBeNull();
  });

  it('is a focusable vertical separator with its values in pixels', () => {
    render(<Appointment resizable maxWidth={900} />);
    const h = handle();
    expect(h).toHaveAttribute('tabindex', '0');
    expect(h).toHaveAttribute('aria-orientation', 'vertical');
    expect(h).toHaveAttribute('aria-valuenow', String(DRAWER_WIDTH.md));
    expect(h).toHaveAttribute('aria-valuemin', '320');
    expect(h).toHaveAttribute('aria-controls', screen.getByRole('dialog').id);
  });

  it('never says a value past its most', async () => {
    render(<Appointment resizable size="lg" />);
    await waitFor(() => expect(handle()).toHaveAttribute('aria-valuemax', '704'));
    expect(handle()).toHaveAttribute('aria-valuenow', '704');
  });

  it('reads the room again at every resize, since a parent changes with no event', async () => {
    const onWidthChange = vi.fn();
    // jsdom lays nothing out, so the row is told its width, before the panel's effect reads it.
    const wide = (el: HTMLElement | null, value: number) =>
      el && Object.defineProperty(el, 'clientWidth', { configurable: true, value });
    render(
      <div data-testid="row" ref={(el) => void wide(el, 1000)}>
        <Appointment mode="inline" resizable defaultWidth={400} onWidthChange={onWidthChange} />
      </div>,
    );
    const row = screen.getByTestId('row');
    handle().focus();
    await userEvent.keyboard('{End}');
    expect(onWidthChange).toHaveBeenLastCalledWith(680);
    wide(row, 800);
    await userEvent.keyboard('{End}');
    expect(onWidthChange).toHaveBeenLastCalledWith(480);
  });

  it('has no handle where there is nothing to give', async () => {
    render(<Appointment resizable maxWidth={320} />);
    await waitFor(() => expect(screen.queryByRole('separator')).toBeNull());
  });

  // jsdom's window is 1024 wide: the most is what leaves the content 320.
  it('never takes the content’s last 320', () => {
    render(<Appointment resizable />);
    expect(handle()).toHaveAttribute('aria-valuemax', '704');
  });

  it('at the end, Left widens and Right narrows, by 16', async () => {
    const onWidthChange = vi.fn();
    render(<Appointment resizable defaultWidth={480} onWidthChange={onWidthChange} />);
    handle().focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(onWidthChange).toHaveBeenLastCalledWith(496);
    expect(screen.getByRole('dialog').style.getPropertyValue('--drawer-width')).toBe('496px');
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    expect(onWidthChange).toHaveBeenLastCalledWith(464);
  });

  it('at the start it is the other way', async () => {
    const onWidthChange = vi.fn();
    render(<Appointment resizable side="start" defaultWidth={480} onWidthChange={onWidthChange} />);
    handle().focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onWidthChange).toHaveBeenLastCalledWith(496);
  });

  it('Home and End go to the ends, and nothing goes past them', async () => {
    const onWidthChange = vi.fn();
    render(<Appointment resizable defaultWidth={480} minWidth={400} maxWidth={600} onWidthChange={onWidthChange} />);
    handle().focus();
    await userEvent.keyboard('{Home}');
    expect(onWidthChange).toHaveBeenLastCalledWith(400);
    await userEvent.keyboard('{ArrowRight}');
    expect(onWidthChange).toHaveBeenCalledTimes(1);
    await userEvent.keyboard('{End}');
    expect(onWidthChange).toHaveBeenLastCalledWith(600);
  });

  it('drags with the pointer, and a double click goes back', () => {
    const onWidthChange = vi.fn();
    render(<Appointment resizable defaultWidth={480} onWidthChange={onWidthChange} />);
    const h = handle();
    fireEvent.pointerDown(h, { button: 0, clientX: 500, pointerId: 1 });
    fireEvent.pointerMove(h, { clientX: 440, pointerId: 1 });
    expect(onWidthChange).toHaveBeenLastCalledWith(540);
    fireEvent.pointerUp(h, { pointerId: 1 });
    fireEvent.pointerMove(h, { clientX: 300, pointerId: 1 });
    expect(onWidthChange).toHaveBeenCalledTimes(1);
    fireEvent.doubleClick(h);
    expect(onWidthChange).toHaveBeenLastCalledWith(480);
  });

  it('controlled, the width is the caller’s', async () => {
    const onWidthChange = vi.fn();
    render(<Appointment resizable width={500} onWidthChange={onWidthChange} />);
    handle().focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(onWidthChange).toHaveBeenLastCalledWith(516);
    expect(screen.getByRole('dialog').style.getPropertyValue('--drawer-width')).toBe('500px');
  });
});

describe('Drawer — stylesheet', () => {
  it('sets display only where a closed popover cannot be', () => {
    expect(block(css, '.drawer {')).not.toMatch(/display\s*:/);
    expect(block(css, '\n.layered {')).not.toMatch(/display\s*:/);
    expect(block(css, '.layered:popover-open {')).toContain('display: flex');
    expect(block(css, '\n.flow {')).toContain('display: flex');
  });

  it('over the content is the overlay surface on the lg shadow, the whole height, in the top layer by position alone', () => {
    const own = block(css, '\n.layered {');
    expect(own).toContain('position: fixed');
    expect(own).toContain('block-size: 100dvh');
    expect(own).toContain('background: var(--ap-color-surface-overlay)');
    expect(own).toContain('box-shadow: var(--ap-elevation-lg)');
    expect(css).not.toMatch(/z-index/);
  });

  it('beside the content is a card’s surface with a line and no shadow', () => {
    const own = block(css, '\n.flow {');
    expect(own).toContain('background: var(--ap-color-surface-raised)');
    expect(own).toContain('--drawer-edge: var(--ap-color-border-subtle)');
    expect(own).not.toContain('box-shadow');
    expect(own).toContain('flex: 0 1 auto');
  });

  it('breaks the title between words, and inside one only as a last resort', () => {
    // `anywhere` also lowers the title's least width to one letter: an inline
    // panel narrowed to 160 set "Justin Anderson" on 14 lines. break-word
    // waits for a word that cannot fit on a line of its own.
    const title = block(css, '.title.title {');
    expect(title).toContain('overflow-wrap: break-word');
    expect(title).not.toContain('anywhere');
  });

  it('is square, at the drawn widths', () => {
    expect(css).not.toMatch(/border-radius/);
    expect(block(css, '.md {')).toContain('480px');
    expect(block(css, '.lg {')).toContain('768px');
  });

  it('the body scrolls and the divider is inset', () => {
    expect(block(css, '.body {')).toContain('overflow-y: auto');
    expect(block(css, '.header::after {')).toContain('inset-inline: var(--ap-spacing-300)');
  });

  it('drops the entrance for reduced motion by never adding it', () => {
    expect(block(css, '@media (prefers-reduced-motion: no-preference) {')).toContain('animation: arrive');
    expect(block(css, '\n.layered {')).not.toContain('animation');
  });

  it('the handle is told its side and not reached by descent', () => {
    expect(css).not.toMatch(/\.(end|start)\s*>?\s*\.handle/);
    expect(block(css, '.handle {')).toContain('touch-action: none');
  });
});
