'use client';

import { useState } from 'react';
import { Location as LocationIcon } from '@carbon/icons-react';
import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { CodeBlock } from '@ui/CodeBlock';
import { TypeText } from '@ui/TypeText';
import { Avatar } from '@/components/Avatar';
import { Field } from '@/components/Field/index';
import { NativeSelect } from '@/components/NativeSelect/index';
import { Select } from '@/components/Select/index';
import type { SelectEntry } from '@/components/Select/index';
import { Table } from '@/components/Table/index';
import { resolve } from '@/tokens/contrast';
import { radius, spacing } from '@/tokens/scale';
import { textStyle } from '@/tokens/typography';
import type { Mode, ThemeTokenName } from '@/tokens/theme';

const MODES: Mode[] = ['light', 'dark'];

const PAIRS: ReadonlyArray<{ name: string; fg: ThemeTokenName; bg: ThemeTokenName; threshold?: number }> = [
  { name: 'value', fg: 'text/primary', bg: 'interactive/neutral' },
  { name: 'placeholder', fg: 'text/placeholder', bg: 'interactive/neutral' },
  { name: 'an option', fg: 'text/primary', bg: 'surface/overlay' },
  { name: 'the check', fg: 'text/accent', bg: 'surface/overlay', threshold: 3 },
];

const SERVICES: SelectEntry[] = [
  { value: 'consult', label: 'Consultation', description: '30 minutes' },
  { value: 'follow-up', label: 'Follow-up', description: '15 minutes' },
  { value: 'assessment', label: 'Assessment', description: '60 minutes' },
];

const person = (value: string, label: string, disabled = false) => ({
  value,
  label,
  disabled,
  start: <Avatar name={label} size="xxs" />,
});

const STAFF: SelectEntry[] = [
  { label: 'On shift', options: [person('amanda', 'Amanda Hall'), person('jonathan', 'Jonathan Young'), person('ashley', 'Ashley Brooks')] },
  { label: 'Away', options: [person('sandra', 'Sandra Brown', true)] },
];

const CODES: SelectEntry[] = [
  ['90791', 'Diagnostic evaluation'],
  ['90792', 'Therapeutic exercises'],
  ['90834', 'Psychotherapy, 45 minutes'],
].map(([code, name]) => ({
  value: code!,
  label: `${code} - ${name}`,
  content: (
    <>
      <strong>{code}</strong> - {name}
    </>
  ),
}));

const USAGE = `import { Select, Avatar, Field } from 'alpenglow';

<Field label="Staff">
  <Select
    name="staff"
    placeholder="Choose someone"
    value={staff}
    onChange={setStaff}
    options={[
      { label: 'On shift', options: people.map((p) => ({
        value: p.id,
        label: p.name,
        start: <Avatar name={p.name} size="xxs" />,
      })) },
    ]}
  />
</Field>`;

type Key = { key: string; does: string };
const KEYS: Key[] = [
  { key: 'Down, Up, Enter, Space', does: 'Open the list at the option that is chosen.' },
  { key: 'Down, Up', does: 'Move over the options, past what cannot be chosen, and stop at the ends.' },
  { key: 'Home, End', does: 'The first and the last.' },
  { key: 'A letter', does: 'The next option that starts with it, open or closed.' },
  { key: 'Enter, Space', does: 'Choose and close.' },
  { key: 'Tab', does: 'Chooses the active option and moves on.' },
  { key: 'Esc', does: 'Closes with nothing chosen, and goes no further: a Dialog around it stays.' },
];

type Measure = { part: string; value: string };
/** Read from the scale and the text styles, so the page cannot quote a number the stylesheet does not use. */
const MEASURES: Measure[] = [
  { part: 'Field', value: `Input’s box: 32, 40 or 48 tall, radius ${radius.xl}` },
  { part: 'Chevron', value: `${spacing[250]}, in the accent` },
  { part: 'List', value: `the menu’s surface, radius ${radius.xl}, ${spacing[100]} of padding, never narrower than the field` },
  { part: 'Option', value: `${spacing[500]} tall, radius ${radius.md}; taller with a description` },
  { part: 'Description', value: `${textStyle['caption/md'].size} / ${textStyle['caption/md'].lineHeight}` },
  { part: 'Check', value: `${spacing[200]}, in the accent` },
  { part: 'Most', value: 'eight options, then it scrolls' },
];

