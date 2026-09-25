import Link from 'next/link';
import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { Swatch } from '@ui/Swatch';
import { tokenId } from '@ui/slug';
import { recorded } from '@ui/chart';
import { Table, type Column } from '@/components/Table';
import { primitives, alphaPrimitives } from '@/tokens/primitives';
import { theme, type ThemeTokenName, type Mode } from '@/tokens/theme';
import { contrast, lightness, resolve } from '@/tokens/contrast';

const RAMPS = ['glow', 'twilight', 'flare', 'glacier', 'stone', 'night', 'mist', 'ember', 'moss', 'amber'] as const;
const STEPS = ['050', '100', '200', '300', '400', '500', '600', '700', '800', '900', '925', '950'] as const;

/** The stops a ramp actually has: 925 exists only in the two surface ladders. */
const stepsOf = (ramp: (typeof RAMPS)[number]) =>
  STEPS.filter((step) => `${ramp}/${step}` in primitives);

const ROLES: Record<(typeof RAMPS)[number], string> = {
  glow: 'the brand — hero, gradient, one call to action per screen; never a button tone',
  twilight: 'everything interactive — fills, links, focus, selection',
  flare: 'the highlight fill — the tertiary tone',
  glacier: 'the second highlight, and the info status',
  stone: 'the neutral foundation — text, borders, the light canvas',
  night: 'the dark surface ladder',
  mist: 'soft states — the wash that hover and pressed lay over any surface, in both modes',
  ember: 'danger',
  moss: 'success',
  amber: 'warning',
};

/**
 * What each stop carries, and the pair that proves it. The claim in the
 * primitives file is that a number means the same amount of light in every
 * family; each row measures the pair across all ten and shows the tightest,
 * so the table is the claim tested rather than restated.
 */
type Guarantee = { stop: (typeof STEPS)[number]; carries: string; fg: (ramp: string) => string; bg: (ramp: string) => string };
const p = primitives as Record<string, string>;
const GUARANTEES: Guarantee[] = [
  { stop: '300', carries: 'text on its own 900', fg: (r) => p[`${r}/300`]!, bg: (r) => p[`${r}/900`]! },
  { stop: '400', carries: 'a night/950 label', fg: () => p['night/950']!, bg: (r) => p[`${r}/400`]! },
  { stop: '500', carries: 'icons and borders on white, 3:1', fg: (r) => p[`${r}/500`]!, bg: () => p.white! },
  { stop: '600', carries: 'a white label', fg: () => p.white!, bg: (r) => p[`${r}/600`]! },
  { stop: '700', carries: 'text on its own 050', fg: (r) => p[`${r}/700`]!, bg: (r) => p[`${r}/050`]! },
];

/** The family where the pair is tightest. */
function tightest(g: Guarantee) {
  return [...RAMPS]
    .map((ramp) => ({ ramp, fg: g.fg(ramp), bg: g.bg(ramp), ratio: contrast(g.fg(ramp), g.bg(ramp)) }))
    .sort((a, b) => a.ratio - b.ratio)[0]!;
}

function group(prefix: string) {
  return (Object.keys(theme) as ThemeTokenName[]).filter((t) => t.startsWith(prefix));
}

/** The surface each group is measured against — the one it actually sits on. */
function against(token: ThemeTokenName): ThemeTokenName {
  // A category's label is read on its fill, its text on its tint; the fill
  // itself is a figure on a card, as the interactive fills are.
  const label = token.match(/^category\/on-(\w+)$/);
  if (label) return `category/${label[1]}` as ThemeTokenName;
  const text = token.match(/^category\/(\w+)-text$/);
  if (text) return `category/${text[1]}-subtle` as ThemeTokenName;
  if (token.endsWith('-subtle')) return token;
  return 'surface/raised';
}

/** Text is held to AA, a fill or an edge to 3:1. */
function floor(token: ThemeTokenName, fallback: number): number {
  if (/^category\/(on-|\w+-text$)/.test(token)) return 4.5;
  return fallback;
}

/** An alpha token has no colour of its own until it lands on something; here that is a card. */
const isAlpha = (alias: string) => alias in alphaPrimitives;

const MODES: Mode[] = ['light', 'dark'];

type TokenRow = { token: ThemeTokenName; light: string; dark: string; measurable: boolean };

