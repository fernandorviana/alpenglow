import { describe, it, expect } from 'vitest';
import { block, readCss } from '@/test/css';
import type { TintTone } from './vocabulary';
import { buttonFillTones, buttonTextTones } from './Button/Button';
import { badgeTones } from './Badge/Badge';
import { loaderTones } from './Loader/Loader';
import { menuItemTones } from './DropdownMenu/rows';

/** The pixel value of `property` in the rule that starts a line with `selector {`. */
function px(css: string, selector: string, property: string) {
  const rule = block(css, `\n${selector} {`);
  return Number(rule.match(new RegExp(`(?:^|[\\s;])${property}:\\s*(\\d+)px`))?.[1]);
}

describe('ControlSize', () => {
  it('gives a button and a field of the same size the same height', () => {
    // Button.module.css sets `height` and control.module.css `min-height`,
    // separately. Retune one and a lg button stops lining up with the lg field
    // beside it, which nothing else in the suite would notice.
    const button = readCss('src/components/Button/Button.module.css');
    const control = readCss('src/components/control.module.css');

    for (const size of ['sm', 'md', 'lg'] as const) {
      const buttonHeight = px(button, `.${size}`, 'height');
      expect(buttonHeight, size).toBeGreaterThan(0);
      expect(buttonHeight, size).toBe(px(control, `.${size}`, 'min-height'));
    }
  });
});

/** Whether the stylesheet has a rule that starts a line with exactly this selector. */
function hasRule(css: string, selector: string) {
  return new RegExp(`(?:^|\\n)${selector.replace(/\./g, '\\.')}\\s*\\{`).test(css);
}

describe('every tone a component lists is painted', () => {
  // A tone added to a list — the step a new token invites — without its CSS
  // renders unstyled, and every other test passes.
  const cases: [string, string, string[]][] = [
    ['Button, solid', 'src/components/Button/Button.module.css', buttonFillTones.map((t) => `.solid.${t}`)],
    ['Button, outline', 'src/components/Button/Button.module.css', buttonTextTones.map((t) => `.outline.${t}`)],
    ['Button, ghost', 'src/components/Button/Button.module.css', buttonTextTones.map((t) => `.ghost.${t}`)],
    ['Badge', 'src/components/Badge/Badge.module.css', badgeTones.map((t) => `.${t}`)],
    ['Loader', 'src/components/Loader/Loader.module.css', loaderTones.map((t) => `.${t}`)],
    // A neutral row is the row's own style and carries no tone class.
    [
      'DropdownMenu row',
      'src/components/DropdownMenu/DropdownMenu.module.css',
      menuItemTones.filter((t) => t !== 'neutral').map((t) => `.${t}`),
    ],
  ];

  for (const [name, path, selectors] of cases) {
    it(name, () => {
      const css = readCss(path);
      expect(selectors.filter((selector) => !hasRule(css, selector))).toEqual([]);
    });
  }
});

describe('TintTone', () => {
  it('does not mistake the tertiary text level for the tertiary tone', () => {
    // Checked by `tsc`, not at runtime. `text/tertiary` is a level of the text
    // hierarchy. A ceiling read from `text/<t>` alone would admit 'tertiary',
    // this directive would go unused, and `npm run typecheck` would fail.
    // @ts-expect-error the tertiary tone has no tinted pair
    const tertiary: TintTone = 'tertiary';
    expect(tertiary).toBe('tertiary');
  });
});
