import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { block, readCss } from '@/test/css';
import { spacing } from '@/tokens/scale';
import { ThemeToggle } from './ThemeToggle';

/**
 * Two contracts are worth a test here, and they are the two that nothing else
 * would catch.
 *
 * The first is behavioural: the control holds three states while presenting
 * two. A viewer who has not touched it is following the system, and follows it
 * live; the first click ends that for good. Nothing about that is visible in a
 * snapshot — it lives in a listener that has to be gone afterwards.
 *
 * The second is in the stylesheet. Dark is written twice, once for the system
 * and once for the stored choice, so the knob is already in place on the first
 * paint. Delete either half and the page still renders, still passes
 * typecheck, and is wrong for half its readers on first load.
 */

const KEY = 'alpenglow-theme';

type Listener = (event: MediaQueryListEvent) => void;

/**
 * jsdom's `matchMedia` never fires, so a system that can change has to be
 * built. The listener set lives out here rather than on the returned object:
 * the component calls `matchMedia` twice and must see one system, not two.
 */
function stubSystem(dark: boolean) {
  const listeners = new Set<Listener>();
  let matches = dark;

  window.matchMedia = ((query: string) => ({
    media: query,
    get matches() {
      return matches;
    },
    onchange: null,
    addEventListener: (_type: 'change', listener: Listener) => void listeners.add(listener),
    removeEventListener: (_type: 'change', listener: Listener) => void listeners.delete(listener),
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;

  return {
    /** What the OS appearance setting does when the viewer changes it. */
    change(next: boolean) {
      matches = next;
      act(() => {
        for (const listener of [...listeners]) listener({ matches: next } as MediaQueryListEvent);
      });
    },
    /** Zero means the control has stopped listening to the system. */
    get listening() {
      return listeners.size;
    },
  };
}

const realMatchMedia = window.matchMedia;
const toggle = () => screen.getByRole('switch');

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

afterEach(() => {
  window.matchMedia = realMatchMedia;
});

describe('ThemeToggle', () => {
  it('announces itself as a switch named for the state it holds', () => {
    // "Dark theme" plus on or off is the whole message. The sun and the moon
    // are decoration on top of that name, so neither may reach the name.
    stubSystem(false);
    render(<ThemeToggle />);
    expect(screen.getByRole('switch', { name: 'Dark theme' })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  describe('before the viewer has chosen', () => {
    it('reports what the system asks for, and stores nothing', () => {
      stubSystem(true);
      render(<ThemeToggle />);
      expect(toggle()).toBeChecked();
      // Reading the system is not choosing. Writing here would freeze a
      // first-time viewer into whatever their OS happened to say that day.
      expect(localStorage.getItem(KEY)).toBeNull();
    });

    it('follows the system when it changes', () => {
      const system = stubSystem(false);
      render(<ThemeToggle />);
      expect(toggle()).not.toBeChecked();

      system.change(true);
      expect(toggle()).toBeChecked();
    });

    it('treats the old three-button control’s "system" as no choice at all', () => {
      // The control this replaced could store 'system'. That value means the
      // same as an empty slot, and a viewer carrying one must not be stuck
      // reading it as a stored light preference.
      localStorage.setItem(KEY, 'system');
      const system = stubSystem(true);
      render(<ThemeToggle />);

      expect(toggle()).toBeChecked();
      system.change(false);
      expect(toggle()).not.toBeChecked();
    });
  });

  describe('once the viewer has chosen', () => {
    it('writes the choice to the root element and to storage', async () => {
      stubSystem(false);
      render(<ThemeToggle />);
      await userEvent.click(toggle());

      expect(toggle()).toBeChecked();
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
      expect(localStorage.getItem(KEY)).toBe('dark');
    });

    it('goes back to light, which is a choice of its own', async () => {
      stubSystem(true);
      render(<ThemeToggle />);
      await userEvent.click(toggle());

      expect(toggle()).not.toBeChecked();
      expect(document.documentElement).toHaveAttribute('data-theme', 'light');
      // 'light' and not a cleared slot: clearing it would hand the viewer back
      // to a system that says dark, undoing the click they just made.
      expect(localStorage.getItem(KEY)).toBe('light');
    });

    it('stops listening to the system, for good', async () => {
      const system = stubSystem(false);
      render(<ThemeToggle />);
      expect(system.listening).toBe(1);

      await userEvent.click(toggle());
      // The listener is gone rather than ignored. This is what makes the first
      // click final: the system can change twice and never be heard again.
      expect(system.listening).toBe(0);

      system.change(true);
      expect(toggle()).toBeChecked();
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');

      system.change(false);
      expect(toggle()).toBeChecked();
    });

    it('reads a stored choice over the system', () => {
      localStorage.setItem(KEY, 'light');
      const system = stubSystem(true);
      render(<ThemeToggle />);

      expect(toggle()).not.toBeChecked();
      expect(system.listening).toBe(0);
    });

    it('puts a stored choice back on the root when React has taken it away', () => {
      // The no-flash script sets the attribute while the page parses. When
      // React renders the root on the client instead of hydrating it, the root
      // comes back with only the attributes React knows about, and a viewer who
      // chose light on a dark system would be handed dark.
      localStorage.setItem(KEY, 'light');
      stubSystem(true);
      render(<ThemeToggle />);

      expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    });

    it('leaves the root alone when nothing was chosen', () => {
      // No attribute is what lets the system rules in the stylesheet apply.
      stubSystem(true);
      render(<ThemeToggle />);

      expect(document.documentElement).not.toHaveAttribute('data-theme');
    });
  });

  it('still works where storage throws', async () => {
    // A private window throws on both calls. The preference cannot persist;
    // the control must not take the page down with it.
    const blocked = () => {
      throw new DOMException('blocked', 'SecurityError');
    };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked);

    try {
      stubSystem(false);
      render(<ThemeToggle />);
      await userEvent.click(toggle());

      expect(toggle()).toBeChecked();
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    } finally {
      vi.restoreAllMocks();
    }
  });
});

/**
 * The docs chrome is plain global CSS rather than a module, so these read the
 * stylesheet the way `Button.test.tsx` does.
 */
describe('the toggle stylesheet', () => {
  const css = readCss('app/docs.css');

  const rules = (text: string) =>
    [...text.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({
      selector: selector!.trim().replace(/\s+/g, ' '),
      declarations: body!
        .split(';')
        .map((part) => part.trim().replace(/\s+/g, ' '))
        .filter(Boolean)
        .sort(),
    }));

  const systemDark = block(css, '@media (prefers-color-scheme: dark)');
  const chosen = rules(css.replace(systemDark, ''));

  it('says everything about dark twice, once for the system and once for the choice', () => {
    // Both halves exist so the knob is in the right place on the first paint,
    // which is the same reason the layout carries a no-flash script. Lose one
    // and the control spends a frame contradicting the page around it.
    const mediaRules = rules(systemDark);
    expect(mediaRules.length).toBeGreaterThan(0);

    for (const rule of mediaRules) {
      const selector = rule.selector.replace(
        ":root:not([data-theme='light'])",
        ":root[data-theme='dark']",
      );
      expect(selector, 'every rule is scoped so a stored light choice wins').not.toBe(
        rule.selector,
      );

      const twin = chosen.find((candidate) => candidate.selector === selector);
      expect(twin, `${selector} is missing`).toBeTruthy();
      expect(twin!.declarations, selector).toEqual(rule.declarations);
    }
  });

  it('never animates the knob’s position away', () => {
    // Position is the state signal that survives when colour does not, so
    // reduced motion drops the transition and nothing else. A `transform` in
    // here would park the knob on the left in dark.
    expect(block(css, '@media (prefers-reduced-motion: reduce)')).not.toMatch(/transform/);
  });

  it('keeps the drawn geometry adding up', () => {
    // The drawing is an 84x48 pill holding two 32px slots. These numbers are
    // literals in the stylesheet because they are drawn, not derived — but
    // they have to agree with each other and with the scale, and the travel is
    // the one that silently stops agreeing. Change the width alone and the
    // knob lands off-centre in its slot rather than anywhere obviously wrong.
    const toggleRule = chosen.find((rule) => rule.selector === '.themeToggle');
    const knobRule = chosen.find((rule) => rule.selector === '.themeToggleKnob');
    const travel = chosen.find((rule) => rule.selector === ":root[data-theme='dark'] .themeToggleKnob");

    const declaration = (rule: typeof toggleRule, property: string) =>
      rule?.declarations.find((d) => d.startsWith(`${property}:`));

    const px = (rule: typeof toggleRule, property: string) =>
      Number(declaration(rule, property)?.match(/(\d+)px/)?.[1]);

    /** Padding and gap are tokens, so they are resolved rather than read. */
    const step = (rule: typeof toggleRule, property: string) => {
      const name = declaration(rule, property)?.match(/--ap-spacing-(\w+)\)/)?.[1];
      return spacing[name as unknown as keyof typeof spacing];
    };

    const pad = step(toggleRule, 'padding');
    const gap = step(toggleRule, 'gap');
    const slot = px(knobRule, 'width');

    expect(pad, 'padding is a spacing token').toBeTypeOf('number');
    expect(gap, 'the gap is a spacing token').toBeTypeOf('number');

    expect(slot).toBe(px(knobRule, 'height'));
    expect(px(toggleRule, 'width')).toBe(pad + slot + gap + slot + pad);
    expect(px(toggleRule, 'height')).toBe(pad + slot + pad);
    expect(step(knobRule, 'top'), 'the knob is inset by the track’s own padding').toBe(pad);
    expect(step(knobRule, 'left')).toBe(pad);
    expect(Number(travel?.declarations[0]?.match(/translateX\((\d+)px\)/)?.[1])).toBe(slot + gap);
  });
});
