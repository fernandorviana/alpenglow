'use client';

import { useState } from 'react';
import { Add, Asleep, FaceDissatisfied, FaceSatisfied, Light, Star, Subtract } from '@carbon/icons-react';
import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { CodeBlock } from '@ui/CodeBlock';
import { Slider } from '@/components/Slider';
import type { SliderPair } from '@/components/Slider';
import { Badge } from '@/components/Badge';
import { Table } from '@/components/Table';
import { resolve } from '@/tokens/contrast';
import { spacing } from '@/tokens/scale';
import type { Mode, ThemeTokenName } from '@/tokens/theme';

const MODES: Mode[] = ['light', 'dark'];

const PAIRS: ReadonlyArray<{ name: string; fg: ThemeTokenName; bg: ThemeTokenName; threshold?: number }> = [
  {
    name: 'the fill and the thumb’s edge on the page, 3:1',
    fg: 'interactive/accent',
    bg: 'surface/base',
    threshold: 3,
  },
  { name: 'the thumb’s edge on the thumb, 3:1', fg: 'interactive/accent', bg: 'surface/raised', threshold: 3 },
  { name: 'the empty line on a card, 3:1', fg: 'border/strong', bg: 'surface/raised', threshold: 3 },
  { name: 'the balloon', fg: 'interactive/on-accent', bg: 'interactive/accent' },
];

const percent = (v: number) => `${v}%`;
const dollars = (v: number) => `$${v.toLocaleString('en-US')}`;

const USAGE = `import { Slider } from 'alpenglow';

const [share, setShare] = useState(75);

<Slider
  label="Percentage"
  unit="%"
  info="How much of the total this takes."
  caption="Applied to every new booking."
  start="0%"
  end="100%"
  showValue
  showInput
  formatValue={(v) => \`\${v}%\`}
  value={share}
  onChange={setShare}
/>

// A range: two thumbs, the fill between them, a field at each end.
const [band, setBand] = useState<[number, number]>([3500, 8500]);

<Slider label="Price range" range min={1000} max={10000} step={100} showValue showInput
  formatValue={(v) => \`$\${v.toLocaleString()}\`} value={band} onChange={setBand} />`;

type Measure = { part: string; value: string };
const MEASURES: Measure[] = [
  { part: 'Thumb', value: `${spacing[200]}, an edge of 2 in interactive/accent on surface/raised, elevation/sm` },
  { part: 'Line', value: `${spacing['050']} at radius full; border/strong empty, interactive/accent filled` },
  {
    part: 'Disabled',
    value: 'interactive/disabled empty, interactive/on-disabled filled and on the thumb’s edge: the filled part stays the more',
  },
  { part: 'Track box', value: `${spacing[300]} tall, so the ring fits; the line is inset by half a thumb` },
  {
    part: 'Balloon',
    value: `caption/md Semibold on 20, ${spacing[100]} inline, radius sm, a caret of ${spacing['050']}`,
  },
  { part: 'Field', value: 'the Input, sm, 64 wide (--slider-field-width)' },
  { part: 'Ticks', value: `2 × ${spacing['050']} in surface/raised, one per step` },
  { part: 'Ends', value: 'caption/md in text/secondary; an icon of 16' },
];
const measureColumns = [
  { key: 'part', header: 'Part', primary: true, cell: (r: Measure) => r.part },
  { key: 'value', header: 'Value', cell: (r: Measure) => <span className="alias">{r.value}</span> },
];