type PropRow = { prop: string; type: string; default: string };
const PROPS: PropRow[] = [
  { prop: 'options', type: 'SelectEntry[] — options, or groups of them', default: 'required' },
  { prop: 'value', type: 'string', default: '—' },
  { prop: 'defaultValue', type: 'string', default: "''" },
  { prop: 'onChange', type: '(value: string) => void', default: '—' },
  { prop: 'placeholder', type: 'string', default: '—' },
  { prop: 'size', type: "'sm' | 'md' | 'lg'", default: 'density/control — 40, 32 compact' },
  { prop: 'invalid', type: 'boolean', default: 'from Field, else false' },
  { prop: 'disabled', type: 'boolean', default: 'false' },
  { prop: 'required', type: 'boolean', default: 'from Field' },
  { prop: 'name', type: 'string', default: '—' },
  { prop: 'iconStart', type: 'ReactNode', default: '—' },
  { prop: 'id, aria-label, aria-labelledby, aria-describedby', type: 'string', default: 'from Field' },
  { prop: 'className', type: 'string', default: '—' },
];
const OPTION: PropRow[] = [
  { prop: 'value', type: 'string', default: 'required' },
  { prop: 'label', type: 'string — what typing finds and a screen reader says', default: 'required' },
  { prop: 'start', type: 'ReactNode — an Avatar, an icon', default: '—' },
  { prop: 'description', type: 'string', default: '—' },
  { prop: 'content', type: 'ReactNode, shown in place of the label', default: '—' },
  { prop: 'disabled', type: 'boolean', default: 'false' },
];

const propColumns = (first: string) => [
  { key: 'prop', header: first, primary: true, cell: (r: PropRow) => <code>{r.prop}</code> },
  { key: 'type', header: 'Type', cell: (r: PropRow) => <span className="alias"><TypeText>{r.type}</TypeText></span> },
  { key: 'default', header: 'Default', cell: (r: PropRow) => <span className="alias">{r.default}</span> },
];

