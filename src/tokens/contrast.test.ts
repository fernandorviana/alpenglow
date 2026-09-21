import { describe, it, expect } from 'vitest';
import { theme, type ThemeTokenName, type Mode } from './theme';
import { resolve, contrast, lightness, tokenContrast, AA_NORMAL, NON_TEXT, SURFACE_STEP } from './contrast';
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
  // Placeholder is in this list, not among the exemptions: it is the same stop
  // as tertiary. The next stop up, stone/500, is 3.57:1 on white, and a
  // placeholder is text.
  const TEXT = ['text/primary', 'text/secondary', 'text/tertiary', 'text/placeholder', 'text/accent',
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
    'text/disabled': { light: 2.39, dark: 3.36 },
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
  // dark is 3.03 rather than 3.36, and that is the surface the DropdownMenu
  // uses. It was 2.30 while the overlay was night/800.
  const EXPECTED: Record<Mode, number> = { light: 2.39, dark: 3.03 };
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
  // is the design decision, not a property of the token names. The neutral
  // row takes the wash, measured over the menu's own surface.
  const PAIRS = [
    ['text/accent',  'surface/accent-subtle'],
    ['text/danger',  'surface/danger-subtle'],
  ] as const;

  for (const mode of MODES) {
    for (const [fg, bg] of PAIRS) {
      it(`${fg} on ${bg} — ${mode}`, () => {
        expect(tokenContrast(fg, bg, mode)).toBeGreaterThanOrEqual(AA_NORMAL);
      });
    }
    it(`text/primary on the washed neutral row — ${mode}`, () => {
      expect(tokenContrast('text/primary', 'interactive/wash-hover', mode, 'surface/overlay')).toBeGreaterThanOrEqual(AA_NORMAL);
    });
  }

  it('records the accent row on the neutral wash, which passes with a margin now', () => {
    // This pairing was 3.50:1 on the opaque neutral fill when the per-tone
    // hover rule was made, 4.59 after the deeper dark tail, and 7.86 on the
    // wash over the overlay. The rule stays — a tone's row hovers to its own
    // subtle surface because that is the design — and the figure is recorded
    // so a change to the wash shows up here rather than in a screenshot.
    expect(tokenContrast('text/accent', 'interactive/wash-hover', 'dark', 'surface/overlay')).toBeCloseTo(7.86, 1);
    expect(tokenContrast('text/accent', 'interactive/wash-hover', 'light', 'surface/overlay')).toBeCloseTo(5.5, 1);
  });
});

