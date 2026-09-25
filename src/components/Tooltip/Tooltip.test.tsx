import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { Tooltip, TOOLTIP_OPEN_DELAY, TOOLTIP_CLOSE_DELAY } from './Tooltip';
import styles from './Tooltip.module.css';
import { installPopoverStub } from '../../test/popover';
import { readCss, block } from '../../test/css';
import { axeViolations } from '../../test/axe';

installPopoverStub();

/** The stub shows a popover by setting `display: block` inline, and clears it to hide. */
const isOpen = (panel: HTMLElement) => panel.style.display === 'block';
const panelOf = () => screen.getByRole('tooltip', { hidden: true });
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

/**
 * Focus as the keyboard gives it. jsdom decides :focus-visible from the last
 * kind of input it saw, as browsers do, so a `.focus()` that follows another
 * test's pointerdown is not focus-visible and the tooltip rightly stays shut.
 * A Tab keydown first makes the focus the keyboard's.
 */
const tabTo = (element: HTMLElement) => {
  fireEvent.keyDown(document.body, { key: 'Tab' });
  act(() => element.focus());
};

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const Subject = (props: Partial<Parameters<typeof Tooltip>[0]>) => (
  <Tooltip content="Move to another day" {...props}>
    <button type="button">Reschedule</button>
  </Tooltip>
);

