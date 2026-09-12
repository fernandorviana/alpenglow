import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { Swatch } from '@ui/Swatch';
import { theme, type ThemeTokenName, type Mode } from '@/tokens/theme';
import { resolve, contrast, lightness, tokenContrast } from '@/tokens/contrast';

/**
 * Every number on this page is computed from the tokens at render time, with
 * the functions the suite uses. The one table that is not — what the
 * reference systems do — was read from the package each one publishes, and
 * says so.
 */

const MODES: Mode[] = ['light', 'dark'];
const LADDER = ['surface/base', 'surface/raised', 'surface/overlay'] as const;
const SURFACES = ['surface/base', 'surface/raised', 'surface/overlay', 'surface/sunken'] as const;
const WASH = ['interactive/wash-hover', 'interactive/wash-pressed'] as const;

const f3 = (n: number) => (n >= 0 ? '+' : '−') + Math.abs(n).toFixed(3);
const f2 = (n: number) => n.toFixed(2);
const short = (t: ThemeTokenName) => t.split('/').slice(1).join('/');

/** ΔL of `token` over `ground`, signed: positive lightens. */
function lift(token: ThemeTokenName, ground: ThemeTokenName, mode: Mode) {
  const g = resolve(ground, mode);
  return lightness(resolve(token, mode, g)) - lightness(g);
}

