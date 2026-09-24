import { describe, it, expect } from 'vitest';
import { block, readCss } from '@/test/css';
import { breakpoint, borderWidth, spacing } from '@/tokens/scale';
import { layout } from '@/tokens/layout';
import { componentsUsed } from './composition';

/**
 * "Built only from Alpenglow": the screen's one stylesheet lays things out
 * and takes every colour, size of type and space from a token.
 */
const PAINT = /^(color|background(-color)?|border(-\w+)?-color|font(-\w+)?|line-height|letter-spacing|padding(-\w+)*|margin(-\w+)*|gap|row-gap|column-gap|box-shadow|border-radius|outline(-\w+)?)$/;

function offenders(css: string) {
  return [...css.matchAll(/([\w-]+)\s*:\s*([^;{}]+);/g)]
    .filter(([, prop]) => PAINT.test(prop!))
    .filter(([, , value]) => {
      const bare = value!.replace(/var\(--ap-[\w-]+\)/g, '').replace(/\b0\b/g, '').replace(/\b(auto|inherit|none|transparent|currentColor)\b/g, '');
      return /[\d#]|rgb|hsl|oklch/.test(bare);
    })
    .map(([decl]) => decl);
}

describe('the dense screen', () => {
  it('finds a literal when there is one', () => {
    expect(offenders('.a { color: #fff; padding: 8px var(--ap-spacing-100); gap: var(--ap-spacing-100); margin: 0 auto; }')).toEqual([
      'color: #fff;',
      'padding: 8px var(--ap-spacing-100);',
    ]);
  });

  it('holds no local colour, type or space', () => {
    expect(offenders(readCss('app/screen/screen.module.css'))).toEqual([]);
  });

  it('is built from the package’s components', () => {
    const used = componentsUsed();
    for (const c of ['Scheduler', 'Table', 'SideNav', 'TopBar', 'Filters', 'CommandPalette', 'Toast', 'Drawer', 'Dialog', 'Tabs', 'EmptyState']) {
      expect(used, c).toContain(c);
    }
  });

  it('never gives the Scheduler less than its five columns at their floor', () => {
    expect(block(readCss('app/screen/screen.module.css'), '.body {')).toMatch(
      /minmax\(calc\(5 \* var\(--ap-spacing-1200\) \+ var\(--ap-spacing-1000\)/,
    );
    const scheduler = readCss('src/components/Scheduler/Scheduler.module.css');
    expect(scheduler).toMatch(/--scheduler-column: var\(--ap-spacing-1200\)/);
    expect(scheduler).toMatch(/--scheduler-hours-width: var\(--ap-spacing-1000\)/);
  });

  it('lays out by the layout tokens, with no gutter of its own', () => {
    const css = readCss('app/screen/screen.module.css');
    for (const selector of ['.dayBar {', '.body {', '.tabs {']) {
      expect(block(css, selector), selector).toMatch(/var\(--ap-layout-margin\)/);
    }
    expect(block(css, '.body {')).toMatch(/gap: var\(--ap-layout-gap\)/);
  });

  it('fits the Scheduler’s five columns at md with the narrow margin', () => {
    // 768 is the frame's tablet: the SideNav is a sheet, so the body has the
    // window less two narrow margins. The narrow mode runs up to lg.
    const floor = 5 * spacing[1200] + spacing[1000] + 2 * borderWidth.hairline;
    expect(breakpoint.md - 2 * layout.margin.narrow).toBeGreaterThanOrEqual(floor);
    expect(breakpoint.md).toBeLessThan(breakpoint.lg);
  });
});
