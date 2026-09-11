import { describe, it, expect } from 'vitest';
import { block, readCss } from '@/test/css';

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
