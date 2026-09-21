'use client';

import { useRef, useState } from 'react';
import { Add, Filter, Maximize, Notification, OpenPanelRight } from '@carbon/icons-react';
import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { CodeBlock } from '@ui/CodeBlock';
import { Popover, popoverPlacements } from '@/components/Popover';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import type { ISODate } from '@/components/Calendar';
import { DatePicker } from '@/components/DatePicker';
import { Field } from '@/components/Field';
import { Input } from '@/components/Input';
import { Link } from '@/components/Link';
import { Select } from '@/components/Select';
import { Table } from '@/components/Table';
import { Tabs } from '@/components/Tabs';
import { toast } from '@/components/Toast';
import { resolve } from '@/tokens/contrast';
import { radius, spacing } from '@/tokens/scale';
import { textStyle } from '@/tokens/typography';
import type { Mode, ThemeTokenName } from '@/tokens/theme';

const MODES: Mode[] = ['light', 'dark'];

const PAIRS: ReadonlyArray<{ name: string; fg: ThemeTokenName; bg: ThemeTokenName }> = [
  { name: 'title and body', fg: 'text/primary', bg: 'surface/overlay' },
  { name: 'secondary text', fg: 'text/secondary', bg: 'surface/overlay' },
];

const USAGE = `import { Popover, Button } from 'alpenglow';

<Popover
  trigger={(props) => <Button {...props}>New appointment</Button>}
  title="New appointment"
  width={424}
  initialFocus={patient}
  actions={({ close }) => (
    <>
      <Button variant="outline" tone="neutral" onClick={close}>Cancel</Button>
      <Button onClick={() => { save(); close(); }}>Save</Button>
    </>
  )}
>
  …the fields…
</Popover>`;

type Message = { from: string; at: string; text: string; unread?: boolean };
const MESSAGES: Message[] = [
  { from: 'Elizabeth Gray', at: '16:40', text: 'Duis mollis, est non commodo luctus.', unread: true },
  { from: 'Jonathan Young', at: '15:39', text: 'Morbi leo risus, porta ac consectetur ac.' },
  { from: 'Sandra Brown', at: '10:56', text: 'Vestibulum id ligula porta.' },
  { from: 'Ashley Brooks', at: '09:04', text: 'Bibendum pellentesque consectetur.' },
];

const caption = {
  margin: 0,
  color: 'var(--ap-color-text-secondary)',
  fontSize: textStyle['caption/md'].size,
  lineHeight: `${textStyle['caption/md'].lineHeight}px`,
  fontWeight: 500,
} as const;