describe('Tooltip — structure', () => {
  it('describes its trigger, and is a tooltip', () => {
    render(<Subject />);
    const panel = panelOf();
    expect(panel).toHaveAttribute('popover', 'manual');
    expect(screen.getByRole('button', { name: 'Reschedule' })).toHaveAttribute('aria-describedby', panel.id);
    expect(screen.getByRole('button')).toHaveAccessibleDescription('Move to another day');
  });

  it('names the trigger instead when that is its purpose', () => {
    // An icon-only button has no other name. A description would leave it
    // announced as "button".
    render(
      <Tooltip content="Copy link" purpose="label">
        <button type="button">
          <svg aria-hidden="true" />
        </button>
      </Tooltip>,
    );
    const button = screen.getByRole('button', { name: 'Copy link' });
    expect(button).toHaveAttribute('aria-labelledby', panelOf().id);
    expect(button).not.toHaveAttribute('aria-describedby');
  });

  it('keeps a description the trigger already had', () => {
    render(
      <>
        <p id="help">Only on weekdays</p>
        <Tooltip content="Move to another day">
          <button type="button" aria-describedby="help">Reschedule</button>
        </Tooltip>
      </>,
    );
    expect(screen.getByRole('button')).toHaveAccessibleDescription('Only on weekdays Move to another day');
  });

  it('is compact for a string and the drawn card for anything richer', () => {
    const { rerender } = render(<Subject />);
    expect(panelOf()).toHaveClass(styles.tooltip!, styles.sm!);
    rerender(<Subject content={<span>Verified since June 17</span>} />);
    expect(panelOf()).toHaveClass(styles.md!);
    rerender(<Subject size="md" />);
    expect(panelOf()).toHaveClass(styles.md!);
  });

  it('carries its placement, a shortcut and a description', () => {
    render(<Subject placement="bottom" shortcut="⌘K" description="Patients are told by email." />);
    const panel = panelOf();
    expect(panel).toHaveClass(styles.bottom!);
    expect(panel.querySelector('kbd')).toHaveTextContent('⌘K');
    expect(panel.querySelector(`.${styles.description}`)).toHaveTextContent('Patients are told by email.');
    // A real space before the shortcut, or the description reads "Move to another day⌘K".
    expect(screen.getByRole('button')).toHaveAccessibleDescription(/another day ⌘K/);
  });

  it('is built of spans, so it can sit inside a paragraph', () => {
    // A div or a p inside a p is closed early by the HTML parser, and the
    // server's markup would not be the markup React hydrates.
    const { container } = render(
      <p>
        Booked by <Tooltip content="Front desk" description="Since 2021."><button type="button">Marta</button></Tooltip>.
      </p>,
    );
    expect(container.querySelector('p')!.querySelectorAll('div, p')).toHaveLength(0);
  });

  it('puts className on the wrapper and ties the panel to it by an anchor name', () => {
    const { container } = render(<Subject className="mine" />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveClass(styles.wrapper!, 'mine');
    // One custom property on the wrapper, inherited by the panel inside it:
    // the stylesheet reads it as the wrapper's anchor-name and the panel's
    // position-anchor. jsdom drops `anchor-name` from an inline style, which
    // is the other reason it is not written there.
    expect(wrapper.style.getPropertyValue('--tooltip-anchor')).toMatch(/^--tooltip-[a-zA-Z0-9]+$/);
    const css = readCss('src/components/Tooltip/Tooltip.module.css');
    expect(block(css, '.wrapper {')).toContain('anchor-name: var(--tooltip-anchor)');
  });
});

describe('Tooltip — opening and closing', () => {
  it('opens on hover only after the delay', () => {
    render(<Subject />);
    fireEvent.pointerEnter(screen.getByRole('button').parentElement!, { pointerType: 'mouse' });
    advance(TOOLTIP_OPEN_DELAY - 1);
    expect(isOpen(panelOf())).toBe(false);
    advance(1);
    expect(isOpen(panelOf())).toBe(true);
  });

  it('never opens if the pointer has left before the delay is up', () => {
    render(<Subject />);
    const wrapper = screen.getByRole('button').parentElement!;
    fireEvent.pointerEnter(wrapper, { pointerType: 'mouse' });
    advance(TOOLTIP_OPEN_DELAY / 2);
    fireEvent.pointerLeave(wrapper, { pointerType: 'mouse' });
    advance(TOOLTIP_OPEN_DELAY * 2);
    expect(isOpen(panelOf())).toBe(false);
  });

  it('gives the pointer time to cross onto the panel, then closes', () => {
    // WCAG 1.4.13, hoverable. The panel is a DOM child of the wrapper, so the
    // pointer on it is still inside; the grace period is for the 8px between.
    render(<Subject />);
    const wrapper = screen.getByRole('button').parentElement!;
    fireEvent.pointerEnter(wrapper, { pointerType: 'mouse' });
    advance(TOOLTIP_OPEN_DELAY);
    fireEvent.pointerLeave(wrapper, { pointerType: 'mouse' });
    advance(TOOLTIP_CLOSE_DELAY - 1);
    fireEvent.pointerEnter(wrapper, { pointerType: 'mouse' });
    advance(TOOLTIP_CLOSE_DELAY * 3);
    expect(isOpen(panelOf())).toBe(true);
    fireEvent.pointerLeave(wrapper, { pointerType: 'mouse' });
    advance(TOOLTIP_CLOSE_DELAY);
    expect(isOpen(panelOf())).toBe(false);
  });

  it('ignores a touch: there is no hover on a phone', () => {
    render(<Subject />);
    fireEvent.pointerEnter(screen.getByRole('button').parentElement!, { pointerType: 'touch' });
    advance(TOOLTIP_OPEN_DELAY * 2);
    expect(isOpen(panelOf())).toBe(false);
  });

  it('opens at once on keyboard focus and closes at once on blur', () => {
    render(<Subject />);
    const button = screen.getByRole('button');
    tabTo(button);
    expect(isOpen(panelOf())).toBe(true);
    act(() => button.blur());
    expect(isOpen(panelOf())).toBe(false);
  });

  it('stays shut when the focus came from a click', () => {
    // A press focuses the button too, and a tooltip opening under the pointer
    // that just pressed is in the way.
    render(<Subject />);
    const button = screen.getByRole('button');
    fireEvent.pointerDown(button);
    fireEvent.mouseDown(button);
    act(() => button.focus());
    expect(isOpen(panelOf())).toBe(false);
  });

  it('closes on Esc and leaves focus where it was', () => {
    // WCAG 1.4.13, dismissible — without moving the pointer or the focus.
    render(<Subject />);
    const button = screen.getByRole('button');
    tabTo(button);
    fireEvent.keyDown(button, { key: 'Escape' });
    expect(isOpen(panelOf())).toBe(false);
    expect(button).toHaveFocus();
  });

  it('gets out of the way when the trigger is pressed', () => {
    render(<Subject />);
    const button = screen.getByRole('button');
    tabTo(button);
    fireEvent.pointerDown(button);
    expect(isOpen(panelOf())).toBe(false);
  });

  it('keeps the Esc that dismissed it from going any further', () => {
    // Inside a Dialog the same keypress would become a close request and
    // discard the form. Cancelled here, it does not.
    render(<Subject />);
    const button = screen.getByRole('button');
    tabTo(button);
    const first = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    button.dispatchEvent(first);
    expect(first.defaultPrevented).toBe(true);
    // Closed, it has no claim on the key.
    const second = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    button.dispatchEvent(second);
    expect(second.defaultPrevented).toBe(false);
  });

  it('stays open under a press on the panel, where a reader may be selecting its words', () => {
    render(<Subject />);
    tabTo(screen.getByRole('button'));
    fireEvent.pointerDown(panelOf());
    expect(isOpen(panelOf())).toBe(true);
  });

  it('shows one tooltip at a time: the last one asked for', () => {
    render(
      <>
        <Tooltip content="Copy link"><button type="button">Copy</button></Tooltip>
        <Tooltip content="Search the docs"><button type="button">Search</button></Tooltip>
      </>,
    );
    const [copy, search] = screen.getAllByRole('tooltip', { hidden: true });
    tabTo(screen.getByRole('button', { name: 'Copy' }));
    fireEvent.pointerEnter(screen.getByRole('button', { name: 'Search' }).parentElement!, { pointerType: 'mouse' });
    advance(TOOLTIP_OPEN_DELAY);
    expect(isOpen(copy!)).toBe(false);
    expect(isOpen(search!)).toBe(true);
  });

  it('while `when` is false, opens on nothing, and so takes neither the one slot nor an Esc', () => {
    // Filters' chip words: a Tooltip that says them whole only while they are
    // cut short. A panel opened and then hidden by a rule would still be a
    // shown popover — one a Drawer finds with :popover-open and gives its
    // Esc to — and would still close a real tooltip elsewhere and cancel the
    // next Esc at the document.
    render(
      <>
        <Tooltip content="Copy link"><button type="button">Copy</button></Tooltip>
        <Tooltip content="Status is Active" when={false}><button type="button">Status is Active</button></Tooltip>
      </>,
    );
    const [copy, whole] = screen.getAllByRole('tooltip', { hidden: true });
    const chip = screen.getByRole('button', { name: 'Status is Active' });
    fireEvent.pointerEnter(screen.getByRole('button', { name: 'Copy' }).parentElement!, { pointerType: 'mouse' });
    advance(TOOLTIP_OPEN_DELAY);
    expect(isOpen(copy!)).toBe(true);
    fireEvent.pointerEnter(chip.parentElement!, { pointerType: 'mouse' });
    advance(TOOLTIP_OPEN_DELAY * 2);
    expect(isOpen(whole!)).toBe(false);
    expect(isOpen(copy!)).toBe(true);
    fireEvent.pointerLeave(screen.getByRole('button', { name: 'Copy' }).parentElement!, { pointerType: 'mouse' });
    advance(TOOLTIP_CLOSE_DELAY);
    expect(isOpen(copy!)).toBe(false);
    tabTo(chip);
    expect(isOpen(whole!)).toBe(false);
    const esc = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    chip.dispatchEvent(esc);
    expect(esc.defaultPrevented).toBe(false);
  });

  it('closes when `when` turns false while it is open, and opens again once it is true', () => {
    const Chip = ({ when }: { when: boolean }) => (
      <Tooltip content="Status is Active or Invite pending" when={when}>
        <button type="button">Status</button>
      </Tooltip>
    );
    const { rerender } = render(<Chip when />);
    const button = screen.getByRole('button');
    tabTo(button);
    expect(isOpen(panelOf())).toBe(true);
    rerender(<Chip when={false} />);
    expect(isOpen(panelOf())).toBe(false);
    rerender(<Chip when />);
    act(() => button.blur());
    tabTo(button);
    expect(isOpen(panelOf())).toBe(true);
  });

  it('never shows a popover that is already showing', () => {
    // The platform throws InvalidStateError on a second showPopover; the stub
    // does not, so the call is counted.
    const show = vi.spyOn(HTMLElement.prototype, 'showPopover');
    render(<Subject />);
    const button = screen.getByRole('button');
    tabTo(button);
    fireEvent.pointerEnter(button.parentElement!, { pointerType: 'mouse' });
    advance(TOOLTIP_OPEN_DELAY);
    expect(show).toHaveBeenCalledTimes(1);
    show.mockRestore();
  });
});

describe('Tooltip — stylesheet', () => {
  const css = readCss('src/components/Tooltip/Tooltip.module.css');

  it('clears the UA sheet’s centring and anchors to the wrapper', () => {
    const rule = block(css, '.tooltip {');
    expect(rule).toMatch(/inset:\s*auto/);
    expect(rule).toMatch(/margin:\s*0/);
    expect(rule).toContain('position-anchor: var(--tooltip-anchor)');
    expect(rule).toContain('position-try-fallbacks');
  });

  it('is edged in border/subtle and never in border/default', () => {
    // Fernando, 2026-09-19: border/default is too strong here. More border
    // tokens are coming from the Figma tests; until then, subtle.
    expect(block(css, '.tooltip {')).toContain('--ap-color-border-subtle');
    expect(css).not.toContain('--ap-color-border-default');
  });

  it('shows nothing where there is no anchor positioning, rather than a tooltip in mid-screen', () => {
    const fallback = block(css, '@supports not (anchor-name: --a)');
    expect(block(fallback, '.tooltip')).toMatch(/display:\s*none/);
  });

  it('fades in from a starting style and simply appears under reduced motion', () => {
    expect(css).toContain('@starting-style');
    expect(block(css, '.tooltip {')).toContain('--ap-motion-duration-fade');
    const reduced = block(css, '@media (prefers-reduced-motion: reduce)');
    expect(block(reduced, '.tooltip')).toMatch(/transition:\s*none/);
  });

  it('keeps size and placement on the panel itself, never reached by descent', () => {
    expect(css).not.toMatch(/\.(?:sm|md|top|bottom|start|end)\s+\.tooltip\b/);
  });
});

describe('Tooltip — axe', () => {
  it('has no violation closed or open', async () => {
    vi.useRealTimers();
    const { container } = render(<Subject shortcut="⌘K" />);
    expect(await axeViolations(container)).toEqual([]);
    tabTo(screen.getByRole('button'));
    expect(await axeViolations(container)).toEqual([]);
  });
});
