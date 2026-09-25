'use client';

import { useRef, useState } from 'react';
import { Add } from '@carbon/icons-react';
import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { CodeBlock } from '@ui/CodeBlock';
import { Accordion, AccordionItem } from '@/components/Accordion';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Drawer, DRAWER_WIDTH } from '@/components/Drawer';
import { Field } from '@/components/Field';
import { Input } from '@/components/Input';
import { Select } from '@/components/Select';
import { Table } from '@/components/Table';
import { toast } from '@/components/Toast';
import { resolve } from '@/tokens/contrast';
import { breakpoint, spacing } from '@/tokens/scale';
import { textStyle } from '@/tokens/typography';
import type { Mode, ThemeTokenName } from '@/tokens/theme';

const MODES: Mode[] = ['light', 'dark'];

const PAIRS: ReadonlyArray<{ name: string; fg: ThemeTokenName; bg: ThemeTokenName; threshold?: number }> = [
  { name: 'over the content', fg: 'text/primary', bg: 'surface/overlay' },
  { name: 'beside the content', fg: 'text/primary', bg: 'surface/raised' },
  { name: 'the handle, under the pointer', fg: 'border/strong', bg: 'surface/overlay', threshold: 3 },
  { name: 'the handle, with the focus', fg: 'border/focus', bg: 'surface/overlay', threshold: 3 },
];

const LOCATIONS = [
  { value: 'phoenix', label: 'Phoenix Clinic' },
  { value: 'video', label: 'Video office' },
];

const STAFF = ['Amanda Hall', 'Laura Lee', 'Patrick Moore'].map((name) => ({
  value: name,
  label: name,
  start: <Avatar name={name} size="xxs" />,
}));

type Slot = { id: string; time: string; patient: string; service: string; state: 'Confirmed' | 'Pending' };
const DAY: Slot[] = [
  { id: 'a', time: '8:00', patient: 'Justin Anderson', service: 'Follow-up', state: 'Confirmed' },
  { id: 'b', time: '9:30', patient: 'Sandra Brown', service: 'First visit', state: 'Pending' },
  { id: 'c', time: '11:00', patient: 'Léa Martin', service: 'Pediatrics', state: 'Confirmed' },
  { id: 'd', time: '14:15', patient: 'Charles Griffin', service: 'Follow-up', state: 'Confirmed' },
];

const USAGE = `import { Drawer, Dialog, Button } from 'alpenglow';

// Over the content.
<Drawer
  open={open}
  onClose={() => (dirty ? setAsking(true) : setOpen(false))}
  title="New appointment"
  initialFocus={patient}
  actions={<><Button variant="outline" tone="neutral" onClick={…}>Cancel</Button><Button onClick={save}>Save</Button></>}
>
  …
</Drawer>

// Beside it: a sibling of the content, which makes room.
<div style={{ display: 'flex', height: '100%' }}>
  <Calendar style={{ flex: 1, minWidth: 0 }} />
  <Drawer
    mode="inline"
    resizable
    open={slot !== null}
    onClose={() => setSlot(null)}
    expanded={expanded}
    onExpandedChange={setExpanded}
    title={slot?.patient}
  >
    …
  </Drawer>
</div>`;

type Choice = { when: string; use: string };
const CHOICES: Choice[] = [
  { when: 'A record opened from a list, which stays in use beside it', use: 'Drawer' },
  { when: 'The content has to stay whole and in view: a calendar, a map', use: 'Drawer, inline' },
  { when: 'A few fields against the button that asked for them', use: 'Popover' },
  { when: 'A question that has to be answered before anything else', use: 'Dialog' },
  { when: 'The application’s navigation', use: 'not this: the start side is its own' },
];

type Key = { key: string; does: string };
const KEYS: Key[] = [
  { key: 'Esc, inside the panel', does: 'Asks the caller to close. A Select or a DatePicker open inside takes it first.' },
  { key: 'Tab', does: 'Goes through the panel and on into the page: nothing is inert.' },
  { key: 'Left, Right, on the handle', does: `Move the inner edge by ${spacing[200]}.` },
  { key: 'Home, End, on the handle', does: 'The least and the most.' },
  { key: 'Double click, on the handle', does: 'Back to the starting width.' },
];

