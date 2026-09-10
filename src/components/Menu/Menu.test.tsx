import { readFileSync } from 'node:fs';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, it, expect } from 'vitest';
import { Menu } from './Menu';

const css = readFileSync('src/components/Menu/Menu.module.css', 'utf8');

/**
 * A stand-in for the popover API, because jsdom 30 has none of it: no
 * showPopover, no togglePopover, no ToggleEvent, and a click on a
 * popovertarget button does nothing. Its UA sheet still hides every
 * [popover], since :popover-open never matches — so without this an open
 * menu's rows would not be in the accessibility tree either.
 *
 * It covers what the component calls and what the trigger relies on, and
 * nothing more. Show and hide flip a flag, make the element visible inline,
 * and queue a `toggle` event as a task. The platform queues it too, and a
 * synchronous one would hide ordering bugs between opening and moving focus.
 *
 * Esc, light dismiss, focus return and the top layer are absent on purpose.
 * They belong to the browser, and a test of them here would be a test of this
 * stub. They are verified in a real browser instead, and the Menu page says so.
 *
 * Each test file gets its own jsdom, so nothing here leaks into other suites.
 */
const NATIVE_POPOVER = 'showPopover' in HTMLElement.prototype;

const shown = new WeakSet<HTMLElement>();
const queued = new WeakMap<HTMLElement, { timer: ReturnType<typeof setTimeout>; oldState: string }>();

function setShown(el: HTMLElement, next: boolean) {
  if (!el.hasAttribute('popover')) throw new DOMException('Not a popover', 'NotSupportedError');
  if (shown.has(el) === next) return;

  if (next) {
    shown.add(el);
    el.style.display = 'block';
  } else {
    shown.delete(el);
    el.style.removeProperty('display');
  }

  // Coalesced as the platform does: a show and a hide inside one task fire a
  // single event carrying the first oldState and the last newState.
  const earlier = queued.get(el);
  if (earlier) clearTimeout(earlier.timer);
  const oldState = earlier?.oldState ?? (next ? 'closed' : 'open');
  const newState = next ? 'open' : 'closed';
  const timer = setTimeout(() => {
    queued.delete(el);
    el.dispatchEvent(Object.assign(new Event('toggle'), { oldState, newState }));
  }, 0);
  queued.set(el, { timer, oldState });
}

beforeAll(() => {
  HTMLElement.prototype.showPopover = function (this: HTMLElement) {
    setShown(this, true);
  };
  HTMLElement.prototype.hidePopover = function (this: HTMLElement) {
    setShown(this, false);
  };
  HTMLElement.prototype.togglePopover = function (this: HTMLElement, force?: boolean) {
    setShown(this, force ?? !shown.has(this));
    return shown.has(this);
  };
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented) return;
    const id = (event.target as Element).closest('button[popovertarget]')?.getAttribute('popovertarget');
    const target = id ? document.getElementById(id) : null;
    target?.togglePopover();
  });
});

// No `items` yet — this task builds the surface. Task 4 adds the prop and
// updates this helper.
function Basic() {
  return <Menu trigger={(props) => <button {...props}>Actions</button>} />;
}

describe('Menu', () => {
  it('stubs the popover API only because jsdom lacks it', () => {
    // When jsdom ships popover, delete the stub above: it would be overriding
    // the real implementation, and the suite would be testing the imitation.
    expect(NATIVE_POPOVER).toBe(false);
  });

  it('names the menu with the trigger rather than a second label', () => {
    // The APG menu button pattern labels the menu with its button. A separate
    // prop would be a second place for the same name to be wrong.
    render(<Basic />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    const menu = document.querySelector('[role="menu"]')!;
    expect(menu.getAttribute('aria-labelledby')).toBe(trigger.id);
    expect(trigger.id).not.toBe('');
  });

  it('opens on the trigger and reports it', async () => {
    render(<Basic />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('gives each instance its own anchor name', () => {
    // Two menus on one page sharing an anchor name would both point at
    // whichever trigger rendered last.
    render(
      <>
        <Basic />
        <Basic />
      </>,
    );
    const [a, b] = screen.getAllByRole('button', { name: 'Actions' });
    const nameOf = (el: HTMLElement) => el.style.getPropertyValue('anchor-name');
    expect(nameOf(a!)).not.toBe('');
    expect(nameOf(a!)).not.toBe(nameOf(b!));
  });

  describe('the stylesheet', () => {
    it('paints the overlay surface, not the raised one', () => {
      // In light both are white, so the drawing could not tell them apart. In
      // dark, raised would put the menu on the same step as the card beneath.
      expect(css).toContain('--ap-color-surface-overlay');
      expect(css).not.toContain('--ap-color-surface-raised');
    });

    it('uses the elevation token rather than a literal shadow', () => {
      expect(css).toContain('box-shadow: var(--ap-elevation-md)');
      expect(css).not.toMatch(/box-shadow:[^;]*rgb/);
    });

    it('holds the border width at rest so dark does not resize the menu', () => {
      // The border only takes a colour in dark. Keeping the width on the
      // element at all times is the same trick control.module.css uses.
      expect(css).toMatch(/border:\s*var\(--ap-border-width-hairline\)\s+solid\s+transparent/);
    });

    it('adds the dark border under both dark selectors, not one', () => {
      const media = css.includes("@media (prefers-color-scheme: dark)");
      const attr = css.includes(":root[data-theme='dark']");
      expect(media && attr).toBe(true);
      const borderColour = css.split('border-color: var(--ap-color-border-default)').length - 1;
      expect(borderColour).toBe(2);
    });

    it('keeps a usable degraded path where anchor positioning is missing', () => {
      // The popover still opens, still dismisses, still takes the keyboard —
      // it loses its anchor and gains the UA's centred placement.
      expect(css).toContain('@supports not (anchor-name: --a)');
    });
  });
});