/**
 * A group of theme tokens: the name and its use, then each mode's value —
 * the swatch, the primitive it points at, and the pair it is measured in.
 * The name never leaves and dark leaves first, so a phone keeps a token
 * beside its light value. The name keeps to one line, and the column holds
 * the longest, `tertiary-pressed`, 119 and the cell's 24; the use line
 * under it wraps. A mode's narrowest is its widest reading, a recorded
 * figure, 104 and the 24; there the swatch sits above the words.
 */
function TokenTable({ caption, tokens, threshold }: { caption: string; tokens: ThemeTokenName[]; threshold: number }) {
  const rows: TokenRow[] = tokens.map((token) => {
    const entry = theme[token];
    const scrim = token === 'surface/scrim';
    const wash = token.startsWith('interactive/wash-');
    // The scrim is flattened over the canvas it covers; every other
    // alpha — the wash, the subtle border — over the card it lands on.
    const ground = (mode: Mode) =>
      isAlpha(entry[mode]) ? resolve(scrim ? 'surface/base' : 'surface/raised', mode) : undefined;
    // A wash is a ground for text, not a figure against one; its
    // readings are on the Elevation page.
    // A category's tint is a ground, as a surface is.
    const measurable =
      !scrim && !wash && !token.startsWith('surface/') && !/^category\/\w+-subtle$/.test(token);
    return { token, light: resolve(token, 'light', ground('light')), dark: resolve(token, 'dark', ground('dark')), measurable };
  });

  const columns: Column<TokenRow>[] = [
    {
      key: 'token',
      header: 'Token',
      primary: true,
      minWidth: 144,
      // The id is the search's landing: a token hit points at
      // `/colour#surface-raised`, and lands on the row, not on the group's heading.
      cell: ({ token }) => (
        <>
          <div className="tokenName" id={tokenId(token)}>{token.split('/').slice(1).join('/')}</div>
          <div className="alias">{theme[token].use}</div>
        </>
      ),
    },
    ...MODES.map(
      (mode, i): Column<TokenRow> => ({
        key: mode,
        header: mode === 'light' ? 'Light' : 'Dark',
        priority: i + 1,
        minWidth: 128,
        cell: (row) => (
          <div className="swatchValue">
            <Swatch value={row[mode]} />
            <div>
              <div className="alias">{theme[row.token][mode]}</div>
              {row.measurable && (
                <Ratio
                  fg={row[mode]}
                  bg={resolve(against(row.token), mode)}
                  threshold={floor(row.token, threshold)}
                  recorded={recorded(row.token, mode)}
                />
              )}
            </div>
          </div>
        ),
      }),
    ),
  ];

  return (
    <div className="specimen">
      <Table caption={caption} density="compact" columns={columns} rows={rows} getRowId={({ token }) => token} />
    </div>
  );
}

type StopRow = { step: (typeof STEPS)[number]; guarantee?: Guarantee };
const STOP_ROWS: StopRow[] = STEPS.filter((step) => step !== '925').map((step) => ({
  step,
  guarantee: GUARANTEES.find((g) => g.stop === step),
}));

/**
 * The stop names the row. The tightest pair is the claim tested, so it ranks
 * next, then what the stop carries; the lightness, the same in every family,
 * leaves first. On a 320 screen the stop, the pair and the job fit.
 */
const STOP_COLUMNS: Column<StopRow>[] = [
  { key: 'stop', header: 'Stop', primary: true, minWidth: 60, cell: ({ step }) => <span className="tokenName">{step}</span> },
  { key: 'l', header: 'L', priority: 3, minWidth: 64, cell: ({ step }) => <span className="alias">{lightness(p[`stone/${step}`]!).toFixed(3)}</span> },
  { key: 'carries', header: 'Carries', priority: 2, minWidth: 112, cell: ({ guarantee }) => guarantee?.carries ?? <span className="alias">—</span> },
  {
    key: 'tightest',
    header: 'Tightest',
    priority: 1,
    minWidth: 104,
    cell: ({ step, guarantee }) => {
      const pair = guarantee && tightest(guarantee);
      return (
        pair && (
          <>
            <span className="alias">{pair.ramp} </span>
            <Ratio fg={pair.fg} bg={pair.bg} threshold={step === '500' ? 3 : 4.5} />
          </>
        )
      );
    },
  },
];