type Measure = { part: string; value: string };
/** Read from the component, the scale and the text styles, so the page cannot quote a number the code does not use. */
const MEASURES: Measure[] = [
  { part: 'Width', value: `${DRAWER_WIDTH.md} or ${DRAWER_WIDTH.lg}, as drawn; the screen’s, when that is less` },
  { part: 'Height, corners', value: 'the whole height, square' },
  { part: 'Header', value: `64, ${spacing[300]} at the sides, a divider inset by the same` },
  { part: 'Title, Semibold', value: `${textStyle['subheading/md'].size} / ${textStyle['subheading/md'].lineHeight}` },
  { part: 'Body, footer', value: `${spacing[300]}` },
  { part: 'Handle', value: `${spacing[150]} across, astride the inner edge` },
  { part: 'A resize leaves', value: '320 to the panel, and 320 to the content' },
];

type PropRow = { prop: string; type: string; default: string };
const PROPS: PropRow[] = [
  { prop: 'open, onClose', type: 'boolean, () => void', default: 'required' },
  {
    prop: 'mode',
    type: `'overlay' | 'inline'; below ${breakpoint.md} (DRAWER_NARROW, exported) inline opens over the content as overlay does`,
    default: "'overlay'",
  },
  { prop: 'side', type: "'end' | 'start'", default: "'end'" },
  { prop: 'size', type: "'md' | 'lg'", default: "'md'" },
  { prop: 'title', type: 'string', default: '—' },
  { prop: 'header, aria-label', type: 'ReactNode in the title’s place, and the name it then needs', default: '—' },
  { prop: 'headerActions, actions', type: 'ReactNode', default: '—' },
  { prop: 'expanded, onExpandedChange', type: 'boolean, (expanded) => void', default: 'false; no button without the handler' },
  { prop: 'resizable', type: 'boolean', default: 'false' },
  { prop: 'width, defaultWidth, onWidthChange', type: 'number, number, (width) => void', default: 'the size’s' },
  { prop: 'minWidth, maxWidth', type: 'number', default: '320, what leaves the content 320' },
  { prop: 'initialFocus', type: 'RefObject<HTMLElement>', default: 'the panel' },
  { prop: 'closeLabel, expandLabel, collapseLabel, resizeLabel', type: 'string', default: 'English' },
  { prop: 'className', type: 'string', default: '—' },
];

