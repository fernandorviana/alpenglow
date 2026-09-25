'use client';

import { useState } from 'react';
import { Add } from '@carbon/icons-react';
import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { CodeBlock } from '@ui/CodeBlock';
import { TypeText } from '@ui/TypeText';
import { Accordion, AccordionItem } from '@/components/Accordion';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Table } from '@/components/Table';
import { toast } from '@/components/Toast';
import { resolve } from '@/tokens/contrast';
import { spacing } from '@/tokens/scale';
import { textStyle } from '@/tokens/typography';
import type { Mode, ThemeTokenName } from '@/tokens/theme';

const MODES: Mode[] = ['light', 'dark'];

const PAIRS: ReadonlyArray<{ name: string; fg: ThemeTokenName; bg: ThemeTokenName; threshold?: number }> = [
  { name: 'title', fg: 'text/primary', bg: 'surface/raised' },
  { name: 'the chevron', fg: 'text/secondary', bg: 'surface/raised', threshold: 3 },
  { name: 'the count', fg: 'text/primary', bg: 'surface/sunken' },
];

const USAGE = `import { Accordion, AccordionItem, Badge, Button } from 'alpenglow';

<Accordion headingLevel={3}>
  <AccordionItem title="Forms" count={2}>…</AccordionItem>
  <AccordionItem
    title="Diagnosis"
    count={diagnoses.length}
    action={<Button variant="ghost" tone="neutral" size="sm" aria-label="Add diagnosis" iconStart={<Add />} onClick={add} />}
    defaultOpen
  >
    …
  </AccordionItem>
  <AccordionItem title="Billing" meta={<Badge tone="danger">Unpaid</Badge>}>…</AccordionItem>
</Accordion>

// One at a time.
<Accordion exclusive>…</Accordion>`;

type Measure = { part: string; value: string };
/** Read from the scale and the text styles, so the page cannot quote a number the stylesheet does not use. */
const MEASURES: Measure[] = [
  { part: 'Row', value: `64: ${spacing[200]} above and below the drawn ${spacing[400]}` },
  { part: 'Under every item', value: 'a hairline, border/subtle' },
  { part: 'Chevron', value: `${spacing[250]}, at the start; it turns to point down` },
  { part: 'Title, Semibold', value: `${textStyle['body/lg'].size} / ${textStyle['body/lg'].lineHeight}` },
  { part: 'Count', value: `a capsule of ${spacing[250]} on surface/sunken, ${textStyle['caption/md'].size} / ${textStyle['caption/md'].lineHeight}` },
  { part: 'Action', value: `${spacing[400]}, at the end, outside the summary` },
  { part: 'Content', value: `${spacing[300]} under the row’s ${spacing[400]}, ${spacing[300]} above the line` },
];

type PropRow = { prop: string; type: string; default: string };
const GROUP: PropRow[] = [
  { prop: 'children', type: 'AccordionItem', default: 'required' },
  { prop: 'exclusive', type: 'boolean', default: 'false' },
  { prop: 'headingLevel', type: '2 | 3 | 4 | 5 | 6', default: '3' },
  { prop: 'className', type: 'string', default: '—' },
];
const ITEM: PropRow[] = [
  { prop: 'title', type: 'string', default: 'required' },
  { prop: 'count', type: 'number', default: '—' },
  { prop: 'meta', type: 'ReactNode — a Badge', default: '—' },
  { prop: 'action', type: 'ReactNode — an icon button', default: '—' },
  { prop: 'open, defaultOpen', type: 'boolean', default: '—, false' },
  { prop: 'onOpenChange', type: '(open: boolean) => void', default: '—' },
  { prop: 'children, className', type: '', default: '—' },
];

const propColumns = [
  { key: 'prop', header: 'Prop', primary: true, cell: (r: PropRow) => <code>{r.prop}</code> },
  { key: 'type', header: 'Type', cell: (r: PropRow) => <span className="alias"><TypeText>{r.type}</TypeText></span> },
  { key: 'default', header: 'Default', cell: (r: PropRow) => <span className="alias">{r.default}</span> },
];

const line = { margin: 0 } as const;

