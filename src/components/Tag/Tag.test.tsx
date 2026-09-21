import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Tag, tagSizes } from './Tag';
import styles from './Tag.module.css';
import { readCss, block } from '../../test/css';
import { axeViolations } from '../../test/axe';

const css = readCss('src/components/Tag/Tag.module.css');

describe('Tag — structure', () => {
  it('is words in a capsule, 32 unless told, with a className beside its own', () => {
    const { container } = render(<Tag className="mine">Follow-up</Tag>);
    const tag = container.firstElementChild!;
    expect(tag.tagName).toBe('SPAN');
    expect(tag).toHaveClass(styles.tag!, styles.md!, 'mine');
    expect(tag).toHaveTextContent('Follow-up');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it.each(tagSizes)('takes the %s size', (size) => {
    const { container } = render(<Tag size={size}>Label</Tag>);
    expect(container.firstElementChild).toHaveClass(styles[size]!);
  });

  it('puts what stands before the words out of the name, and says so to the stylesheet', () => {
    const { container } = render(<Tag start={<i data-testid="avatar" />}>Laura Lee</Tag>);
    expect(screen.getByTestId('avatar').parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(container.firstElementChild).toHaveClass(styles.withStart!);
  });

  it('passes what a span takes', () => {
    render(
      <Tag id="team-laura" data-person="laura">
        Laura Lee
      </Tag>,
    );
    expect(document.getElementById('team-laura')).toHaveAttribute('data-person', 'laura');
  });
});

describe('Tag — taking it away', () => {
  it('has a button named after its words, which tells the caller', async () => {
    const onRemove = vi.fn();
    render(<Tag onRemove={onRemove}>Anthony Jackson</Tag>);
    const button = screen.getByRole('button', { name: 'Remove Anthony Jackson' });
    expect(button).toHaveAttribute('type', 'button');
    await userEvent.click(button);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('is reached by Tab and pressed with the keyboard', async () => {
    const onRemove = vi.fn();
    render(<Tag onRemove={onRemove}>Anthony Jackson</Tag>);
    await userEvent.tab();
    expect(screen.getByRole('button')).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('takes the caller’s name for the button, and says only "Remove" when its words are not a string', () => {
    const { rerender } = render(
      <Tag onRemove={() => {}} removeLabel="Retirar Laura Lee">
        Laura Lee
      </Tag>,
    );
    expect(screen.getByRole('button', { name: 'Retirar Laura Lee' })).toBeInTheDocument();
    rerender(
      <Tag onRemove={() => {}}>
        <strong>Laura</strong> Lee
      </Tag>,
    );
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
  });

  it('lets a field that holds it take the button out of the tab order and keep the focus', async () => {
    const onMouseDown = vi.fn((event: React.MouseEvent) => event.preventDefault());
    render(
      <>
        <input aria-label="Field" />
        <Tag onRemove={() => {}} removeProps={{ tabIndex: -1, onMouseDown }}>
          Laura Lee
        </Tag>
      </>,
    );
    screen.getByRole('textbox').focus();
    await userEvent.click(screen.getByRole('button'));
    expect(onMouseDown).toHaveBeenCalled();
    expect(screen.getByRole('textbox')).toHaveFocus();
    expect(screen.getByRole('button')).toHaveAttribute('tabindex', '-1');
  });

  it('has no button while it is disabled, and says so with its colour', () => {
    const { container } = render(
      <Tag disabled onRemove={() => {}}>
        Laura Lee
      </Tag>,
    );
    expect(screen.queryByRole('button')).toBeNull();
    expect(container.firstElementChild).toHaveClass(styles.disabled!);
  });

  it('gives the small tag’s button its own class, not a descent from the tag', () => {
    render(
      <Tag size="sm" onRemove={() => {}}>
        Laura Lee
      </Tag>,
    );
    expect(screen.getByRole('button')).toHaveClass(styles.remove!, styles.removeSm!);
  });
});

describe('Tag — stylesheet', () => {
  it('is a capsule on the sunken surface, unless a field hands it another fill', () => {
    const tag = block(css, '\n.tag {');
    expect(tag).toContain('border-radius: var(--ap-radius-full)');
    expect(tag).toContain('background: var(--tag-fill, var(--ap-color-surface-sunken))');
  });

  it('keeps an edge where forced colours take the fill away, and does not grow for it', () => {
    expect(block(css, '\n.tag {')).toContain('border: var(--ap-border-width-hairline) solid transparent');
    expect(block(css, '\n.start {')).toContain('margin-block: calc(var(--ap-border-width-hairline) * -1)');
  });

  it('is 32 and 24, with a button of 24 and 20', () => {
    expect(block(css, '\n.md {')).toContain('min-height: var(--ap-spacing-400)');
    expect(block(css, '\n.sm {')).toContain('min-height: var(--ap-spacing-300)');
    expect(block(css, '\n.remove {')).toContain('width: var(--ap-spacing-300)');
    expect(block(css, '.remove.removeSm {')).toContain('width: var(--ap-spacing-250)');
  });

  it('has the wash under the pointer and the system’s ring, and no tone', () => {
    expect(block(css, '.remove:hover {')).toContain('var(--ap-color-interactive-wash-hover)');
    expect(block(css, '.remove:focus-visible {')).toContain('var(--ap-color-border-focus)');
    expect(css).not.toMatch(/-(success|danger|warning|info|accent)-subtle/);
  });
});

describe('Tag — axe', () => {
  it('has no violations in a list, with and without a button', async () => {
    const { container } = render(
      <main>
        <ul aria-label="My team">
          <li>
            <Tag onRemove={() => {}}>Anthony Jackson</Tag>
          </li>
          <li>
            <Tag size="sm">Pediatrics</Tag>
          </li>
        </ul>
      </main>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
