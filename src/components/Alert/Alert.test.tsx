import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Alert, alertTones, ALERT_NARROW } from './Alert';
import styles from './Alert.module.css';
import { readCss, block } from '../../test/css';
import { axeViolations } from '../../test/axe';

const alertOf = (container: HTMLElement) => container.querySelector(`.${styles.alert}`) as HTMLElement;

describe('Alert — structure', () => {
  it('is info unless told, and says its tone in words', () => {
    const { container } = render(<Alert>Use Markdown in your messages.</Alert>);
    expect(alertOf(container)).toHaveClass(styles.info!);
    expect(alertOf(container)).toHaveTextContent('Information: Use Markdown in your messages.');
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it.each(alertTones)('takes the %s tone on the painted element', (tone) => {
    const { container } = render(<Alert tone={tone}>Message</Alert>);
    expect(alertOf(container)).toHaveClass(styles.alert!, styles[tone]!);
  });

  it('puts className on the root, which is the container it measures', () => {
    const { container } = render(<Alert className="mine">Message</Alert>);
    expect(container.firstElementChild).toHaveClass(styles.root!, 'mine');
  });

  it('shows a title above the message, and keeps a strong in it', () => {
    render(
      <Alert title="Trial ending">
        Your trial ends in <strong>3 days</strong>.
      </Alert>,
    );
    const title = screen.getByText('Trial ending');
    expect(title).toHaveClass(styles.title!);
    expect(title.compareDocumentPosition(screen.getByText('3 days')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText('3 days').tagName).toBe('STRONG');
  });
});

describe('Alert — announcing', () => {
  it('is not a live region unless asked: it may have been there since the page loaded', () => {
    const { container } = render(<Alert tone="danger">Could not save.</Alert>);
    expect(alertOf(container)).not.toHaveAttribute('role');
  });

  it('interrupts for danger and warning, and waits for the others', () => {
    const roles = alertTones.map((tone) => {
      const { container, unmount } = render(
        <Alert tone={tone} announce>
          Message
        </Alert>,
      );
      const role = alertOf(container).getAttribute('role');
      unmount();
      return [tone, role];
    });
    expect(Object.fromEntries(roles)).toEqual({ info: 'status', success: 'status', warning: 'alert', danger: 'alert' });
  });
});

describe('Alert — the buttons', () => {
  it('has none unless given', () => {
    render(<Alert>Message</Alert>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows the close with onClose, calls it, and does not hide itself', () => {
    const onClose = vi.fn();
    render(<Alert onClose={onClose}>Message</Alert>);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Message')).toBeInTheDocument();
  });

  it('names the close as told', () => {
    render(
      <Alert onClose={() => {}} closeLabel="Fechar">
        Message
      </Alert>,
    );
    expect(screen.getByRole('button', { name: 'Fechar' })).toBeInTheDocument();
  });

  it('runs its action, which comes before the close', () => {
    const onClick = vi.fn();
    render(
      <Alert action={{ label: 'Upgrade', onClick }} onClose={() => {}}>
        Message
      </Alert>,
    );
    const [first, second] = screen.getAllByRole('button');
    expect(first).toHaveAccessibleName('Upgrade');
    expect(second).toHaveAccessibleName('Dismiss');
    fireEvent.click(first!);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('Alert — the stylesheet', () => {
  const css = readCss('src/components/Alert/Alert.module.css');

  it.each(alertTones)('%s is its tinted surface, its text and its soft edge', (tone) => {
    const rule = block(css, `.alert.${tone} {`);
    expect(rule).toContain(`var(--ap-color-surface-${tone}-subtle)`);
    expect(rule).toContain(`var(--ap-color-text-${tone})`);
    expect(rule).toContain(`var(--ap-color-border-${tone}-subtle)`);
  });

  it('outlines the action in the text’s colour: the theme fills two tones of four', () => {
    expect(block(css, '.action {')).toMatch(/border:[^;]*currentColor/);
    expect(css).not.toMatch(/--ap-color-interactive-(success|danger)\b/);
  });

  it('asks its container how wide it is, not the screen', () => {
    expect(block(css, '.root {')).toMatch(/container-type:\s*inline-size/);
    expect(css).toContain(`@container (max-width: ${ALERT_NARROW}px)`);
    // A size container cannot take its width from its content: without this
    // it is 0 wide in a flex row or an auto grid column.
    expect(block(css, '.root {')).toMatch(/width:\s*100%/);
    expect(css).not.toMatch(/@media \((max|min)-width/);
  });

  it('never reaches a classed part by descent', () => {
    const headers = [...css.matchAll(/(^|\})\s*([^{}@]+)\{/g)].flatMap(([, , header]) => header!.split(','));
    expect(headers.map((h) => h.trim()).filter((h) => /\.[\w-]+\s+[>+~]?\s*\./.test(h))).toEqual([]);
  });

  it('drops the wash’s fade under reduced motion', () => {
    expect(block(css, '@media (prefers-reduced-motion: reduce)')).toMatch(/transition:\s*none/);
  });
});

describe('Alert — axe', () => {
  it.each(alertTones)('%s, with a title, an action and a close', async (tone) => {
    const { container } = render(
      <Alert tone={tone} title="Title" action={{ label: 'Retry', onClick: () => {} }} onClose={() => {}} announce>
        Message
      </Alert>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