type PropRow = { prop: string; type: string; default: string };
const PROPS: PropRow[] = [
  { prop: 'label', type: 'string', default: 'required' },
  { prop: 'hideLabel', type: 'boolean', default: 'false' },
  { prop: 'unit', type: 'string', default: '—' },
  { prop: 'info', type: 'string', default: '—' },
  { prop: 'caption', type: 'ReactNode', default: '—' },
  { prop: 'min / max / step', type: 'number', default: '0 / 100 / 1' },
  { prop: 'range', type: 'true', default: '—' },
  { prop: 'value / defaultValue', type: 'number, or [number, number] with range', default: 'min; [min, max]' },
  { prop: 'onChange', type: '(value: number) => void, or a pair', default: '—' },
  { prop: 'showValue', type: 'boolean', default: 'false' },
  { prop: 'formatValue', type: '(value: number) => string', default: 'String' },
  { prop: 'ticks', type: 'boolean', default: 'false' },
  { prop: 'start / end', type: 'ReactNode', default: '—' },
  { prop: 'showInput', type: 'boolean', default: 'false' },
  { prop: 'inputLabel', type: 'string', default: '"label value"' },
  { prop: 'thumbLabels', type: '[string, string]', default: "['Minimum', 'Maximum']" },
  { prop: 'disabled', type: 'boolean', default: 'false' },
  { prop: 'name', type: 'string', default: '—' },
  { prop: 'className', type: 'string', default: '—' },
];
const propColumns = [
  { key: 'prop', header: 'Prop', primary: true, cell: (r: PropRow) => <code>{r.prop}</code> },
  { key: 'type', header: 'Type', cell: (r: PropRow) => <span className="alias">{r.type}</span> },
  { key: 'default', header: 'Default', cell: (r: PropRow) => <span className="alias">{r.default}</span> },
];

