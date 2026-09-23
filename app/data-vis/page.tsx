import type { ReactNode } from 'react';
import Link from 'next/link';
import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { Swatch } from '@ui/Swatch';
import { theme, type ThemeTokenName, type Mode } from '@/tokens/theme';
import { lightness, resolve } from '@/tokens/contrast';
import { SEQUENTIAL, DIVERGING, type ChartStep, cssVar, recorded } from '@ui/chart';

/**
 * The chart palette: the six categories, the sequential ramp and the
 * diverging ramp, each step read against the canvas and a card in both
 * modes with the functions the suite uses. The charts are SVG drawn from the
 * tokens, twice each — on a card and on the canvas — because those are the
 * two grounds a chart renders on. No chart component: the palette is for
 * whatever draws the chart, through the custom properties.
 */

const MODES: Mode[] = ['light', 'dark'];
/** The order series take the six categories in — by hue distance, the closest pairs last. */
const ORDER = ['glacier', 'flare', 'moss', 'glow', 'amber', 'ember'] as const;

const short = (t: ThemeTokenName) => t.split('/').slice(1).join('/');
const f3 = (n: number) => n.toFixed(3);

/**
 * The text a value inside a cell takes, per step and mode: text/primary on
 * the steps near the canvas, the accent's own label further out. The light
 * sequential-3 is twilight/500, which carries neither at AA, and takes
 * text/primary as large text.
 */
type Label = { token: ThemeTokenName; large?: boolean };
const LABEL: Record<ChartStep, Record<Mode, Label>> = {
  'chart/sequential-1': { light: { token: 'text/primary' }, dark: { token: 'text/primary' } },
  'chart/sequential-2': { light: { token: 'text/primary' }, dark: { token: 'text/primary' } },
  'chart/sequential-3': { light: { token: 'text/primary', large: true }, dark: { token: 'interactive/on-accent' } },
  'chart/sequential-4': { light: { token: 'interactive/on-accent' }, dark: { token: 'interactive/on-accent' } },
  'chart/sequential-5': { light: { token: 'interactive/on-accent' }, dark: { token: 'interactive/on-accent' } },
  'chart/low-3': { light: { token: 'interactive/on-accent' }, dark: { token: 'interactive/on-accent' } },
  'chart/low-2': { light: { token: 'interactive/on-accent' }, dark: { token: 'interactive/on-accent' } },
  'chart/low-1': { light: { token: 'text/primary' }, dark: { token: 'text/primary' } },
  'chart/mid': { light: { token: 'text/primary' }, dark: { token: 'text/primary' } },
  'chart/high-1': { light: { token: 'text/primary' }, dark: { token: 'text/primary' } },
  'chart/high-2': { light: { token: 'interactive/on-accent' }, dark: { token: 'interactive/on-accent' } },
  'chart/high-3': { light: { token: 'interactive/on-accent' }, dark: { token: 'interactive/on-accent' } },
};

// ---- the charts ----------------------------------------------------------
// Data is made up and says so in each chart's name. Every colour reaches
// the SVG as a custom property, so the same drawing follows the mode.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const SERIES = [
  { name: 'Web', hue: 'glacier', values: [42, 48, 51, 58, 63, 71], marker: 'circle' },
  { name: 'Phone', hue: 'flare', values: [35, 33, 36, 31, 29, 27], marker: 'square' },
  { name: 'Walk-in', hue: 'moss', values: [12, 15, 14, 19, 22, 20], marker: 'triangle' },
] as const;