export default function Page() {
  const patient = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [asking, setAsking] = useState(false);
  const [full, setFull] = useState(false);

  const [slot, setSlot] = useState<Slot | null>(null);
  const [expanded, setExpanded] = useState(false);

  const leave = () => {
    setAsking(false);
    setOpen(false);
    setName('');
    setFull(false);
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
                  {mode} <Ratio fg={resolve(pair.fg, mode)} bg={resolve(pair.bg, mode)} threshold={pair.threshold} />
                </p>
              ))}
            </div>
          ))}
        </>
      }
    >
      <h1>Drawer</h1>
      <p className="lead">
        A panel at the side of the page for a record, a form or filters, with the page beside it still in use.
      </p>

      <h2>Try it</h2>
      <div className="specimen">
        <div className="specimenRow">
          <Button iconStart={<Add size={16} />} onClick={() => setOpen(true)}>
            New appointment
          </Button>
        </div>
        <p className="alias" style={{ marginTop: spacing[150] }}>
          Type a name, then close it: a panel never closes itself, so the page can ask first.
        </p>
      </div>

      <Drawer
        open={open}
        onClose={() => (name ? setAsking(true) : leave())}
        title="New appointment"
        initialFocus={patient}
        resizable
        expanded={full}
        onExpandedChange={setFull}
        actions={
          <>
            <Button variant="outline" tone="neutral" onClick={() => (name ? setAsking(true) : leave())}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                leave();
                toast('Appointment saved', { tone: 'success' });
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: spacing[200] }}>
          <Field label="Patient">
            <Input ref={patient} value={name} onChange={(e) => setName(e.target.value)} placeholder="Name or record number" />
          </Field>
          <Field label="Location">
            <Select placeholder="Location" options={LOCATIONS} />
          </Field>
          <Field label="Staff">
            <Select defaultValue="Amanda Hall" options={STAFF} />
          </Field>
        </div>
      </Drawer>

      <Dialog
        open={asking}
        onClose={() => setAsking(false)}
        title="Leave without saving?"
        size="xs"
        actions={
          <>
            <Button variant="ghost" tone="neutral" onClick={() => setAsking(false)}>
              Keep editing
            </Button>
            <Button tone="danger" onClick={leave}>
              Leave
            </Button>
          </>
        }
      >
        What you typed for this appointment will be lost.
      </Dialog>

      <h2>Beside the content</h2>
      <div className="specimen" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', height: 420 }}>
          <ul
            aria-label="Thursday"
            style={{ flex: '1 0 160px', minWidth: 0, margin: 0, padding: spacing[200], listStyle: 'none', display: 'grid', gap: spacing[100], alignContent: 'start', overflowY: 'auto' }}
          >
            {DAY.map((s) => (
              <li key={s.id}>
                <Button
                  variant={slot?.id === s.id ? 'solid' : 'outline'}
                  tone="neutral"
                  onClick={() => setSlot(s)}
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                >
                  {s.time} · {s.patient}
                </Button>
              </li>
            ))}
          </ul>
          <Drawer
            mode="inline"
            resizable
            defaultWidth={360}
            open={slot !== null}
            onClose={() => {
              setSlot(null);
              setExpanded(false);
            }}
            expanded={expanded}
            onExpandedChange={setExpanded}
            title={slot?.patient}
          >
            {slot && (
              <div style={{ display: 'grid', gap: spacing[150], justifyItems: 'start' }}>
                <Badge tone={slot.state === 'Confirmed' ? 'success' : 'warning'}>{slot.state}</Badge>
                <p style={{ margin: 0 }}>
                  {slot.time}, {slot.service}
                </p>
                <p className="alias" style={{ margin: 0 }}>
                  Press another appointment: the list is still in use, and the panel follows. Drag its inner edge, or
                  give the edge the focus and use the arrows.
                </p>
                <div style={{ justifySelf: 'stretch' }}>
                  <Accordion>
                    <AccordionItem title="Forms" count={2}>
                      Intake form · New patient questionnaire
                    </AccordionItem>
                    <AccordionItem title="Notes">No notes yet.</AccordionItem>
                  </Accordion>
                </div>
              </div>
            )}
          </Drawer>
        </div>
      </div>
      <p>
        <code>mode=&quot;inline&quot;</code> is a sibling of the content and not a layer over it: the caller puts the
        two in a flex row, the panel keeps its width and the content takes what is left. It is for content that has to
        stay whole — a calendar whose last column must not be under a panel. It is part of the page, so it is a
        card&rsquo;s surface with a line where it meets the content, and no shadow. Expanded, either kind covers the
        page. Below {breakpoint.md} there is no room beside the content: the content is what shows, and an inline
        Drawer opens over it, as the overlay one does.
      </p>

      <h2>Drawer, popover or dialog</h2>
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

      <h2>Not modal</h2>
      <p>
        The roadmap had this as a <code>dialog</code> element at the side, with the <a href="/dialog">Dialog</a>&rsquo;s
        rules. Decided on 2026-09-21: the rules stay and the element does not. In the product this was drawn for, the
        calendar beside the panel stays live — another appointment is a press away — so there is no scrim and nothing
        is inert. What stops a form from being lost is not the page being locked but the page being asked: Esc and the
        close button call <code>onClose</code>, and the caller either closes it or opens a Dialog that says what will
        be lost. A press outside does nothing, as on the Dialog.
      </p>
      <p>
        Over the content it is <code>popover=&quot;manual&quot;</code>: the top layer, with no <code>z-index</code>,
        and none of the light dismiss an <code>auto</code> popover has. A Dialog opened from it opens over it.
      </p>

      <h2>Anatomy</h2>
      <div className="specimen">
        <Table
          caption="Drawer geometry, in pixels"
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
        The drawn Side Drawer is the <a href="/popover">Popover</a>&rsquo;s shell at the height of the page: the title
        at the start, icon buttons at the end, the footer&rsquo;s buttons at the end. <code>header</code> takes the
        title&rsquo;s place for the drawn View and Edit, whose header is the appointment&rsquo;s state. The sections
        that open and close in that drawing are the <a href="/accordion">Accordion</a>, as in the panel above.
      </p>

      <h2>Accessibility</h2>
      <p>
        Over the content it is a <code>dialog</code> that is never <code>aria-modal</code>; beside it, a named{' '}
        <code>region</code>. The focus goes to <code>initialFocus</code> or to the panel on the way in, and on the way
        out back to what had it — unless the reader has already gone somewhere else, where it is left. The handle is a{' '}
        <code>separator</code> with the width as its value, so a resize is not the pointer&rsquo;s alone.
      </p>
      <div className="specimen">
        <Table
          caption="Drawer, by keyboard"
          density="compact"
          columns={[
            { key: 'key', header: 'Key', primary: true, cell: (r: Key) => r.key },
            { key: 'does', header: 'Does', cell: (r: Key) => r.does },
          ]}
          rows={KEYS}
          getRowId={(r) => r.key}
        />
      </div>

      <h2>Using it</h2>
      <CodeBlock code={USAGE} lang="tsx" />
      <div className="specimen">
        <Table
          caption="Drawer props"
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
