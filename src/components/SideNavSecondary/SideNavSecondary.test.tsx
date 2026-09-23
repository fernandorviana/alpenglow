import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { SideNavSecondary } from './SideNavSecondary';
import type { SideNavSection } from './SideNavSecondary';
import styles from './SideNavSecondary.module.css';
import { readCss, block } from '../../test/css';
import { axeViolations } from '../../test/axe';

const css = readCss('src/components/SideNavSecondary/SideNavSecondary.module.css');
const icon = <svg viewBox="0 0 24 24" />;

const sections: SideNavSection[] = [
  {
    label: 'Me',
    items: [
      { href: '/profile', label: 'Profile', icon, current: true },
      { href: '/password', label: 'Login & password', icon },
    ],
  },
  { label: 'Account', items: [{ href: '/business', label: 'Business settings', icon }], defaultOpen: false },
];

describe('SideNavSecondary', () => {
  it('is a navigation named Section, each section a details with its caption as the summary', () => {
    const { container } = render(<SideNavSecondary sections={sections} />);
    expect(screen.getByRole('navigation', { name: 'Section' })).toBeInTheDocument();
    const details = container.querySelectorAll('details');
    expect(details).toHaveLength(2);
    expect(details[0]!.querySelector('summary')).toHaveTextContent('Me');
    expect(details[0]).toHaveAttribute('open');
    expect(details[1]).not.toHaveAttribute('open');
  });

  it('marks the current page and hands the link to the router', () => {
    render(<SideNavSecondary sections={sections} renderLink={(props) => <a {...props} data-router="yes" />} />);
    const link = screen.getByRole('link', { name: 'Profile' });
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(link).toHaveAttribute('data-router', 'yes');
  });

  it('has the fold button only with a handler, named for what it will do, and reports the next state', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<SideNavSecondary sections={sections} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    rerender(<SideNavSecondary sections={sections} onCollapsedChange={onChange} />);
    const fold = screen.getByRole('button', { name: 'Collapse navigation' });
    expect(fold).toHaveAttribute('aria-expanded', 'true');
    await user.click(fold);
    expect(onChange).toHaveBeenLastCalledWith(true);
    rerender(<SideNavSecondary sections={sections} collapsed onCollapsedChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Expand navigation' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('navigation')).toHaveClass(styles.collapsed!);
  });

  it('keeps a section the reader folded folded when the current page changes', () => {
    const { container, rerender } = render(<SideNavSecondary sections={sections} />);
    const me = container.querySelector('details')!;
    expect(me).toHaveAttribute('open');
    me.removeAttribute('open');
    const moved = sections.map((s) => ({ ...s, items: s.items.map((i) => ({ ...i, current: i.href === '/password' })) }));
    rerender(<SideNavSecondary sections={moved} />);
    expect(container.querySelector('details')).not.toHaveAttribute('open');
    expect(screen.getByRole('link', { name: 'Login & password' })).toHaveAttribute('aria-current', 'page');
  });

  it('tells two sections with one caption apart', () => {
    const { container } = render(
      <SideNavSecondary sections={[sections[0]!, { ...sections[0]!, items: [{ href: '/x', label: 'X', icon }] }]} />,
    );
    expect(container.querySelectorAll('details')).toHaveLength(2);
  });

  it('takes its labels from the caller', () => {
    render(
      <SideNavSecondary sections={sections} aria-label="Definições" onCollapsedChange={() => {}} collapseLabel="Recolher" />,
    );
    expect(screen.getByRole('navigation', { name: 'Definições' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Recolher' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<SideNavSecondary sections={sections} onCollapsedChange={() => {}} />);
    expect(await axeViolations(container)).toEqual([]);
    expect(within(container).getAllByRole('list')).toHaveLength(2);
  });
});

describe('SideNavSecondary — stylesheet', () => {
  it('is 240 wide and a 24 strip collapsed, the sections hidden through the custom property', () => {
    expect(block(css, '.secondary {')).toContain('inline-size: var(--sidenav-width, 240px)');
    const collapsed = block(css, '.collapsed {');
    expect(collapsed).toContain('--sidenav-width: 24px');
    expect(collapsed).toContain('--sidenav-sections: none');
    expect(block(css, '.section {')).toContain('display: var(--sidenav-sections)');
  });

  it('lifts the current item to surface/raised in the accent, and keeps the caption readable', () => {
    const current = block(css, ".item[aria-current='page'] {");
    expect(current).toContain('var(--ap-color-surface-raised)');
    expect(current).toContain('var(--ap-color-text-accent)');
    expect(block(css, '.caption {')).toContain('var(--ap-color-text-tertiary)');
    expect(css).not.toContain('text-disabled');
  });

  it('takes its item height from density, the padding what is left of it', () => {
    const item = block(css, '.item {');
    expect(item).toContain('min-block-size: var(--ap-density-nav-item);');
    expect(item).toContain('padding-block: calc((var(--ap-density-nav-item) - var(--ap-text-body-md-line-height)) / 2);');
  });
});
