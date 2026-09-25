import { createRef, useState } from 'react';
import { renderToString } from 'react-dom/server';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Popover, popoverPlacements } from './Popover';
import type { PopoverProps } from './Popover';
import styles from './Popover.module.css';
import floating from '../floating.module.css';
import { NATIVE_POPOVER, installPopoverStub } from '../../test/popover';
import { readCss, block } from '../../test/css';
import { axeViolations } from '../../test/axe';

installPopoverStub();

const css = readCss('src/components/Popover/Popover.module.css');

function Appointment(props: Partial<PopoverProps>) {
  return (
    <Popover trigger={(t) => <button {...t}>New appointment</button>} title="New appointment" {...props}>
      {props.children ?? <input aria-label="Patient" />}
    </Popover>
  );
}

const trigger = () => screen.getByRole('button', { name: 'New appointment' });
const panel = () => screen.getByRole('dialog', { hidden: true });
const opened = () => waitFor(() => expect(trigger()).toHaveAttribute('aria-expanded', 'true'));

describe('Popover — structure', () => {
  it('stubs the popover API only because jsdom lacks it', () => {
    expect(NATIVE_POPOVER).toBe(false);
  });

  it('is a dialog that is not modal, named by its title, on the floating surface', () => {
    render(<Appointment />);
    expect(panel()).toHaveAttribute('popover', 'auto');
    expect(panel()).not.toHaveAttribute('aria-modal');
    // Closed it is `display: none`, and a name is not computed for what is not rendered.
    const heading = screen.getByRole('heading', { level: 2, hidden: true });
    expect(heading).toHaveTextContent('New appointment');
    expect(panel()).toHaveAttribute('aria-labelledby', heading.id);
    expect(panel()).toHaveClass(floating.floating!, styles.popover!);
    expect(screen.getByRole('heading', { level: 2, hidden: true })).toHaveClass(styles.title!);
  });

  it('takes aria-label where it has no title, and then has no header', () => {
    render(<Appointment title={undefined} aria-label="Filters" />);
    expect(panel()).toHaveAttribute('aria-label', 'Filters');
    expect(panel()).not.toHaveAttribute('aria-labelledby');
    expect(panel().querySelector(`.${styles.header}`)).toBeNull();
  });

  it('ties the trigger to the panel', () => {
    render(<Appointment />);
    expect(trigger()).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(trigger()).toHaveAttribute('aria-controls', panel().id);
    expect(trigger()).toHaveAttribute('popovertarget', panel().id);
  });

  it('names one anchor on the trigger and in the panel', () => {
    render(<Appointment />);
    const name = panel().style.getPropertyValue('--floating-anchor');
    expect(name).toMatch(/^--popover-\w+$/);
    expect(trigger().style.getPropertyValue('anchor-name') || trigger().getAttribute('style')).toContain(name);
  });

  // The edge is the far side's margin, start then end: the 8 the panel keeps
  // from the screen on the side away from the trigger's edge it aligns to.
  it.each([
    ['bottom-start', 'block-end span-inline-end', '0 var(--ap-spacing-100)'],
    ['bottom-end', 'block-end span-inline-start', 'var(--ap-spacing-100) 0'],
    ['top-start', 'block-start span-inline-end', '0 var(--ap-spacing-100)'],
    ['top-end', 'block-start span-inline-start', 'var(--ap-spacing-100) 0'],
  ] as const)('places %s as %s, and keeps its far side off the screen’s edge', (placement, area, edge) => {
    render(<Appointment placement={placement} />);
    expect(panel().style.getPropertyValue('--floating-area')).toBe(area);
    expect(panel().style.getPropertyValue('--floating-edge')).toBe(edge);
    expect(popoverPlacements).toContain(placement);
  });

  it('takes a width as a number of pixels or as CSS, and none unless told', () => {
    const { rerender } = render(<Appointment />);
    expect(panel().style.getPropertyValue('--popover-width')).toBe('');
    rerender(<Appointment width={424} />);
    expect(panel().style.getPropertyValue('--popover-width')).toBe('424px');
    rerender(<Appointment width="24rem" />);
    expect(panel().style.getPropertyValue('--popover-width')).toBe('24rem');
  });

  it('has a footer only with actions, and header actions beside the title', () => {
    const { rerender } = render(<Appointment />);
    expect(panel().querySelector(`.${styles.footer}`)).toBeNull();
    rerender(<Appointment actions={<button>Save</button>} headerActions={<button>Expand</button>} />);
    expect(panel().querySelector(`.${styles.footer}`)).toContainElement(
      screen.getByRole('button', { name: 'Save', hidden: true }),
    );
    expect(panel().querySelector(`.${styles.headerActions}`)).toContainElement(
      screen.getByRole('button', { name: 'Expand', hidden: true }),
    );
  });

  it('leaves the trigger inert in server HTML, so a click before hydration cannot open it behind React', () => {
    expect(renderToString(<Appointment />)).not.toMatch(/popovertarget/i);
  });
});

