import { describe, it, expect } from 'vitest';
import { theme, type ThemeTokenName, type Mode } from './theme';
import { resolve, contrast, tokenContrast, AA_NORMAL, NON_TEXT } from './contrast';
import { alphaPrimitives, primitives } from './primitives';

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

describe('a disabled menu row is exempt, at the figure it actually shows', () => {
  // The recorded exemption is measured on surface/raised. On surface/overlay
  // dark is 2.66 rather than 3.02, and that is the surface the DropdownMenu uses.
  const EXPECTED: Record<Mode, number> = { light: 2.77, dark: 2.66 };
  for (const mode of MODES) {
    it(`text/disabled on surface/overlay — ${mode}`, () => {
      expect(tokenContrast('text/disabled', 'surface/overlay', mode)).toBeCloseTo(EXPECTED[mode], 1);
    });
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

describe('a menu row label meets AA on the fill its tone hovers to', () => {
  // Each tone hovers to its own subtle surface rather than to one shared
  // neutral fill. That started as a rule for the danger row only; it became
  // uniform when text/accent was measured on the neutral fill and came back at
  // 3.50:1 in dark. Pairs are listed rather than derived because the pairing
  // is the design decision, not a property of the token names.
  const PAIRS = [
    ['text/primary', 'interactive/neutral-hover'],
    ['text/accent',  'surface/accent-subtle'],
    ['text/danger',  'surface/danger-subtle'],
  ] as const;

  for (const mode of MODES) {
    for (const [fg, bg] of PAIRS) {
      it(`${fg} on ${bg} — ${mode}`, () => {
        expect(tokenContrast(fg, bg, mode)).toBeGreaterThanOrEqual(AA_NORMAL);
      });
    }
  }

  it('records why the accent row does not take the neutral fill', () => {
    // Kept as an assertion so that a future edit which makes this pairing
    // usable is noticed rather than assumed.
    expect(tokenContrast('text/accent', 'interactive/neutral-hover', 'dark')).toBeLessThan(AA_NORMAL);
  });
});

describe('every on-* label meets AA on all of its fill states', () => {
  // Families are derived from the tokens, not listed here. A hand-kept list is
  // how `success` shipped untested: the family was added to the theme and the
  // list was not updated, so nothing checked it and everything passed.
  const families = [
    ...new Set(
      Object.keys(theme)
        .filter((k) => k.startsWith('interactive/on-'))
        .map((k) => k.slice('interactive/on-'.length)),
    ),
  ].filter((family) => family !== 'disabled');

  /** Pairs that are knowingly below AA, held at the figure they were accepted at. */
  const EXEMPT: Record<string, { ratio: number; why: string }> = {
    'interactive/on-success on interactive/success-pressed in light': {
      ratio: 3.36,
      why: 'Pressed is feedback after the decision, not information used to make it. The green ramp has no third step that keeps a dark label above 4.5.',
    },
  };

  for (const mode of MODES) {
    for (const family of families) {
      const on = `interactive/on-${family}` as ThemeTokenName;
      const fills = [
        `interactive/${family}`,
        `interactive/${family}-hover`,
        `interactive/${family}-pressed`,
      ].filter((f): f is ThemeTokenName => f in theme);

      it(`${on} — ${mode} (${fills.length} fills)`, () => {
        for (const fill of fills) {
          const ratio = tokenContrast(on, fill, mode);
          const exemption = EXEMPT[`${on} on ${fill} in ${mode}`];

          if (exemption) {
            // Asserted at its recorded value, so an edit can never make it worse
            // without failing. An exemption is not a place to stop measuring.
            expect(ratio, exemption.why).toBeCloseTo(exemption.ratio, 1);
          } else {
            expect(ratio, `${on} on ${fill} (${mode})`).toBeGreaterThanOrEqual(AA_NORMAL);
          }
        }
      });
    }
  }

  it('covers every interactive family the theme defines', () => {
    // Guards the derivation itself: if a family stops producing an on- token,
    // this notices rather than silently checking one fewer thing.
    expect(families.sort()).toEqual(['accent', 'danger', 'neutral', 'success', 'tertiary']);
  });
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

describe('every badge tone is readable, in the treatment it actually uses', () => {
  // Badge is not one treatment with swapped values. In light it is a tinted
  // fill with no outline; in dark the fill drops to the sunken surface for
  // every tone and an outline appears in the tone's own colour. Measuring the
  // light pairing in both modes would have been checking something the
  // component does not do.
  const TONES: ReadonlyArray<readonly [ThemeTokenName, ThemeTokenName]> = [
    ['text/primary', 'surface/sunken'],
    ['text/accent', 'surface/accent-subtle'],
    ['text/success', 'surface/success-subtle'],
    ['text/warning', 'surface/warning-subtle'],
    ['text/danger', 'surface/danger-subtle'],
    ['text/info', 'surface/info-subtle'],
  ];

  it('light: the label clears AA on its tinted fill', () => {
    for (const [fg, bg] of TONES) {
      expect(tokenContrast(fg, bg, 'light'), `${fg} on ${bg}`).toBeGreaterThanOrEqual(AA_NORMAL);
    }
  });

  it('dark: the label clears AA on the sunken fill every tone shares', () => {
    for (const [fg] of TONES) {
      expect(tokenContrast(fg, 'surface/sunken', 'dark'), fg).toBeGreaterThanOrEqual(AA_NORMAL);
    }
  });

  it('dark: the outline clears 1.4.11 against the surface the badge sits on', () => {
    // The outline is what gives the badge its shape there, so it has to be
    // findable against the card behind it, not only against its own fill.
    for (const [fg] of TONES) {
      expect(tokenContrast(fg, 'surface/raised', 'dark'), fg).toBeGreaterThanOrEqual(NON_TEXT);
    }
  });

  it('light: each tinted fill is separable from the surface behind it', () => {
    for (const [, bg] of TONES) {
      expect(tokenContrast(bg, 'surface/raised', 'light'), bg).toBeGreaterThanOrEqual(1.03);
    }
  });
});

describe('a switch shows both its shape and its state', () => {
  // The drawn switch is a mint track with a white knob: the knob is 1.48:1
  // against the track and the track 1.48:1 against a white card, so neither the
  // control nor its state has a boundary. These are the tokens that exist to
  // clear 3:1, which is what a control's identifying parts need.
  const KNOB: ThemeTokenName = 'surface/raised';
  const OFF: ThemeTokenName = 'border/strong';
  const ON: ThemeTokenName = 'border/success';

  for (const mode of MODES) {
    it(`the knob is visible on both tracks — ${mode}`, () => {
      expect(tokenContrast(KNOB, OFF, mode), 'knob on the off track').toBeGreaterThanOrEqual(NON_TEXT);
      expect(tokenContrast(KNOB, ON, mode), 'knob on the on track').toBeGreaterThanOrEqual(NON_TEXT);
    });

    it(`the track is visible on every surface a form sits on — ${mode}`, () => {
      for (const surface of ['surface/base', 'surface/raised'] as const) {
        expect(tokenContrast(OFF, surface, mode), `off on ${surface}`).toBeGreaterThanOrEqual(NON_TEXT);
        expect(tokenContrast(ON, surface, mode), `on on ${surface}`).toBeGreaterThanOrEqual(NON_TEXT);
      }
    });
  }
});

describe('a focus indicator is visible wherever focus can land', () => {
  // Read-only fields are focusable — that is how their text gets copied — and
  // they sit on a recessed fill. The obvious quiet border for them, default, is
  // 1.20:1 there: an indicator nobody can see, on an element the keyboard can
  // reach.
  for (const mode of MODES) {
    it(`read-only focus border — ${mode}`, () => {
      expect(tokenContrast('border/strong', 'surface/sunken', mode)).toBeGreaterThanOrEqual(NON_TEXT);
      expect(tokenContrast('border/strong', 'surface/raised', mode)).toBeGreaterThanOrEqual(NON_TEXT);
    });

    it(`an editable field's focus border is stronger than a read-only one — ${mode}`, () => {
      // The two must not be mistakable for each other.
      const editable = tokenContrast('border/inverse', 'surface/raised', mode);
      const readOnly = tokenContrast('border/strong', 'surface/raised', mode);
      expect(editable).toBeGreaterThan(readOnly);
    });
  }
});

describe('a checkbox or radio stays legible against its own fill', () => {
  // The box is inset, so its border and its selected dot are measured against
  // the fill inside it, not only against the card behind it. Filling the box
  // with the canvas colour instead drops the border to 2.83:1 and the dot to
  // 2.70:1 in dark — invisible where it matters and fine everywhere else, which
  // is the hardest kind of regression to notice.
  const BOX_FILL: ThemeTokenName = 'surface/sunken';

  for (const mode of MODES) {
    it(`border and dot against the box fill — ${mode}`, () => {
      expect(tokenContrast('border/strong', BOX_FILL, mode), 'unchecked border').toBeGreaterThanOrEqual(NON_TEXT);
      expect(tokenContrast('interactive/accent', BOX_FILL, mode), 'selected dot').toBeGreaterThanOrEqual(NON_TEXT);
    });

    it(`the box is separable from the surface it sits on — ${mode}`, () => {
      expect(tokenContrast(BOX_FILL, 'surface/raised', mode)).toBeGreaterThanOrEqual(1.1);
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

  /** Adjacent pairs, so the loop never indexes past the end. */
  const STEPS = LADDER.flatMap((from, i) => {
    const to = LADDER[i + 1];
    return to ? [[from, to] as const] : [];
  });

  it('each step is lighter than the one below it', () => {
    for (const [from, to] of STEPS) {
      const lighter = (t: (typeof LADDER)[number]) => contrast(resolve(t, 'dark'), '#000000');
      expect(lighter(from), `${from} -> ${to}`).toBeLessThan(lighter(to));
    }
  });

  it('each adjacent step is separable', () => {
    for (const [from, to] of STEPS) {
      const ratio = contrast(resolve(from, 'dark'), resolve(to, 'dark'));
      expect(ratio, `${from} -> ${to}`).toBeGreaterThanOrEqual(1.09);
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
    const families = new Set(fills.map((f) => f.split('/')[1]!.split('-')[0]!));
    for (const family of families) {
      expect(Object.keys(theme), `on-${family}`).toContain(`interactive/on-${family}`);
    }
  });
});

describe('the table stays legible in both modes', () => {
  // The header band is surface/base rather than the surface/sunken its own
  // `use` string advertises: in light, sunken and border/subtle resolve to
  // the same hex, so a sunken band swallows the separator. Both clear AA,
  // which is why the choice was made on the collision instead. This assertion
  // restates a pairing the generic loop already covers — it exists to name the
  // Table's specific choice and keep this reasoning next to it.
  it.each(['light', 'dark'] as const)('header text clears AA on the band in %s', (mode) => {
    const ratio = tokenContrast('text/secondary', 'surface/base', mode);
    expect(ratio, 'text/secondary on surface/base').toBeGreaterThanOrEqual(AA_NORMAL);
  });

  // New coverage: interactive/selected does not appear as a text ground in the
  // generic loop.
  it.each(['light', 'dark'] as const)('body text clears AA on a selected row in %s', (mode) => {
    const ratio = tokenContrast('text/primary', 'interactive/selected', mode);
    expect(ratio, 'text/primary on interactive/selected').toBeGreaterThanOrEqual(AA_NORMAL);
  });

  // Row separators group rows that position already separates, so they are
  // decoration and exempt from the 3:1 of WCAG 1.4.11. The visibility FLOOR
  // for this pairing is enforced above, at MIN_VISIBLE — a floor here would be
  // looser and could never fail first, so it would defend nothing. What is
  // recorded instead is the measured figure, following the exemptions block:
  // an edit that moves the separator in EITHER direction has to be deliberate.
  const SEPARATOR = { light: 1.16, dark: 1.31 } as const;

  it.each(['light', 'dark'] as const)('row separators stay at their measured value in %s', (mode) => {
    const ratio = tokenContrast('border/subtle', 'surface/raised', mode);
    expect(ratio, 'border/subtle on surface/raised').toBeCloseTo(SEPARATOR[mode], 1);
  });
});

describe('the calendar meets the thresholds its drawing did not', () => {
  // Every number here was measured before the component was written, and three
  // of them are the reason it does not use the colour it was drawn with. See
  // docs/superpowers/specs/2026-09-10-date-picker-design.md.
  const TEXT_PAIRS = [
    ['a day label on the panel', 'text/primary', 'surface/overlay'],
    ['weekend label on the panel', 'text/tertiary', 'surface/overlay'],
    ['the weekday header on the panel', 'text/tertiary', 'surface/overlay'],
    ["today's label on today's pill", 'text/accent', 'interactive/selected'],
    ['a selected label on the accent pill', 'interactive/on-accent', 'interactive/accent'],
    ['the range label on the band', 'interactive/on-accent', 'interactive/accent'],
    ['the pagination chevron on its resting fill', 'interactive/on-neutral', 'interactive/neutral'],
    ['the pagination chevron on its hover fill', 'interactive/on-neutral', 'interactive/neutral-hover'],
  ] as const satisfies readonly (readonly [string, ThemeTokenName, ThemeTokenName])[];

  const NON_TEXT_PAIRS = [
    ['the range band against the panel', 'interactive/accent', 'surface/overlay'],
    ['the focus ring against the panel', 'border/focus', 'surface/overlay'],
    ["today's dot against the panel", 'interactive/accent', 'surface/overlay'],
  ] as const satisfies readonly (readonly [string, ThemeTokenName, ThemeTokenName])[];

  for (const mode of MODES) {
    for (const [what, fg, bg] of TEXT_PAIRS) {
      it(`${what} — ${mode}`, () => {
        expect(tokenContrast(fg, bg, mode)).toBeGreaterThanOrEqual(AA_NORMAL);
      });
    }
    for (const [what, fg, bg] of NON_TEXT_PAIRS) {
      it(`${what} — ${mode}`, () => {
        expect(tokenContrast(fg, bg, mode)).toBeGreaterThanOrEqual(NON_TEXT);
      });
    }
  }

  it('keeps a spilled day quieter than an unavailable one, in both modes', () => {
    // Not a WCAG threshold: the spilled days are inert, so 1.4.3 exempts them.
    // What is asserted is the ordering the primitive inverted in dark, where
    // gray-light/400 measured 7.90:1 — brighter than the weekday header.
    // Measured: text/inert 1.65 light / 1.60 dark; text/disabled 2.77 / 2.66.
    for (const mode of MODES) {
      expect(tokenContrast('text/inert', 'surface/overlay', mode), mode).toBeLessThan(
        tokenContrast('text/disabled', 'surface/overlay', mode),
      );
    }
  });

  it('cannot draw the focus ring on the selected fill, which is why it is offset', () => {
    // The measurement that rejected the drawing's own approach, kept as a test
    // so nobody re-adopts it. border/focus and interactive/accent are the same
    // value: a ring drawn on the fill is not a ring.
    for (const mode of MODES) {
      expect(tokenContrast('border/focus', 'interactive/accent', mode)).toBeLessThan(NON_TEXT);
    }
  });

  it('records the panel edge in light as carried by the shadow alone', () => {
    // Not a failure to fix — invariant 1 of the system working as designed.
    // Asserted so that a change to either token surfaces here rather than in
    // a screenshot. In dark, the panel also takes a border/default hairline,
    // as the dropdown menu does.
    expect(contrast(resolve('surface/overlay', 'light'), resolve('surface/raised', 'light')))
      .toBeCloseTo(1, 2);
    expect(contrast(resolve('surface/overlay', 'dark'), resolve('surface/raised', 'dark')))
      .toBeGreaterThan(1.1);
  });
});

describe('surface/scrim', () => {
  it('is the drawn wash in light: gray-light/200 at 95%', () => {
    // The Figma Overlay is gray-light/200 with the layer at 95% — read from
    // the exported PNG's alpha, 242/255. Not the black wash this token held.
    const wash = alphaPrimitives[theme['surface/scrim'].light as keyof typeof alphaPrimitives];
    expect(wash).toEqual({ hex: primitives['gray-light/200'], alpha: 0.95 });
  });

  it('keeps a dialog distinguishable from its backdrop in dark', () => {
    // Dark was never drawn. The literal mirror of the light wash,
    // gray-dark/600 at 95%, sits at 1.01:1 against surface/overlay — the
    // dialog would vanish into its own backdrop.
    const scrim = resolve('surface/scrim', 'dark', resolve('surface/base', 'dark'));
    expect(contrast(resolve('surface/overlay', 'dark'), scrim)).toBeGreaterThanOrEqual(1.4);
  });
});
