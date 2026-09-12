import { createRef } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { block, readCss } from '@/test/css';
import { Dialog, type DialogProps } from './Dialog';
import styles from './Dialog.module.css';
import { NATIVE_DIALOG, installDialogStub } from '../../test/dialog';
import { axeViolations } from '../../test/axe';

installDialogStub();

function setup(props: Partial<DialogProps> = {}) {
  const onClose = vi.fn();
  const all: DialogProps = { open: true, onClose, title: 'Add staff member', children: <p>Body</p>, ...props };
  const utils = render(<Dialog {...all} />);
  const rerender = (next: Partial<DialogProps>) => utils.rerender(<Dialog {...all} {...next} />);
  return { ...utils, onClose, rerender };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('Dialog', () => {
  it('stubs showModal only because jsdom lacks it', () => {
    // When jsdom ships the modal API, delete src/test/dialog.ts: it would be
    // overriding the real implementation.
    expect(NATIVE_DIALOG).toBe(false);
  });

  it('is named by its title', () => {
    setup();
    expect(screen.getByRole('dialog', { name: 'Add staff member' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Add staff member' })).toBeInTheDocument();
  });

  it('opens and closes with open', () => {
    const { rerender } = setup({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    rerender({ open: true });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    rerender({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('turns Esc into onClose and leaves the decision to the caller', () => {
    // The caller holding unsaved input can refuse; the dialog stays open until
    // `open` changes.
    const { onClose } = setup();
    const dialog = screen.getByRole('dialog');
    const notPrevented = fireEvent(dialog, new Event('cancel', { cancelable: true }));
    expect(notPrevented).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(dialog).toHaveAttribute('open');
  });

  it('reports a close the platform performs on its own', async () => {
    // Chrome closes on a second Esc without user activation and fires no
    // cancel. The caller's state must not go on saying open.
    const { onClose } = setup();
    (screen.getByRole('dialog') as HTMLDialogElement).close();
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('does not report a close the caller asked for', async () => {
    const { onClose, rerender } = setup();
    rerender({ open: false });
    await tick();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes from the close button', async () => {
    const { onClose } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows a back button only for a flow that has a previous step', async () => {
    const { rerender } = setup();
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
    const onBack = vi.fn();
    rerender({ onBack });
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('keeps focus inside when the back button it was on goes away', () => {
    // The first step of a flow has no back button, so pressing Back removes
    // the button under focus. Found in Chrome: the platform drops focus to the
    // body, outside the modal, with nowhere for a keyboard user to go on from.
    const { rerender } = setup({ onBack: () => {} });
    screen.getByRole('button', { name: 'Back' }).focus();
    rerender({ onBack: undefined });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close' }));
  });

  it('does not close on a click on the backdrop', async () => {
    // A click on the ::backdrop targets the dialog element itself. A stray
    // click beside a form must not throw away what was typed.
    const { onClose } = setup();
    await userEvent.click(screen.getByRole('dialog'));
    await tick();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('has a footer only when there are actions', () => {
    const { rerender } = setup();
    expect(screen.getByRole('dialog').querySelector(`.${styles.footer}`)).toBeNull();
    rerender({ actions: <button type="button">Save</button> });
    const footer = screen.getByRole('dialog').querySelector(`.${styles.footer}`);
    expect(footer).toContainElement(screen.getByRole('button', { name: 'Save' }));
  });

  it('moves focus to initialFocus once it is open', () => {
    // React's client renderer does not write `autofocus`, so showModal()
    // cannot find an autoFocus field; the dialog focuses the ref instead.
    const field = createRef<HTMLInputElement>();
    const { rerender } = setup({
      open: false,
      initialFocus: field,
      children: <input ref={field} aria-label="Full name" />,
    });
    expect(document.activeElement).not.toBe(field.current);
    rerender({ open: true });
    expect(document.activeElement).toBe(field.current);
  });

  it('is md unless told otherwise', () => {
    const { rerender } = setup();
    expect(screen.getByRole('dialog')).toHaveClass(styles.md!);
    rerender({ size: 'xs' });
    expect(screen.getByRole('dialog')).toHaveClass(styles.xs!);
  });

  it('has no WCAG A or AA violation open, with a back button and actions', async () => {
    const { container } = setup({
      onBack: () => {},
      actions: (
        <>
          <button type="button">Cancel</button>
          <button type="button">Save</button>
        </>
      ),
    });
    expect(await axeViolations(container)).toEqual([]);
  });

  describe('the stylesheet', () => {
    const css = readCss('src/components/Dialog/Dialog.module.css');

    it('is as wide as drawn at each size', () => {
      // A class assertion cannot prove a rule exists: in tests the CSS-module
      // map returns a name for any key.
      for (const [size, px] of [['xs', 320], ['sm', 480], ['md', 640], ['lg', 960]] as const) {
        expect(block(css, `\n.${size} {`), size).toMatch(new RegExp(`width:\\s*${px}px`));
      }
    });

    it('never displays a closed dialog', () => {
      // `display` on `.dialog` alone would beat the UA sheet's
      // `dialog:not([open]) { display: none }` and paint a closed dialog.
      expect(block(css, '\n.dialog {')).not.toMatch(/display:/);
      expect(block(css, '\n.dialog[open] {')).toMatch(/display:\s*flex/);
    });

    it('paints the backdrop with the scrim token', () => {
      expect(block(css, '\n.dialog::backdrop {')).toMatch(/var\(--ap-color-surface-scrim\)/);
    });

    it('lets the title wrap rather than truncate', () => {
      // At xs the header leaves the title about 144px. Truncated, the
      // question a confirmation asks was cut at "Cancel th…", and there is
      // no way to reach the rest of a dialog's title.
      const title = css.match(/\n\.dialog \.title\s*\{([^}]*)\}/)![1]!;
      expect(title).not.toMatch(/white-space:\s*nowrap/);
      expect(title).not.toMatch(/text-overflow/);
      expect(title).toMatch(/text-wrap:\s*balance/);
    });

    it('gives the title two classes, so a page prose h2 rule cannot restyle it', () => {
      expect(css).toMatch(/\n\.dialog \.title\s*\{/);
    });
  });
});