function Ladder({ mode }: { mode: Mode }) {
  return (
    <div className="tableScroll">
      <table className="tokens">
        <thead>
          <tr>
            <th>Level</th>
            <th colSpan={2}>{mode}</th>
            <th>ΔL from below</th>
            <th>WCAG from below</th>
          </tr>
        </thead>
        <tbody>
          {[...LADDER].reverse().map((token, i, all) => {
            const below = all[i + 1];
            const hex = resolve(token, mode);
            return (
              <tr key={token}>
                <td>
                  <div className="tokenName">{short(token)}</div>
                  <div className="alias">{theme[token].use}</div>
                </td>
                <td><Swatch value={hex} /></td>
                <td><div className="alias">{theme[token][mode]} {hex}</div></td>
                <td className="ratioLine">{below ? f3(lightness(hex) - lightness(resolve(below, mode))) : '—'}</td>
                <td className="ratioLine">{below ? `${f2(contrast(hex, resolve(below, mode)))}:1` : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function WashTable({ mode }: { mode: Mode }) {
  return (
    <div className="tableScroll">
      <table className="tokens">
        <thead>
          <tr>
            <th>Over</th>
            {WASH.map((w) => (
              <th key={w} colSpan={3}>{short(w)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SURFACES.map((surface) => (
            <tr key={surface}>
              <td>
                <div className="tokenName">{short(surface)}</div>
                <div className="alias">{resolve(surface, mode)}</div>
              </td>
              {WASH.map((wash) => (
                <WashCell key={wash} wash={wash} surface={surface} mode={mode} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WashCell({ wash, surface, mode }: { wash: (typeof WASH)[number]; surface: (typeof SURFACES)[number]; mode: Mode }) {
  const ground = resolve(surface, mode);
  const hex = resolve(wash, mode, ground);
  return (
    <>
      <td><Swatch value={hex} /></td>
      <td>
        <div className="alias">{hex}</div>
        <div className="ratioLine">ΔL {f3(lightness(hex) - lightness(ground))}</div>
      </td>
      <td>
        <div className="alias">tertiary text</div>
        <Ratio fg={resolve('text/tertiary', mode)} bg={hex} />
      </td>
    </>
  );
}

function BorderTable() {
  return (
    <div className="tableScroll">
      <table className="tokens">
        <thead>
          <tr>
            <th>border/subtle over</th>
            <th colSpan={2}>Light</th>
            <th colSpan={2}>Dark</th>
          </tr>
        </thead>
        <tbody>
          {SURFACES.map((surface) => (
            <tr key={surface}>
              <td><div className="tokenName">{short(surface)}</div></td>
              {MODES.map((mode) => {
                const ground = resolve(surface, mode);
                const hex = resolve('border/subtle', mode, ground);
                return (
                  <td key={mode} colSpan={2}>
                    <span className="ratioLine">
                      <Swatch value={hex} /> {theme['border/subtle'][mode]} → {hex} · {f2(contrast(hex, ground))}:1
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * What the reference systems do, read from the package each one publishes on
 * 2026-09-12: Primer's dark theme CSS, the Atlassian tokens artefact, Radix
 * Colors and Themes, Spectrum's tokens JSON, Carbon's themes, Geist's
 * variables on vercel.com, shadcn's globals.css, UIKit's documented values,
 * Discord's and Notion's shipped CSS. ΔL is OKLCH lightness between adjacent
 * surface levels.
 */
const SURVEY = [
  { system: 'GitHub Primer', layers: 'opaque — inset #010409, default #0d1117, muted #151b23', states: '#656c76 at 20% hover, 25% active, on every transparent control', borders: 'default opaque; muted is default at 70%' },
  { system: 'Atlassian', layers: 'opaque — surface #242528, raised #2B2C2F, overlay #303134; ΔL .025–.029', states: '#E3E4F2 at 12% hover, #E5E9F6 at 25% pressed', borders: 'input border is #E3E4F2 at 12%' },
  { system: 'Radix Colors / Themes', layers: 'opaque gray 1–5, ΔL .028–.039; a translucent panel exists and requires backdrop blur', states: 'gray-a3 hover, gray-a4 active; the alpha scale is built so a3 over gray1 equals gray3', borders: 'steps 6–8 of the opaque scale' },
  { system: 'Adobe Spectrum', layers: 'opaque — base #111, layer-1 #1b1b1b, layer-2 #222; ΔL .024–.044', states: 'opaque scale; a transparent-white scale (11–21%) is reserved for content over images', borders: 'opaque' },
  { system: 'IBM Carbon g100', layers: 'opaque — #161616, #262626, #393939, #525252; ΔL .068–.094', states: 'layer-hover opaque #333; background-hover rgba(141,141,141,.16), selected .24', borders: 'opaque' },
  { system: 'Vercel Geist', layers: 'opaque — bg L 4%, gray 100–400 at L 10 / 12 / 16 / 18%', states: 'a separate gray-alpha scale: white at 6, 9, 13, 14, 24% in dark, black in light', borders: 'gray 400–600' },
  { system: 'shadcn/ui v4', layers: 'opaque — bg L .145, card .205, muted .269, accent .371', states: 'accent opaque', borders: 'white at 10%; input at 15%' },
  { system: 'Apple iOS', layers: 'opaque — #000, #1C1C1E, #2C2C2E, one step higher when elevated', states: 'systemFill rgba(120,120,128,.36) dark, .20 light — same ink, two alphas', borders: 'separator #545458 at 60%' },
  { system: 'Discord', layers: 'opaque — #1e1f22, #2b2d31, #313338', states: 'rgba(78,80,88,.3) hover, .6 selected', borders: 'white at 6%' },
  { system: 'Material 3', layers: 'opaque tonal roles: surface-container lowest…highest at N4 / N10 / N12 / N17 / N22', states: 'state layers: the content colour at a fixed opacity', borders: '—' },
] as const;

export default function Page() {
  const darkCard = resolve('surface/raised', 'dark');
  const step = (a: ThemeTokenName, b: ThemeTokenName) => lightness(resolve(a, 'dark')) - lightness(resolve(b, 'dark'));

  return (
    <DocPage
      evidence={
        <>
          <p>dark ladder, ΔL</p>
          <p>
            {f3(step('surface/raised', 'surface/base'))} · {f3(step('surface/overlay', 'surface/raised'))}
          </p>
          <p>was +.085 · +.085</p>
          <p>hovered row on a dark card</p>
          <p>ΔL {f3(lift('interactive/wash-hover', 'surface/raised', 'dark'))}</p>
          <p>was +.184</p>
          <p>references</p>
          <p>.025 to .045 per level</p>
          <p>+.05 to +.09 on hover</p>
        </>
      }
    >
      <h1>Elevation and states</h1>
      <p className="lead">
        Layers are opaque steps of a surface scale. Hover and pressed are a wash laid over
        whatever is beneath. Each is measured with the instrument that can see it.
      </p>

      <p>
        This page answers a question that came up on 2026-09-12: in dark mode, are panels,
        elevated surfaces and hovers done with white alphas or with a colour scale? The colour
        scales looked too strong. Eleven reference systems were read from the packages they
        publish, and they agree on a pattern the values below follow.
      </p>

      <h2>The ladder</h2>
      <p>
        Three levels in each mode. In light the shadow separates raised from overlay; in dark
        a shadow stops reading as height and the colour step does the work, so overlay is a
        lighter step. The dark steps are ΔL .043 in OKLCH, where the reference systems that
        read as calm place theirs — .025 to .045 — and where this system used to jump a whole
        stop, .085. <code>925</code> is the surface step added for this; it is aliased only
        here and in the <code>stone</code> ladder a neutral product would use instead.
      </p>
      <Ladder mode="light" />
      <Ladder mode="dark" />
      <p>
        <code>surface/sunken</code> shares the canvas in dark and sits ΔL{' '}
        {f3(step('surface/raised', 'surface/sunken'))} below a card. When a component runs out
        of levels — a popover inside a dialog — it stays on <code>overlay</code> and takes a
        border.
      </p>

      <h2>Why lightness, not the ratio</h2>
      <p>
        The WCAG ratio adds 0.05 to both luminances, which flattens the dark end: Radix&rsquo;s
        first two dark greys, <code>#111111</code> and <code>#191919</code>, are 1.06:1 apart
        and everyone sees the step. The step from the canvas to a card here is{' '}
        {f2(contrast(resolve('surface/base', 'dark'), darkCard))}:1. The suite used to hold the
        ladder to 1.09 and would have refused it while passing the .085 jump that looked wrong.
        Text on a surface and a boundary on a surface stay on the ratio, which is what WCAG
        asks of them; surface against surface — a ladder step, a well in a card, a wash — is
        measured in OKLCH lightness, with a floor of .035.
      </p>

      <h2>The wash</h2>
      <p>
        <code>interactive/wash-hover</code> and <code>wash-pressed</code> are{' '}
        <code>mist/500</code> at 8 and 16% in light, 12 and 20% in dark. One ink: it darkens a
        light surface with the faint cyan cast the light hover always had, and lightens a dark
        one. A control with no fill of its own — a row, a menu item, a ghost or outline
        button — sets its background to the wash; a control with a fill — the neutral button,
        the calendar&rsquo;s month buttons, a dialog&rsquo;s icon buttons — keeps it and lays
        the wash over it as a background image. The text beneath keeps its own token, and
        the tightest pair where rows and menu items live, <code>text/tertiary</code>, is read
        in the last column of each cell.
      </p>
      <WashTable mode="light" />
      <WashTable mode="dark" />
      <p>
        Every text token clears AA under both washes on base, raised and overlay in both modes,
        and under hover on sunken. Tertiary clears both on raised and overlay, where rows and
        menu items sit; on the canvas it clears hover and misses pressed by 0.22, and on a well
        it misses both. Nothing puts helper text on a washed control over those two surfaces,
        and the suite records the figures so that changes. The neutral button&rsquo;s label
        under the pressed wash is{' '}
        <Ratio fg={resolve('interactive/on-neutral', 'light')} bg={resolve('interactive/wash-pressed', 'light', resolve('interactive/neutral', 'light'))} /> light and{' '}
        <Ratio fg={resolve('interactive/on-neutral', 'dark')} bg={resolve('interactive/wash-pressed', 'dark', resolve('interactive/neutral', 'dark'))} /> dark.
      </p>
      <p>
        The menu keeps its own rule: the accent and danger rows hover to their own subtle
        surfaces. The neutral row takes the wash, on which the accent label would now be{' '}
        {f2(tokenContrast('text/accent', 'interactive/wash-hover', 'dark', 'surface/overlay'))}:1 in dark.
      </p>

      <h2>Borders</h2>
      <p>
        <code>border/subtle</code> is an alpha in both modes — <code>stone/950</code> at 8% in
        light, white at 16% in dark — so it reads on every surface without picking a stop above
        any of them. The opaque <code>stone/100</code> it replaced was the light sunken surface
        itself, invisible there; the <code>night/700</code> it replaced in dark was 1.97:1 on
        a card, twice the weight the references draw. <code>default</code> and{' '}
        <code>strong</code> stay opaque: one is a recorded exception, the other is the 3:1
        every form control relies on.
      </p>
      <BorderTable />

      <h2>What the references do</h2>
      <p>
        Read from each system&rsquo;s published package or stylesheet, not from its
        documentation prose. Layers are opaque in every one; transient states are alphas of a
        mid grey or a tinted near-white in most; borders are moving to alpha. Material 3
        dropped Material 2&rsquo;s white overlay per elevation for opaque tonal roles.
      </p>
      <div className="tableScroll">
        <table className="tokens">
          <thead>
            <tr>
              <th>System</th>
              <th>Layers</th>
              <th>Hover, pressed, selected</th>
              <th>Borders</th>
            </tr>
          </thead>
          <tbody>
            {SURVEY.map((row) => (
              <tr key={row.system}>
                <td><div className="tokenName">{row.system}</div></td>
                <td><div className="alias" style={{ whiteSpace: 'normal' }}>{row.layers}</div></td>
                <td><div className="alias" style={{ whiteSpace: 'normal' }}>{row.states}</div></td>
                <td><div className="alias" style={{ whiteSpace: 'normal' }}>{row.borders}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>What it cost</h2>
      <p>
        The dialog moved a step closer to its scrim: the darkest ink at 95% over the canvas
        is now{' '}
        {f2(contrast(resolve('surface/overlay', 'dark'), resolve('surface/scrim', 'dark', resolve('surface/base', 'dark'))))}:1
        below it, where it was 1.43. Nothing darker than the ink exists and a lighter scrim
        moves toward the dialog, so the edge is the border&rsquo;s, as it is for the menu —{' '}
        <code>border/default</code> is{' '}
        {f2(contrast(resolve('border/default', 'dark'), resolve('surface/scrim', 'dark', resolve('surface/base', 'dark'))))}:1
        against the scrim — with the shadow as reinforcement. The suite records the figure.
        Two token names left the theme, <code>interactive/neutral-hover</code> and{' '}
        <code>neutral-pressed</code>, and every dark surface value changed; the package went
        to <code>0.2.0</code>.
      </p>
    </DocPage>
  );
}
