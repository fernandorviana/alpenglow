import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Breadcrumb } from './Breadcrumb';
import styles from './Breadcrumb.module.css';
import { readCss, block } from '../../test/css';
import { axeViolations } from '../../test/axe';

const css = readCss('src/components/Breadcrumb/Breadcrumb.module.css');

const PATH = [
  { label: 'Clients', href: '/clients' },
  { label: 'Justin Anderson', href: '/clients/justin' },
  { label: 'Appointments', href: '/clients/justin/appointments' },
];
const LONG = [
  { label: 'Settings', href: '/s' },
  { label: 'Calendar', href: '/s/c' },
  { label: 'Reminders', href: '/s/c/r' },
  { label: 'SMS', href: '/s/c/r/sms' },
  { label: 'Template' },
];

describe('Breadcrumb — structure', () => {
  it('is a named nav with an ordered list, one item for each level', () => {
    render(<Breadcrumb items={PATH} />);
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    const list = within(nav).getByRole('list');
    expect(list.tagName).toBe('OL');
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
  });

  it('links every ancestor, and the page is words with aria-current and never a link', () => {
    render(<Breadcrumb items={PATH} />);
    expect(screen.getByRole('link', { name: 'Clients' })).toHaveAttribute('href', '/clients');
    expect(screen.getByRole('link', { name: 'Justin Anderson' })).toHaveAttribute('href', '/clients/justin');
    expect(screen.queryByRole('link', { name: 'Appointments' })).toBeNull();
    const page = screen.getByText('Appointments').closest('[aria-current]')!;
    expect(page).toHaveAttribute('aria-current', 'page');
    expect(page.tagName).toBe('SPAN');
  });

  it('leaves an ancestor with no href as words', () => {
    render(<Breadcrumb items={[{ label: 'Clients' }, { label: 'Justin Anderson' }]} />);
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('Clients').closest(`.${styles.words}`)).not.toBeNull();
  });

  it('makes the first a capsule at rest, and gives only the first the icon, hidden', () => {
    render(<Breadcrumb items={PATH} icon={<svg data-testid="icon" />} />);
    const root = screen.getByRole('link', { name: 'Clients' });
    expect(root).toHaveClass(styles.link!, styles.root!);
    expect(screen.getByRole('link', { name: 'Justin Anderson' })).not.toHaveClass(styles.root!);
    expect(screen.getAllByTestId('icon')).toHaveLength(1);
    expect(root).toContainElement(screen.getByTestId('icon'));
    expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps the icon on a first item that is not a link', () => {
    render(<Breadcrumb items={[{ label: 'Clients' }, { label: 'Justin Anderson' }]} icon={<svg data-testid="icon" />} />);
    expect(screen.getByTestId('icon').closest('li')).toHaveTextContent('Clients');
  });

  it('hides its slashes, one fewer than its items', () => {
    const { container } = render(<Breadcrumb items={PATH} />);
    const slashes = container.querySelectorAll(`.${styles.slash}`);
    expect(slashes).toHaveLength(2);
    slashes.forEach((s) => expect(s).toHaveAttribute('aria-hidden', 'true'));
  });

  it('hands its links to a router', () => {
    render(<Breadcrumb items={PATH} renderLink={(props) => <a data-router="" {...props} />} />);
    const link = screen.getByRole('link', { name: 'Justin Anderson' });
    expect(link).toHaveAttribute('data-router');
    expect(link).toHaveClass(styles.link!);
  });

  it('has no axe violations, folded or not', async () => {
    const { container, rerender } = render(<Breadcrumb items={PATH} icon={<svg />} />);
    expect(await axeViolations(container)).toEqual([]);
    rerender(<Breadcrumb items={LONG} maxItems={3} />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe('Breadcrumb — a long path', () => {
  it('keeps the first and the last, and folds the middle into one button', () => {
    render(<Breadcrumb items={LONG} maxItems={3} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Calendar' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Reminders' })).toBeNull();
    expect(screen.getByRole('link', { name: 'SMS' })).toBeInTheDocument();
    expect(screen.getByText('Template')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show path' })).toBeInTheDocument();
  });

  it('unfolds in place, and gives the focus to the first link it revealed', async () => {
    render(<Breadcrumb items={LONG} maxItems={3} />);
    await userEvent.click(screen.getByRole('button', { name: 'Show path' }));
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(screen.getByRole('link', { name: 'Calendar' })).toHaveFocus();
  });

  it('with no link among what it revealed, goes to the next link, and with none at all to the list', async () => {
    const { unmount } = render(
      <Breadcrumb maxItems={3} items={[LONG[0]!, { label: 'Calendar' }, { label: 'Reminders' }, LONG[3]!, LONG[4]!]} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Show path' }));
    expect(screen.getByRole('link', { name: 'SMS' })).toHaveFocus();
    unmount();
    render(<Breadcrumb maxItems={2} items={LONG.map(({ label }) => ({ label }))} />);
    await userEvent.click(screen.getByRole('button', { name: 'Show path' }));
    expect(screen.getByRole('list')).toHaveFocus();
  });

  it('does not fold a path that fits', () => {
    render(<Breadcrumb items={PATH} maxItems={3} />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('Breadcrumb — stylesheet', () => {
  it('fills the root with the neutral fill, which is a fill in dark too', () => {
    expect(block(css, '.link.root {')).toContain('background-color: var(--ap-color-interactive-neutral)');
    expect(css).not.toContain('--ap-color-surface-');
  });

  it('makes every link a capsule under the pointer with the wash, over the fill or over nothing', () => {
    const hover = block(css, '.link.link:hover, .fold:hover {');
    expect(hover).toContain('var(--ap-color-interactive-wash-hover)');
    expect(hover).toContain('background-image');
  });

  it('doubles the class against a page’s own link rules, and has no underline at rest or under the pointer', () => {
    expect(block(css, '.link.link, .fold {')).toContain('text-decoration: none');
    expect(block(css, '.link.link:hover, .fold:hover {')).toContain('text-decoration: none');
  });

  it('cuts a long name with an ellipsis', () => {
    const label = block(css, '.label {');
    expect(label).toContain('text-overflow: ellipsis');
    expect(label).toContain('max-inline-size: 24ch');
  });

  it('says the page in Semibold and primary', () => {
    const page = block(css, '\n.page {');
    expect(page).toContain('color: var(--ap-color-text-primary)');
    expect(page).toContain('font-weight: var(--ap-font-weight-semibold)');
  });
});
