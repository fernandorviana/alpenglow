import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { DropdownMenu } from './DropdownMenu';
import type { DropdownMenuEntry } from './rows';
import { NATIVE_POPOVER, installPopoverStub } from '../../test/popover';
import { axeViolations } from '../../test/axe';

const css = readFileSync('src/components/DropdownMenu/DropdownMenu.module.css', 'utf8');

installPopoverStub();

function Actions({ items = [] }: { items?: DropdownMenuEntry[] }) {
  return <DropdownMenu trigger={(props) => <button {...props}>Actions</button>} items={items} />;
}

async function open(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Actions' }));
}

describe('DropdownMenu', () => {
  it('stubs the popover API only because jsdom lacks it', () => {
    // When jsdom ships popover, delete the stub above: it would be overriding
    // the real implementation, and the suite would be testing the imitation.
    expect(NATIVE_POPOVER).toBe(false);
  });

  it('names the menu with the trigger rather than a second label', () => {
    // The APG menu button pattern labels the menu with its button. A separate
    // prop would be a second place for the same name to be wrong.
    render(<Actions />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    const menu = document.querySelector('[role="menu"]')!;
    expect(menu.getAttribute('aria-labelledby')).toBe(trigger.id);
    expect(trigger.id).not.toBe('');
  });

  it('opens on the trigger and reports it', async () => {
    render(<Actions />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('leaves the trigger inert in server HTML, so a click before hydration cannot open the menu behind React', () => {
    // Native popovertarget would open the menu before React listens: `open`
    // would stay false, so aria-expanded would deny a menu on screen, and the
    // first row would never take focus. Case-insensitive, because React
    // serialises the attribute as `popoverTarget`.
    const html = renderToString(<Actions />);
    expect(html).not.toMatch(/popovertarget/i);
  });

  it('gives each instance its own anchor name', () => {
    // Two menus on one page sharing an anchor name would both point at
    // whichever trigger rendered last.
    render(
      <>
        <Actions />
        <Actions />
      </>,
    );
    const [a, b] = screen.getAllByRole('button', { name: 'Actions' });
    const nameOf = (el: HTMLElement) => el.style.getPropertyValue('anchor-name');
    expect(nameOf(a!)).not.toBe('');
    expect(nameOf(a!)).not.toBe(nameOf(b!));
  });

  describe('the stylesheet', () => {
    it('keeps a group label flush where a page styles every paragraph', () => {
      // A docs page's `.prose p` (a class and an element) outranks a lone
      // `.groupLabel` class, and gave the label a 16px bottom margin inside
      // the menu. Two classes win on specificity alone.
      expect(css).toMatch(/\.menu\s+\.groupLabel\s*\{[^}]*margin:\s*0;/);
    });

    it('paints the overlay surface, not the raised one', () => {
      // In light both are white, so the drawing could not tell them apart. In
      // dark, raised would put the menu on the same step as the card beneath.
      expect(css).toContain('--ap-color-surface-overlay');
      expect(css).not.toContain('--ap-color-surface-raised');
    });

    it('uses the elevation token rather than a literal shadow', () => {
      expect(css).toContain('box-shadow: var(--ap-elevation-md)');
      expect(css).not.toMatch(/box-shadow:[^;]*rgb/);
    });

    it('holds the border width at rest so dark does not resize the menu', () => {
      // The border only takes a colour in dark. Keeping the width on the
      // element at all times is the same trick control.module.css uses.
      expect(css).toMatch(/border:\s*var\(--ap-border-width-hairline\)\s+solid\s+transparent/);
    });

    it('adds the dark border under both dark selectors, not one', () => {
      const media = css.includes("@media (prefers-color-scheme: dark)");
      const attr = css.includes(":root[data-theme='dark']");
      expect(media && attr).toBe(true);
      const borderColour = css.split('border-color: var(--ap-color-border-default)').length - 1;
      expect(borderColour).toBe(2);
    });

    it('keeps a usable degraded path where anchor positioning is missing', () => {
      // The popover still opens, still dismisses, still takes the keyboard —
      // it loses its anchor and gains the UA's centred placement.
      expect(css).toContain('@supports not (anchor-name: --a)');
    });
  });
});

describe('DropdownMenu rows', () => {
  it('renders one menuitem per action', async () => {
    const user = userEvent.setup();
    render(<Actions items={[{ id: 'edit', label: 'Edit' }, { id: 'copy', label: 'Copy' }]} />);
    await open(user);
    expect(screen.getAllByRole('menuitem').map((el) => el.textContent)).toEqual(['Edit', 'Copy']);
  });

  it('fires onSelect and closes', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Actions items={[{ id: 'edit', label: 'Edit', onSelect }]} />);
    await open(user);
    await user.click(screen.getByRole('menuitem', { name: 'Edit' }));
    expect(onSelect).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Actions' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('hides decorative icons from assistive technology', async () => {
    const user = userEvent.setup();
    render(
      <Actions items={[{ id: 'edit', label: 'Edit', icon: <svg data-testid="lead" />, iconEnd: <svg data-testid="trail" /> }]} />,
    );
    await open(user);
    expect(screen.getByTestId('lead').parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('trail').parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  describe('the stylesheet', () => {
    it('gives each tone the fill measured for it, not one shared neutral', () => {
      // text/accent on the neutral fill is 4.23:1 in dark. On its own subtle
      // surface it is 8.39:1. See contrast.test.ts.
      expect(css).toContain('--ap-color-interactive-neutral-hover');
      expect(css).toContain('--ap-color-surface-accent-subtle');
      expect(css).toContain('--ap-color-surface-danger-subtle');
    });

    it('does not give the danger row the drawn hover border', () => {
      // The drawing adds 1px of border/danger on hover. It would reflow the
      // row by 1px and would be the only hover in the system that changes
      // geometry. At ΔE76 14.14 in light and 61.74 in dark the fill is
      // unambiguous alone.
      expect(css).not.toContain('--ap-color-border-danger');
    });

    it("lets the icon slots take the row's colour", () => {
      // control.module.css paints its icons text/tertiary. A grey icon beside
      // a red label splits the row in two.
      expect(css).toMatch(/\.icon[^{]*\{[^}]*color:\s*inherit/);
    });

    it('lets the keyboard ring win over the rule that removes the default outline', () => {
      // Found in Chrome: inside the guarded fill rule, `outline: none` out-ranked
      // `.item:focus-visible` and the ring never showed. jsdom computes no
      // :focus-visible, so the order of the rules is what can be asserted.
      const rules = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^}]*)\}/g)].map(
        ([, selector, body]) => ({ selector: selector!.trim(), body: body! }),
      );
      const removers = rules.filter((rule) => /outline:\s*none/.test(rule.body));
      const ring = rules.findIndex((rule) => rule.selector === '.item:focus-visible');

      expect(removers.map((rule) => rule.selector)).toEqual(['.item:focus']);
      expect(ring).toBeGreaterThan(rules.indexOf(removers[0]!));
    });
  });
});