export default function Page() {
  const primitiveCount = Object.keys(primitives).length;
  const themeCount = Object.keys(theme).length;
  return (
    <DocPage
      evidence={
        <>
          <p>{primitiveCount} primitives</p>
          <p>{themeCount} theme tokens</p>
          <p>0 hex in the theme</p>
          <p>measured against</p>
          <p>surface/raised</p>
        </>
      }
    >
      <h1>Colour</h1>
      <p className="lead">
        Ten families of eleven stops, a twelfth in the two surface ladders, {themeCount} roles,
        and a rule that keeps them apart:
        nothing in the product references a primitive directly.
      </p>

      <h2>How colour is organised</h2>
      <p>
        Three layers, and a seam between the first two. Primitives name a value —{' '}
        <code>twilight/600</code> — and are never applied in a component. Theme tokens name a
        job — <code>interactive/accent</code> — and point at a primitive; they are the only
        layer a component references, and the only one that changes between light and dark.
        That seam is what makes the dark theme possible: without it, dark mode would mean
        auditing every use to work out which meant &ldquo;the accent&rdquo; and which just
        wanted violet.
      </p>

      <h2>Primitives</h2>
      <p>
        The raw ramps. These carry no meaning and are not used in components — they exist to
        be aliased. Every family is generated in OKLCH and shares one lightness per stop, so a
        number means the same amount of light everywhere: any 600 carries a white label at
        4.5:1 or better, any 400 carries a <code>night/950</code> label, any 500 is the 3:1 stop
        for icons and borders, any 700 is text on its own 050, any 300 is text on its own 900.
        Chroma and hue are each family&rsquo;s own.
      </p>
      <p>
        There are no half steps for text or fills. The twenty-step neutral this replaced had
        adjacent steps 1.08 to 1.23:1 apart, and produced two text levels nobody could tell
        apart. The one exception is <code>925</code>, the surface step, in <code>stone</code>{' '}
        and <code>night</code> only: no text is ever set in one surface against another, and
        every reference system measured places its surface levels closer than any ramp places
        its text stops — see{' '}
        <a href="/elevation">Elevation and states</a>. When a ladder runs out, separate with
        a border.
      </p>

      {RAMPS.map((ramp) => (
        <div key={ramp}>
          <p className="rampName">
            {ramp} <span className="alias">{ROLES[ramp]}</span>
          </p>
          <div className="ramp">
            {stepsOf(ramp).map((step) => {
              const key = `${ramp}/${step}` as keyof typeof primitives;
              return <div key={step} className="rampStep" style={{ background: primitives[key] }} />;
            })}
          </div>
          <div className="rampLabels">
            {stepsOf(ramp).map((step) => (
              <span key={step}>{step}</span>
            ))}
          </div>
        </div>
      ))}

      <h3>One lightness per stop</h3>
      <p>
        The lightness is <code>stone</code>&rsquo;s, read in OKLCH; every other family sits
        within a thousandth of it. Each stop&rsquo;s job is measured across all ten families as
        the page renders, and the family shown is the one where the pair is tightest.
      </p>
      <div className="specimen">
        <Table caption="One lightness per stop" density="compact" columns={STOP_COLUMNS} rows={STOP_ROWS} getRowId={({ step }) => step} />
      </div>

      <h2>Choosing a colour</h2>
      <p>
        Reach for the role, never the value. A component that needs the accent takes{' '}
        <code>interactive/accent</code>; if what it needs has no token, the answer is a new
        token, not a primitive that happens to look right today — a separator borrowed as a
        text colour reads until borders get lighter, and then the text goes with them.
      </p>
      <p>
        One colour, one meaning. The accent means interactive, so that hue on static text tells
        the reader to click something that is not a control. <code>glow</code> is the brand
        and never a button tone: <code>glow/600</code> and <code>ember/600</code> are 1.02:1
        apart, and a pink button beside a danger button would be two of the same thing.{' '}
        <code>amber</code> is warning and <code>flare</code> the highlight, kept far enough
        apart at 400 to read as two. And filled colour is emphasis: one solid accent per view,
        with the alternative beside it neutral — see <a href="/button">Button</a>.
      </p>
      <p>
        Measure the pair that renders. Text against the surface it sits on, a border against
        the fill it edges, a label against its own button in every state, and an alpha over
        the ground it lands on. The tables below do exactly that, with the function the test
        suite runs; a value written by hand is a value that can rot.
      </p>

      <h2>Surfaces</h2>
      <p>
        A ladder of elevation rather than a set of colours. In light, raised and overlay are
        both white and the shadow does the separating; in dark, overlay steps lighter
        because shadow no longer reads as height, and sunken shares the canvas because the
        ramp ends at 950 — a well on the canvas takes a border. The dark ladder is{' '}
        <code>night</code> 950, 925, 900, ΔL .043 per step; a product that wants a neutral
        dark aliases the same stops of <code>stone</code>, and every pair holds — the
        tightest, <code>border/strong</code> on <code>stone/800</code>, is 3.44:1. The tail
        is deep on purpose: 700 to 950 sit at L .43, .33, .245, .205 and .16, so the dark
        canvas reads as night rather than slate. Alpha tokens are shown flattened over a card.
      </p>
      <TokenTable caption="Surfaces" tokens={group('surface/')} threshold={3} />

      <h2>Text</h2>
      <p>
        Measured against <code>surface/raised</code>. Placeholder is the same stop as tertiary
        and clears AA; disabled and inert sit below it deliberately — both are exempt under
        WCAG 2.1, and both are documented at their recorded value so a future edit cannot
        quietly make them worse.
      </p>
      <TokenTable caption="Text" tokens={group('text/')} threshold={4.5} />

      <h2>Interactive</h2>
      <p>
        Fills and the labels that sit on them. Every <code>on-*</code> token is measured
        against all of its fill states, not just the resting one. The two wash tokens are a
        state layer rather than a fill — laid over a row, a menu item, a ghost button or the
        neutral button&rsquo;s own fill — and are shown here over a card; their readings are
        on the <a href="/elevation">Elevation page</a>.
      </p>
      <TokenTable caption="Interactive" tokens={group('interactive/')} threshold={3} />

      <h2>Border</h2>
      <p>
        Three tiers by function, not by weight. <code>subtle</code> divides, and is an alpha
        so it reads on every surface without picking a stop above any of them;{' '}
        <code>default</code> outlines containers; and <code>strong</code> is the only tier
        that clears WCAG 1.4.11 — which is why every form control uses it.
      </p>
      <TokenTable caption="Border" tokens={group('border/')} threshold={3} />

      <h2>Category</h2>
      <p>
        Colour by category rather than by meaning: a person&rsquo;s events on the Scheduler, a
        tag by topic. Six hues, each the accent&rsquo;s own four stops — 600 / 400 for the
        fill, white / night-950 for the label on it, 050 / 900 for the tint, 700 / 300 for
        the text on the tint or on a card — so whatever holds for the accent holds for each.
        The label is measured on its fill and the text on its tint, both to AA; the fill on
        a card to 3:1. The tint is a ground, and is not measured. Not a status: a warning is
        not &ldquo;amber&rdquo;.
      </p>
      <TokenTable caption="Category" tokens={group('category/')} threshold={3} />

      <h2>Chart</h2>
      <p>
        The two ramps a chart needs beside the six categories: sequential for a magnitude,
        twilight in five steps, and diverging for a value on either side of a centre, twilight
        against flare on a stone centre. A step is numbered by its distance from the canvas, so{' '}
        <code>sequential-1</code> and <code>mid</code> sit nearest it in both modes. The steps
        near the canvas are under 3:1 by construction — a heatmap&rsquo;s low cell is told apart
        by the legend and its neighbours — and are recorded rather than graded; what the suite
        holds for them is the lightness between neighbours. The figures on both surfaces, the
        text a value inside a cell takes, and the rules are on{' '}
        <Link href="/data-vis">Data visualisation</Link>.
      </p>
      <TokenTable caption="Chart" tokens={group('chart/')} threshold={3} />

      <h2>Accessibility</h2>
      <p>
        Colour is never the only channel. A state has an icon, a label or a shape beside its
        colour; focus adds a ring rather than recolouring a border; a selected row carries an
        attribute a screen reader can read. Text clears 4.5:1 and non-text, borders and icons
        and the parts of a control, 3:1, on the surface they render on, in both modes.
      </p>
      <p>
        Two text tokens sit under the line on purpose. <code>disabled</code> and{' '}
        <code>inert</code> are exempt under WCAG 2.1 — one is an unavailable control, the other
        decoration — and each is documented at its recorded value above, so an edit that made
        either worse would show in the table before it shipped.
      </p>
    </DocPage>
  );
}
