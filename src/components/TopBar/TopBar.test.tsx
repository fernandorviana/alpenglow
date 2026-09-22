import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { TopBar } from './TopBar';
import styles from './TopBar.module.css';
import { readCss, block } from '../../test/css';
import { axeViolations } from '../../test/axe';

const css = readCss('src/components/TopBar/TopBar.module.css');

describe('TopBar', () => {
  it('is the banner, with the brand at the start, the middle, and the actions at the end', () => {
    render(
      <TopBar brand={<span>Alpenglow</span>} actions={<button type="button">Create</button>}>
        <input aria-label="Search" />
      </TopBar>,
    );
    const bar = screen.getByRole('banner');
    expect(bar).toHaveClass(styles.topbar!);
    expect(screen.getByText('Alpenglow').parentElement).toHaveClass(styles.brand!);
    expect(screen.getByRole('textbox', { name: 'Search' }).parentElement).toHaveClass(styles.middle!);
    expect(screen.getByRole('button', { name: 'Create' }).parentElement).toHaveClass(styles.end!);
  });

  it('draws the menu button only with onMenu, named and saying what it controls', async () => {
    const onMenu = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<TopBar />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    rerender(<TopBar onMenu={onMenu} menuExpanded={false} />);
    const menu = screen.getByRole('button', { name: 'Menu' });
    expect(menu).toHaveAttribute('aria-expanded', 'false');
    await user.click(menu);
    expect(onMenu).toHaveBeenCalledTimes(1);
    rerender(<TopBar onMenu={onMenu} menuLabel="Navegação" />);
    expect(screen.getByRole('button', { name: 'Navegação' })).not.toHaveAttribute('aria-expanded');
  });

  it('has no axe violations', async () => {
    const { container } = render(<TopBar onMenu={() => {}} brand="Alpenglow" actions={<button type="button">Create</button>} />);
    expect(await axeViolations(container)).toEqual([]);
  });

  it('is 64 tall on surface/raised with a hairline under, as drawn', () => {
    const bar = block(css, '.topbar {');
    expect(bar).toContain('min-block-size: var(--ap-spacing-800)');
    expect(bar).toContain('var(--ap-color-surface-raised)');
    expect(bar).toContain('border-block-end: var(--ap-border-width-hairline) solid var(--ap-color-border-subtle)');
  });
});
