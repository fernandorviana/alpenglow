import axe from 'axe-core';

/**
 * The WCAG A and AA rules axe can decide without a layout, run over `root`.
 * Returns one line per violated rule, with the elements that break it, so a
 * failing `toEqual([])` reads as the list of what to fix.
 *
 * `color-contrast` is off: jsdom paints nothing, so axe could only report it
 * incomplete, and contrast is measured from the tokens by
 * `src/tokens/contrast.test.ts`. Best-practice rules are not run — `region`
 * and `landmark-one-main` judge a whole page, and a component rendered alone
 * would fail them for being alone.
 *
 * What passes here is structure: roles, names, states, ARIA that is valid for
 * the role it is on. Focus order, what a screen reader says, and anything that
 * needs layout are not covered. Nor is a reference to an id that does not
 * exist: axe reports `aria-labelledby="nowhere"` as needing review, not as a
 * violation, so a broken description link is still the hand-written tests' job.
 */
export async function axeViolations(root: Element): Promise<string[]> {
  const results = await axe.run(root, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
    rules: { 'color-contrast': { enabled: false } },
    resultTypes: ['violations'],
  });
  return results.violations.map(
    (violation) =>
      `${violation.id}: ${violation.help}\n${violation.nodes.map((node) => `  ${node.target.join(' ')}`).join('\n')}`,
  );
}