export default function Page() {
  const [diagnoses, setDiagnoses] = useState(['J45.909 · Unspecified asthma', 'R05 · Cough']);

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
      <h1>Accordion</h1>
      <p className="lead">Sections of a record that open and close, so a long panel can be read a part at a time.</p>

      <h2>Try it</h2>
      <div className="specimen">
        <Accordion>
          <AccordionItem title="Forms" count={2}>
            <p style={line}>Intake form · New patient questionnaire</p>
          </AccordionItem>
          <AccordionItem
            title="Diagnosis"
            count={diagnoses.length}
            defaultOpen
            action={
              <Button
                variant="ghost"
                tone="neutral"
                size="sm"
                aria-label="Add diagnosis"
                iconStart={<Add size={20} />}
                onClick={() => {
                  setDiagnoses([...diagnoses, 'Z00.00 · General examination']);
                  toast('Diagnosis added');
                }}
              />
            }
          >
            <ul style={{ margin: 0, paddingInlineStart: spacing[250] }}>
              {diagnoses.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </AccordionItem>
          <AccordionItem title="Notes">
            <p style={line}>No notes yet.</p>
          </AccordionItem>
          <AccordionItem title="Billing" meta={<Badge tone="danger">Unpaid</Badge>}>
            <p style={line}>Follow-up · 45 min · $120.00</p>
          </AccordionItem>
        </Accordion>
      </div>
      <p className="alias">Search this page for &ldquo;questionnaire&rdquo;: the browser opens the section that holds it.</p>

      <h2>One at a time</h2>
      <div className="specimen">
        <Accordion exclusive>
          <AccordionItem title="Before the appointment" defaultOpen>
            <p style={line}>Bring your insurance card and a list of the medicines you take.</p>
          </AccordionItem>
          <AccordionItem title="On the day">
            <p style={line}>Arrive ten minutes early. The video room opens five minutes before the hour.</p>
          </AccordionItem>
          <AccordionItem title="Afterwards">
            <p style={line}>Your notes and any prescription are in your record within a day.</p>
          </AccordionItem>
        </Accordion>
      </div>
      <p>
        Several may be open, which is what is drawn and what a record wants: Diagnosis read against Notes.{' '}
        <code>exclusive</code> is for a list of questions, where the one just opened is the one being read. It gives
        the items one <code>name</code>, and closing the others is the platform&rsquo;s.
      </p>

      <h2>The native element</h2>
      <p>
        An item is a <code>details</code> and its row a <code>summary</code>. Opening and closing, Enter and Space, and
        the state a screen reader says are the platform&rsquo;s, and so is one thing a scripted accordion does not
        have: text inside a closed section is found by the browser&rsquo;s own search, which opens it. The opening is
        animated only where the platform can animate to a height it has not been told, and not at all for a reader who
        asked for less motion; elsewhere a section is open or it is not.
      </p>

      <h2>The action</h2>
      <p>
        The drawn row has an add button at its end, shown under the pointer. Two things differ here. It is outside the{' '}
        <code>summary</code>, since a button inside a control is invalid and a press on it would also toggle the
        section; it is laid over the row&rsquo;s end and the summary keeps that room clear. And it is always shown: a
        control that exists on hover does not exist for the keyboard or for touch.
      </p>

      <h2>Anatomy</h2>
      <div className="specimen">
        <Table
          caption="Accordion geometry, in pixels"
          density="compact"
          columns={[
            { key: 'part', header: 'Part', primary: true, cell: (r: Measure) => r.part },
            { key: 'value', header: 'Value', cell: (r: Measure) => <span className="alias">{r.value}</span> },
          ]}
          rows={MEASURES}
          getRowId={(r) => r.part}
        />
      </div>
      <p>
        The chevron is at the start, as in the published set; older frames have it at the end, after the action.
        Decided on 2026-09-21: at the start the titles stand in a column and the end is the action&rsquo;s alone.
      </p>

      <h2>Accessibility</h2>
      <p>
        The title is a heading inside the summary, so the sections are in the page&rsquo;s outline;{' '}
        <code>headingLevel</code> is one below the heading the accordion stands under. The count is read after the
        title. The chevron is the only mark of open and closed for the eye, so it is held to 3:1; the state itself is
        the element&rsquo;s. The focus ring is drawn inside the row, where a scrolling panel cannot cut it.
      </p>

      <h2>Using it</h2>
      <CodeBlock code={USAGE} lang="tsx" />
      <div className="specimen">
        <Table caption="Accordion props" captionVisible density="compact" columns={propColumns} rows={GROUP} getRowId={(r) => r.prop} />
      </div>
      <div className="specimen">
        <Table caption="AccordionItem props" captionVisible density="compact" columns={propColumns} rows={ITEM} getRowId={(r) => r.prop} />
      </div>
    </DocPage>
  );
}