describe('DropdownMenu groups and separators', () => {
  it('labels a group with its own heading', async () => {
    const user = userEvent.setup();
    render(
      <Actions items={[{ label: 'Danger zone', items: [{ id: 'delete', label: 'Delete' }] }]} />,
    );
    await open(user);
    expect(screen.getByRole('group', { name: 'Danger zone' })).toBeInTheDocument();
  });

  it('renders a separator as a separator, not as a row', async () => {
    const user = userEvent.setup();
    render(<Actions items={[{ id: 'a', label: 'A' }, 'separator', { id: 'b', label: 'B' }]} />);
    await open(user);
    expect(screen.getAllByRole('separator')).toHaveLength(1);
    expect(screen.getAllByRole('menuitem')).toHaveLength(2);
  });

  it('keeps rows in source order across groups', async () => {
    const user = userEvent.setup();
    render(
      <Actions
        items={[
          { id: 'a', label: 'A' },
          'separator',
          { label: 'More', items: [{ id: 'b', label: 'B' }] },
        ]}
      />,
    );
    await open(user);
    expect(screen.getAllByRole('menuitem').map((el) => el.textContent)).toEqual(['A', 'B']);
  });

  it('draws the divider with the divider token, not the drawn surface', () => {
    // The drawing uses surface/sunken. It resolves to the same primitive in
    // light (stone/100) and to a different one in dark; border/subtle is
    // the token that means divider and stays one in both modes.
    expect(css).toContain('--ap-color-border-subtle');
    expect(css).not.toContain('--ap-color-surface-sunken');
  });
});

