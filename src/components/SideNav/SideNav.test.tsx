import { render, screen, within, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { SideNav, SIDE_NAV_NARROW } from './SideNav';
import type { SideNavItem } from './SideNav';
import styles from './SideNav.module.css';
import { installDialogStub } from '../../test/dialog';
import { installPopoverStub } from '../../test/popover';
import { readCss, block } from '../../test/css';
import { axeViolations } from '../../test/axe';

installDialogStub();
installPopoverStub();

const css = readCss('src/components/SideNav/SideNav.module.css');
const icon = <svg viewBox="0 0 24 24" />;

const items: SideNavItem[] = [
  { href: '/home', label: 'Home', icon },
  { href: '/calendar', label: 'Calendar', icon, current: true },
  { href: '/clients', label: 'Clients', icon },
];
const footer: SideNavItem[] = [{ href: '/settings', label: 'Settings', icon }];

/** A window that says whether it is narrow. */
function mockMedia(matches: boolean) {
  const listeners = new Set<() => void>();
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  }));
  return listeners;
}

beforeEach(() => {
  mockMedia(false);
});

describe('SideNav — wide', () => {
  it('is a navigation named Main, with a link per item and the current one marked', () => {
    render(<SideNav items={items} />);
    const nav = screen.getByRole('navigation', { name: 'Main' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual(['Home', 'Calendar', 'Clients']);
    expect(screen.getByRole('link', { name: 'Calendar' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });

  it('puts the footer in a list of its own, after the items', () => {
    render(<SideNav items={items} footer={footer} />);
    const lists = screen.getAllByRole('list');
    expect(lists).toHaveLength(2);
    expect(lists[1]).toHaveClass(styles.foot!);
    expect(within(lists[1]!).getByRole('link', { name: 'Settings' })).toBeInTheDocument();
  });

  it('hands the link to the router', () => {
    render(<SideNav items={items} renderLink={(props) => <a {...props} data-router="yes" />} />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('data-router', 'yes');
  });

  it('collapsed, keeps every name in a tooltip and takes the class', () => {
    render(<SideNav items={items} collapsed aria-label="App" />);
    expect(screen.getByRole('navigation', { name: 'App' })).toHaveClass(styles.collapsed!);
    for (const item of items) {
      const link = screen.getByRole('link', { name: item.label });
      const tip = document.getElementById(link.getAttribute('aria-labelledby')!);
      expect(tip, item.label).toHaveTextContent(item.label);
    }
  });

  it('renders no dialog on a wide screen', () => {
    const { container } = render(<SideNav items={items} open onClose={() => {}} />);
    expect(container.querySelector('dialog')).toBeNull();
  });

  it('has no axe violations', async () => {
    const { container } = render(<SideNav items={items} footer={footer} />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe('SideNav — narrow', () => {
  beforeEach(() => {
    mockMedia(true);
  });

  it('stands in a dialog that opens with open and is named as the nav is', () => {
    const { container, rerender } = render(<SideNav items={items} onClose={() => {}} />);
    const dialog = container.querySelector('dialog')!;
    expect(dialog).not.toHaveAttribute('open');
    rerender(<SideNav items={items} open onClose={() => {}} />);
    expect(dialog).toHaveAttribute('open');
    expect(screen.getByRole('dialog', { name: 'Main' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Main' })).toHaveClass(styles.inSheet!);
  });

  it('reports Esc and the close button, and does not close itself', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<SideNav items={items} open onClose={onClose} />);
    const dialog = container.querySelector('dialog')!;
    fireEvent(dialog, new Event('cancel', { cancelable: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(dialog).toHaveAttribute('open');
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('reports a close the platform performs, once', async () => {
    const onClose = vi.fn();
    const { container } = render(<SideNav items={items} open onClose={onClose} />);
    const dialog = container.querySelector('dialog')!;
    await act(async () => {
      dialog.close();
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when open goes false', async () => {
    const { container, rerender } = render(<SideNav items={items} open onClose={() => {}} />);
    const dialog = container.querySelector('dialog')!;
    rerender(<SideNav items={items} open={false} onClose={() => {}} />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(dialog).not.toHaveAttribute('open');
  });

  it('is not collapsed in the drawer, whatever collapsed says', () => {
    render(<SideNav items={items} open collapsed onClose={() => {}} />);
    expect(screen.getByRole('navigation')).not.toHaveClass(styles.collapsed!);
  });

  it('takes the query from the caller', () => {
    const media = window.matchMedia as unknown as ReturnType<typeof vi.fn>;
    render(<SideNav items={items} narrow="(max-width: 1000px)" />);
    expect(media).toHaveBeenCalledWith('(max-width: 1000px)');
    expect(SIDE_NAV_NARROW).toBe('(max-width: 760px)');
  });

  it('has no axe violations open', async () => {
    const { container } = render(<SideNav items={items} open onClose={() => {}} />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe('SideNav — stylesheet', () => {
  it('is 200 wide and 80 collapsed, the label hidden through the custom property', () => {
    expect(block(css, '.sidenav {')).toContain('inline-size: var(--sidenav-width, 200px)');
    const collapsed = block(css, '.collapsed {');
    expect(collapsed).toContain('--sidenav-width: 80px');
    expect(collapsed).toContain('--sidenav-label: none');
    expect(block(css, '.label {')).toContain('display: var(--sidenav-label)');
  });

  it('paints the current item on surface/base in the accent, as drawn', () => {
    const current = block(css, ".item[aria-current='page'] {");
    expect(current).toContain('var(--ap-color-surface-base)');
    expect(current).toContain('var(--ap-color-text-accent)');
  });

  it('sets display on the sheet only while open, and the scrim on its backdrop', () => {
    expect(block(css, '.sheet {')).not.toMatch(/(^|\s)display:/);
    expect(block(css, '.sheet[open] {')).toContain('display: flex');
    expect(block(css, '.sheet::backdrop {')).toContain('var(--ap-color-surface-scrim)');
  });
});