export default function Page() {
  const [share, setShare] = useState(75);
  const [band, setBand] = useState<SliderPair>([3500, 8500]);

  return (
    <DocPage
      evidence={
        <>
          {PAIRS.map((pair) => (
            <div key={pair.name}>
              <p>{pair.name}</p>
              {MODES.map((mode) => (
                <p key={mode}>
                  {mode} <Ratio fg={resolve(pair.fg, mode)} bg={resolve(pair.bg, mode)} threshold={pair.threshold} />
                </p>
              ))}
            </div>
          ))}
        </>
      }
    >
      <h1>Slider</h1>
      <p className="lead">
        A value chosen along a line: brightness, a rating, a price band. One thumb for a value, two for a range, and a
        field beside to type the number without the mouse.
      </p>

      <h2>Try it</h2>
      <div className="specimen">
        <Slider
          label="Percentage"
          unit="%"
          info="How much of the total this takes."
          caption="Applied to every new booking."
          start="0%"
          end="100%"
          showValue
          showInput
          formatValue={percent}
          value={share}
          onChange={setShare}
        />
      </div>
      <p className="alias">
        Drag the thumb, or focus it and use the arrows; Home and End go to the ends. Type 101 in the field to see the
        error the drawing has.
      </p>
      <p>
        The drawn complete version: label, unit, info, caption, the values at the ends, the balloon that is always shown
        and the field. Everything else on this page is the same component with parts left out. Underneath is the
        platform&rsquo;s <code>input type=&quot;range&quot;</code>, so the keyboard, <code>aria-valuenow</code>, the
        submitted value and what a reader hears are the browser&rsquo;s; the component paints the line, the fill, the
        ticks and the balloon itself, so every browser draws the same track.
      </p>

      <h2>The drawn usages</h2>
      <div className="specimen">
        <div className="specimenRow">
          <Badge tone="info">rating, with a mark at every step and faces at the ends</Badge>
        </div>
        <Slider
          label="Rating"
          caption="How happy are you with the service provided?"
          min={0}
          max={10}
          defaultValue={5}
          ticks
          showValue
          start={<FaceDissatisfied size={16} />}
          end={<FaceSatisfied size={16} />}
        />
        <div className="specimenRow">
          <Badge tone="info">brightness, icons and words</Badge>
        </div>
        <Slider
          label="Brightness"
          defaultValue={90}
          showValue
          formatValue={(v) => (v > 80 ? 'Very bright' : v > 40 ? 'Bright' : 'Dim')}
          start={<Asleep size={16} />}
          end={<Light size={16} />}
        />
        <div className="specimenRow">
          <Badge tone="info">whatever size, − and +</Badge>
        </div>
        <Slider label="Whatever size" defaultValue={50} start={<Subtract size={16} />} end={<Add size={16} />} />
        <div className="specimenRow">
          <Badge tone="info">no label, an icon at the start and the max at the end</Badge>
        </div>
        <Slider
          label="Stars"
          hideLabel
          min={0}
          max={10}
          defaultValue={8}
          showValue
          start={<Star size={16} />}
          end="10"
        />
        <div className="specimenRow">
          <Badge tone="info">just the slider</Badge>
        </div>
        <Slider label="Simple" hideLabel defaultValue={40} />
        <div className="specimenRow">
          <Badge tone="info">disabled</Badge>
        </div>
        <Slider label="Locked" defaultValue={30} showValue disabled />
      </div>

      <h2>A range</h2>
      <div className="specimen">
        <Slider
          label="Price range"
          info="Bookings outside it are hidden."
          range
          min={1000}
          max={10000}
          step={100}
          start="$1,000"
          end="$10,000"
          showValue
          formatValue={dollars}
          value={band}
          onChange={setBand}
        />
        <div className="specimenRow">
          <Badge tone="info">with fields for both</Badge>
        </div>
        <Slider label="Share" unit="%" range defaultValue={[25, 75]} showValue showInput formatValue={percent} />
      </div>
      <p>
        There is no native input with two thumbs, so a range is two inputs on one line, each a real control named
        &ldquo;Price range Minimum&rdquo; and &ldquo;Maximum&rdquo;, with the fill between them. Only the top input
        takes the pointer, and the one whose thumb is nearer the pointer is raised as it moves over the track: either
        thumb drags, and a click on the line moves the nearer one, which is what a single input does. The two never
        cross; the low field&rsquo;s ceiling is the high value and the high field&rsquo;s floor the low value. When the
        values meet, the balloons overlap; recorded, not solved.
      </p>

      <h2>Where it departs from the drawing, and why</h2>
      <p>
        The drawn track is a light grey that reads at about 1.5:1 on white, the same problem the Switch had: a
        control&rsquo;s identifying parts need 3:1 (WCAG 1.4.11). The empty line is border/strong, the token that exists
        for that, and the fill and the thumb&rsquo;s edge are interactive/accent, measured against both surfaces and
        against the thumb&rsquo;s own fill. The fill starts at the thumb&rsquo;s centre and not at the track&rsquo;s
        edge: the thumb travels the width less its own size, so a fill in percent of the whole width would miss it by up
        to half a thumb at the ends. The tag-like balloon the drawing offers as an alternative is not built.
      </p>

      <h2>Best practice, and the alternatives</h2>
      <p>
        A slider is for a value the reader <em>feels</em> more than knows: volume, brightness, a price band. For a value
        they know, a field alone is faster and more exact, and <code>showInput</code> gives both. The balloon always
        shown is the drawing&rsquo;s choice; the common practice is to show it on hover and focus, and the same
        component does that with <code>showValue</code> off and the value in <code>end</code> or in the field. Ticks
        serve ten steps or fewer; more crowd the line. A range with two fields is the fullest form; one with balloons
        only is what the drawing calls &ldquo;Range slider + Label&rdquo;. For a choice among a few named options, a{' '}
        <a href="/segmented-control">SegmentedControl</a> says the options; a slider says the distance between them.
      </p>

      <h2>Accessibility</h2>
      <p>
        The input is named by the visible label through <code>aria-labelledby</code>, and a range adds Minimum and
        Maximum off screen. <code>aria-valuetext</code> is <code>formatValue</code> of the value, so a reader hears
        &ldquo;75%&rdquo; or &ldquo;Very bright&rdquo;, the words the balloon shows; the balloon itself is hidden from
        readers, since the input already says it. The caption and the field&rsquo;s error describe the input. The info
        icon is a button whose Tooltip is its name. Focus draws a ring around the thumb.
      </p>

      <h2>Measures</h2>
      <div className="specimen">
        <Table
          caption="Measures"
          captionVisible
          density="compact"
          columns={measureColumns}
          rows={MEASURES}
          getRowId={(r) => r.part}
        />
      </div>

      <h2>Using it</h2>
      <CodeBlock code={USAGE} lang="tsx" />
      <div className="specimen">
        <Table
          caption="Slider props"
          captionVisible
          density="compact"
          columns={propColumns}
          rows={PROPS}
          getRowId={(r) => r.prop}
        />
      </div>
    </DocPage>
  );
}
