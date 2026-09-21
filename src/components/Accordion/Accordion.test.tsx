import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Accordion, AccordionItem } from './Accordion';
import type { AccordionItemProps, AccordionProps } from './Accordion';
import styles from './Accordion.module.css';
import { readCss, block } from '../../test/css';
import { axeViolations } from '../../test/axe';

const css = readCss('src/components/Accordion/Accordion.module.css');

function Sections({ diagnosis, ...props }: Partial<AccordionProps> & { diagnosis?: Partial<AccordionItemProps> }) {
  return (
    <Accordion {...props}>
      <AccordionItem title="Forms" count={2}>
        Intake form
      </AccordionItem>
      <AccordionItem title="Diagnosis" {...diagnosis}>
        J45.909
      </AccordionItem>
    </Accordion>
  );
}

const details = (name: string) => screen.getByRole('heading', { name }).closest('details')!;
/** jsdom toggles `open` on a summary's click and fires no `toggle`; the platform fires it as a task. */
const press = (name: string) => {
  const el = details(name);
  el.open = !el.open;
  fireEvent(el, new Event('toggle'));
};

describe('Accordion — structure', () => {
  it('is details and summary, the title a heading at level 3 unless told', () => {
    const { rerender } = render(<Sections />);
    const heading = screen.getByRole('heading', { level: 3, name: 'Forms' });
    expect(heading.parentElement!.tagName).toBe('SUMMARY');
    expect(heading).toHaveClass(styles.title!);
    expect(details('Forms')).toHaveClass(styles.details!);
    rerender(<Sections headingLevel={4} />);
    expect(screen.getByRole('heading', { level: 4, name: 'Forms' })).toBeInTheDocument();
  });

  it('lets several be open, and shares no name', () => {
    render(<Sections />);
    expect(details('Forms')).not.toHaveAttribute('name');
    press('Forms');
    press('Diagnosis');
    expect(details('Forms').open).toBe(true);
    expect(details('Diagnosis').open).toBe(true);
  });

  it('exclusive, the items share one name, which is the platform’s way to close the others', () => {
    render(<Sections exclusive />);
    const name = details('Forms').getAttribute('name');
    expect(name).toBeTruthy();
    expect(details('Diagnosis')).toHaveAttribute('name', name);
  });

  it('shows the count and the meta in the summary, after the title', () => {
    render(<Sections diagnosis={{ meta: <span>Unpaid</span> }} />);
    const summary = details('Forms').querySelector('summary')!;
    expect(summary.querySelector(`.${styles.count}`)).toHaveTextContent('2');
    expect(details('Diagnosis').querySelector('summary')).toHaveTextContent('Unpaid');
    expect(details('Diagnosis').querySelector(`.${styles.count}`)).toBeNull();
  });

  it('keeps the action outside the summary and the details, and keeps its room clear', () => {
    render(<Sections diagnosis={{ action: <button>Add diagnosis</button> }} />);
    const action = screen.getByRole('button', { name: 'Add diagnosis' });
    expect(action.closest('summary')).toBeNull();
    expect(action.closest('details')).toBeNull();
    expect(action.parentElement).toHaveClass(styles.action!);
    expect(details('Diagnosis').querySelector('summary')).toHaveClass(styles.withAction!);
    expect(details('Forms').querySelector('summary')).not.toHaveClass(styles.withAction!);
  });

  it('has no axe violations', async () => {
    const { container } = render(<Sections exclusive diagnosis={{ defaultOpen: true, action: <button>Add diagnosis</button> }} />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe('Accordion — open', () => {
  it('opens by default when asked, and says nothing of it', () => {
    const onOpenChange = vi.fn();
    render(<Sections diagnosis={{ defaultOpen: true, onOpenChange }} />);
    expect(details('Diagnosis').open).toBe(true);
    // The platform fires `toggle` for an item that mounts open.
    fireEvent(details('Diagnosis'), new Event('toggle'));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('reads defaultOpen once, so a reader’s choice outlives a default that flips', () => {
    const { rerender } = render(<Sections diagnosis={{ defaultOpen: true }} />);
    press('Diagnosis');
    expect(details('Diagnosis').open).toBe(false);
    rerender(<Sections diagnosis={{ defaultOpen: false }} />);
    rerender(<Sections diagnosis={{ defaultOpen: true }} />);
    expect(details('Diagnosis').open).toBe(false);
  });

  it('tells the caller of a change', () => {
    const onOpenChange = vi.fn();
    render(<Sections diagnosis={{ onOpenChange }} />);
    press('Diagnosis');
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    press('Diagnosis');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(onOpenChange).toHaveBeenCalledTimes(2);
  });

  it('controlled, follows the prop', () => {
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Show</button>
          <Sections diagnosis={{ open, onOpenChange: setOpen }} />
        </>
      );
    }
    render(<Controlled />);
    fireEvent.click(screen.getByRole('button', { name: 'Show' }));
    expect(details('Diagnosis').open).toBe(true);
    press('Diagnosis');
    expect(details('Diagnosis').open).toBe(false);
  });

  it('controlled by a caller who says no, is put back', () => {
    const onOpenChange = vi.fn();
    render(<Sections diagnosis={{ open: false, onOpenChange }} />);
    press('Diagnosis');
    expect(onOpenChange).toHaveBeenCalledWith(true);
    // Nothing re-rendered; the next render is what puts it back.
    expect(details('Diagnosis').open).toBe(true);
  });
});

describe('Accordion — stylesheet', () => {
  it('draws its own marker', () => {
    expect(block(css, '.summary {')).toContain('list-style: none');
    expect(block(css, '.summary::-webkit-details-marker {')).toContain('display: none');
  });

  it('is the drawn row: 64, a hairline under every item', () => {
    expect(block(css, '.summary {')).toContain('min-block-size: 64px');
    expect(block(css, '.item {')).toContain('border-block-end: var(--ap-border-width-hairline) solid var(--ap-color-border-subtle)');
  });

  it('tells the chevron its turn and does not reach it by descent', () => {
    // Closed says so too: a custom property inherits into a nested accordion.
    expect(block(css, '.details {')).toContain('--accordion-turn: 0deg');
    expect(block(css, '.details[open] {')).toContain('--accordion-turn: 90deg');
    expect(block(css, '.details[open]:dir(rtl) {')).toContain('--accordion-turn: -90deg');
    expect(block(css, '.chevron {')).toContain('rotate: var(--accordion-turn, 0deg)');
    expect(css).not.toMatch(/\[open\][^{,]*\s\.(chevron|content|title)/);
  });

  it('keeps the action’s room as a property a wider action can set', () => {
    expect(block(css, '.withAction {')).toContain('var(--accordion-action-room, var(--ap-spacing-800))');
  });

  it('rings the summary inside its own box, so the ring is not cut by a scrolling parent', () => {
    expect(block(css, '.summary:focus-visible {')).toContain('outline-offset: calc(-1 * var(--ap-border-width-ring))');
  });

  it('animates the opening only where the platform can, and only when motion is welcome', () => {
    const motion = block(css, '@media (prefers-reduced-motion: no-preference) {');
    expect(motion).toContain('@supports (interpolate-size: allow-keywords)');
    expect(motion).toContain('::details-content');
    expect(css.replace(motion, '')).not.toContain('::details-content');
  });
});