export default function Page() {
  const [staff, setStaff] = useState('amanda');
  const [code, setCode] = useState('90792');
  const [service, setService] = useState('');
  const [native, setNative] = useState('follow-up');

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
      <h1>Select</h1>
      <p className="lead">
        One value from a list, shown in the field once it is chosen: a button in Input&rsquo;s
        box that opens the system&rsquo;s own list.
      </p>

      <h2>Try it</h2>
      <div className="specimen">
        <div style={{ display: 'grid', gap: spacing[200], maxWidth: 360 }}>
          <Field label="Staff">
            <Select options={STAFF} value={staff} onChange={setStaff} placeholder="Choose someone" />
          </Field>
          <Field label="Service code">
            <Select options={CODES} value={code} onChange={setCode} />
          </Field>
          <Field label="Location">
            <Select
              iconStart={<LocationIcon />}
              placeholder="Location"
              options={['Phoenix Clinic Hospital', 'Scottsdale Clinic Building', 'Video office'].map((l) => ({ value: l, label: l }))}
            />
          </Field>
        </div>
        <p className="alias" style={{ margin: `${spacing[150]}px 0 0` }}>
          An Avatar before the name, a code in bold, a plain list with an icon: the three drawn
          fields. Type a letter, open or closed, to go to an option.
        </p>
      </div>

      <h2>Choosing a select</h2>
      <p>
        A select is for one value from a list too long to lay out: past six or so options, a
        row of radios is a wall, and a select is one line. Under that, prefer{' '}
        <a href="/choice">radios</a>, which show every answer at once and need no opening. Two
        answers are a switch or a checkbox, never a select.
      </p>
      <p>
        Put the options in the order the reader expects — alphabetical for names and places,
        by size or by time where the list has one, and the common answer first when there is
        one — and choose it for them when the form usually wants it. A placeholder is a prompt
        for the field&rsquo;s answer, <em>Choose a service</em>: it is not an option, and it
        cannot be the value a required field submits.
      </p>

      <h3>Select or dropdown menu</h3>
      <p>
        Both are a button that opens a list on the same surface, and in a drawing they are the
        same thing. They answer different questions. A select holds a <strong>value</strong>:
        the choice stays visible in the field afterwards, belongs to a form, and is submitted
        with it. A <a href="/dropdown-menu">dropdown menu</a> runs a <strong>command</strong>:
        nothing is kept, the list closes, and something happens — reschedule, export, cancel.
      </p>
      <p>
        The test is what the control shows once the list has closed. If it shows the choice, it
        is a Select. If choosing was the end of it, it is a dropdown menu. A screen reader is
        told the difference: a select says its name, its value and &ldquo;3 of 12&rdquo;; a menu
        says how many commands it has.
      </p>

      <h2>Chosen, and active</h2>
      <p>
        The chosen option carries a check in the accent and nothing else. The wash belongs to
        the active option, the one under the pointer or the arrows, so the two are never the
        same mark, and when they are the same option both show. The check is a shape, so the
        choice does not rest on colour.
      </p>

      <h2>Anatomy and sizes</h2>
      <div className="specimen">
        <Table
          caption="Select geometry, in pixels"
          density="compact"
          columns={[
            { key: 'part', header: 'Part', primary: true, cell: (r: Measure) => r.part },
            { key: 'value', header: 'Value', cell: (r: Measure) => <span className="alias">{r.value}</span> },
          ]}
          rows={MEASURES}
          getRowId={(r) => r.part}
        />
      </div>
      <div className="specimen">
        <div style={{ display: 'grid', gap: spacing[200], maxWidth: 360 }}>
          <Select aria-label="Service, small" size="sm" placeholder="Small" options={SERVICES} />
          <Select aria-label="Service, medium" size="md" placeholder="Medium" options={SERVICES} />
          <Select aria-label="Service, large" size="lg" placeholder="Large" options={SERVICES} />
        </div>
      </div>
      <p>
        The field is <a href="/input">Input</a>&rsquo;s box, at its three heights, with the same
        fill and the same border that arrives on focus. The open list is not drawn anywhere; it
        is the <a href="/dropdown-menu">menu</a>&rsquo;s rows on the one floating surface the
        menu, the date picker and the <a href="/popover">popover</a> stand on.
      </p>

      <h2>States</h2>
      <div className="specimen">
        <div style={{ display: 'grid', gap: spacing[200], maxWidth: 360 }}>
          <Select aria-label="Disabled" disabled placeholder="Disabled" options={SERVICES} />
          <Select aria-label="Invalid" invalid placeholder="In error" options={SERVICES} />
        </div>
      </div>
      <p>
        No hover, as on Input: the box does not react to the pointer, and the border arrives
        with focus. Disabled drops the paint and the focus; invalid takes the danger border,
        and inside a Field the message that says what to choose.
      </p>

      <h2>In a Field</h2>
      <div className="specimen">
        <div style={{ maxWidth: 360 }}>
          <Field
            label="Service"
            description="Determines the length of the appointment."
            error={!service && 'Choose a service before continuing.'}
            required
          >
            <Select name="service" placeholder="Choose a service" options={SERVICES} value={service} onChange={setService} />
          </Field>
        </div>
      </div>
      <p>
        The Field&rsquo;s label names the button, and its description and error are read with
        it. With a <code>name</code> the value goes with the form through a hidden input. A
        hidden input cannot stop a form, so <code>required</code> is said to a screen reader
        and enforced by the caller, as the error above is.
      </p>

      <h2>The platform&rsquo;s select</h2>
      <p>
        Until 2026-09-21 this component was the native <code>&lt;select&gt;</code>, by a rule
        the system still holds: prefer the native element. It was set aside here for one
        reason. The drawn fields hold what a native list cannot show — an Avatar, a code in
        bold, a second line — and the list belongs to the operating system, so it is a
        different list in every browser. <code>appearance: base-select</code> will end that
        trade; it is in Chrome, Edge and Safari 27, and not yet in Firefox.
      </p>
      <p>
        The native one is <code>NativeSelect</code>, unchanged. It is the better choice on a
        phone in a long form, where the platform&rsquo;s picker is better than any list of
        ours, and for a very long list such as countries.
      </p>
      <div className="specimen">
        <div style={{ maxWidth: 360 }}>
          <Field label="Service" description="The platform’s list.">
            <NativeSelect value={native} onChange={(event) => setNative(event.target.value)}>
              <option value="consult">Consultation</option>
              <option value="follow-up">Follow-up</option>
              <option value="assessment">Assessment</option>
            </NativeSelect>
          </Field>
        </div>
      </div>

      <h2>Accessibility</h2>
      <p>
        It is the select-only combobox of the ARIA practices: a button with{' '}
        <code>role=&quot;combobox&quot;</code> that owns a <code>listbox</code>. The keyboard&rsquo;s
        focus never leaves the button; the active option is named to it, so there is one tab
        stop and nothing to give the focus back to. The list is the platform&rsquo;s{' '}
        <code>popover</code>, so a press outside closes it.
      </p>
      <div className="specimen">
        <Table
          caption="Select, by keyboard"
          density="compact"
          columns={[
            { key: 'key', header: 'Key', primary: true, cell: (r: Key) => r.key },
            { key: 'does', header: 'Does', cell: (r: Key) => r.does },
          ]}
          rows={KEYS}
          getRowId={(r) => r.key}
        />
      </div>
      <p>
        The select never renders its own label. Wrap it in a <code>Field</code> or give it an{' '}
        <code>aria-label</code>, as the sizes above do. An option&rsquo;s <code>label</code> is
        always words, even where <code>content</code> is shown in its place: it is what typing
        finds.
      </p>

      <h2>Props</h2>
      <CodeBlock code={USAGE} lang="tsx" />
      <div className="specimen">
        <Table caption="Select props" captionVisible density="compact" columns={propColumns('Prop')} rows={PROPS} getRowId={(r) => r.prop} />
      </div>
      <div className="specimen">
        <Table caption="An option" captionVisible density="compact" columns={propColumns('Field')} rows={OPTION} getRowId={(r) => r.prop} />
      </div>
      <p className="alias" style={{ marginTop: 8 }}>
        A group is <code>{'{ label, options }'}</code>. <code>NativeSelect</code> takes{' '}
        <code>size</code>, <code>placeholder</code>, <code>invalid</code>, <code>iconStart</code>,
        its options as children, and every attribute of a <code>select</code>.
      </p>
    </DocPage>
  );
}
