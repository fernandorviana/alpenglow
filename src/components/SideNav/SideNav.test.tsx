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

  it('collapsed, puts each tooltip in an entry that centres it, so the wrapper is the item’s size', () => {
    // The Tooltip's wrapper is inline-flex, the trigger's own box: at the
    // start of a plain li it held the item to its 24 icon, a sliver at the
    // rail's start edge. The entry centres it, and the tooltip opens 8 from
    // the circle rather than from a wrapper as wide as the rail.
    render(<SideNav items={items} footer={footer} collapsed />);
    for (const link of screen.getAllByRole('link')) {
      const entry = link.closest('li')!;
      expect(entry, link.textContent!).toHaveClass(styles.entry!);
      expect(link.parentElement, link.textContent!).not.toBe(entry);
      expect(link.parentElement!.parentElement, link.textContent!).toBe(entry);
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
    expect(SIDE_NAV_NARROW).toBe('(width < 48rem)');
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

  it('takes its item height from density, the padding what is left of it', () => {
    const item = block(css, '.item {');
    expect(item).toContain('min-block-size: var(--ap-density-nav-item);');
    expect(item).toContain('padding-block: calc((var(--ap-density-nav-item) - var(--ap-spacing-300)) / 2);');
  });

  it('collapsed, draws each item as a circle at the item’s height, centred in the rail', () => {
    // Figma 157:9589 draws a 48 circle; the item's height is the density
    // token, 40 comfortable and 32 compact, until the token moves to 48.
    const collapsed = block(css, '.collapsed {');
    expect(collapsed).toContain('--sidenav-item-width: var(--ap-density-nav-item);');
    expect(collapsed).toContain('--sidenav-align: center;');
    const root = block(css, '.sidenav {');
    expect(root).toContain('--sidenav-item-width: auto;');
    expect(root).toContain('--sidenav-align: stretch;');
    const item = block(css, '.item {');
    expect(item).toContain('inline-size: var(--sidenav-item-width);');
    expect(item).toContain('border-radius: var(--ap-radius-full);');
    expect(item).toContain('justify-content: var(--sidenav-justify);');
    const entry = block(css, '.entry {');
    expect(entry).toContain('display: flex;');
    expect(entry).toContain('flex-direction: column;');
    expect(entry).toContain('align-items: var(--sidenav-align);');
  });

  it('in the sheet, takes the height left under the close button and scrolls inside it', () => {
    // .sidenav's min-block-size: 100% is the rail's, the page's height. In the
    // sheet it is the dialog's, under a 48 close button: at 375×812 the
    // content was 840 and Settings, at the foot, ended 16 past the edge.
    const sheet = block(css, '\n.inSheet {');
    expect(sheet).toContain('min-block-size: 0;');
    expect(sheet).toContain('overflow-y: auto;');
    expect(sheet).toMatch(/flex: 1 1 auto;/);
  });

  it('sets display on the sheet only while open, and the scrim on its backdrop', () => {
    expect(block(css, '.sheet {')).not.toMatch(/(^|\s)display:/);
    expect(block(css, '.sheet[open] {')).toContain('display: flex');
    expect(block(css, '.sheet::backdrop {')).toContain('var(--ap-color-surface-scrim)');
  });
});
