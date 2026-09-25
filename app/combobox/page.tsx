'use client';

import { useState } from 'react';
import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { CodeBlock } from '@ui/CodeBlock';
import { TypeText } from '@ui/TypeText';
import { Avatar } from '@/components/Avatar';
import { Combobox } from '@/components/Combobox';
import { Field } from '@/components/Field/index';
import { Table } from '@/components/Table/index';
import { resolve } from '@/tokens/contrast';
import { radius, spacing } from '@/tokens/scale';
import { textStyle } from '@/tokens/typography';
import type { Mode, ThemeTokenName } from '@/tokens/theme';

const MODES: Mode[] = ['light', 'dark'];

const PAIRS: ReadonlyArray<{ name: string; fg: ThemeTokenName; bg: ThemeTokenName; threshold?: number }> = [
  { name: 'typed text', fg: 'text/primary', bg: 'interactive/neutral' },
  { name: 'a tag', fg: 'text/primary', bg: 'surface/raised' },
  { name: 'an option', fg: 'text/primary', bg: 'surface/overlay' },
  { name: 'the checked box', fg: 'interactive/on-accent', bg: 'interactive/accent' },
];

const NAMES = [
  'Anthony Jackson',
  'Brian Stewart',
  'Charles Griffin',
  'Elizabeth Hall',
  'Justin Anderson',
  'Laura Lee',
  'Laura Martinez',
  'Léa Martin',
  'Patrick Moore',
  'Sandra Brown',
];
const PEOPLE = NAMES.map((name) => ({
  value: name.normalize('NFD').replace(/[^\w ]/g, '').toLowerCase().replace(/ /g, '-'),
  label: name,
  start: <Avatar name={name} size="xxs" />,
}));

const USAGE = `import { Combobox, Avatar, Field } from 'alpenglow';

// One value.
<Field label="Patient">
  <Combobox
    name="patient"
    placeholder="Name or record number"
    options={patients}
    value={patient}
    onChange={setPatient}
    emptyText={(q) => \`No patients match “\${q}”\`}
  />
</Field>

// Many: tags in the field, a checkbox before every option.
<Combobox multiple selectAllLabel="All" options={people} value={team} onChange={setTeam} />

// A server does the narrowing.
<Combobox filter={null} onInputChange={search} loading={pending} options={results} … />`;

type Key = { key: string; does: string };
const KEYS: Key[] = [
  { key: 'Typing', does: 'Opens the list, narrows it, and makes the best match active.' },
  { key: 'Down, Up', does: 'Open the list, and move over the options past what cannot be chosen.' },
  { key: 'Alt + Down', does: 'Opens the list and makes nothing active.' },
  { key: 'Home, End', does: 'The caret’s, until an option is active; then the first and the last.' },
  { key: 'Enter', does: 'Chooses the active option. With many, the list stays open.' },
  { key: 'Esc', does: 'Closes the list. Again, puts back what was typed over. Neither goes on to a Dialog around it.' },
  { key: 'Backspace', does: 'With many and nothing typed, takes the last tag away.' },
  { key: 'Leaving the field', does: 'What was typed and chose nothing is put back: the value is always from the list. Emptied, a single choice is taken away.' },
];

type Measure = { part: string; value: string };
/** Read from the scale and the text styles, so the page cannot quote a number the stylesheet does not use. */
const MEASURES: Measure[] = [
  { part: 'Field', value: `Input’s box: 32, 40 or 48 tall, radius ${radius.xl}; it grows with its tags` },
  { part: 'Tag', value: `${spacing[300]} tall, a capsule on the raised surface, ${textStyle['caption/md'].size} / ${textStyle['caption/md'].lineHeight}` },
  { part: 'A tag’s button', value: `${spacing[250]}` },
  { part: 'Clear', value: `${spacing[300]}, the least a target may be` },
  { part: 'Option', value: `the Select’s: ${spacing[500]} tall, radius ${radius.md}` },
  { part: 'Checkbox', value: `${spacing[250]}, the Checkbox’s own box` },
  { part: 'Most', value: 'eight options, then it scrolls' },
];

type PropRow = { prop: string; type: string; default: string };
const PROPS: PropRow[] = [
  { prop: 'options', type: 'SelectEntry[] — the Select’s options and groups', default: 'required' },
  { prop: 'multiple', type: 'boolean', default: 'false' },
  { prop: 'value, defaultValue', type: 'string — or string[] with multiple', default: '—' },
  { prop: 'onChange', type: '(value) => void', default: '—' },
  { prop: 'placeholder', type: 'string', default: '—' },
  { prop: 'filter', type: '(option, query) => boolean, or null', default: 'the label holds it' },
  { prop: 'onInputChange', type: '(query: string) => void', default: '—' },
  { prop: 'loading, loadingText', type: 'boolean, string', default: "false, 'Loading…'" },
  { prop: 'emptyText', type: 'string | (query) => string', default: "'No results'" },
  { prop: 'clearable, clearLabel', type: 'boolean, string', default: "with multiple, 'Clear'" },
  { prop: 'selectAllLabel', type: 'string, with multiple', default: '—' },
  { prop: 'removeLabel, countLabel', type: '(label) => string, (count) => string', default: 'English' },
  { prop: 'size, invalid, disabled, required, name, iconStart', type: 'as the Select', default: '—' },
  { prop: 'id, aria-label, aria-labelledby, aria-describedby, className', type: 'string', default: 'from Field' },
];

