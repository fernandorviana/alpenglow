/**
 * A stand-in for the modal half of `<dialog>`, because jsdom 30 has
 * `HTMLDialogElement` with only `open`: no `showModal`, no `close`. Its UA
 * sheet still hides a dialog without `[open]`, so a closed dialog is out of the
 * accessibility tree, as in a browser.
 *
 * It covers what `Dialog` calls and nothing more. `showModal` sets `open`;
 * `close` removes it and queues `close` as a task, as the platform does.
 * Esc is not simulated: a test dispatches `cancel` itself. The top layer, the
 * inert page, focus return and the platform's own initial focus are absent on
 * purpose — the Dialog page records the by-hand check of those.
 *
 * Each test file gets its own jsdom, so nothing here leaks into other suites.
 */
export const NATIVE_DIALOG = 'showModal' in HTMLDialogElement.prototype;

export function installDialogStub() {
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
      if (this.open) throw new DOMException('The dialog is already open', 'InvalidStateError');
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
      if (!this.open) return;
      this.removeAttribute('open');
      setTimeout(() => this.dispatchEvent(new Event('close')), 0);
    };
  });
}