function Inbox({ messages }: { messages: Message[] }) {
  return (
    <ul style={{ display: 'grid', gap: spacing['050'], margin: 0, padding: 0, listStyle: 'none' }}>
      {messages.map((m) => (
        <li key={m.from} style={{ display: 'flex', alignItems: 'center', gap: spacing[150], padding: `${spacing[100]}px ${spacing[150]}px`, borderRadius: radius.xl, background: m.unread ? 'var(--ap-color-surface-sunken)' : undefined }}>
          <Avatar name={m.from} status={m.unread ? 'available' : undefined} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: spacing[100], fontWeight: 600 }}>
              <span style={{ flex: 1 }}>{m.from}</span>
              <span style={caption}>{m.at}</span>
            </div>
            <p style={caption}>{m.text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

type Choice = { when: string; use: string };
const CHOICES: Choice[] = [
  { when: 'A few fields or a short list, about the control that opens it, and the page stays in use', use: 'Popover' },
  { when: 'It must be answered before anything else, or it is long', use: 'Dialog' },
  { when: 'A list of commands', use: 'Dropdown menu' },
  { when: 'Words about a control, with nothing to press', use: 'Tooltip' },
];

type Measure = { part: string; value: string };
/** Read from the scale and the text styles, so the page cannot quote a number the stylesheet does not use. */
const MEASURES: Measure[] = [
  { part: 'Radius', value: String(radius.xl) },
  { part: 'Elevation', value: 'lg, a level above a menu; a border in dark only' },
  { part: 'From the trigger', value: String(spacing['050']) },
  { part: 'Header', value: `${spacing[250]} above, ${spacing[300]} inline, ${spacing[200]} to the divider` },
  { part: 'Title, Semibold', value: `${textStyle['subheading/md'].size} / ${textStyle['subheading/md'].lineHeight}` },
  { part: 'Body and footer', value: `${spacing[300]} of padding; buttons ${spacing[150]} apart, at the end` },
  { part: 'From the screen’s edge', value: `${spacing[100]} at least; the body scrolls` },
];

type PropRow = { prop: string; type: string; default: string };
const PROPS: PropRow[] = [
  { prop: 'trigger', type: '(props: PopoverTriggerProps) => ReactNode — a button', default: 'required' },
  { prop: 'children', type: 'ReactNode | ({ close }) => ReactNode', default: 'required' },
  { prop: 'title', type: 'string', default: '—' },
  { prop: 'aria-label', type: 'string, where there is no title', default: '—' },
  { prop: 'headerActions', type: 'ReactNode | ({ close }) => ReactNode', default: '—' },
  { prop: 'actions', type: 'ReactNode | ({ close }) => ReactNode', default: '—' },
  { prop: 'placement', type: popoverPlacements.map((p) => `'${p}'`).join(' | '), default: "'bottom-start'" },
  { prop: 'width', type: 'number | string', default: 'the content’s' },
  { prop: 'open', type: 'boolean', default: '—' },
  { prop: 'onOpenChange', type: '(open: boolean) => void', default: '—' },
  { prop: 'initialFocus', type: 'RefObject<HTMLElement>', default: 'the panel' },
  { prop: 'className', type: 'string', default: '—' },
];

export default function Page() {
  const patient = useRef<HTMLInputElement>(null);
  const [date, setDate] = useState<ISODate | null>('2023-05-19');

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
      <h1>Popover</h1>
      <p className="lead">
        A panel that opens against the control that asked for it, holds a few fields or a
        short list, and leaves the page behind it in use.
      </p>

      <h2>Try it</h2>
      <div className="specimen">
        <div className="specimenRow">
          <Popover
            trigger={(props) => (
              <Button iconStart={<Add size={16} />} {...props}>
                New appointment
              </Button>
            )}
            title="New appointment"
            width={424}
            initialFocus={patient}
            headerActions={
              <>
                <Button variant="ghost" tone="neutral" size="sm" aria-label="Open full screen" iconStart={<Maximize size={20} />} />
                <Button variant="ghost" tone="neutral" size="sm" aria-label="Open in the side panel" iconStart={<OpenPanelRight size={20} />} />
              </>
            }
            actions={({ close }) => (
              <>
                <Button variant="outline" tone="neutral" onClick={close}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    close();
                    toast('Appointment saved', { tone: 'success' });
                  }}
                >
                  Save
                </Button>
              </>
            )}
          >
            <div style={{ display: 'grid', gap: spacing[200] }}>
              <Field label="Patient">
                <Input ref={patient} placeholder="Name or record number" />
              </Field>
              <Field label="Date">
                <DatePicker label="Date" value={date} onSelect={(next) => setDate(next as ISODate | null)} />
              </Field>
              <Field label="Location">
                <Select placeholder="Location" defaultValue="">
                  <option>Phoenix Clinic Hospital</option>
                  <option>Scottsdale Clinic Building</option>
                  <option>Video office</option>
                </Select>
              </Field>
              <Field label="Service">
                <Select placeholder="Service" defaultValue="">
                  <option>90791 - Diagnostic evaluation</option>
                  <option>90792 - Therapeutic exercises</option>
                </Select>
              </Field>
            </div>
          </Popover>

          <Popover
            trigger={(props) => (
              <Button variant="outline" tone="neutral" iconStart={<Notification size={16} />} {...props}>
                Messages
              </Button>
            )}
            title="Messages"
            width={352}
            headerActions={<Link variant="standalone" href="#try-it">See all</Link>}
          >
            <Tabs
              label="Messages"
              variant="pill"
              items={[
                { id: 'all', label: 'All', count: MESSAGES.length, content: <Inbox messages={MESSAGES} /> },
                { id: 'unread', label: 'Unread', count: 1, content: <Inbox messages={MESSAGES.filter((m) => m.unread)} /> },
              ]}
            />
          </Popover>

          <Popover
            trigger={(props) => (
              <Button variant="ghost" tone="neutral" iconStart={<Filter size={16} />} {...props}>
                Filters
              </Button>
            )}
            aria-label="Filters"
            placement="bottom-end"
          >
            <div style={{ display: 'grid', gap: spacing[150] }}>
              <Checkbox defaultChecked>Confirmed</Checkbox>
              <Checkbox defaultChecked>Pending</Checkbox>
              <Checkbox>Cancelled</Checkbox>
            </div>
          </Popover>
        </div>
      </div>
      <p className="alias">
        Two of the drawn panels, rebuilt from the system&rsquo;s own parts, and a third with no
        header at all. Press Esc, or anywhere outside: the focus goes back to the button.
      </p>

      <h2>Choosing a popover</h2>
      <div className="specimen">
        <Table
          caption="What opens over the page"
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
        A popover is not modal. The page behind it can be read, scrolled and pressed, and a
        press on it closes the panel, so nothing in a popover may be the only way to something,
        and nothing typed in it should be lost without a word: a form worth keeping is a{' '}
        <a href="/dialog">dialog</a>. The drawn User Menu is not this component: a list of
        commands is a <a href="/dropdown-menu">dropdown menu</a>, whatever stands above it.
      </p>

      <h2>Anatomy</h2>
      <div className="specimen">
        <Table
          caption="Popover geometry, in pixels"
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
        The shell is the Dialog&rsquo;s, smaller: a title, what it holds, and its buttons at
        the end. The four drawn panels are a product&rsquo;s, and what they hold is the
        caller&rsquo;s. The title is primary where the drawing has it secondary, as the
        Dialog&rsquo;s is: it is the panel&rsquo;s name.
      </p>

      <h2>One floating surface</h2>
      <p>
        The menu, the date picker, the page size of a pagination and this panel stand on one
        stylesheet: the overlay surface, a border in dark only where the shadow stops carrying
        the edge, the anchor, the flip when there is no room, and hiding when the trigger
        scrolls away. It was written out four times; it is written once, and each of the four
        keeps only its own padding, radius and width. A control that opens its own panel
        inside a popover, as the date picker above does, opens over it and does not close it.
      </p>

      <h2>Accessibility</h2>
      <p>
        The panel is a <code>dialog</code> that is not modal, named by its title or by{' '}
        <code>aria-label</code>; the trigger says it has one and whether it is open. It is the
        platform&rsquo;s <code>popover</code>: Esc and a press outside close it, and the focus
        returns to the trigger, with no listener of the system&rsquo;s own. On the way in the
        focus goes to the panel, or to <code>initialFocus</code>, the first field of a form.
        The panel follows its trigger in the document, so Tab goes from the button into it
        and out of it to what comes next. Where CSS anchor positioning is missing it opens in
        the middle of the screen and works the same.
      </p>

      <h2>Using it</h2>
      <CodeBlock code={USAGE} lang="tsx" />
      <div className="specimen">
        <Table
          caption="Popover props"
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
