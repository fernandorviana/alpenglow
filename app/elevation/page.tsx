import { Fragment } from 'react';
import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { Swatch } from '@ui/Swatch';
import { Table, type Column } from '@/components/Table';
import { theme, type ThemeTokenName, type Mode } from '@/tokens/theme';
import { composite, contrast, hexToRgb, lightness, resolve, rgbToHex, tokenContrast } from '@/tokens/contrast';
import { elevation, type ElevationName } from '@/tokens/elevation';
import { alphaPrimitives } from '@/tokens/primitives';
import { radius, spacing } from '@/tokens/scale';

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

/**
 * The level names the row, with its use; its value in the mode ranks next,
 * then the lightness from the level below — the instrument this page argues
 * for — and the WCAG ratio, which cannot see the step, leaves first. Each
 * column holds its header ("WCAG from below", 124, and the cell's 24): a 320
 * screen keeps the level and its value, a 375 the lightness too.
 */
function Ladder({ mode }: { mode: Mode }) {
  const levels = [...LADDER].reverse();
  const below = (token: (typeof LADDER)[number]) => levels[levels.indexOf(token) + 1];
  const columns: Column<(typeof LADDER)[number]>[] = [
    {
      key: 'level',
      header: 'Level',
      primary: true,
      minWidth: 124,
      cell: (token) => (
        <>
          <div className="tokenName">{short(token)}</div>
          <div className="alias">{theme[token].use}</div>
        </>
      ),
    },
    {
      key: 'value',
      header: mode,
      priority: 1,
      minWidth: 88,
      cell: (token) => {
        const hex = resolve(token, mode);
        return (
          <div className="swatchValue">
            <Swatch value={hex} />
            <div className="alias">{theme[token][mode]} {hex}</div>
          </div>
        );
      },
    },
    {
      key: 'dl',
      header: 'ΔL from below',
      priority: 2,
      minWidth: 128,
      cell: (token) => {
        const under = below(token);
        return <span className="ratioLine">{under ? f3(lightness(resolve(token, mode)) - lightness(resolve(under, mode))) : '—'}</span>;
      },
    },
    {
      key: 'wcag',
      header: 'WCAG from below',
      priority: 3,
      minWidth: 148,
      cell: (token) => {
        const under = below(token);
        return <span className="ratioLine">{under ? `${f2(contrast(resolve(token, mode), resolve(under, mode)))}:1` : '—'}</span>;
      },
    },
  ];
  return (
    <div className="specimen">
      <Table caption={`The ladder, ${mode}`} density="compact" columns={columns} rows={levels} getRowId={(token) => token} />
    </div>
  );
}

/**
 * The surface names the row; hover ranks next and pressed leaves first. A
 * wash's cell is its swatch, its value and lift, and tertiary text on it,
 * which stack at the column's narrowest: its header, "wash-pressed", 99 and
 * the cell's 24. A 320 screen keeps the surface and hover, a 375 both.
 */
function WashTable({ mode }: { mode: Mode }) {
  const columns: Column<(typeof SURFACES)[number]>[] = [
    {
      key: 'over',
      header: 'Over',
      primary: true,
      minWidth: 76,
      cell: (surface) => (
        <>
          <div className="tokenName">{short(surface)}</div>
          <div className="alias">{resolve(surface, mode)}</div>
        </>
      ),
    },
    ...WASH.map(
      (wash, i): Column<(typeof SURFACES)[number]> => ({
        key: wash,
        header: short(wash),
        priority: i + 1,
        minWidth: 124,
        cell: (surface) => <WashCell wash={wash} surface={surface} mode={mode} />,
      }),
    ),
  ];
  return (
    <div className="specimen">
      <Table caption={`The wash, ${mode}`} density="compact" columns={columns} rows={[...SURFACES]} getRowId={(surface) => surface} />
    </div>
  );
}

function WashCell({ wash, surface, mode }: { wash: (typeof WASH)[number]; surface: (typeof SURFACES)[number]; mode: Mode }) {
  const ground = resolve(surface, mode);
  const hex = resolve(wash, mode, ground);
  return (
    <div className="swatchValue">
      <Swatch value={hex} />
      <div>
        <div className="alias">{hex}</div>
        <div className="ratioLine">ΔL {f3(lightness(hex) - lightness(ground))}</div>
      </div>
      <div>
        <div className="alias">tertiary text</div>
        <Ratio fg={resolve('text/tertiary', mode)} bg={hex} />
      </div>
    </div>
  );
}

/**
 * The surface names the row, and its header says what is measured over it,
 * "border/subtle over", 138 and the cell's 24. Each mode's reading holds its
 * longest word and the 24 — `alpha/ink-08`, 89, in light; `alpha/white-16`,
 * 104, in dark — so a 320 screen keeps the surface and light. Dark leaves
 * first, and on a phone.
 */