export default function Page() {
  const [patient, setPatient] = useState('');
  const [team, setTeam] = useState<string[]>(['anthony-jackson', 'laura-lee', 'lea-martin']);

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
      <h1>Combobox</h1>
      <p className="lead">
        A field that is typed in to narrow a list, and a choice made from the list: one value,
        or many as tags.
      </p>

      <h2>Try it</h2>
      <div className="specimen">
        <div style={{ display: 'grid', gap: spacing[300], maxWidth: 556 }}>
          <Field label="Patient" description="One value. Type “and”.">
            <Combobox
              clearable
              placeholder="Name or record number"
              options={PEOPLE}
              value={patient}
              onChange={setPatient}
              emptyText={(q) => `No patients match “${q}”`}
            />
          </Field>
          <Field label="My team" description="Many, as drawn: tags, a checkbox before every option, a row for all.">
            <Combobox multiple selectAllLabel="All" placeholder="Add someone" options={PEOPLE} value={team} onChange={setTeam} />
          </Field>
        </div>
      </div>

      <h2>Choosing a combobox</h2>
      <p>
        A <a href="/select">Select</a> is for a list that can be read: a dozen services, five
        locations. A combobox is for one nobody wants to scroll — patients, staff, countries —
        where the reader already knows a piece of the name. It costs a field to type in, so
        under ten options or so it is the wrong trade.
      </p>
      <p>
        The value is always from the list. What is typed is a way to an option and not an
        answer: leave the field with <em>zzz</em> in it and the last choice comes back; leave it
        empty and the choice is taken away. Free
        text with suggestions under it is another pattern, and is an <a href="/input">Input</a>.
      </p>

      <h2>What was typed, in the label</h2>
      <p>
        An option stays if its label holds what was typed anywhere in it, whatever the case or
        the accents, so <em>and</em> finds Sandra and <em>lea</em> finds Léa. Anywhere, and not
        only at the start, asks the eye why a row is there: the part that matched is in a
        heavier weight. Weight, not colour — the accent is the check&rsquo;s. The first option
        that can be chosen is active as soon as something is typed, so Enter takes the best
        match. Nothing is completed in the field: it suggests and never completes, the rule of
        the site&rsquo;s own search, because a field that types for you is a field that types
        the wrong thing.
      </p>

      <h2>Many</h2>
      <p>
        With <code>multiple</code> each choice is a tag in the field, which grows with them;
        every option has the <a href="/choice">Checkbox</a>&rsquo;s box before it; and{' '}
        <code>selectAllLabel</code> adds a first row that is checked, empty, or mixed. That row
        is hidden while something is typed, where &ldquo;all&rdquo; would not mean the ones in
        view. The list stays open after a choice, and what was typed is cleared, since it has
        done its work.
      </p>
      <p>
        The drawn box is filled with the inverse surface; this one is the accent, because it
        is the Checkbox&rsquo;s own and one checkbox is enough for a system. It is drawn again
        here as a picture and is not the component: an input inside an option is a control
        inside a control.
      </p>

      <h2>Anatomy</h2>
      <div className="specimen">
        <Table
          caption="Combobox geometry, in pixels"
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
        The tag is private to the Combobox for now. The system&rsquo;s Tag is on the roadmap
        and not yet drawn; when it is, this becomes that.
      </p>

      <h2>Accessibility</h2>
      <p>
        The field is a text input with <code>role=&quot;combobox&quot;</code> and{' '}
        <code>aria-autocomplete=&quot;list&quot;</code> that owns a <code>listbox</code>; the
        focus never leaves it, and the active option is named to it. With many the listbox
        says it takes many, a change says how many are chosen, and the row for all says{' '}
        <code>mixed</code>. A tag&rsquo;s button is reached by the pointer and not by Tab — six
        tags would be six stops before the field — because the keyboard has two other ways:
        Backspace takes the last away, and the list unchecks any. The Enter that commits an
        IME composition is the composition&rsquo;s and chooses nothing.
      </p>
      <div className="specimen">
        <Table
          caption="Combobox, by keyboard"
          density="compact"
          columns={[
            { key: 'key', header: 'Key', primary: true, cell: (r: Key) => r.key },
            { key: 'does', header: 'Does', cell: (r: Key) => r.does },
          ]}
          rows={KEYS}
          getRowId={(r) => r.key}
        />
      </div>

      <h2>Props</h2>
      <CodeBlock code={USAGE} lang="tsx" />
      <div className="specimen">
        <Table
          caption="Combobox props"
          captionVisible
          density="compact"
          columns={[
            { key: 'prop', header: 'Prop', primary: true, cell: (r: PropRow) => <code>{r.prop}</code> },
            { key: 'type', header: 'Type', cell: (r: PropRow) => <span className="alias"><TypeText>{r.type}</TypeText></span> },
            { key: 'default', header: 'Default', cell: (r: PropRow) => <span className="alias">{r.default}</span> },
          ]}
          rows={PROPS}
          getRowId={(r) => r.prop}
        />
      </div>
    </DocPage>
  );
}
