'use client';

import { useRef, useState } from 'react';
import { Location as LocationIcon } from '@carbon/icons-react';
import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { CodeBlock } from '@ui/CodeBlock';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Table } from '@/components/Table';
import { Tag } from '@/components/Tag';
import { resolve } from '@/tokens/contrast';
import { spacing } from '@/tokens/scale';
import { textStyle } from '@/tokens/typography';
import type { Mode, ThemeTokenName } from '@/tokens/theme';

const MODES: Mode[] = ['light', 'dark'];

const PAIRS: ReadonlyArray<{ name: string; fg: ThemeTokenName; bg: ThemeTokenName }> = [
  { name: 'on a card', fg: 'text/primary', bg: 'surface/sunken' },
  { name: 'in a field', fg: 'text/primary', bg: 'surface/raised' },
  { name: 'the button', fg: 'text/secondary', bg: 'surface/sunken' },
];

const TEAM = ['Anthony Jackson', 'Laura Lee', 'Léa Martin', 'Patrick Moore'];

const USAGE = `import { Tag, Avatar } from 'alpenglow';

<ul aria-label="My team">
  {team.map((person) => (
    <li key={person.id}>
      <Tag
        start={<Avatar name={person.name} size="xxs" />}
        onRemove={() => remove(person.id)}
      >
        {person.name}
      </Tag>
    </li>
  ))}
</ul>`;

type Choice = { when: string; use: string };
const CHOICES: Choice[] = [
  { when: 'Something the reader added and can take away: a person, a filter, a label', use: 'Tag' },
  { when: 'A state the record is in: confirmed, pending, overdue', use: 'Badge' },
  { when: 'It does something when pressed', use: 'Button' },
  { when: 'A count beside a name', use: 'Badge, or the Tabs’ own count' },
];

type Measure = { part: string; value: string };
/** Read from the scale and the text styles, so the page cannot quote a number the stylesheet does not use. */
const MEASURES: Measure[] = [
  { part: 'Height', value: `${spacing[400]} as drawn, or ${spacing[300]}` },
  { part: 'Shape', value: 'a capsule' },
  { part: 'Text, Medium', value: `${textStyle['caption/md'].size} / ${textStyle['caption/md'].lineHeight}` },
  { part: 'Words from the edge', value: `${spacing[150]}, or ${spacing[100]} when small` },
  {
    part: 'An Avatar from the edge',
    value: `the same all round: ${spacing['050']} for a 24 Avatar in the 32 tag, none in the 24`,
  },
  { part: 'The button', value: `${spacing[300]}, or ${spacing[250]} when small` },
];

type PropRow = { prop: string; type: string; default: string };
const PROPS: PropRow[] = [
  { prop: 'children', type: 'ReactNode', default: 'required' },
  { prop: 'start', type: 'ReactNode — an Avatar, an icon', default: '—' },
  { prop: 'size', type: "'sm' | 'md'", default: "'md'" },
  { prop: 'onRemove', type: '() => void', default: '—' },
  { prop: 'removeLabel', type: 'string', default: '“Remove” and the words' },
  { prop: 'removeProps', type: 'what a button takes: tabIndex, onMouseDown', default: '—' },
  { prop: 'disabled', type: 'boolean', default: 'false' },
  { prop: 'className, and what a span takes', type: '', default: '—' },
];

const list = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[100],
  margin: 0,
  padding: 0,
  listStyle: 'none',
} as const;

