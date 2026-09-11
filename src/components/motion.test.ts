import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { readCss } from '@/test/css';

/**
 * Transitions and one-shot animations take their timing from the motion
 * tokens, so how fast the interface answers is one decision rather than a
 * search. A loop is exempt: the Loader's cycle and its curves were measured for
 * that arc, and are part of its drawing rather than a pace the rest of the
 * interface shares.
 *
 * jsdom runs no transitions, so the test reads the declarations.
 */

const stylesheets = [
  ...readdirSync('src/components', { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.module.css'))
    .map((file) => join('src/components', file)),
  'app/docs.css',
];

const TIME = /(?<![\w-])\d*\.?\d+m?s(?![\w-])/;
const CURVE =
  /(?<![\w-])(?:ease(?:-in|-out|-in-out)?|linear|cubic-bezier|steps|step-start|step-end)(?![\w-])/;

/** Splits on the commas that separate items, not the ones inside `cubic-bezier(…)`. */
function items(value: string) {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < value.length; i++) {
    if (value[i] === '(') depth++;
    else if (value[i] === ')') depth--;
    else if (value[i] === ',' && depth === 0) {
      parts.push(value.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(value.slice(start));
  return parts.map((part) => part.trim()).filter(Boolean);
}

/** Every item of every transition and animation declaration outside `@keyframes`. */
function timings(css: string) {
  const outsideKeyframes = css.replace(/@keyframes[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
  return [
    ...outsideKeyframes.matchAll(
      /(?<![\w-])((?:transition|animation)(?:-duration|-timing-function|-delay)?)\s*:\s*([^;{}]+)/g,
    ),
  ].flatMap(([, property, value]) => items(value!).map((item) => ({ property: property!, item })));
}

function hardCoded(css: string) {
  return timings(css)
    .filter(({ property, item }) => !(property.startsWith('animation') && /\binfinite\b/.test(item)))
    .filter(({ item }) => {
      const literal = item.replace(/var\([^()]*\)/g, '');
      return TIME.test(literal) || CURVE.test(literal);
    })
    .map(({ property, item }) => `${property}: ${item}`);
}

describe('motion comes from the tokens', () => {
  it('finds a written duration or curve, and lets tokens and loops through', () => {
    expect(hardCoded('.a { transition: color 120ms ease, border-color 0.2s linear; }')).toEqual([
      'transition: color 120ms ease',
      'transition: border-color 0.2s linear',
    ]);
    expect(hardCoded('.a { animation: appear var(--ap-motion-duration-fade) cubic-bezier(0, 0, 1, 1); }')).toHaveLength(1);
    expect(hardCoded('.a { transition-duration: 140ms; }')).toHaveLength(1);

    expect(
      hardCoded('.a { transition: color var(--ap-motion-duration-fade) var(--ap-motion-easing-standard); }'),
    ).toEqual([]);
    expect(hardCoded('.a { transition: none; }')).toEqual([]);
    expect(hardCoded('.a { animation: spin 1.5s linear infinite; }')).toEqual([]);
    expect(hardCoded('@keyframes dash { 0% { animation-timing-function: cubic-bezier(0.45, 0, 0.4, 1); } }')).toEqual([]);
  });

  it.each(stylesheets)('%s writes no duration or curve by hand', (file) => {
    expect(hardCoded(readCss(file))).toEqual([]);
  });

  it('gives a transition that moves something the travel duration', () => {
    // A knob crossing its track takes a little longer than a colour changing
    // in place. Whatever changes alongside the move — the track's colour —
    // shares its duration, but only the move itself can be read from the rule.
    const moves = stylesheets.flatMap((file) =>
      timings(readCss(file))
        .filter(({ property, item }) => property === 'transition' && /^transform\b/.test(item))
        .map(({ item }) => `${file}: ${item}`),
    );

    expect(moves.length, 'the Switch and the theme toggle both slide').toBeGreaterThanOrEqual(2);
    for (const move of moves) {
      expect(move).toContain('var(--ap-motion-duration-travel)');
    }
  });
});