/** Three series over six months, each labelled at its end and by a marker of its own shape. */
function LineChart() {
  const w = 320;
  const h = 180;
  const pad = { top: 12, right: 64, bottom: 24, left: 28 };
  const x = (i: number) => pad.left + (i * (w - pad.left - pad.right)) / (MONTHS.length - 1);
  const y = (v: number) => pad.top + (1 - v / 80) * (h - pad.top - pad.bottom);
  const marker = (shape: (typeof SERIES)[number]['marker'], cx: number, cy: number, fill: string) => {
    if (shape === 'circle') return <circle cx={cx} cy={cy} r={3.5} fill={fill} />;
    if (shape === 'square') return <rect x={cx - 3.5} y={cy - 3.5} width={7} height={7} fill={fill} />;
    return <polygon points={`${cx},${cy - 4.5} ${cx + 4},${cy + 3} ${cx - 4},${cy + 3}`} fill={fill} />;
  };
  return (
    <svg
      className="chart"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label="Bookings by channel over six months, made-up figures: Web rising from 42 to 71, Phone falling from 35 to 27, Walk-in rising from 12 to 20"
    >
      {[0, 20, 40, 60, 80].map((v) => (
        <g key={v}>
          <line className="chartGrid" x1={pad.left} x2={w - pad.right} y1={y(v)} y2={y(v)} />
          <text x={pad.left - 6} y={y(v) + 4} textAnchor="end">
            {v}
          </text>
        </g>
      ))}
      <line className="chartAxis" x1={pad.left} x2={w - pad.right} y1={y(0)} y2={y(0)} />
      {MONTHS.map((m, i) => (
        <text key={m} x={x(i)} y={h - 6} textAnchor="middle">
          {m}
        </text>
      ))}
      {SERIES.map((s) => {
        const fill = cssVar(`category/${s.hue}`);
        const last = s.values.length - 1;
        return (
          <g key={s.name}>
            <polyline
              fill="none"
              stroke={fill}
              strokeWidth={2}
              points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
            />
            {s.values.map((v, i) => (
              <g key={i}>{marker(s.marker, x(i), y(v), fill)}</g>
            ))}
            <text
              className="chartSeriesLabel"
              x={x(last) + 8}
              y={y(s.values[last]!) + 4}
              style={{ fill: cssVar(`category/${s.hue}-text`) }}
            >
              {s.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = ['9', '11', '13', '15', '17'];
/** Appointments per slot, made up; bucketed into the five steps by fifths of the largest. */
const HEAT = [
  [3, 5, 4, 6, 7, 2, 0],
  [8, 12, 11, 13, 14, 4, 1],
  [6, 9, 10, 9, 8, 5, 2],
  [10, 14, 15, 12, 11, 3, 1],
  [4, 6, 7, 5, 3, 1, 0],
];
const HEAT_MAX = 15;
const heatStep = (v: number) => Math.min(SEQUENTIAL.length - 1, Math.floor((v / HEAT_MAX) * SEQUENTIAL.length));

/** A week by hour on the sequential ramp, values in the cells' titles, the legend below. */
function Heatmap() {
  const cell = 36;
  const gap = 3;
  const left = 30;
  const top = 18;
  const w = left + DAYS.length * (cell + gap);
  const legendY = top + HOURS.length * (cell + gap) + 12;
  const h = legendY + 22;
  return (
    <svg
      className="chart"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label="Appointments per hour across a week, made-up figures from none to fifteen, on the five sequential steps; the busiest hours are 11 and 15 on weekdays"
    >
      {DAYS.map((d, i) => (
        <text key={d} x={left + i * (cell + gap) + cell / 2} y={12} textAnchor="middle">
          {d}
        </text>
      ))}
      {HEAT.map((row, r) => (
        <g key={r}>
          <text x={left - 6} y={top + r * (cell + gap) + cell / 2 + 4} textAnchor="end">
            {HOURS[r]}
          </text>
          {row.map((v, c) => (
            <rect
              key={c}
              x={left + c * (cell + gap)}
              y={top + r * (cell + gap)}
              width={cell}
              height={cell}
              rx={3}
              fill={cssVar(SEQUENTIAL[heatStep(v)]!)}
            >
              <title>{`${DAYS[c]} ${HOURS[r]}:00 — ${v}`}</title>
            </rect>
          ))}
        </g>
      ))}
      <text x={left} y={legendY + 16}>
        fewer
      </text>
      {SEQUENTIAL.map((t, i) => (
        <rect key={t} x={left + 44 + i * 22} y={legendY + 6} width={20} height={12} rx={2} fill={cssVar(t)} />
      ))}
      <text x={left + 44 + SEQUENTIAL.length * 22 + 6} y={legendY + 16}>
        more
      </text>
    </svg>
  );
}

const DEVIATION = [
  { month: 'Jan', value: -18 },
  { month: 'Feb', value: -9 },
  { month: 'Mar', value: -3 },
  { month: 'Apr', value: 4 },
  { month: 'May', value: 11 },
  { month: 'Jun', value: 22 },
  { month: 'Jul', value: 15 },
  { month: 'Aug', value: -12 },
];
/** ±3 for a deviation past 15, ±2 past 7, ±1 for the rest, the centre for nothing. */
const divergingStep = (v: number): ThemeTokenName => {
  const m = Math.abs(v);
  const n = v === 0 ? 0 : m > 15 ? 3 : m > 7 ? 2 : 1;
  if (n === 0) return 'chart/mid';
  return `chart/${v < 0 ? 'low' : 'high'}-${n}` as ThemeTokenName;
};

/** Deviation from a yearly average, bars on either side of a zero line that is drawn, not implied. */
function DivergingChart() {
  const w = 320;
  const h = 180;
  const pad = { top: 16, right: 12, bottom: 24, left: 36 };
  const slot = (w - pad.left - pad.right) / DEVIATION.length;
  const bar = slot * 0.6;
  const y = (v: number) => pad.top + (1 - (v + 25) / 50) * (h - pad.top - pad.bottom);
  return (
    <svg
      className="chart"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label="Bookings against the yearly average, made-up figures: eighteen below in January, nine below in February, three below in March, four above in April, eleven above in May, twenty-two above in June, fifteen above in July and twelve below in August"
    >
      {[-20, -10, 10, 20].map((v) => (
        <g key={v}>
          <line className="chartGrid" x1={pad.left} x2={w - pad.right} y1={y(v)} y2={y(v)} />
          <text x={pad.left - 6} y={y(v) + 4} textAnchor="end">
            {v > 0 ? `+${v}%` : `${v}%`}
          </text>
        </g>
      ))}
      {DEVIATION.map((d, i) => {
        const x = pad.left + i * slot + (slot - bar) / 2;
        const y0 = y(0);
        const y1 = y(d.value);
        return (
          <g key={d.month}>
            <rect x={x} y={Math.min(y0, y1)} width={bar} height={Math.abs(y1 - y0)} rx={2} fill={cssVar(divergingStep(d.value))}>
              <title>{`${d.month}: ${d.value > 0 ? '+' : ''}${d.value}%`}</title>
            </rect>
            <text x={x + bar / 2} y={h - 6} textAnchor="middle">
              {d.month}
            </text>
          </g>
        );
      })}
      <line className="chartZero" x1={pad.left} x2={w - pad.right} y1={y(0)} y2={y(0)} />
      <text x={pad.left - 6} y={y(0) + 4} textAnchor="end">
        0
      </text>
    </svg>
  );
}

/** A chart on the two grounds it renders on. */
function Figure({ children }: { children: ReactNode }) {
  return (
    <div className="chartFigure">
      <div className="chartOnCard">
        <p>On a card — surface/raised</p>
        {children}
      </div>
      <div className="chartOnCanvas">
        <p>On the canvas — surface/base</p>
        {children}
      </div>
    </div>
  );
}

// ---- the tables ----------------------------------------------------------

function StepRow({ token, first, mode }: { token: ChartStep; first?: ChartStep; mode: Mode }) {
  const hex = resolve(token, mode);
  const label = LABEL[token][mode];
  const dl = first ? Math.abs(lightness(hex) - lightness(resolve(first, mode))) : undefined;
  return (
    <tr>
      <td>
        <div className="tokenName">{short(token)}</div>
      </td>
      <td>
        <Swatch value={hex} />
      </td>
      <td>
        <div className="alias">{theme[token][mode]}</div>
        {dl !== undefined && <div className="alias">ΔL {dl.toFixed(3)} from the step before</div>}
      </td>
      <td>
        <Ratio fg={hex} bg={resolve('surface/base', mode)} threshold={3} recorded={recorded(token, mode)} />
      </td>
      <td>
        <Ratio fg={hex} bg={resolve('surface/raised', mode)} threshold={3} recorded={recorded(token, mode)} />
      </td>
      <td>
        <div className="alias">
          {short(label.token)}
          {label.large ? ', large text' : ''}
        </div>
        <Ratio fg={resolve(label.token, mode)} bg={hex} threshold={label.large ? 3 : 4.5} />
      </td>
    </tr>
  );
}

/** One table per mode: the step, its value, its figure on both grounds, and the text a value in it takes. */
function RampTable({ steps }: { steps: readonly ChartStep[] }) {
  return MODES.map((mode) => (
    <div className="tableScroll" key={mode}>
      <table className="tokens">
        <thead>
          <tr>
            <th>Step</th>
            <th colSpan={2}>{mode === 'light' ? 'Light' : 'Dark'}</th>
            <th>On base</th>
            <th>On raised</th>
            <th>A value in the cell</th>
          </tr>
        </thead>
        <tbody>
          {steps.map((token, i) => (
            <StepRow key={token} token={token} first={i > 0 ? steps[i - 1] : undefined} mode={mode} />
          ))}
        </tbody>
      </table>
    </div>
  ));
}

export default function Page() {
  const chartCount = (Object.keys(theme) as ThemeTokenName[]).filter((t) => t.startsWith('chart/')).length;
  const tightest = (steps: readonly ThemeTokenName[]) =>
    Math.min(
      ...MODES.flatMap((mode) =>
        steps.slice(1).map((t, i) => Math.abs(lightness(resolve(t, mode)) - lightness(resolve(steps[i]!, mode)))),
      ),
    );
  return (
    <DocPage
      evidence={
        <>
          <p>{chartCount} chart tokens</p>
          <p>6 categories</p>
          <p>ΔL between steps</p>
          <p>≥ {f3(tightest(SEQUENTIAL))} sequential</p>
          <p>≥ {f3(tightest(DIVERGING))} diverging</p>
          <p>measured on base</p>
          <p>and on raised</p>
        </>
      }
    >
      <h1>Data visualisation</h1>
      <p className="lead">
        Three palettes for three questions — which, how much, and which side of the centre —
        each step read against the canvas and a card in both modes, and a rule for what a chart
        may ask of colour.
      </p>

      <h2>No chart component</h2>
      <p>
        The palette is for whatever draws the chart — Recharts, D3, Observable Plot, a{' '}
        <code>canvas</code> — through the custom properties, <code>--ap-color-chart-*</code> and{' '}
        <code>--ap-color-category-*</code>. The charts on this page are SVG drawn from the same
        properties, and each is drawn twice, on a card and on the canvas, because those are the
        two grounds a chart renders on and every figure below is read against both. A chart
        library is a library, and not this system&rsquo;s job.
      </p>

      <h2>Which: the six categories</h2>
      <p>
        A series takes a hue from <code>category/*</code>, the palette the Scheduler colours a
        person&rsquo;s events with, in this order — by hue distance, so the closest pairs come
        last: ember against glow measures 1.01:1 and glacier against moss 1.03. The six fills
        share one lightness, which is why every category&rsquo;s label and tint hold the same
        figures, and it is also the warning: on a chart the six differ by hue alone, and a
        reader who does not see hue does not see six series.
      </p>
      <ol className="chartOrder">
        {ORDER.map((hue) => (
          <li key={hue}>
            <span style={{ background: cssVar(`category/${hue}`) }} />
            {hue}
          </li>
        ))}
      </ol>
      <p>
        So a categorical chart names its series directly — at the end of the line, on the bar,
        in the cell — or gives each a marker of its own shape, never a colour legend alone. The
        chart below does both. A seventh series has no seventh hue: it splits the chart, or
        takes a pattern fill. And the six are not statuses: a warning is not &ldquo;amber&rdquo;,
        which stays under <code>surface/warning-subtle</code> and <code>text/warning</code>.
      </p>
      <Figure>
        <LineChart />
      </Figure>

      <h2>How much: the sequential ramp</h2>
      <p>
        One hue, twilight, in five steps: 200 / 400 / 500 / 600 / 800 in light and the same list
        the other way in dark, so in both modes <code>sequential-1</code> is the step nearest
        the canvas and a heatmap reads &ldquo;more&rdquo; as &ldquo;further from the
        ground&rdquo; — ink in light, light in dark. Steps 1 and 2 are under 3:1 against the
        canvas by construction: a heatmap&rsquo;s low cell sits near its ground and is told
        apart by the legend and its neighbours, not by its own edge. What the suite holds is the
        lightness between neighbours, ΔL ≥ .09 in OKLCH, twice the surface ladder&rsquo;s step,
        and 3:1 from step 3 on both surfaces. The wider ramp, 100 to 900, separates better and
        was refused: its dark 900 is 1.06:1 against a card, one surface step, so the low cell
        would vanish there.
      </p>
      <p>
        Twilight rather than a multi-hue ramp: a ramp across families has the same figures to
        the decimal, since every family shares one lightness per stop, but in dark the order of
        the hues would reverse, and a map that changes direction with the mode is not one map.
        Twilight is the accent, but a cell has no button&rsquo;s shape, and the accent as the
        first chart colour is Carbon&rsquo;s and Cloudscape&rsquo;s precedent.
      </p>
      <div className="chartRamp" role="img" aria-label="The five sequential steps, from the nearest to the canvas to the furthest">
        {SEQUENTIAL.map((t) => (
          <span key={t} style={{ background: cssVar(t) }} />
        ))}
      </div>
      <Figure>
        <Heatmap />
      </Figure>
      <h3>A value inside a cell</h3>
      <p>
        Takes <code>text/primary</code> on the steps near the canvas and{' '}
        <code>interactive/on-accent</code> — white in light, night/950 in dark — further out, each
        pairing held by the suite at AA. The light step 3 is twilight/500, the stop that carries
        no label at AA (4.15 with <code>text/primary</code>, 3.92 with white): a value on it is
        set as large text, which clears at 3:1, or sits beside the cell. The heatmap above keeps
        its values in the cells&rsquo; titles for that reason.
      </p>
      <RampTable steps={SEQUENTIAL} />

      <h2>Which side: the diverging ramp</h2>
      <p>
        Twilight against flare, three steps a side on a stone centre — ColorBrewer&rsquo;s
        purple-orange pair, safe under the common colour-vision deficiencies, and never red
        against green. Neighbours are ΔL ≥ .16 apart at every step; the centre is stone, the
        neutral, because mist&rsquo;s cyan cast would lean it towards one side. The warm side is
        &ldquo;high&rdquo; by the thermal convention and nothing more: a sign never rests on hue
        alone, so a diverging chart draws its zero line in <code>border/strong</code> and
        labels its axis with the sign.
      </p>
      <div className="chartRamp" role="img" aria-label="The seven diverging steps, from three below the centre to three above">
        {DIVERGING.map((t) => (
          <span key={t} style={{ background: cssVar(t) }} />
        ))}
      </div>
      <Figure>
        <DivergingChart />
      </Figure>
      <RampTable steps={DIVERGING} />

      <h2>The rest of a chart</h2>
      <p>
        Uses tokens that exist. Gridlines <code>border/subtle</code>, an axis{' '}
        <code>border/default</code>, the zero line <code>border/strong</code>, tick and axis
        labels <code>text/secondary</code>, a title <code>text/primary</code>, a hovered bar the
        wash. The category text tokens, <code>category/*-text</code>, are the direct labels on
        the line chart above: text in the hue, at AA on a card. Everything else on a chart is
        the <Link href="/colour">Colour</Link> page&rsquo;s.
      </p>

      <h2>Not built</h2>
      <p>
        A Chart component. Pattern fills as tokens. A second sequential hue. Colour-vision
        simulation in the suite — the ΔL figures are the instrument, and a simulated view is
        a later page.
      </p>
    </DocPage>
  );
}