export default function Page() {
  const [team, setTeam] = useState(TEAM);
  const members = useRef<HTMLUListElement>(null);

  return (
    <DocPage
      evidence={
        <>
          {PAIRS.map((pair) => (
            <div key={pair.name}>
              <p>{pair.name}</p>
              {MODES.map((mode) => (
                <p key={mode}>
                  {mode} <Ratio fg={resolve(pair.fg, mode)} bg={resolve(pair.bg, mode)} />
                </p>
              ))}
            </div>
          ))}
        </>
      }
    >
      <h1>Tag</h1>
      <p className="lead">
        Something the reader put there and can take away: a person on a team, a filter on a list, a label on a record.
      </p>

      <h2>Try it</h2>
      <div className="specimen">
        <ul ref={members} aria-label="My team" tabIndex={-1} style={list}>
          {team.map((name) => (
            <li key={name}>
              <Tag
                start={<Avatar name={name} size="xxs" />}
                onRemove={() => {
                  setTeam(team.filter((n) => n !== name));
                  // The button that had the focus is gone with its tag; the list
                  // it belonged to takes it, so the next Tab goes on from here.
                  members.current?.focus();
                }}
              >
                {name}
              </Tag>
            </li>
          ))}
        </ul>
        {team.length < TEAM.length && (
          <div style={{ marginTop: spacing[200] }}>
            <Button variant="outline" tone="neutral" size="sm" onClick={() => setTeam(TEAM)}>
              Bring them back
            </Button>
          </div>
        )}
      </div>
      <p className="alias">
        The tag does not remove itself: <code>onRemove</code> tells the caller, who takes it out of the list, as with
        the Alert.
      </p>

      <h2>Tag or badge</h2>
      <div className="specimen">
        <div className="specimenRow">
          <Tag start={<Avatar name="Laura Lee" size="xxs" />} onRemove={() => {}}>
            Laura Lee
          </Tag>
          <Tag>Pediatrics</Tag>
          <Badge tone="success">Confirmed</Badge>
          <Badge tone="warning">Pending</Badge>
        </div>
      </div>
      <div className="specimen">
        <Table
          caption="Which one"
          density="compact"
          columns={[
            { key: 'when', header: 'When', primary: true, cell: (r: Choice) => r.when },
            { key: 'use', header: 'Use', cell: (r: Choice) => r.use },
          ]}
          rows={CHOICES}
          getRowId={(r) => r.when}
        />
      </div>
      <p>
        The roadmap left it open whether a tag is a <a href="/badge">Badge</a> with a button. It is not. A badge is a
        rectangle that says a state and is never touched; its own page says it is not interactive and carries no role. A
        tag is a capsule that stands for a thing, and it has a button. One component for both would have given the badge
        a button or taken the tag&rsquo;s away.
      </p>

      <h2>No tones</h2>
      <p>
        A tag is neutral, decided on 2026-09-21. The theme&rsquo;s tones are meanings: success, danger, warning. What is
        painted on a tag is a category — a kind of appointment, a team — and the theme has no colours for categories
        yet. Given green and red, tags would spend them, and they would stop meaning success and danger anywhere else.
        The tones come with a categorical palette.
      </p>

      <h2>Sizes, and what stands before the words</h2>
      <div className="specimen">
        <div className="specimenRow">
          <Tag start={<Avatar name="Anthony Jackson" size="xxs" />} onRemove={() => {}}>
            Anthony Jackson
          </Tag>
          <Tag start={<LocationIcon size={16} />} onRemove={() => {}}>
            Phoenix Clinic
          </Tag>
          <Tag>Follow-up</Tag>
          <Tag disabled onRemove={() => {}}>
            Disabled
          </Tag>
        </div>
        <div className="specimenRow" style={{ marginTop: spacing[150] }}>
          <Tag size="sm" start={<Avatar name="Laura Lee" size="xxs" />} onRemove={() => {}}>
            Laura Lee
          </Tag>
          <Tag size="sm" start={<LocationIcon size={16} />}>
            Video office
          </Tag>
          <Tag size="sm">Pediatrics</Tag>
        </div>
      </div>
      <div className="specimen">
        <Table
          caption="Tag geometry, in pixels"
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
        It is drawn once, inside the <a href="/combobox">Combobox</a>: 32 tall, an Avatar of 28, a name in the caption
        style. The Avatar&rsquo;s scale has 24 and 30 and no 28, so the Avatar here is 24. The small tag is what a 40
        field has room for, and is the one the Combobox uses.
      </p>

      <h2>In a field</h2>
      <p>
        On a card a tag is <code>surface/sunken</code>. A field is already that grey, and the tag would vanish into it,
        so a field hands it <code>--tag-fill</code>: the Combobox gives the raised surface, the drawn white. It also
        takes the button out of the tab order, with <code>removeProps</code>, because there the keyboard has Backspace
        and the list, and six tags would be six stops before the field.
      </p>

      <h2>Accessibility</h2>
      <p>
        A tag on its own has one way to be taken away, so its button is a real button in the tab order, named
        &ldquo;Remove&rdquo; and the tag&rsquo;s words, 24 across. A set of tags is a list, so their number is said. A
        tag that is removed takes its button with it, and the focus with the button, so the caller places the focus as
        it removes: the example above gives it to the list, which has <code>tabIndex=&#123;-1&#125;</code> for that. The
        fill is the tag&rsquo;s only edge, so it keeps a transparent border, which forced colours paint. What stands
        before the words is not part of the name.
      </p>

      <h2>Using it</h2>
      <CodeBlock code={USAGE} lang="tsx" />
      <div className="specimen">
        <Table
          caption="Tag props"
          density="compact"
          columns={[
            { key: 'prop', header: 'Prop', primary: true, cell: (r: PropRow) => <code>{r.prop}</code> },
            { key: 'type', header: 'Type', cell: (r: PropRow) => <span className="alias">{r.type}</span> },
            { key: 'default', header: 'Default', cell: (r: PropRow) => <span className="alias">{r.default}</span> },
          ]}
          rows={PROPS}
          getRowId={(r) => r.prop}
        />
      </div>
    </DocPage>
  );
}
