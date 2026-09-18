import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Tabs, tabsVariants, type TabItem } from './Tabs';
import styles from './Tabs.module.css';
import { readCss, block } from '../../test/css';
import { axeViolations } from '../../test/axe';

const ITEMS: readonly TabItem[] = [
  { id: 'details', label: 'Details', content: <p>About the appointment</p> },
  { id: 'people', label: 'Participants', count: 12, content: <p>Who is coming</p> },
  { id: 'chat', label: 'Chat', content: <p>Messages</p> },
];

const tab = (name: RegExp | string) => screen.getByRole('tab', { name });

describe('Tabs — structure', () => {
  it('is a named tablist of tabs, with the first one selected', () => {
    render(<Tabs label="Appointment" items={ITEMS} />);
    const list = screen.getByRole('tablist', { name: 'Appointment' });
    expect(within(list).getAllByRole('tab')).toHaveLength(3);
    expect(tab('Details')).toHaveAttribute('aria-selected', 'true');
    expect(tab('Chat')).toHaveAttribute('aria-selected', 'false');
  });

  it('ties the selected tab and its panel to each other', () => {
    render(<Tabs label="Appointment" items={ITEMS} />);
    const panel = screen.getByRole('tabpanel');
    expect(tab('Details')).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAttribute('aria-labelledby', tab('Details').id);
    expect(panel).toHaveTextContent('About the appointment');
  });

  it('points no tab at a panel that is not in the document', () => {
    // axe calls a dangling idref "needs review", not a violation, so it is
    // held here. APG writes aria-controls on every tab because every panel is
    // in its page; here only the selected one is.
    render(<Tabs label="Appointment" items={ITEMS} />);
    expect(tab('Chat')).not.toHaveAttribute('aria-controls');
  });

  it('makes ids that survive any id the caller gives', () => {
    // aria-controls is a space-separated list: built from "past visits" it
    // would point at two elements, neither of which exists.
    render(<Tabs label="A" items={[{ id: 'past visits', label: 'Past visits', content: <p>None</p> }]} />);
    const panel = screen.getByRole('tabpanel');
    expect(panel.id).not.toMatch(/\s/);
    expect(tab('Past visits')).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAccessibleName('Past visits');
  });

  it('has one tab stop, the selected tab, and a panel that can be reached', () => {
    render(<Tabs label="Appointment" items={ITEMS} defaultValue="people" />);
    expect(screen.getAllByRole('tab').map((t) => t.tabIndex)).toEqual([-1, 0, -1]);
    // A panel of plain text has nothing to tab to; without this, Tab would
    // jump from the list past the content it just revealed.
    expect(screen.getByRole('tabpanel').tabIndex).toBe(0);
  });

  it('reads the count as part of the tab’s name', () => {
    render(<Tabs label="Appointment" items={ITEMS} />);
    expect(tab('Participants 12')).toBeInTheDocument();
  });

  it('falls back to the first tab that can be selected', () => {
    const items: TabItem[] = [{ ...ITEMS[0]!, disabled: true }, ITEMS[1]!, ITEMS[2]!];
    const { rerender } = render(<Tabs label="Appointment" items={items} value="nowhere" />);
    expect(tab(/Participants/)).toHaveAttribute('aria-selected', 'true');
    // A disabled tab cannot be the one showing, even when asked for by name.
    rerender(<Tabs label="Appointment" items={items} value="details" />);
    expect(tab(/Participants/)).toHaveAttribute('aria-selected', 'true');
  });

  it('applies the variant, underline unless told otherwise, and merges className on the root', () => {
    const { container, rerender } = render(<Tabs label="A" items={ITEMS} className="mine" />);
    expect(container.firstElementChild).toHaveClass(styles.root!, styles.underline!, 'mine');
    for (const variant of tabsVariants) {
      rerender(<Tabs label="A" items={ITEMS} variant={variant} />);
      expect(container.firstElementChild).toHaveClass(styles[variant]!);
    }
  });

  it('tells the segmented thumb where to be, and draws none elsewhere', () => {
    const { container, rerender } = render(<Tabs label="A" items={ITEMS} variant="segmented" defaultValue="chat" />);
    const list = screen.getByRole('tablist');
    expect(list.style.getPropertyValue('--tabs-index')).toBe('2');
    expect(list.style.getPropertyValue('--tabs-count')).toBe('3');
    expect(container.querySelector(`.${styles.thumb}`)).toHaveAttribute('aria-hidden', 'true');
    rerender(<Tabs label="A" items={ITEMS} variant="pill" />);
    expect(container.querySelector(`.${styles.thumb}`)).toBeNull();
  });
});

