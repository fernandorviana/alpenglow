import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EmptyState, emptyStateSizes } from './EmptyState';
import styles from './EmptyState.module.css';
import { readCss, block } from '../../test/css';
import { axeViolations } from '../../test/axe';

const css = readCss('src/components/EmptyState/EmptyState.module.css');

describe('EmptyState — structure', () => {
  it('says what is not here in a heading, at level 3 unless told', () => {
    const { rerender } = render(<EmptyState title="No locations yet" />);
    expect(screen.getByRole('heading', { level: 3, name: 'No locations yet' })).toHaveClass(styles.title!);
    rerender(<EmptyState title="No locations yet" headingLevel={2} />);
    expect(screen.getByRole('heading', { level: 2, name: 'No locations yet' })).toBeInTheDocument();
  });

  it('has a description only when given', () => {
    const { container, rerender } = render(<EmptyState title="No notes yet" />);
    expect(container.querySelector('p')).toBeNull();
    rerender(<EmptyState title="No notes yet" description="Notes are kept here." />);
    expect(screen.getByText('Notes are kept here.')).toHaveClass(styles.description!);
  });

  it('hides the icon, which is decoration', () => {
    render(<EmptyState title="No locations yet" icon={<svg data-testid="icon" />} />);
    expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('icon').parentElement).toHaveClass(styles.icon!);
  });

  it('puts media in the icon’s place, not beside it, and does not hide it: an illustration may have words', () => {
    render(<EmptyState title="No locations yet" icon={<svg data-testid="icon" />} media={<img alt="A map with no pins" src="" />} />);
    expect(screen.queryByTestId('icon')).toBeNull();
    expect(screen.getByRole('img', { name: 'A map with no pins' }).parentElement).toHaveClass(styles.media!);
  });

  it('puts the other way before the action, so the primary is last in reading order', () => {
    const { container } = render(
      <EmptyState title="No clients yet" action={<button>Add client</button>} secondaryAction={<button>Import CSV</button>} />,
    );
    const names = [...container.querySelectorAll(`.${styles.actions} button`)].map((b) => b.textContent);
    expect(names).toEqual(['Import CSV', 'Add client']);
  });

  it('never has the other way alone: the type refuses it', () => {
    // @ts-expect-error — secondaryAction needs an action beside it.
    const props: import('./EmptyState').EmptyStateProps = { title: 'x', secondaryAction: <button>Learn more</button> };
    expect(props).toBeTruthy();
  });

  it('has no actions row when empty is good news', () => {
    const { container } = render(<EmptyState title="No unread messages" />);
    expect(container.querySelector(`.${styles.actions}`)).toBeNull();
  });

  it.each(emptyStateSizes)('takes the %s size, lg unless told', (size) => {
    const { container } = render(<EmptyState title="Empty" size={size} className="mine" />);
    expect(container.firstElementChild).toHaveClass(styles.empty!, styles[size]!, 'mine');
  });

  it('is lg and plain by default, dashed when asked, and bare with nothing before the words', () => {
    const { container, rerender } = render(<EmptyState title="Empty" />);
    const el = () => container.firstElementChild!;
    expect(el()).toHaveClass(styles.lg!, styles.bare!);
    expect(el()).not.toHaveClass(styles.dashed!);
    rerender(<EmptyState title="Empty" variant="dashed" icon={<svg />} />);
    expect(el()).toHaveClass(styles.dashed!);
    expect(el()).not.toHaveClass(styles.bare!);
  });

  it('has no axe violations, either size', async () => {
    const { container } = render(
      <main>
        <h2>Locations</h2>
        <EmptyState title="No locations yet" description="Add the places where you see clients." icon={<svg />} action={<button>Add location</button>} />
        <EmptyState size="sm" variant="dashed" title="No notes yet" action={<button>Add note</button>} />
      </main>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe('EmptyState — stylesheet', () => {
  it('centres the large one and holds its sentence to a measure', () => {
    expect(block(css, '.lg {')).toContain('text-align: center');
    expect(block(css, '.description.description {')).toContain('max-inline-size: 40ch');
  });

  it('starts the small one at the start, and tells its parts what differs without reaching them', () => {
    const sm = block(css, '.sm {');
    expect(sm).toContain('text-align: start');
    expect(sm).toContain('--empty-icon-fill: none');
    expect(css).not.toMatch(/\.(sm|lg)\s*>?\s+\.(icon|title|actions|media|words)/);
  });

  it('fills the circle with the wash, which is right over any surface in both modes', () => {
    expect(block(css, '.icon {')).toContain('var(--empty-icon-fill, var(--ap-color-interactive-wash-pressed))');
    expect(css).not.toContain('--ap-color-surface-');
  });

  it('draws the frame dashed, with a line that is seen', () => {
    expect(block(css, '.dashed {')).toContain('dashed var(--ap-color-border-strong)');
  });

  it('doubles the title and the description against a page’s own rules', () => {
    expect(css).toContain('.title.title {');
    expect(css).toContain('.description.description {');
  });
});