describe('Popover — opening and closing', () => {
  it('opens on the trigger, says so, and takes the focus', async () => {
    const onOpenChange = vi.fn();
    render(<Appointment onOpenChange={onOpenChange} />);
    await userEvent.click(trigger());
    await opened();
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(panel()).toHaveFocus();
  });

  it('puts the focus on initialFocus instead, the first field of a form', async () => {
    const field = createRef<HTMLInputElement>();
    render(
      <Appointment initialFocus={field}>
        <input ref={field} aria-label="Patient" />
      </Appointment>,
    );
    await userEvent.click(trigger());
    await opened();
    expect(screen.getByRole('textbox', { name: 'Patient' })).toHaveFocus();
  });

  it('hands close to the body and to the actions', async () => {
    const onOpenChange = vi.fn();
    render(
      <Appointment onOpenChange={onOpenChange} actions={({ close }) => <button onClick={close}>Cancel</button>}>
        {({ close }) => <button onClick={close}>Done</button>}
      </Appointment>,
    );
    await userEvent.click(trigger());
    await opened();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(false));
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(trigger());
    await opened();
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(trigger()).toHaveAttribute('aria-expanded', 'false'));
  });

  it('does not throw when open arrives for a panel the trigger has already opened', async () => {
    function Both() {
      const [open, setOpen] = useState(false);
      return (
        <Popover
          open={open}
          onOpenChange={setOpen}
          trigger={(t) => (
            <button {...t} onClick={() => setOpen(true)}>
              New appointment
            </button>
          )}
          title="New appointment"
        >
          x
        </Popover>
      );
    }
    render(<Both />);
    await userEvent.click(trigger());
    await opened();
    expect(panel().style.display).toBe('block');
  });

  it('follows open when it is controlled, and tells the caller of a close it did not ask for', async () => {
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Open from outside</button>
          <Appointment
            open={open}
            onOpenChange={setOpen}
            actions={({ close }) => <button onClick={close}>Cancel</button>}
          />
        </>
      );
    }
    render(<Controlled />);
    await userEvent.click(screen.getByRole('button', { name: 'Open from outside' }));
    await opened();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(trigger()).toHaveAttribute('aria-expanded', 'false'));
    // And it opens again: the prop went back to false with the close.
    await userEvent.click(screen.getByRole('button', { name: 'Open from outside' }));
    await opened();
  });
});

describe('Popover — stylesheet', () => {
  it('stands a level above a menu, and sets nothing the floating surface sets', () => {
    const own = block(css, '.popover {');
    expect(own).toContain('--floating-elevation: var(--ap-elevation-lg)');
    expect(own).not.toMatch(
      /(^|\s)(position|position-area|position-anchor|inset|background|box-shadow|border|margin)\s*:/,
    );
  });

  it('sets display only while it is open, or it would never close', () => {
    expect(block(css, '.popover {')).not.toMatch(/display\s*:/);
    expect(block(css, '.popover:popover-open {')).toContain('display: flex');
    // Every other `display` is a part's.
    const withDisplay = [...css.matchAll(/([^{}]+)\{[^}]*display\s*:/g)].map(([, selector]) => selector!.trim());
    expect(withDisplay.filter((selector) => /^\.popover\b(?!:popover-open)/.test(selector))).toEqual([]);
  });

  it('keeps inside the screen, and scrolls its body between a header and a footer that stay', () => {
    const own = block(css, '.popover {');
    expect(own).toContain('max-inline-size: calc(100vw - 2 * var(--ap-spacing-100))');
    expect(own).toMatch(/max-block-size:\s*min\(calc\(100% -/);
    expect(own).toContain('position-try-order: most-block-size');
    expect(block(css, '.body {')).toContain('overflow-y: auto');
  });

  describe('the floating surface keeps 8 from the screen’s edges', () => {
    // At 320 and 375 the panel lay flush with the screen's edge: placed at the
    // trigger's start, it fitted the room to the edge exactly (320: 16 + 304)
    // or was pushed back by the platform only as far as the edge (375: 23 to
    // 375). The margin on the far side makes "fits" mean "fits with 8 to
    // spare"; the last fallback holds a panel that fits beside neither of the
    // trigger's edges 8 in from the screen's end, below the trigger or else
    // above it.
    const floatingCss = readCss('src/components/floating.module.css');
    const surface = block(floatingCss, '\n.floating {');

    it('asks for 8 on the side away from the trigger, which a consumer that moves the area moves with it', () => {
      expect(surface).toContain('margin-inline: var(--floating-edge, 0 var(--ap-spacing-100))');
    });

    it('tries the trigger’s other edge first, and the screen’s inline end last, below and then above', () => {
      // Both flips together before the last resort: a panel from a trigger low
      // at the screen's start fits above it at its other edge, and without
      // that entry the last resort took it above but across the screen.
      expect(surface).toContain(
        'position-try-fallbacks: flip-block, flip-inline, flip-block flip-inline, --floating-inside, --floating-inside flip-block',
      );
      const inside = block(floatingCss, '@position-try --floating-inside {');
      expect(inside).toContain('position-area: block-end span-all');
      expect(inside).toContain('justify-self: end');
      expect(inside).toContain('margin-inline: 0 var(--ap-spacing-100)');
    });

    it('gives the margin back to the centred placement where anchor positioning is missing', () => {
      expect(block(floatingCss, '@supports not (anchor-name: --a) {')).toMatch(/\bmargin: auto/);
    });
  });

  it('draws the divider inset, as drawn', () => {
    expect(block(css, '.header::after {')).toContain('inset-inline: var(--ap-spacing-300)');
  });
});

describe('Popover — axe', () => {
  it('has no violations, closed or open', async () => {
    const { container } = render(
      <main>
        <Appointment actions={<button>Save</button>} />
      </main>,
    );
    expect(await axeViolations(container)).toEqual([]);
    await userEvent.click(trigger());
    await opened();
    expect(await axeViolations(container)).toEqual([]);
  });
});
