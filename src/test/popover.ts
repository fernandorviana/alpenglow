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
 * The order is the platform's: `beforetoggle` synchronously, then the state
 * change, then `toggle` queued.
 *
 * Esc, light dismiss, focus return and the top layer are absent on purpose.
 * For a `popover="auto"` consumer (DropdownMenu) the first three belong to the
 * browser, and a test of them here would be a test of this stub. A `manual`
 * consumer (DatePicker) implements its own dismissal, which its suite tests
 * through this stub. The top layer, anchor placement and real focus are not
 * covered by any suite, and have not yet been checked by hand.
 *
 * Each test file gets its own jsdom, so nothing here leaks into other suites.
 *
 * Two consumers: `DropdownMenu.test.tsx` and `DatePicker.test.tsx`.
 */
export const NATIVE_POPOVER = 'showPopover' in HTMLElement.prototype;

const shown = new WeakSet<HTMLElement>();
const queued = new WeakMap<HTMLElement, { timer: ReturnType<typeof setTimeout>; oldState: string }>();

function setShown(el: HTMLElement, next: boolean) {
  if (!el.hasAttribute('popover')) throw new DOMException('Not a popover', 'NotSupportedError');
  if (shown.has(el) === next) return;

  el.dispatchEvent(
    Object.assign(new Event('beforetoggle'), {
      oldState: next ? 'closed' : 'open',
      newState: next ? 'open' : 'closed',
    }),
  );

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

export function installPopoverStub() {
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
}
