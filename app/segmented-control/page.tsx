'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { CodeBlock } from '@ui/CodeBlock';
import { SegmentedControl } from '@/components/SegmentedControl';
import type { SegmentedOption } from '@/components/SegmentedControl';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { Table } from '@/components/Table';
import { resolve } from '@/tokens/contrast';
import { radius, spacing } from '@/tokens/scale';
import { textStyle } from '@/tokens/typography';
import type { Mode, ThemeTokenName } from '@/tokens/theme';

const MODES: Mode[] = ['light', 'dark'];

/** The pairs a segment is read in. `over` is the surface a wash lands on. */
const PAIRS: ReadonlyArray<{ name: string; fg: ThemeTokenName; bg: ThemeTokenName; over?: ThemeTokenName }> = [
  { name: 'chosen, on the thumb', fg: 'text/accent', bg: 'surface/overlay' },
  { name: 'resting, on the track', fg: 'text/secondary', bg: 'surface/sunken' },
  { name: 'hovered', fg: 'text/secondary', bg: 'interactive/wash-hover', over: 'surface/sunken' },
  { name: 'pressed', fg: 'text/secondary', bg: 'interactive/wash-pressed', over: 'surface/sunken' },
];

const PERIOD: readonly SegmentedOption[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

const VIEW: readonly SegmentedOption[] = [
  { value: 'list', label: 'List' },
  { value: 'board', label: 'Board' },
  { value: 'timeline', label: 'Timeline', disabled: true },
];

const USAGE = `import { SegmentedControl } from 'alpenglow';

const [period, setPeriod] = useState('week');

<SegmentedControl
  label="Period"
  options={[
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
  ]}
  value={period}
  onChange={setPeriod}
/>

// In a form: the value is submitted under name, as any radio group's.
<SegmentedControl label="Period" name="period" options={…} defaultValue="week" />`;

type Measure = { part: string; value: string };
const type = (name: keyof typeof textStyle) => `${textStyle[name].size} / ${textStyle[name].lineHeight}`;

/** Read from the scale and the text styles, so the page cannot quote a number the stylesheet does not use. */
const MEASURES: Measure[] = [
  { part: 'Height', value: '32, segment 28' },
  { part: 'Columns', value: 'equal; the track fits its labels, or its container with fullWidth' },
  { part: 'Gap between segments', value: String(spacing['025']) },
  { part: 'Radius', value: `track ${radius.lg}, thumb ${radius.md}` },
  { part: 'Label, Semibold', value: type('caption/md') },
  { part: 'Track', value: 'surface/sunken, a border/subtle hairline' },
  { part: 'Thumb', value: 'surface/overlay on elevation/sm; a border/strong hairline in dark' },
];

const measureColumns = [
  { key: 'part', header: 'Part', primary: true, cell: (r: Measure) => r.part },
  { key: 'value', header: 'Value', cell: (r: Measure) => <span className="alias">{r.value}</span> },
];

type PropRow = { prop: string; type: string; default: string };
const PROPS: PropRow[] = [
  { prop: 'options', type: 'readonly SegmentedOption[] — { value, label, disabled? }', default: 'required' },
  { prop: 'label', type: 'string', default: 'required' },
  { prop: 'value', type: 'string', default: '—' },
  { prop: 'defaultValue', type: 'string', default: '—' },
  { prop: 'onChange', type: '(value: string) => void', default: '—' },
  { prop: 'name', type: 'string', default: 'a generated id' },
  { prop: 'disabled', type: 'boolean', default: 'false' },
  { prop: 'fullWidth', type: 'boolean', default: 'false' },
  { prop: 'className', type: 'string', default: '—' },
];

const propColumns = [
  { key: 'prop', header: 'Prop', primary: true, cell: (r: PropRow) => <code>{r.prop}</code> },
  { key: 'type', header: 'Type', cell: (r: PropRow) => <span className="alias">{r.type}</span> },
  { key: 'default', header: 'Default', cell: (r: PropRow) => <span className="alias">{r.default}</span> },
];

export default function Page() {
  const [period, setPeriod] = useState('week');
  const [submitted, setSubmitted] = useState<string | null>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSubmitted((data.get('period') as string | null) ?? 'nothing');
  };

  return (
    <DocPage
      evidence={
        <>
          {PAIRS.map((pair) => (
            <div key={pair.name}>
              <p>{pair.name}</p>
              {MODES.map((mode) => (
                <p key={mode}>
                  {mode}{' '}
                  <Ratio
                    fg={resolve(pair.fg, mode)}
                    bg={resolve(pair.bg, mode, pair.over && resolve(pair.over, mode))}
                  />
                </p>
              ))}
            </div>
          ))}
        </>
      }
    >
      <h1>Segmented control</h1>
      <p className="lead">
        The segmented track over a value: two to five options in one row, the chosen one on a lifted thumb. A radio
        group that looks like the <a href="/tabs">Tabs</a>.
      </p>

      <h2>Try it</h2>
      <div className="specimen">
        <div className="specimenRow">
          <SegmentedControl label="Period" options={PERIOD} value={period} onChange={setPeriod} />
          <span className="alias">The {period} view.</span>
        </div>
      </div>
      <p className="alias">Tab into it and use the arrows; a disabled option is skipped, as with any radio.</p>
      <p>
        Not drawn on its own: the product&rsquo;s <em>Tabs</em> set is the drawing, and the package has it as the
        Tabs&rsquo; segmented variant. What was missing is the same drawing over a value, which the Tabs page has said
        since it was written: a control that holds a value and shows no panel is a radio group, however much it looks
        like the segmented track. This is that radio group. The two share one stylesheet, so they cannot drift apart.
      </p>

      <h2>SegmentedControl or Tabs</h2>
      <p>
        The question is what the reader is choosing. <strong>Tabs</strong> switch between views of one object, each a
        panel complete on its own: the details, the participants and the chat of an appointment.{' '}
        <strong>SegmentedControl</strong> holds an answer: the period of a calendar, the view of a list, a unit. A
        screen reader tells them apart, &ldquo;tab, 2 of 3, selected&rdquo; against &ldquo;radio button, 2 of 3,
        checked&rdquo;, and so does a form: the control submits its value, the Tabs submit nothing. When the answer
        changes what is shown below, it is still a SegmentedControl, since what is shown is the same thing filtered, not
        a different panel.
      </p>

      <h2>States</h2>
      <div className="specimen">
        <div className="specimenRow">
          <Badge tone="info">a disabled option</Badge>
        </div>
        <div className="specimenRow">
          <SegmentedControl label="View" options={VIEW} defaultValue="list" />
        </div>
        <div className="specimenRow">
          <Badge tone="info">disabled</Badge>
        </div>
        <div className="specimenRow">
          <SegmentedControl label="View, disabled" options={VIEW.slice(0, 2)} defaultValue="board" disabled />
        </div>
        <div className="specimenRow">
          <Badge tone="info">nothing chosen yet</Badge>
        </div>
        <div className="specimenRow">
          <SegmentedControl
            label="Unit"
            options={[
              { value: 'kg', label: 'kg' },
              { value: 'lb', label: 'lb' },
            ]}
          />
        </div>
        <div className="specimenRow">
          <Badge tone="info">fullWidth</Badge>
        </div>
        <div className="specimenRow">
          <div style={{ width: '100%' }}>
            <SegmentedControl label="Period, full width" options={PERIOD} defaultValue="day" fullWidth />
          </div>
        </div>
      </div>
      <p>
        A radio group may have no answer yet, and a <code>value</code> that names nothing, or a disabled option, checks
        nothing and draws no thumb. Not the Tabs&rsquo; fallback to the first: a form must not answer for the reader.{' '}
        <code>disabled</code> on the control disables the group through its fieldset; the value it holds stays in view.
      </p>

      <h2>In a form</h2>
      <p>
        The radios are real, so the control needs no wiring to submit: give it a <code>name</code> and the value arrives
        with the form.
      </p>
      <div className="specimen">
        <form
          onSubmit={onSubmit}
          style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--ap-spacing-200)' }}
        >
          <SegmentedControl label="Period" name="period" options={PERIOD} defaultValue="month" />
          <Button type="submit" variant="outline" tone="neutral" size="sm">
            Submit
          </Button>
          <span className="alias" aria-live="polite">
            {submitted === null ? 'Nothing submitted yet.' : `Submitted period=${submitted}.`}
          </span>
        </form>
      </div>

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
      <p>
        The thumb is one element that slides. The columns are equal, so a step is the thumb&rsquo;s own width plus the
        gap, and nothing is measured in script; under reduced motion it jumps. The track is surface/sunken with a
        hairline where the drawing has surface/base with none, the Tabs&rsquo; decision of 2026-09-18: base is the
        canvas, where the drawn track vanishes.
      </p>

      <h2>The boundary</h2>
      <p>
        The roadmap had this control take the Checkbox&rsquo;s rule for every option&rsquo;s unmarked boundary,
        border/strong at 3:1. It does not, and this is the decision: on an unchecked checkbox the border is the whole
        control, and here the options are visible text, the chosen one has a shape, and a colour, and the radio
        announces the state. The track keeps the Tabs&rsquo; hairline. The thumb itself is the one exception, in dark
        only: its surface step above a card (fidelity audit, 2026-09-24) is the thinnest in the system, and it now
        takes a border/strong hairline of its own there, the same &ldquo;separate with a border&rdquo; move the
        track&rsquo;s edge already makes against the canvas.
      </p>

      <h2>Accessibility</h2>
      <p>
        A fieldset with <code>role=&quot;radiogroup&quot;</code>, named by a legend that is read and not seen. Each
        segment is a label around a radio kept off screen, so the platform supplies the arrows, Space, the skipping of a
        disabled option, the submitted value and what is announced; the component writes no keyboard handling. Focus
        lands on the radio and the segment draws the ring for it.
      </p>

      <h2>Using it</h2>
      <CodeBlock code={USAGE} lang="tsx" />
      <div className="specimen">
        <Table
          caption="SegmentedControl props"
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
