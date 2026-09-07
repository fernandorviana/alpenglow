import { describe, it, expect } from 'vitest';
import { theme, type ThemeTokenName, type Mode } from './theme.js';
import { resolve, contrast, tokenContrast, AA_NORMAL, NON_TEXT } from './contrast.js';

const MODES: Mode[] = ['light', 'dark'];

/** Opaque surfaces a component can sit on. `scrim` is excluded: it is a wash, not a ground. */
const SURFACES = [
  'surface/base',
  'surface/raised',
  'surface/overlay',
  'surface/sunken',
] as const satisfies readonly ThemeTokenName[];

describe('text meets AA on every surface it can appear on', () => {
  const TEXT = ['text/primary', 'text/secondary', 'text/tertiary', 'text/accent',
                'text/success', 'text/warning', 'text/danger', 'text/info'] as const;

  for (const mode of MODES) {
    for (const token of TEXT) {
      it(`${token} — ${mode}`, () => {
        for (const surface of SURFACES) {
          const ratio = tokenContrast(token, surface, mode);
          expect(ratio, `${token} on ${surface} (${mode})`).toBeGreaterThanOrEqual(AA_NORMAL);
        }
      });
    }
  }
});

describe('documented exemptions hold at their recorded values', () => {
  // These are deliberately below AA. Asserting the recorded figure means a
  // future edit that makes them *worse* still fails.
  const EXPECTED: Record<string, Record<Mode, number>> = {
    'text/placeholder': { light: 3.98, dark: 4.54 },
    'text/disabled':    { light: 2.77, dark: 3.02 },
  };

  for (const [token, byMode] of Object.entries(EXPECTED)) {
    for (const mode of MODES) {
      it(`${token} — ${mode} is still ${byMode[mode]}:1 on surface/raised`, () => {
        const ratio = tokenContrast(token as ThemeTokenName, 'surface/raised', mode);
        expect(ratio).toBeCloseTo(byMode[mode], 1);
      });
    }
  }
});

describe('status text meets AA on its own subtle surface', () => {
  const PAIRS = [
    ['text/success', 'surface/success-subtle'],
    ['text/warning', 'surface/warning-subtle'],
    ['text/danger',  'surface/danger-subtle'],
    ['text/info',    'surface/info-subtle'],
    ['text/primary', 'surface/accent-subtle'],
  ] as const;

  for (const mode of MODES) {
    for (const [fg, bg] of PAIRS) {
      it(`${fg} on ${bg} — ${mode}`, () => {
        expect(tokenContrast(fg, bg, mode)).toBeGreaterThanOrEqual(AA_NORMAL);
      });
    }
  }
});

describe('every on-* label meets AA on all of its fill states', () => {
  // The rule this guards: a fill and its label are a pair. In dark the accent
  // fill lightens while the label darkens; breaking either half breaks AA.
  const GROUPS = [
    { on: 'interactive/on-accent',   fills: ['interactive/accent', 'interactive/accent-hover', 'interactive/accent-pressed'] },
    { on: 'interactive/on-neutral',  fills: ['interactive/neutral', 'interactive/neutral-hover', 'interactive/neutral-pressed'] },
    { on: 'interactive/on-tertiary', fills: ['interactive/tertiary', 'interactive/tertiary-hover', 'interactive/tertiary-pressed'] },
    { on: 'interactive/on-danger',   fills: ['interactive/danger', 'interactive/danger-hover', 'interactive/danger-pressed'] },
  ] as const;

  for (const mode of MODES) {
    for (const { on, fills } of GROUPS) {
      for (const fill of fills) {
        it(`${on} on ${fill} — ${mode}`, () => {
          expect(tokenContrast(on, fill, mode)).toBeGreaterThanOrEqual(AA_NORMAL);
        });
      }
    }
  }
});

describe('border/strong meets 1.4.11 on every surface, in both modes', () => {
  // This is what makes it usable for all form controls without a per-surface
  // exception. It is why the token is the same primitive in both modes.
  for (const mode of MODES) {
    it(`border/strong — ${mode}`, () => {
      for (const surface of SURFACES) {
        const ratio = tokenContrast('border/strong', surface, mode);
        expect(ratio, `border/strong on ${surface} (${mode})`).toBeGreaterThanOrEqual(NON_TEXT);
      }
    });
  }
});