const BORDER_COLUMNS: Column<(typeof SURFACES)[number]>[] = [
  { key: 'surface', header: 'border/subtle over', primary: true, minWidth: 164, cell: (surface) => <div className="tokenName">{short(surface)}</div> },
  ...MODES.map(
    (mode, i): Column<(typeof SURFACES)[number]> => ({
      key: mode,
      header: mode === 'light' ? 'Light' : 'Dark',
      priority: i + 1,
      minWidth: mode === 'light' ? 116 : 132,
      cell: (surface) => {
        const ground = resolve(surface, mode);
        const hex = resolve('border/subtle', mode, ground);
        return (
          <div className="swatchValue">
            <Swatch value={hex} />
            <span className="ratioLine">
              {theme['border/subtle'][mode]} → {hex} · {f2(contrast(hex, ground))}:1
            </span>
          </div>
        );
      },
    }),
  ),
];

function BorderTable() {
  return (
    <div className="specimen">
      <Table caption="Borders" density="compact" columns={BORDER_COLUMNS} rows={[...SURFACES]} getRowId={(surface) => surface} />
    </div>
  );
}

/** A shadow's darkest layer flattened over the ground it falls on, as a ratio against that ground. */
function shadowOn(name: ElevationName, mode: Mode) {
  const ground = resolve(mode === 'light' ? 'surface/raised' : 'surface/base', mode);
  const darkest = [...elevation[name][mode]].sort(
    (a, b) => alphaPrimitives[b.colour].alpha - alphaPrimitives[a.colour].alpha,
  )[0]!;
  const { hex, alpha } = alphaPrimitives[darkest.colour];
  return contrast(rgbToHex(composite(hexToRgb(hex), hexToRgb(ground), alpha)), ground);
}

/**
 * Readings joined as the text always read — "10 / 32 / -4 · 6 / 14 / -6",
 * "ink-10, ink-12" — with each kept whole, so a narrow cell breaks between
 * two layers or two inks and not inside one ("ink-" over "12").
 */
function readings(items: string[], separator: string) {
  return items.map((item, i) => (
    <Fragment key={i}>
      {i > 0 && ' '}
      <span className="unbroken">
        {item}
        {i < items.length - 1 && separator}
      </span>
    </Fragment>
  ));
}

/**
 * The step names the row. Its layers are the shadow and rank next, then the
 * inks, light before dark; the darkest point, a figure derived from them,
 * leaves first. The widest layer with its separator, "14 / 64 / -4 ·", is
 * 95, and the Layers column 120 with the cell's 24. A phone keeps the step,
 * its layers and the light ink.
 */
const SHADOW_COLUMNS: Column<ElevationName>[] = [
  { key: 'step', header: 'Step', primary: true, minWidth: 56, cell: (name) => <div className="tokenName">{name}</div> },
  {
    key: 'layers',
    header: 'Layers',
    priority: 1,
    minWidth: 120,
    cell: (name) => <div className="alias">{readings(elevation[name].light.map((l) => `${l.y} / ${l.blur} / ${l.spread}`), ' ·')}</div>,
  },
  {
    key: 'light',
    header: 'Light ink',
    priority: 2,
    minWidth: 88,
    cell: (name) => <div className="alias">{readings(elevation[name].light.map((l) => l.colour.split('/')[1]!), ',')}</div>,
  },
  {
    key: 'dark',
    header: 'Dark ink',
    priority: 3,
    minWidth: 88,
    cell: (name) => <div className="alias">{readings(elevation[name].dark.map((l) => l.colour.split('/')[1]!), ',')}</div>,
  },
  {
    key: 'darkest',
    header: 'Darkest point, light · dark',
    priority: 4,
    // The header, 189 and the cell's 24: a header does not wrap.
    minWidth: 216,
    cell: (name) => (
      <span className="ratioLine">
        {f2(shadowOn(name, 'light'))}:1 · {f2(shadowOn(name, 'dark'))}:1
      </span>
    ),
  },
];