describe('the wash', () => {
  // A state layer, not a fill. It composites over whatever is beneath, so it
  // is measured over every surface it can land on, and the text beneath it
  // keeps its own token and is measured there too.
  const WASH = ['interactive/wash-hover', 'interactive/wash-pressed'] as const;

  for (const mode of MODES) {
    it(`is visible over every surface, and pressed goes further than hover — ${mode}`, () => {
      for (const surface of SURFACES) {
        const ground = resolve(surface, mode);
        const hover = lightness(resolve('interactive/wash-hover', mode, ground)) - lightness(ground);
        const pressed = lightness(resolve('interactive/wash-pressed', mode, ground)) - lightness(ground);
        // Light darkens, dark lightens: the sign is the mode's.
        const sign = mode === 'light' ? -1 : 1;
        expect(sign * hover, `hover over ${surface} (${mode})`).toBeGreaterThanOrEqual(0.02);
        expect(sign * pressed, `pressed over ${surface} (${mode})`).toBeGreaterThan(sign * hover);
      }
    });

    it(`every text token but tertiary clears AA under both washes on base, raised and overlay — ${mode}`, () => {
      const TEXT = ['text/primary', 'text/secondary', 'text/accent', 'text/success', 'text/warning', 'text/danger', 'text/info'] as const;
      for (const wash of WASH) {
        for (const surface of ['surface/base', 'surface/raised', 'surface/overlay'] as const) {
          for (const text of TEXT) {
            expect(tokenContrast(text, wash, mode, surface), `${text} under ${wash} over ${surface} (${mode})`).toBeGreaterThanOrEqual(AA_NORMAL);
          }
        }
      }
    });

    it(`and under the hover wash on a well — ${mode}`, () => {
      // Pressed over sunken is the one cell where a status colour dips:
      // text/accent is 4.38 there in light, recorded below. No control that
      // can be pressed sits on a well today.
      const TEXT = ['text/primary', 'text/secondary', 'text/accent', 'text/success', 'text/warning', 'text/danger', 'text/info'] as const;
      for (const text of TEXT) {
        expect(tokenContrast(text, 'interactive/wash-hover', mode, 'surface/sunken'), `${text} (${mode})`).toBeGreaterThanOrEqual(AA_NORMAL);
      }
    });

    it(`tertiary text clears AA under both washes where rows and menu items live — ${mode}`, () => {
      for (const wash of WASH) {
        for (const surface of ['surface/raised', 'surface/overlay'] as const) {
          expect(tokenContrast('text/tertiary', wash, mode, surface), `under ${wash} over ${surface}`).toBeGreaterThanOrEqual(AA_NORMAL);
        }
      }
    });

    it(`the neutral button's label clears AA under both washes — ${mode}`, () => {
      for (const wash of WASH) {
        expect(tokenContrast('interactive/on-neutral', wash, mode, 'interactive/neutral'), wash).toBeGreaterThanOrEqual(AA_NORMAL);
      }
    });
  }

  it('records tertiary text under the light washes on the canvas and on a well', () => {
    // Where the guarantee stops. Nothing today puts helper text on a washed
    // control over base or sunken; if something does, these are its figures,
    // and an edit to the wash that moves them has to be deliberate.
    expect(tokenContrast('text/tertiary', 'interactive/wash-hover', 'light', 'surface/base')).toBeCloseTo(4.64, 1);
    expect(tokenContrast('text/tertiary', 'interactive/wash-pressed', 'light', 'surface/base')).toBeCloseTo(4.28, 1);
    expect(tokenContrast('text/tertiary', 'interactive/wash-hover', 'light', 'surface/sunken')).toBeCloseTo(4.27, 1);
    expect(tokenContrast('text/tertiary', 'interactive/wash-pressed', 'light', 'surface/sunken')).toBeCloseTo(3.94, 1);
    expect(tokenContrast('text/accent', 'interactive/wash-pressed', 'light', 'surface/sunken')).toBeCloseTo(4.38, 1);
  });

  it('is gentler than the opaque hover it replaced, in the place that was worst', () => {
    // A row on a dark card hovered to stone/700: ΔL +.184 against the
    // references' +.05 to +.09. Now +.057. Recorded so the wash cannot
    // drift back up.
    const card = resolve('surface/raised', 'dark');
    const hovered = resolve('interactive/wash-hover', 'dark', card);
    expect(lightness(hovered) - lightness(card)).toBeCloseTo(0.057, 2);
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

  /**
   * Pairs that are knowingly below AA, held at the figure they were accepted
   * at. Empty since the shared-lightness ramps: the success ladder used to
   * hold one (a dark label on the light pressed green, 3.36:1), and the
   * mechanism stays so the next exemption is recorded rather than waved.
   */
  const EXEMPT: Record<string, { ratio: number; why: string }> = {};

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
      // Surface against surface: measured in lightness, like the ladder.
      const step = Math.abs(lightness(resolve(BOX_FILL, mode)) - lightness(resolve('surface/raised', mode)));
      expect(step).toBeGreaterThanOrEqual(SURFACE_STEP);
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
  // border/subtle used to be checked on raised and overlay only: as stone/100
  // it was the same primitive as the light sunken surface, and in dark it had
  // to pick a stop above the overlay. As an alpha it reads on every surface,
  // so it is checked on every surface.
  const MIN_VISIBLE = 1.1;

  const SCOPED: ReadonlyArray<readonly [ThemeTokenName, readonly ThemeTokenName[]]> = [
    ['border/subtle',  SURFACES],
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
  // Three colour steps, 950 → 925 → 900. Sunken is not a fourth: the ramp
  // ends at 950, so in dark a well shares the canvas and reads as recessed
  // only inside a raised surface — on the canvas it takes a border. A
  // twentieth step was measured and refused (see primitives.ts), so this is
  // asserted as equality rather than left to look like an oversight.
  //
  // Steps are measured in OKLCH lightness, not in the WCAG ratio. The ratio
  // flattens the dark end: the 950 → 925 step is 1.08:1 and plainly visible,
  // and the 1.09 floor this suite used to hold would have refused it while
  // passing the old ΔL .085 jump that looked wrong. See contrast.ts.
  const LADDER = ['surface/base', 'surface/raised', 'surface/overlay'] as const;

  it('sunken shares the canvas, and is still recessed inside a card', () => {
    expect(resolve('surface/sunken', 'dark')).toBe(resolve('surface/base', 'dark'));
    const step = lightness(resolve('surface/raised', 'dark')) - lightness(resolve('surface/sunken', 'dark'));
    expect(step).toBeGreaterThanOrEqual(SURFACE_STEP);
  });

  /** Adjacent pairs, so the loop never indexes past the end. */
  const STEPS = LADDER.flatMap((from, i) => {
    const to = LADDER[i + 1];
    return to ? [[from, to] as const] : [];
  });

  it('each step is lighter than the one below it, by at least a surface step', () => {
    for (const [from, to] of STEPS) {
      const step = lightness(resolve(to, 'dark')) - lightness(resolve(from, 'dark'));
      expect(step, `${from} -> ${to}`).toBeGreaterThanOrEqual(SURFACE_STEP);
    }
  });

  it('holds the steps where the references put theirs', () => {
    // Radix, Atlassian, Spectrum and Geist place adjacent surface levels at
    // ΔL .025–.045. Both steps are .043; the ceiling keeps the ladder from
    // drifting back toward the .085 of one whole stop.
    for (const [from, to] of STEPS) {
      const step = lightness(resolve(to, 'dark')) - lightness(resolve(from, 'dark'));
      expect(step, `${from} -> ${to}`).toBeLessThanOrEqual(0.05);
    }
  });
});

describe('tabs read in every variant and every state', () => {
  const WASH = ['interactive/wash-hover', 'interactive/wash-pressed'] as const;

  for (const mode of MODES) {
    it(`the selected pill's count reads on its own fill — ${mode}`, () => {
      // Drawn as text/inverse on interactive/selected: white on twilight/050,
      // an empty circle in the file's own render. The fill is kept, the text
      // corrected. 5.53 light, 9.64 dark.
      expect(tokenContrast('text/accent', 'interactive/selected', mode)).toBeGreaterThanOrEqual(AA_NORMAL);
    });

    it(`the selected pill's label reads while hovered and pressed — ${mode}`, () => {
      for (const wash of WASH) {
        expect(tokenContrast('text/inverse', wash, mode, 'surface/inverse'), wash).toBeGreaterThanOrEqual(AA_NORMAL);
      }
    });

    it(`a segment's label reads under both washes on the track — ${mode}`, () => {
      // The track is a well, where tertiary is recorded as failing under the
      // wash. That is why a segment's resting label is secondary.
      for (const wash of WASH) {
        expect(tokenContrast('text/secondary', wash, mode, 'surface/sunken'), wash).toBeGreaterThanOrEqual(AA_NORMAL);
      }
    });

    it(`an unselected pill's label reads under both washes — ${mode}`, () => {
      for (const wash of WASH) {
        expect(tokenContrast('text/primary', wash, mode, 'surface/sunken'), wash).toBeGreaterThanOrEqual(AA_NORMAL);
      }
    });

    it(`the underline tab's bar is a non-text indicator on every surface — ${mode}`, () => {
      for (const surface of ['surface/base', 'surface/raised', 'surface/overlay'] as const) {
        expect(tokenContrast('border/accent', surface, mode), surface).toBeGreaterThanOrEqual(NON_TEXT);
      }
    });

    it(`the thumb sits above its track, and above a card it may stand on — ${mode}`, () => {
      // surface/overlay. In dark the shadow does no separating (invariant 10);
      // the steps do. In light overlay and raised are both white, and the
      // shadow is what lifts the thumb off a card there.
      const thumb = lightness(resolve('surface/overlay', mode));
      expect(thumb - lightness(resolve('surface/sunken', mode))).toBeGreaterThanOrEqual(SURFACE_STEP);
      if (mode === 'dark') expect(thumb - lightness(resolve('surface/raised', mode))).toBeGreaterThanOrEqual(SURFACE_STEP);
    });

    it(`the selected segment's label reads on the thumb — ${mode}`, () => {
      expect(tokenContrast('text/accent', 'surface/overlay', mode)).toBeGreaterThanOrEqual(AA_NORMAL);
    });
  }

  it('the unselected pill takes a border in dark, where its fill is the canvas', () => {
    expect(resolve('surface/sunken', 'dark')).toBe(resolve('surface/base', 'dark'));
    expect(tokenContrast('border/default', 'surface/base', 'dark')).toBeGreaterThanOrEqual(NON_TEXT);
    expect(tokenContrast('border/default', 'surface/raised', 'dark')).toBeGreaterThanOrEqual(NON_TEXT);
  });
});

describe('a tooltip reads, and stands off what it floats over', () => {
  for (const mode of MODES) {
    it(`its text, its description and its shortcut — ${mode}`, () => {
      // The surface loop above covers the first two; named here so the
      // Tooltip's pairs can be found by its name.
      expect(tokenContrast('text/primary', 'surface/overlay', mode)).toBeGreaterThanOrEqual(AA_NORMAL);
      expect(tokenContrast('text/tertiary', 'surface/overlay', mode)).toBeGreaterThanOrEqual(AA_NORMAL);
      expect(tokenContrast('text/secondary', 'surface/sunken', mode)).toBeGreaterThanOrEqual(AA_NORMAL);
    });
  }

  it('dark: a surface step above a card and above the canvas', () => {
    const panel = lightness(resolve('surface/overlay', 'dark'));
    expect(panel - lightness(resolve('surface/raised', 'dark'))).toBeGreaterThanOrEqual(SURFACE_STEP);
    expect(panel - lightness(resolve('surface/base', 'dark'))).toBeGreaterThanOrEqual(SURFACE_STEP);
  });

  it('light: the card\'s own white, so the shadow and the edge do the separating', () => {
    expect(resolve('surface/overlay', 'light')).toBe(resolve('surface/raised', 'light'));
  });

  it('records its edge, which is decorative and expected to change', () => {
    // Fernando, 2026-09-19: border/default is too strong for a tooltip, and
    // more border tokens are to come from the colour tests in Figma. The
    // drawn stone/200 is 1.36 on this surface; the new token belongs between
    // these two. Recorded, not held to a floor: the panel has a shadow in
    // light and a surface step in dark, and the edge carries neither.
    const edge = (token: 'border/subtle' | 'border/default', mode: Mode) =>
      Number(tokenContrast(token, 'surface/overlay', mode, 'surface/overlay').toFixed(2));
    expect([edge('border/subtle', 'light'), edge('border/subtle', 'dark')]).toEqual([1.18, 1.65]);
    expect([edge('border/default', 'light'), edge('border/default', 'dark')]).toEqual([1.72, 2.97]);
  });
});

describe('a toast reads on the inverse surface, and is seen over any other', () => {
  const WASHES = ['interactive/wash-hover', 'interactive/wash-pressed'] as const;

  for (const mode of MODES) {
    it(`its text, at rest and under both washes — ${mode}`, () => {
      expect(tokenContrast('text/inverse', 'surface/inverse', mode)).toBeGreaterThanOrEqual(AA_NORMAL);
      for (const wash of WASHES) {
        expect(tokenContrast('text/inverse', wash, mode, 'surface/inverse'), wash).toBeGreaterThanOrEqual(AA_NORMAL);
      }
    });

    it(`the wash is a step on it: lighter in light, darker in dark — ${mode}`, () => {
      const rest = resolve('surface/inverse', mode);
      const hover = resolve('interactive/wash-hover', mode, rest);
      expect(Math.abs(lightness(hover) - lightness(rest))).toBeGreaterThanOrEqual(SURFACE_STEP);
    });

    it(`it is a boundary against every surface it floats over — ${mode}`, () => {
      for (const under of ['surface/base', 'surface/raised', 'surface/overlay'] as const) {
        expect(tokenContrast('surface/inverse', under, mode), under).toBeGreaterThanOrEqual(NON_TEXT);
      }
    });
  }

  it('records why its focus ring is currentColor and not border/focus', () => {
    // In dark the inverse surface is a near-white block and the focus colour
    // was chosen against dark ones. The ring takes text/inverse instead.
    const ring = (mode: Mode) => Number(tokenContrast('border/focus', 'surface/inverse', mode).toFixed(2));
    expect([ring('light'), ring('dark')]).toEqual([4.96, 1.64]);
    expect(ring('dark')).toBeLessThan(NON_TEXT);
  });
});

describe('an alert reads on its tint, and is found on a card', () => {
  const TONES = ['info', 'success', 'warning', 'danger'] as const;
  const surface = (tone: (typeof TONES)[number]) => `surface/${tone}-subtle` as const;

  for (const mode of MODES) {
    it(`its text, at rest and under the wash its buttons take — ${mode}`, () => {
      for (const tone of TONES) {
        expect(tokenContrast(`text/${tone}`, surface(tone), mode), tone).toBeGreaterThanOrEqual(AA_NORMAL);
        for (const wash of ['interactive/wash-hover', 'interactive/wash-pressed'] as const) {
          expect(tokenContrast(`text/${tone}`, wash, mode, surface(tone)), `${tone} ${wash}`).toBeGreaterThanOrEqual(AA_NORMAL);
        }
      }
    });

    it(`the focus ring on every tint — ${mode}`, () => {
      for (const tone of TONES) {
        expect(tokenContrast('border/focus', surface(tone), mode), tone).toBeGreaterThanOrEqual(NON_TEXT);
      }
    });
  }

  it('dark: every tint is a surface step above a card', () => {
    const card = lightness(resolve('surface/raised', 'dark'));
    for (const tone of TONES) {
      expect(lightness(resolve(surface(tone), 'dark')) - card, tone).toBeGreaterThanOrEqual(SURFACE_STEP);
    }
  });

  it('records its soft edges, which are decorative', () => {
    // Fernando, 2026-09-20: all four soft, over completing the 600 family.
    // Light is the drawn stops; dark is */700, stronger as every border in
    // the theme is in dark. In light the tint has the canvas's own lightness,
    // so on the canvas the hue and this edge are what find it.
    const edges = (mode: Mode) =>
      TONES.map((tone) => Number(tokenContrast(`border/${tone}-subtle`, surface(tone), mode).toFixed(2)));
    expect(edges('light')).toEqual([1.25, 1.26, 1.6, 1.29]);
    expect(edges('dark')).toEqual([2.05, 2.05, 1.99, 1.9]);
  });
});

describe('pagination: the numbers read under the wash, and the bar is seen', () => {
  const GROUNDS = ['surface/base', 'surface/raised'] as const;

  for (const mode of MODES) {
    it(`a page number, current or not, at rest and hovered — ${mode}`, () => {
      // The wash suite covers these; named so the Pagination's pairs are findable.
      for (const ground of GROUNDS) {
        for (const text of ['text/primary', 'text/secondary'] as const) {
          expect(tokenContrast(text, ground, mode), `${text} on ${ground}`).toBeGreaterThanOrEqual(AA_NORMAL);
          expect(tokenContrast(text, 'interactive/wash-pressed', mode, ground), `${text} pressed`).toBeGreaterThanOrEqual(AA_NORMAL);
        }
      }
    });

    it(`the bar under the current page is a boundary — ${mode}`, () => {
      for (const ground of GROUNDS) {
        expect(tokenContrast('border/accent', ground, mode), ground).toBeGreaterThanOrEqual(NON_TEXT);
      }
    });
  }
});

describe('card: a filled step under a raised ground', () => {
  const FILL = 'surface/sunken';

  for (const mode of MODES) {
    it(`is a surface step under surface/raised — ${mode}`, () => {
      const step = lightness(resolve('surface/raised', mode)) - lightness(resolve(FILL, mode));
      expect(step).toBeGreaterThanOrEqual(SURFACE_STEP);
    });

    it(`its title and its captions read, at rest and under the wash — ${mode}`, () => {
      for (const text of ['text/primary', 'text/secondary'] as const) {
        expect(tokenContrast(text, FILL, mode), text).toBeGreaterThanOrEqual(AA_NORMAL);
        expect(tokenContrast(text, 'interactive/wash-hover', mode, FILL), `${text} hovered`).toBeGreaterThanOrEqual(AA_NORMAL);
      }
      expect(tokenContrast('text/tertiary', FILL, mode), 'text/tertiary').toBeGreaterThanOrEqual(AA_NORMAL);
    });

    it(`the focus ring is seen against the ground the card stands on — ${mode}`, () => {
      expect(tokenContrast('border/focus', 'surface/raised', mode)).toBeGreaterThanOrEqual(NON_TEXT);
    });
  }

  // The drawn captions are tertiary. On this fill, under the wash, light falls
  // short of 4.5, so the captions of a linked card are secondary. Recorded so
  // that a change to the wash or to stone/600 is seen here.
  it('text/tertiary does not hold under the wash in light: a linked card’s captions are secondary', () => {
    expect(tokenContrast('text/tertiary', 'interactive/wash-hover', 'light', FILL)).toBeCloseTo(4.27, 1);
    expect(tokenContrast('text/tertiary', 'interactive/wash-hover', 'dark', FILL)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it('is the canvas in dark, which is why it does not stand on it', () => {
    expect(resolve(FILL, 'dark')).toBe(resolve('surface/base', 'dark'));
  });
});

describe('link: the accent reads on every ground, and does not stand apart from the words by colour', () => {
  for (const mode of MODES) {
    it(`text/accent clears AA on the three grounds a sentence stands on — ${mode}`, () => {
      for (const ground of ['surface/base', 'surface/raised', 'surface/sunken'] as const) {
        expect(tokenContrast('text/accent', ground, mode), ground).toBeGreaterThanOrEqual(AA_NORMAL);
      }
    });
  }

  // Decided 2026-09-21 (docs/superpowers/specs/2026-09-21-link-design.md): no
  // line at rest. These four are why colour cannot be the cue, and the Medium
  // weight is. Recorded so that a theme that reaches 3:1 is noticed, and the
  // decision looked at again.
  it.each([
    ['text/primary', 'light', 2.73],
    ['text/primary', 'dark', 1.64],
    ['text/secondary', 'light', 2.06],
    ['text/secondary', 'dark', 1.03],
  ] as const)('text/accent against %s in %s is %s:1, under the 3:1 colour alone would need', (text, mode, ratio) => {
    const measured = contrast(resolve('text/accent', mode), resolve(text, mode));
    expect(measured).toBeCloseTo(ratio, 1);
    expect(measured).toBeLessThan(NON_TEXT);
  });
});

describe('popover: a panel on the overlay surface, a level above a menu', () => {
  for (const mode of MODES) {
    it(`its title, its words and its links read on surface/overlay — ${mode}`, () => {
      for (const text of ['text/primary', 'text/secondary', 'text/accent'] as const) {
        expect(tokenContrast(text, 'surface/overlay', mode), text).toBeGreaterThanOrEqual(AA_NORMAL);
      }
    });

    it(`the focus ring of what it holds is seen on it — ${mode}`, () => {
      expect(tokenContrast('border/focus', 'surface/overlay', mode)).toBeGreaterThanOrEqual(NON_TEXT);
    });
  }

  it('takes its edge from the border in dark, as the menu does, against the canvas and a card', () => {
    for (const ground of ['surface/base', 'surface/raised'] as const) {
      expect(tokenContrast('border/default', ground, 'dark'), ground).toBeGreaterThanOrEqual(2.9);
    }
  });
});

describe('select: the field, and the list on the overlay surface', () => {
  for (const mode of MODES) {
    it(`the value and the placeholder read on the field's fill — ${mode}`, () => {
      expect(tokenContrast('text/primary', 'interactive/neutral', mode)).toBeGreaterThanOrEqual(AA_NORMAL);
      expect(tokenContrast('text/placeholder', 'interactive/neutral', mode)).toBeGreaterThanOrEqual(AA_NORMAL);
    });

    it(`an option, its second line and what cannot be chosen — ${mode}`, () => {
      expect(tokenContrast('text/primary', 'surface/overlay', mode)).toBeGreaterThanOrEqual(AA_NORMAL);
      expect(tokenContrast('text/secondary', 'surface/overlay', mode)).toBeGreaterThanOrEqual(AA_NORMAL);
      expect(tokenContrast('text/primary', 'interactive/wash-hover', mode, 'surface/overlay')).toBeGreaterThanOrEqual(AA_NORMAL);
    });

    it(`the check and the chevron, which are shapes, are seen — ${mode}`, () => {
      expect(tokenContrast('text/accent', 'surface/overlay', mode)).toBeGreaterThanOrEqual(NON_TEXT);
      expect(tokenContrast('text/accent', 'interactive/wash-hover', mode, 'surface/overlay')).toBeGreaterThanOrEqual(NON_TEXT);
      expect(tokenContrast('text/accent', 'interactive/neutral', mode)).toBeGreaterThanOrEqual(NON_TEXT);
    });
  }
});

describe('tag: a capsule on a card, and the same capsule in a field', () => {
  for (const mode of MODES) {
    it(`its words, its button and the button's ring read on the sunken fill — ${mode}`, () => {
      expect(tokenContrast('text/primary', 'surface/sunken', mode)).toBeGreaterThanOrEqual(AA_NORMAL);
      expect(tokenContrast('text/secondary', 'surface/sunken', mode)).toBeGreaterThanOrEqual(AA_NORMAL);
      expect(tokenContrast('text/secondary', 'interactive/wash-hover', mode, 'surface/sunken')).toBeGreaterThanOrEqual(AA_NORMAL);
      expect(tokenContrast('border/focus', 'surface/sunken', mode)).toBeGreaterThanOrEqual(NON_TEXT);
    });
  }

  // The fill alone is a faint edge, and in dark on a card it is the step the
  // Card has. It is not a boundary: the capsule's words are what is read.
  // Recorded so a change to the ramp is seen here.
  it('is a surface step from a card in dark, and says so', () => {
    const step = lightness(resolve('surface/raised', 'dark')) - lightness(resolve('surface/sunken', 'dark'));
    expect(step).toBeGreaterThanOrEqual(SURFACE_STEP);
  });
});

describe('drawer: a panel over the page, or beside it', () => {
  for (const mode of MODES) {
    it(`its words read on both of its surfaces, and its handle is seen on them — ${mode}`, () => {
      for (const surface of ['surface/overlay', 'surface/raised'] as const) {
        expect(tokenContrast('text/primary', surface, mode)).toBeGreaterThanOrEqual(AA_NORMAL);
        expect(tokenContrast('text/secondary', surface, mode)).toBeGreaterThanOrEqual(AA_NORMAL);
        // The handle is nothing at rest; under the pointer and with the focus
        // it is a line that has to be seen.
        expect(tokenContrast('border/strong', surface, mode)).toBeGreaterThanOrEqual(NON_TEXT);
        expect(tokenContrast('border/focus', surface, mode)).toBeGreaterThanOrEqual(NON_TEXT);
      }
    });
  }
});

describe('combobox: tags on the field, and a checkbox before an option', () => {
  for (const mode of MODES) {
    it(`a tag's words read on the raised surface it is cut from — ${mode}`, () => {
      expect(tokenContrast('text/primary', 'surface/raised', mode)).toBeGreaterThanOrEqual(AA_NORMAL);
      expect(tokenContrast('text/secondary', 'surface/raised', mode)).toBeGreaterThanOrEqual(AA_NORMAL);
    });

    it(`the box is seen on the list, empty and checked — ${mode}`, () => {
      expect(tokenContrast('border/strong', 'surface/overlay', mode)).toBeGreaterThanOrEqual(NON_TEXT);
      expect(tokenContrast('interactive/accent', 'surface/overlay', mode)).toBeGreaterThanOrEqual(NON_TEXT);
      expect(tokenContrast('interactive/on-accent', 'interactive/accent', mode)).toBeGreaterThanOrEqual(NON_TEXT);
    });
  }
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
    // The wash is not a fill: it has no label of its own, the text beneath it
    // keeps its token, and `the wash` above measures it there.
    const fills = Object.keys(theme).filter(
      (k) => k.startsWith('interactive/') && !k.includes('/on-') && !k.endsWith('selected') && !k.includes('/wash-'),
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
  // As an alpha the separator reads on the sunken surface too, which stone/100
  // did not (1.00:1 there); the dark figure came down from 1.97 toward the
  // 1.5 the reference systems draw.
  const SEPARATOR = { light: 1.18, dark: 1.62 } as const;

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

  it('the pagination chevron clears AA on its washed fill, in both modes', () => {
    for (const mode of MODES) {
      expect(tokenContrast('interactive/on-neutral', 'interactive/wash-hover', mode, 'interactive/neutral'), mode).toBeGreaterThanOrEqual(AA_NORMAL);
    }
  });

  it('keeps a spilled day quieter than an unavailable one, in both modes', () => {
    // Not a WCAG threshold: the spilled days are inert, so 1.4.3 exempts them.
    // What is asserted is the ordering the drawn primitive inverted in dark,
    // where its light grey measured 7.90:1 — brighter than the weekday header.
    // Measured: text/inert 1.72 light / 1.97 dark; text/disabled 2.39 / 3.03.
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
    expect(lightness(resolve('surface/overlay', 'dark')) - lightness(resolve('surface/raised', 'dark')))
      .toBeGreaterThanOrEqual(SURFACE_STEP);
  });
});

describe('surface/scrim', () => {
  it('is the drawn wash in light: the neutral 200 at 95%', () => {
    // The Figma Overlay is the neutral ramp's 200 with the layer at 95% — read
    // from the exported PNG's alpha, 242/255. Not the black wash this token held.
    const wash = alphaPrimitives[theme['surface/scrim'].light as keyof typeof alphaPrimitives];
    expect(wash).toEqual({ hex: primitives['stone/200'], alpha: 0.95 });
  });

  it('records the dialog against its backdrop in dark', () => {
    // Dark was never drawn. The literal mirror of the light wash, the overlay
    // colour at 95%, sits within 1.01:1 of surface/overlay — the dialog would
    // vanish into its own backdrop — so the scrim is the darkest ink at 95%.
    // With the overlay at night/900 the dialog is 1.19:1 above it (1.43 while
    // the overlay was night/800). Nothing darker than the ink exists and a
    // lighter scrim moves toward the dialog, so the edge is the border's,
    // as it is for the menu: border/default is 2.97 against the dialog and
    // 3.5 against the scrim. Recorded, so a move in either direction is
    // deliberate.
    const scrim = resolve('surface/scrim', 'dark', resolve('surface/base', 'dark'));
    expect(contrast(resolve('surface/overlay', 'dark'), scrim)).toBeCloseTo(1.19, 1);
    expect(contrast(resolve('border/default', 'dark'), scrim)).toBeGreaterThanOrEqual(NON_TEXT);
  });
});