describe('the focus ring is distinguishable from every surface', () => {
  for (const mode of MODES) {
    it(`border/focus — ${mode}`, () => {
      for (const surface of SURFACES) {
        expect(tokenContrast('border/focus', surface, mode)).toBeGreaterThanOrEqual(NON_TEXT);
      }
    });
  }
});

describe('nothing collides with the surface it sits on', () => {
  // Two real defects were found this way: border/subtle matching surface/overlay,
  // and interactive/neutral matching it too. Both were 1.00:1 — invisible.
  //
  // Each token is checked only against the surfaces it is actually used on.
  // border/subtle is knowingly too faint on base and sunken, which is why the
  // system says to step up to border/default there — asserting it everywhere
  // would be testing a rule the design does not make.
  const MIN_VISIBLE = 1.1;

  const SCOPED: ReadonlyArray<readonly [ThemeTokenName, readonly ThemeTokenName[]]> = [
    ['border/subtle',  ['surface/raised', 'surface/overlay']],
    ['border/default', SURFACES],
    ['border/strong',  SURFACES],
  ];

  for (const mode of MODES) {
    for (const [token, surfaces] of SCOPED) {
      it(`${token} — ${mode}`, () => {
        for (const surface of surfaces) {
          const ratio = tokenContrast(token, surface, mode);
          expect(ratio, `${token} vs ${surface} (${mode}) — collision`).toBeGreaterThanOrEqual(MIN_VISIBLE);
        }
      });
    }
  }
});

describe('every interactive fill is separable from its surface', () => {
  // A secondary button's fill is deliberately equal to the canvas in Light —
  // it is an outline button there. So the requirement is not "the fill must
  // differ" but "the control must be findable", by fill OR by its outline.
  const FILLS = [
    'interactive/neutral',
    'interactive/neutral-hover',
    'interactive/neutral-pressed',
    'interactive/disabled',
  ] as const satisfies readonly ThemeTokenName[];

  const MIN_VISIBLE = 1.1;

  for (const mode of MODES) {
    for (const token of FILLS) {
      it(`${token} — ${mode}`, () => {
        for (const surface of SURFACES) {
          const byFill = tokenContrast(token, surface, mode);
          const byOutline = tokenContrast('border/default', surface, mode);
          expect(
            Math.max(byFill, byOutline),
            `${token} on ${surface} (${mode}) is indistinguishable by fill (${byFill.toFixed(2)}) or outline (${byOutline.toFixed(2)})`,
          ).toBeGreaterThanOrEqual(MIN_VISIBLE);
        }
      });
    }
  }
});

describe('the dark elevation ladder is ordered and every step is perceptible', () => {
  const LADDER = ['surface/sunken', 'surface/base', 'surface/raised', 'surface/overlay'] as const;

  it('each step is lighter than the one below it', () => {
    const lums = LADDER.map((t) => resolve(t, 'dark'));
    for (let i = 0; i < lums.length - 1; i++) {
      expect(contrast(lums[i], '#000000'), `${LADDER[i]} -> ${LADDER[i + 1]}`)
        .toBeLessThan(contrast(lums[i + 1], '#000000'));
    }
  });

  it('each adjacent step is separable', () => {
    for (let i = 0; i < LADDER.length - 1; i++) {
      const ratio = contrast(resolve(LADDER[i], 'dark'), resolve(LADDER[i + 1], 'dark'));
      expect(ratio, `${LADDER[i]} -> ${LADDER[i + 1]}`).toBeGreaterThanOrEqual(1.09);
    }
  });
});

describe('structural invariants', () => {
  it('every token defines both modes', () => {
    for (const [name, entry] of Object.entries(theme)) {
      expect(entry.light, `${name}.light`).toBeTruthy();
      expect(entry.dark, `${name}.dark`).toBeTruthy();
    }
  });

  it('no token resolves to a raw hex — every value is an alias', () => {
    for (const entry of Object.values(theme)) {
      expect(String(entry.light)).not.toMatch(/^#/);
      expect(String(entry.dark)).not.toMatch(/^#/);
    }
  });

  it('every fill state has a matching on-* token', () => {
    const fills = Object.keys(theme).filter(
      (k) => k.startsWith('interactive/') && !k.includes('/on-') && !k.endsWith('selected'),
    );
    const families = new Set(fills.map((f) => f.split('/')[1].split('-')[0]));
    for (const family of families) {
      expect(Object.keys(theme), `on-${family}`).toContain(`interactive/on-${family}`);
    }
  });
});