function ShadowTable() {
  return (
    <div className="specimen">
      <Table
        caption="Shadows"
        density="compact"
        columns={SHADOW_COLUMNS}
        rows={Object.keys(elevation) as ElevationName[]}
        getRowId={(name) => name}
      />
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

type SurveyRow = (typeof SURVEY)[number];

/**
 * The system names the row, and wraps at its spaces. Layers — opaque in
 * every one, the finding this page acts on — rank next, then the states,
 * and the borders leave first. The states hold their header, "Hover, pressed,
 * selected", 176 and the cell's 24, which also holds an unbroken
 * `rgba(141,141,141,.16)`. A phone keeps the system and its layers.
 */
const SURVEY_COLUMNS: Column<SurveyRow>[] = [
  { key: 'system', header: 'System', primary: true, minWidth: 96, cell: (r) => <div className="tokenName wraps">{r.system}</div> },
  { key: 'layers', header: 'Layers', priority: 1, minWidth: 160, cell: (r) => <div className="alias">{r.layers}</div> },
  { key: 'states', header: 'Hover, pressed, selected', priority: 2, minWidth: 200, cell: (r) => <div className="alias">{r.states}</div> },
  { key: 'borders', header: 'Borders', priority: 3, minWidth: 104, cell: (r) => <div className="alias">{r.borders}</div> },
];

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

      <h2>See it</h2>
      <p>
        The ladder in the theme you are reading in: the canvas, a card on it, a well inside
        the card, and a panel above them all. Flip the theme with the toggle in the rail and
        watch what does the separating — the shadow in light, the colour step in dark.
      </p>
      <div
        style={{
          padding: spacing[400],
          borderRadius: radius.xl,
          background: 'var(--ap-color-surface-base)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: spacing[400],
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            flex: '1 1 240px',
            padding: spacing[300],
            borderRadius: radius.lg,
            background: 'var(--ap-color-surface-raised)',
            border: 'var(--ap-border-width-hairline) solid var(--ap-color-border-subtle)',
          }}
        >
          <p style={{ margin: `0 0 ${spacing[150]}px` }}>surface/raised — a card</p>
          <div
            style={{
              padding: spacing[150],
              borderRadius: radius.md,
              background: 'var(--ap-color-surface-sunken)',
              color: 'var(--ap-color-text-secondary)',
            }}
          >
            surface/sunken — a well
          </div>
        </div>
        <div
          style={{
            flex: '1 1 200px',
            padding: spacing[300],
            borderRadius: radius.lg,
            background: 'var(--ap-color-surface-overlay)',
            boxShadow: 'var(--ap-elevation-md)',
            border: 'var(--ap-border-width-hairline) solid var(--ap-color-border-subtle)',
          }}
        >
          surface/overlay — a menu, a dialog, with elevation/md
        </div>
      </div>

      <h2>Choosing a level</h2>
      <p>
        <code>base</code> is the canvas. <code>raised</code> is anything that sits on it and
        stays — a card, the drawer, a table&rsquo;s rows. <code>overlay</code> is anything
        that comes and goes above the page — a menu, a popover, a dialog — and it is the last
        step: a popover inside a dialog stays on <code>overlay</code> and takes a border, rather
        than inventing a level. <code>sunken</code> is a well inside a card — a read-only field,
        the fill of a checkbox — and on the canvas it takes a border, because in dark the two
        are the same colour.
      </p>
      <p>
        A shadow means elevation and a border means structure. In light, raised and overlay
        are both white and the shadow is the whole difference; in dark the shadow reaches 1.05:1
        against the canvas and the colour step does the work, with a hairline where a surface
        has run out of steps. Hover and pressed are never a level: they are the wash, laid over
        whatever is beneath, so a hovered row does not rise.
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

      <h2>Shadows</h2>
      <p>
        Three steps. <code>sm</code> is one short layer for a part that lifts inside its own
        control, the segmented tab&rsquo;s thumb. <code>md</code> for anchored panels and{' '}
        <code>lg</code> for the Dialog are two layers each: a long soft one and a short
        contact one, at the drawn offsets.
        The geometry is shared between modes; only the ink changes. Light takes the ink alphas
        of the drawing. Dark was never drawn, and it is modest on purpose: black at 64% over
        the dark canvas would reach 1.05:1 against it while black at 8% over white reaches
        1.19, so dark does not chase a shadow that cannot work and stops at 32 and 48%. The
        last column is the darkest layer flattened over the ground it falls on.
      </p>
      <ShadowTable />

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
        Ten of the eleven, read from each system&rsquo;s published package or stylesheet, not
        from its documentation prose. Layers are opaque in every one; transient states are alphas of a
        mid grey or a tinted near-white in most; borders are moving to alpha. Material 3
        dropped Material 2&rsquo;s white overlay per elevation for opaque tonal roles.
      </p>
      <div className="specimen">
        <Table caption="What the references do" density="compact" columns={SURVEY_COLUMNS} rows={[...SURVEY]} getRowId={(r) => r.system} />
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

      <h2>Accessibility</h2>
      <p>
        A surface step is a step for the eye, not a contrast requirement: no text is ever set
        in one surface against another, which is why the ladder is measured in lightness and
        text stays on the ratio. What the wash changes is the ground under text, so every
        text token is re-measured over both washes on every surface, and the tables above are
        those readings. Hover is never the only cue for anything: a row under the wash is the
        same row, and what it does is said by its content, not by its lift. The focus ring is
        drawn on every level and clears 3:1 on the highest,{' '}
        <Ratio fg={resolve('border/focus', 'light')} bg={resolve('surface/overlay', 'light')} threshold={3} /> in
        light and{' '}
        <Ratio fg={resolve('border/focus', 'dark')} bg={resolve('surface/overlay', 'dark')} threshold={3} /> in dark.
      </p>
    </DocPage>
  );
}