describe('Tabs — selecting', () => {
  it('selects on click and says so once', () => {
    const onChange = vi.fn();
    render(<Tabs label="A" items={ITEMS} onChange={onChange} />);
    fireEvent.click(tab('Chat'));
    expect(tab('Chat')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Messages');
    expect(onChange).toHaveBeenCalledExactlyOnceWith('chat');
  });

  it('says nothing when the tab already showing is chosen again', () => {
    const onChange = vi.fn();
    render(<Tabs label="A" items={ITEMS} onChange={onChange} />);
    fireEvent.click(tab('Details'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows what the caller says when controlled, and only asks', () => {
    const onChange = vi.fn();
    render(<Tabs label="A" items={ITEMS} value="details" onChange={onChange} />);
    fireEvent.click(tab('Chat'));
    expect(onChange).toHaveBeenCalledWith('chat');
    expect(tab('Details')).toHaveAttribute('aria-selected', 'true');
  });

  it('keeps a disabled tab in the tree and out of reach', () => {
    // aria-disabled, not disabled: the tab stays in the accessibility tree,
    // where a reader can learn that it exists and cannot be used yet.
    const onChange = vi.fn();
    const items: TabItem[] = [ITEMS[0]!, { ...ITEMS[1]!, disabled: true }, ITEMS[2]!];
    render(<Tabs label="A" items={items} onChange={onChange} />);
    expect(tab(/Participants/)).toHaveAttribute('aria-disabled', 'true');
    expect(tab(/Participants/)).not.toBeDisabled();
    fireEvent.click(tab(/Participants/));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Tabs — keyboard', () => {
  it('moves focus and selects with the arrows, by default', () => {
    render(<Tabs label="A" items={ITEMS} />);
    tab('Details').focus();
    fireEvent.keyDown(tab('Details'), { key: 'ArrowRight' });
    expect(tab(/Participants/)).toHaveFocus();
    expect(tab(/Participants/)).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(tab(/Participants/), { key: 'End' });
    expect(tab('Chat')).toHaveFocus();
    fireEvent.keyDown(tab('Chat'), { key: 'ArrowRight' });
    expect(tab('Details')).toHaveFocus();
  });

  it('moves focus only when activation is manual, and selects on the button’s own click', () => {
    // Enter and Space reach a button as a click; nothing here listens for them.
    render(<Tabs label="A" items={ITEMS} activation="manual" />);
    tab('Details').focus();
    fireEvent.keyDown(tab('Details'), { key: 'ArrowRight' });
    expect(tab(/Participants/)).toHaveFocus();
    expect(tab('Details')).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(tab(/Participants/));
    expect(tab(/Participants/)).toHaveAttribute('aria-selected', 'true');
  });

  it('reverses the arrows under dir="rtl"', () => {
    render(
      <div dir="rtl">
        <Tabs label="A" items={ITEMS} />
      </div>,
    );
    tab('Details').focus();
    fireEvent.keyDown(tab('Details'), { key: 'ArrowLeft' });
    expect(tab(/Participants/)).toHaveFocus();
  });

  it('leaves an arrow with a modifier to the browser', () => {
    // Alt+Left is Back on Windows and Linux. Claiming it would strand a reader
    // on the page with a tab changed instead.
    render(<Tabs label="A" items={ITEMS} defaultValue="people" />);
    tab(/Participants/).focus();
    for (const modifier of ['altKey', 'ctrlKey', 'metaKey'] as const) {
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', [modifier]: true, bubbles: true, cancelable: true });
      tab(/Participants/).dispatchEvent(event);
      expect(event.defaultPrevented, modifier).toBe(false);
    }
    expect(tab(/Participants/)).toHaveAttribute('aria-selected', 'true');
  });

  it('leaves the keys that are not its own to the page', () => {
    render(<Tabs label="A" items={ITEMS} />);
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
    tab('Details').dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });
});

describe('Tabs — panels', () => {
  it('mounts only the panel that is showing', () => {
    render(<Tabs label="A" items={ITEMS} />);
    expect(screen.getAllByRole('tabpanel', { hidden: true })).toHaveLength(1);
    expect(screen.queryByText('Messages')).toBeNull();
  });

  it('keeps every panel mounted when asked, and hides the rest', () => {
    render(<Tabs label="A" items={ITEMS} keepMounted />);
    const panels = screen.getAllByRole('tabpanel', { hidden: true });
    expect(panels).toHaveLength(3);
    expect(panels.filter((p) => !p.hidden)).toHaveLength(1);
    expect(tab('Chat')).toHaveAttribute('aria-controls', panels[2]!.id);
  });
});

describe('Tabs — stylesheet', () => {
  const css = readCss('src/components/Tabs/Tabs.module.css');

  it('lets a long list scroll instead of widening its parent', () => {
    // As a flex item the root's minimum width is its content. Without this
    // the list measured 731 in a 320 viewport and never scrolled.
    expect(block(css, '.root {')).toMatch(/min-width:\s*0/);
    expect(block(css, '.list.underline')).toMatch(/overflow-x:\s*auto/);
  });

  it('never reaches a tab through a descendant selector from the variant', () => {
    // `.segmented .tab` also matches the tabs of a Tabs nested in a panel, and
    // the inner one takes the outer one's look. Seen in the browser on the
    // docs page's own specimen; jsdom computes no styles and could not.
    // `.count` is exempt: it lives inside a tab's button, where no Tabs can be.
    expect(css).not.toMatch(/\.(?:underline|segmented|pill)\s+\.(?:bar|list|tab|ghost|thumb)\b/);
    expect(css).not.toMatch(/\)\s+\.ghost\b/);
  });

  it('puts the variant on every element it styles', () => {
    render(<Tabs label="A" items={ITEMS} variant="pill" />);
    expect(screen.getByRole('tablist')).toHaveClass(styles.list!, styles.pill!);
    expect(screen.getAllByRole('tab')[0]).toHaveClass(styles.tab!, styles.pill!);
  });

  it('paints the underline tab’s hover on the ghost inside it, not on the tab', () => {
    // Fernando, 2026-09-18: a rounded ghost, not the whole box — so the wash
    // never touches the list's rule or the active bar.
    expect(block(css, '.tab.underline:hover:not([aria-disabled=\'true\']) > .ghost')).toContain('--ap-color-interactive-wash-hover');
    // And no rule paints the hovered tab itself.
    const hovered = [...css.matchAll(/(\.tab\.underline:hover[^{]*)\{/g)].map(([, header]) => header!.trim());
    expect(hovered.length).toBeGreaterThan(0);
    expect(hovered.filter((header) => !header.endsWith('.ghost'))).toEqual([]);
  });

  it('draws the underline tab’s focus ring around the ghost, clear of the bar', () => {
    expect(block(css, '.tab.underline:focus-visible > .ghost')).toContain('--ap-color-border-focus');
    expect(block(css, '.tab.underline:focus-visible {')).toMatch(/outline:\s*none/);
  });

  it('slides the thumb in the travel duration and lets it jump under reduced motion', () => {
    expect(block(css, '.thumb {')).toMatch(/transition:\s*transform var\(--ap-motion-duration-travel\)/);
    const reduced = block(css, '@media (prefers-reduced-motion: reduce)');
    expect(block(reduced, '.thumb')).toMatch(/transition:\s*none/);
  });

  it('gives the unselected pill its dark border in both halves of the dark rule', () => {
    // The generated token file's shape (invariant 9): the media query for a
    // reader with no stored choice, the attribute for one who chose.
    const media = block(css, '@media (prefers-color-scheme: dark)');
    expect(block(media, ":root:not([data-theme='light']) .tab.pill")).toContain('--ap-color-border-default');
    expect(block(css, ":root[data-theme='dark'] .tab.pill")).toContain('--ap-color-border-default');
  });

  it('lays the wash over a pill’s fill as an image, the neutral button’s way', () => {
    expect(block(css, ".tab.pill:hover:not([aria-disabled='true'])")).toMatch(/background-image:\s*linear-gradient/);
  });
});

describe('Tabs — axe', () => {
  it.each(tabsVariants)('%s has no violation', async (variant) => {
    const { container } = render(<Tabs label="Appointment" items={ITEMS} variant={variant} />);
    expect(await axeViolations(container)).toEqual([]);
  });

  it('has none with every panel mounted and one tab disabled', async () => {
    const items: TabItem[] = [ITEMS[0]!, { ...ITEMS[1]!, disabled: true }, ITEMS[2]!];
    const { container } = render(<Tabs label="Appointment" items={items} keepMounted />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