const THREE: DropdownMenuEntry[] = [
  { id: 'archive', label: 'Archive' },
  { id: 'copy', label: 'Copy' },
  { id: 'delete', label: 'Delete' },
];

describe('DropdownMenu keyboard', () => {
  it('opens on ArrowDown with the first row focused', async () => {
    const user = userEvent.setup();
    render(<Actions items={THREE} />);
    screen.getByRole('button', { name: 'Actions' }).focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Archive' })).toHaveFocus();
  });

  it('opens on ArrowUp with the last row focused', async () => {
    // Reaching the bottom of a long menu should not cost a full traversal.
    // The toggle event arrives after this key has placed focus, so this is
    // also the test that it does not drag focus back to the first row.
    const user = userEvent.setup();
    render(<Actions items={THREE} />);
    screen.getByRole('button', { name: 'Actions' }).focus();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus();
  });

  it('wraps at both ends', async () => {
    const user = userEvent.setup();
    render(<Actions items={THREE} />);
    await open(user);
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Archive' })).toHaveFocus();
  });

  it('jumps to the ends with Home and End', async () => {
    const user = userEvent.setup();
    render(<Actions items={THREE} />);
    await open(user);
    await user.keyboard('{End}');
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('menuitem', { name: 'Archive' })).toHaveFocus();
  });

  it('moves on the first character typed', async () => {
    const user = userEvent.setup();
    render(<Actions items={THREE} />);
    await open(user);
    await user.keyboard('c');
    expect(screen.getByRole('menuitem', { name: 'Copy' })).toHaveFocus();
  });

  // No Escape test. Esc and focus return are the platform's, and the popover
  // stub deliberately does not imitate them — a test here would test the stub.

  it('closes on Tab, which popover does not do and the APG asks for', async () => {
    const user = userEvent.setup();
    render(<Actions items={THREE} />);
    await open(user);
    await user.keyboard('{Tab}');
    expect(screen.getByRole('button', { name: 'Actions' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('activates the focused row on Enter and closes', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Actions items={[{ id: 'archive', label: 'Archive', onSelect }]} />);
    await open(user);
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it('lets the pointer move focus, so one row is highlighted and not two', async () => {
    // Without this the pointer highlights one row while the keyboard holds
    // another, and neither answers "what happens if I press Enter now".
    const user = userEvent.setup();
    render(<Actions items={THREE} />);
    await open(user);
    await user.hover(screen.getByRole('menuitem', { name: 'Copy' }));
    expect(screen.getByRole('menuitem', { name: 'Copy' })).toHaveFocus();
  });
});

const WITH_DISABLED: DropdownMenuEntry[] = [
  { id: 'archive', label: 'Archive' },
  { id: 'copy', label: 'Copy', disabled: true },
  { id: 'delete', label: 'Delete' },
];

describe('DropdownMenu disabled rows', () => {
  it('stays in the accessibility tree so it is still discoverable', () => {
    render(<Actions items={WITH_DISABLED} />);
    const row = screen.getByRole('menuitem', { name: 'Copy', hidden: true });
    expect(row).toHaveAttribute('aria-disabled', 'true');
    expect(row).not.toHaveAttribute('tabindex');
  });

  it('is skipped by the arrows rather than focused and inert', async () => {
    // A row that takes focus and reacts to nothing is a dead end.
    const user = userEvent.setup();
    render(<Actions items={WITH_DISABLED} />);
    await open(user);
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus();
  });

  it('is skipped by End', async () => {
    const user = userEvent.setup();
    render(<Actions items={[{ id: 'a', label: 'A' }, { id: 'b', label: 'B', disabled: true }]} />);
    await open(user);
    await user.keyboard('{End}');
    expect(screen.getByRole('menuitem', { name: 'A' })).toHaveFocus();
  });

  it('is skipped by typeahead', async () => {
    const user = userEvent.setup();
    render(
      <Actions
        items={[
          { id: 'a', label: 'Archive' },
          { id: 'c1', label: 'Copy', disabled: true },
          { id: 'c2', label: 'Copy link' },
        ]}
      />,
    );
    await open(user);
    await user.keyboard('c');
    expect(screen.getByRole('menuitem', { name: 'Copy link' })).toHaveFocus();
  });

  it('fires nothing when clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Actions items={[{ id: 'copy', label: 'Copy', disabled: true, onSelect }]} />);
    await open(user);
    await user.click(screen.getByRole('menuitem', { name: 'Copy' }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('does not take focus from the pointer', async () => {
    const user = userEvent.setup();
    render(<Actions items={WITH_DISABLED} />);
    await open(user);
    await user.hover(screen.getByRole('menuitem', { name: 'Copy' }));
    expect(screen.getByRole('menuitem', { name: 'Copy' })).not.toHaveFocus();
  });

  it('parks focus on the surface when every row is disabled', async () => {
    // Otherwise the popover opens with focus nowhere and Tab leaves the page.
    const user = userEvent.setup();
    render(<Actions items={[{ id: 'a', label: 'A', disabled: true }]} />);
    await open(user);
    expect(document.querySelector('[role="menu"]')).toHaveFocus();
  });

  describe('the stylesheet', () => {
    it('guards every paint-bearing focus rule against a disabled row', () => {
      // Button's :not(.loading) guard, for the same reason: one unguarded rule
      // repaints the state the guard suppresses. Comments are stripped first,
      // or their prose is parsed as selectors.
      const rules = css.replace(/\/\*[\s\S]*?\*\//g, '');
      const offenders = [...rules.matchAll(/([^{}]+)\{([^}]*)\}/g)]
        .filter(([, , body]) => /(^|[\s;])background\s*:/.test(body!))
        .flatMap(([, selector]) => selector!.split(',').map((part) => part.trim()))
        .filter((part) => /:focus|:hover/.test(part))
        .filter((part) => !part.includes("[aria-disabled='true']"));

      expect(offenders).toEqual([]);
    });

    it('marks the row unavailable to the pointer', () => {
      expect(css).toMatch(/\[aria-disabled='true'\][^{]*\{[^}]*cursor:\s*not-allowed/);
    });
  });
});

describe('DropdownMenu, open, to axe', () => {
  it('has no WCAG A or AA violation with every kind of row showing', async () => {
    // A docs page renders the menu closed, where its rows are hidden and axe
    // skips them. Open, the rows are what a screen reader walks.
    const { container } = render(
      <Actions
        items={[
          { id: 'edit', label: 'Edit', icon: <svg aria-hidden="true" /> },
          {
            label: 'Share',
            items: [
              { id: 'copy', label: 'Copy link' },
              { id: 'invite', label: 'Invite', disabled: true },
            ],
          },
          'separator',
          { id: 'delete', label: 'Delete', tone: 'danger' },
        ]}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Actions' });
    await userEvent.click(trigger);
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));

    expect(screen.getByRole('menuitem', { name: 'Copy link' })).toBeVisible();
    expect(await axeViolations(container)).toEqual([]);
  });
});
