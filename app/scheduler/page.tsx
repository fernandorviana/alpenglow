'use client';

import { useMemo, useRef, useState } from 'react';
import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { CodeBlock } from '@ui/CodeBlock';
import { Scheduler, formatSlots } from '@/components/Scheduler';
import type {
  ISODateTime,
  SchedulerChange,
  SchedulerDraft,
  SchedulerEvent,
  SchedulerKind,
  SchedulerResource,
  SchedulerView,
} from '@/components/Scheduler';
import { addDays } from '@/components/Calendar/date';
import type { ISODate } from '@/components/Calendar/date';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Calendar } from '@/components/Calendar';
import { Card, CardBody } from '@/components/Card';
import { Checkbox } from '@/components/Checkbox';
import { Field } from '@/components/Field';
import { Input } from '@/components/Input';
import { Switch } from '@/components/Switch';
import { toast } from '@/components/Toast';
import { Select } from '@/components/Select';
import { Table } from '@/components/Table';
import { useMediaQuery } from '@/components/useMediaQuery';
import { resolve } from '@/tokens/contrast';
import { media, spacing, radius } from '@/tokens/scale';
import { textStyle } from '@/tokens/typography';
import { density } from '@/tokens/density';
import type { Mode, ThemeTokenName } from '@/tokens/theme';

const MODES: Mode[] = ['light', 'dark'];

const PAIRS: ReadonlyArray<{ name: string; fg: ThemeTokenName; bg: ThemeTokenName; threshold?: number }> = [
  { name: 'a confirmed card’s words, on the accent', fg: 'interactive/on-accent', bg: 'interactive/accent' },
  { name: 'a pending or past card’s words, on the tint', fg: 'text/accent', bg: 'surface/accent-subtle' },
  { name: 'a person’s confirmed card, category/moss', fg: 'category/on-moss', bg: 'category/moss' },
  { name: 'a person’s tinted card, category/moss', fg: 'category/moss-text', bg: 'category/moss-subtle' },
  { name: 'the moss fill as an edge on a card, 3:1', fg: 'category/moss', bg: 'surface/raised', threshold: 3 },
  { name: 'the now line, on a card, 3:1', fg: 'border/danger', bg: 'surface/raised', threshold: 3 },
  { name: 'the hours', fg: 'text/tertiary', bg: 'surface/raised' },
];

/** A glyph of the file's own geometry, not an icon package: a camera and a person, in the drawn 24 circle. */
const Video = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="1.5" y="4" width="9" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10.5 7l4-2v6l-4-2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);
const Person = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M2.5 14.5c0-3 2.5-4.5 5.5-4.5s5.5 1.5 5.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const NOW: ISODateTime = '2023-04-20T11:16';
const TODAY: ISODate = '2023-04-20';

const t = (day: number, time: string): ISODateTime => `2023-04-${String(day).padStart(2, '0')}T${time}`;

/** The drawn week, near enough: Justin Anderson's month, with the lunch, the vet, the training and the odd cancellation. */
const WEEK: SchedulerEvent[] = [
  { id: '1', title: 'Ryan Williams', start: t(17, '09:00'), end: t(17, '09:30'), icon: <Video /> },
  { id: '2', title: 'Gary Kim', start: t(17, '10:00'), end: t(17, '11:00'), icon: <Person /> },
  { id: '3', title: 'Justin Anderson', start: t(17, '11:30'), end: t(17, '12:30'), kind: 'cancelled', icon: <Video /> },
  { id: '4', title: 'Justin Anderson', start: t(17, '14:00'), end: t(17, '14:45'), kind: 'pending', icon: <Video /> },
  { id: '5', title: 'Christine Jackson', start: t(17, '15:00'), end: t(17, '15:15') },
  { id: '6', title: 'Amanda Brown', start: t(17, '15:30'), end: t(17, '16:00') },
  { id: '7', title: 'Justin Roberts', start: t(17, '16:15'), end: t(17, '16:45') },
  { id: '8', title: 'Betty Hall', start: t(18, '09:00'), end: t(18, '09:30'), icon: <Video /> },
  { id: '9', title: 'Justin Anderson', start: t(18, '11:00'), end: t(18, '12:00'), icon: <Video /> },
  { id: '10', title: 'Justin Anderson', start: t(18, '12:15'), end: t(18, '12:30') },
  { id: '11', title: 'Justin Anderson', start: t(18, '15:00'), end: t(18, '15:30') },
  { id: '12', title: 'Justin Anderson', start: t(18, '16:00'), end: t(18, '17:00'), icon: <Video /> },
  { id: '13', title: 'Out of office', start: t(18, '00:00'), end: t(18, '00:00'), allDay: true, kind: 'blocker' },
  { id: '14', title: 'Justin Anderson', start: t(19, '11:00'), end: t(19, '13:00'), icon: <Video /> },
  { id: '15', title: 'Lunch', start: t(19, '13:00'), end: t(19, '15:00'), kind: 'blocker' },
  { id: '16', title: 'Justin Anderson', start: t(19, '15:45'), end: t(19, '16:00') },
  { id: '17', title: 'Justin Anderson', start: t(19, '16:00'), end: t(19, '16:30') },
  { id: '18', title: 'Justin Anderson', start: t(19, '17:00'), end: t(19, '17:30'), icon: <Person /> },
  { id: '19', title: 'Train Session', start: t(20, '09:45'), end: t(20, '10:00'), kind: 'external' },
  { id: '20', title: 'Justin Anderson', start: t(20, '10:00'), end: t(20, '10:30') },
  { id: '21', title: 'Justin Anderson', start: t(20, '10:45'), end: t(20, '11:00') },
  { id: '22', title: 'Justin Anderson', start: t(20, '11:45'), end: t(20, '12:30'), kind: 'pending', icon: <Video /> },
  { id: '23', title: 'Justin Anderson', start: t(20, '14:00'), end: t(20, '15:00'), icon: <Person /> },
  { id: '24', title: 'Train Session', start: t(20, '15:00'), end: t(20, '15:45'), kind: 'external' },
  { id: '25', title: 'Justin Anderson', start: t(20, '16:00'), end: t(20, '17:00'), icon: <Video /> },
  { id: '26', title: 'Justin Anderson', start: t(20, '17:30'), end: t(20, '18:00') },
  { id: '27', title: 'Justin Anderson', start: t(21, '09:30'), end: t(21, '10:45'), icon: <Video /> },
  { id: '28', title: 'Vet', start: t(21, '11:00'), end: t(21, '11:30'), kind: 'blocker' },
  { id: '29', title: 'Justin Anderson', start: t(21, '14:30'), end: t(21, '14:45') },
  { id: '30', title: 'Justin Anderson', start: t(21, '15:00'), end: t(21, '15:30') },
  { id: '31', title: 'Free for a booking', start: t(21, '16:00'), end: t(21, '17:00'), kind: 'availability' },
];

/** The drawn day with several people: five columns, a colour each. */
const PEOPLE: SchedulerResource[] = [
  { id: 'jr', name: 'Julia Roberts', tone: 'moss', avatar: <Avatar name="Julia Roberts" size="xxs" /> },
  { id: 'eh', name: 'Elizabeth Hall', tone: 'ember', avatar: <Avatar name="Elizabeth Hall" size="xxs" /> },
  { id: 'll', name: 'Laura Lee', tone: 'amber', avatar: <Avatar name="Laura Lee" size="xxs" /> },
  { id: 'aj', name: 'Anthony Jackson', tone: 'glacier', avatar: <Avatar name="Anthony Jackson" size="xxs" /> },
  { id: 'lm', name: 'Léa Martin', tone: 'flare', avatar: <Avatar name="Léa Martin" size="xxs" />, workingHours: { start: 12, end: 20 } },
];

const p = (
  id: string,
  resourceId: string,
  title: string,
  start: string,
  end: string,
  more: Partial<SchedulerEvent> = {},
): SchedulerEvent => ({ id, resourceId, title, start: t(21, start), end: t(21, end), ...more });

const STAFF_DAY: SchedulerEvent[] = [
  p('a1', 'jr', 'Dennis Hall', '09:15', '10:00'),
  p('a2', 'jr', 'Steven Wilson', '10:30', '11:30', { icon: <Video /> }),
  p('a3', 'jr', 'Susan Harris', '12:00', '12:30', { kind: 'cancelled' }),
  p('a4', 'jr', 'Jonathan Harris', '13:00', '13:30'),
  p('a5', 'jr', 'Lunch', '14:00', '14:15', { kind: 'blocker' }),
  p('a6', 'jr', 'Melissa Taylor', '14:45', '15:30', { icon: <Person /> }),
  p('a7', 'jr', 'Michelle Jones', '16:00', '17:00', { icon: <Video /> }),
  p('b1', 'eh', 'Andrew Hernandez', '11:00', '11:30'),
  p('b2', 'eh', 'Justin Anderson', '12:00', '13:00', { icon: <Video /> }),
  p('b3', 'eh', 'Scott Martin', '13:15', '14:00', { kind: 'cancelled' }),
  p('b4', 'eh', 'Lunch', '15:00', '16:00', { kind: 'blocker' }),
  p('b5', 'eh', 'Debra Clark', '16:00', '16:15'),
  p('b6', 'eh', 'Daniel Garcia', '17:00', '17:30'),
  p('c1', 'll', 'Debra Young', '10:30', '11:00'),
  p('c2', 'll', 'George Clark', '11:45', '12:00'),
  p('c3', 'll', 'Daniel Miller', '12:15', '13:00', { icon: <Person /> }),
  p('c4', 'll', 'Emily Young', '14:00', '14:30'),
  p('c5', 'll', 'Joseph Diaz', '14:30', '15:30', { icon: <Video /> }),
  p('d1', 'aj', 'Kate Simmons', '09:00', '09:30'),
  p('d2', 'aj', 'Brenda King', '09:30', '09:45'),
  p('d3', 'aj', 'Greg Young', '10:00', '11:00', { icon: <Video /> }),
  p('d4', 'aj', 'Jennifer Young', '11:00', '11:45', { kind: 'cancelled', icon: <Video /> }),
  p('d5', 'aj', 'Vet', '12:00', '12:30', { kind: 'blocker' }),
  p('d6', 'aj', 'Andrew Martinez', '13:00', '14:00', { icon: <Person /> }),
  p('d7', 'aj', 'Train Session', '14:00', '14:45', { kind: 'external' }),
  p('d8', 'aj', 'Angela Roberts', '15:00', '16:00', { kind: 'pending', icon: <Video /> }),
  p('e1', 'lm', 'Margaret Brooks', '11:00', '11:30'),
  p('e2', 'lm', 'Robert Clark', '12:00', '13:00', { icon: <Video /> }),
  p('e3', 'lm', 'Kevin Simmons', '13:00', '13:15'),
  p('e4', 'lm', 'Lunch', '14:00', '14:45', { kind: 'blocker' }),
  p('e5', 'lm', 'Family Meeting', '15:00', '15:45', { kind: 'external' }),
  p('e6', 'lm', 'Linda Lau', '16:00', '16:30'),
  p('e7', 'lm', 'Betty Stewart', '17:00', '18:00', { icon: <Person /> }),
];

const KINDS: SchedulerKind[] = ['confirmed', 'pending', 'cancelled', 'blocker', 'external', 'availability'];
const KIND_WORDS: Record<SchedulerKind, string> = {
  confirmed: 'Confirmed',
  pending: 'Unconfirmed',
  cancelled: 'Cancelled',
  blocker: 'Time blockers',
  external: 'External events',
  availability: 'Availability',
};

const VIEWS = [
  { value: 'week', label: 'Week' },
  { value: 'day', label: 'Day' },
  { value: 'staff', label: 'Day, by person' },
];

const USAGE = `import { Scheduler } from 'alpenglow';
import type { SchedulerEvent } from 'alpenglow';

const [date, setDate] = useState('2023-04-20');
const [selected, setSelected] = useState<string | null>(null);

<Scheduler
  label="Appointments"
  view="week"
  date={date}
  weekStartsOn={1}
  hours={{ start: 7, end: 20 }}
  workingHours={{ start: 9, end: 18 }}
  zoneLabel="WET"
  maxHeight={640}
  events={events}
  selectedId={selected}
  onSelect={(event) => setSelected(event.id)}
/>

// A day, one column per person, each in a colour of the category palette.
<Scheduler
  label="Appointments"
  view="day"
  date={date}
  resources={[
    { id: 'jr', name: 'Julia Roberts', tone: 'moss', avatar: <Avatar name="Julia Roberts" size="xxs" /> },
    { id: 'eh', name: 'Elizabeth Hall', tone: 'ember' },
  ]}
  events={events}
/>

// The gestures: each arms itself with its callback. A press or a drag proposes a
// draft; the caller keeps it while its panel is open. A move hands back the event
// as it was, so Undo is one line.
<Scheduler
  …
  draft={draft}
  onCreate={(proposed) => setDraft(proposed)}
  onMove={(event, next) => { update(event.id, next); toast('Moved', { action: { label: 'Undo', onClick: () => update(event.id, event) } }); }}
  onResize={(event, next) => update(event.id, next)}
  onRemove={(event) => remove(event.id)}
  createKind={availability ? 'availability' : 'confirmed'}
/>

// The drawn "Copy to clipboard": one line per day.
navigator.clipboard.writeText(formatSlots(events.filter((e) => e.kind === 'availability')));

// An event: wall-clock times, no zone; a kind; a tone of its own if it needs one.
const event: SchedulerEvent = {
  id: '42', title: 'Justin Anderson',
  start: '2023-04-20T11:00', end: '2023-04-20T12:00',
  resourceId: 'jr', kind: 'pending', icon: <VideoIcon />,
};`;

type Measure = { part: string; value: string };
const type = (name: keyof typeof textStyle) => `${textStyle[name].size} / ${textStyle[name].lineHeight}`;
const MEASURES: Measure[] = [
  { part: 'Hour', value: `density/hour (--scheduler-hour) — ${density.hour.comfortable}, ${density.hour.compact} compact; for the drawn 81` },
  { part: 'Column floor', value: `${spacing[1200]} (--scheduler-column), for the drawn 129; a share of the rest above it` },
  { part: 'Hours column', value: `${spacing[1000]} wide, the labels caption/md in text/tertiary on their line` },
  { part: 'Header', value: `${spacing[800]} tall; weekday caption/sm uppercase, day body/md Medium, today in a ${spacing[400]} accent circle` },
  { part: 'All-day row', value: `min ${spacing[300] + spacing['050']}, one ${spacing[300]} card a line` },
  { part: 'Card', value: `${spacing['050']} ${spacing[100]}, radius ${radius.lg}, ${spacing['075']} in from the column; min ${spacing[300]} tall` },
  { part: 'Card text', value: `title ${type('caption/md')} Semibold, time ${type('caption/sm')} Medium; the icon in a ${spacing[300]} circle from an hour up` },
  { part: 'Now line', value: `a border/danger hairline with a ${spacing[150]} dot at today’s column; its time in text/danger` },
  { part: 'Off hours', value: 'surface/sunken bands outside workingHours' },
];
const measureColumns = [
  { key: 'part', header: 'Part', primary: true, cell: (r: Measure) => r.part },
  { key: 'value', header: 'Value', cell: (r: Measure) => <span className="alias">{r.value}</span> },
];

type PropRow = { prop: string; type: string; default: string };
const PROPS: PropRow[] = [
  { prop: 'label', type: 'string', default: 'required' },
  { prop: 'date', type: 'ISODate', default: 'required' },
  { prop: 'events', type: 'SchedulerEvent[] — { id, title, start, end, resourceId?, kind?, tone?, icon?, allDay? }', default: 'required' },
  { prop: 'view', type: "'week' | 'day'", default: "'week'" },
  { prop: 'weekStartsOn', type: '0–6', default: '0' },
  { prop: 'days', type: 'number (week view)', default: '7' },
  { prop: 'resources', type: 'SchedulerResource[] — { id, name, avatar?, tone?, workingHours? } (day view)', default: '—' },
  { prop: 'selectedId / onSelect', type: 'string | null; (event) => void', default: '—' },
  { prop: 'hours', type: '{ start, end } in hours', default: '{ 0, 24 }' },
  { prop: 'workingHours', type: '{ start, end }', default: '—' },
  { prop: 'now', type: 'ISODateTime | null', default: 'the clock, after hydration' },
  { prop: 'locale', type: 'string', default: "'en-US'" },
  { prop: 'zoneLabel / allDayLabel', type: 'ReactNode / string', default: "— / 'All-day'" },
  { prop: 'kindLabels', type: 'Partial<Record<SchedulerKind, string>>', default: 'Confirmed, Pending approval, …' },
  { prop: 'maxHeight', type: 'number | string', default: '—' },
  { prop: 'scrollTo', type: 'number (an hour)', default: 'workingHours.start, or the first event' },
  { prop: 'renderEvent', type: '(event) => ReactNode', default: '—' },
  { prop: 'onCreate', type: '(draft: { start, end, resourceId?, title?, from? }) => void', default: '— (arms press, drag, Enter, paste, duplicate)' },
  { prop: 'onMove / onResize', type: '(event, next: { start, end, resourceId? }) => void', default: '— (arms the drag, the handle, Shift+arrows)' },
  { prop: 'onRemove', type: '(event) => void', default: '— (the × on availability, Delete)' },
  { prop: 'draft', type: '{ start, end, resourceId?, title? } | null', default: '—' },
  { prop: 'createKind', type: 'SchedulerKind', default: "'confirmed'" },
  { prop: 'step / defaultDuration', type: 'minutes', default: '15 / 30' },
  { prop: 'draftLabel / removeLabel', type: 'string', default: "'(No title)' / 'Remove'" },
  { prop: 'className', type: 'string', default: '—' },
];
const propColumns = [
  { key: 'prop', header: 'Prop', primary: true, cell: (r: PropRow) => <code>{r.prop}</code> },
  { key: 'type', header: 'Type', cell: (r: PropRow) => <span className="alias">{r.type}</span> },
  { key: 'default', header: 'Default', cell: (r: PropRow) => <span className="alias">{r.default}</span> },
];

const monthName = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const dayName = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

export default function Page() {
  const [date, setDate] = useState<ISODate>(TODAY);
  const [view, setView] = useState('week');
  const [shown, setShown] = useState<SchedulerKind[]>(KINDS);
  const [selected, setSelected] = useState<SchedulerEvent | null>(null);
  const narrow = useMediaQuery(media.down.md);
  const [items, setItems] = useState<SchedulerEvent[]>(WEEK);
  const [staff, setStaff] = useState<SchedulerEvent[]>(STAFF_DAY);
  const [draft, setDraft] = useState<SchedulerDraft | null>(null);
  const [title, setTitle] = useState('');
  const [availability, setAvailability] = useState(false);
  const counter = useRef(100);

  const effective: SchedulerView = narrow || view !== 'week' ? 'day' : 'week';
  const byPerson = view === 'staff';
  const pool = byPerson ? staff : items;
  const setPool = byPerson ? setStaff : setItems;
  const events = useMemo(() => pool.filter((event) => shown.includes(event.kind ?? 'confirmed')), [pool, shown]);
  const slots = useMemo(() => pool.filter((event) => event.kind === 'availability'), [pool]);

  // The gestures: a press or a drag proposes; in Availability mode it is a slot at once, as drawn.
  const add = (event: Omit<SchedulerEvent, 'id'>) => {
    counter.current += 1;
    setPool((list) => [...list, { ...event, id: `n${counter.current}` }]);
  };
  const onCreate = (proposed: SchedulerDraft) => {
    if (availability) {
      add({ title: 'Time slot', start: proposed.start, end: proposed.end, resourceId: proposed.resourceId, kind: 'availability' });
      return;
    }
    setDraft(proposed);
    setTitle(proposed.title ?? proposed.from?.title ?? '');
  };
  const change = (word: string) => (event: SchedulerEvent, next: SchedulerChange) => {
    setPool((list) => list.map((x) => (x.id === event.id ? { ...x, ...next } : x)));
    toast(`${event.title} ${word} to ${next.start.slice(11)} – ${next.end.slice(11)}`, {
      action: { label: 'Undo', onClick: () => setPool((list) => list.map((x) => (x.id === event.id ? event : x))) },
    });
  };
  const onRemove = (event: SchedulerEvent) => setPool((list) => list.filter((x) => x.id !== event.id));
  const copySlots = () => {
    const text = formatSlots(slots);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(text).then(() => toast('Slots copied', { tone: 'success' }));
    }
  };
  const step = effective === 'week' ? 7 : 1;
  const heading = effective === 'week' ? monthName.format(Date.UTC(2023, 3, 1)) : dayName.format(new Date(`${date}T00:00:00Z`));

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
      <h1>Scheduler</h1>
      <p className="lead">
        The grid of hours with the appointments on it: a week of days or a day of people, the now line, each event a
        card in its kind and its person&rsquo;s colour. The component the system&rsquo;s origin asks for.
      </p>

      <h2>Try it</h2>
      <div className="specimen">
        <style>{`
          .schedulerScreen { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: ${spacing[300]}px; align-items: start; }
          .schedulerScreen > * { min-width: 0; }
          .schedulerToolbar { display: flex; flex-wrap: wrap; align-items: center; gap: ${spacing[150]}px; margin-bottom: ${spacing[200]}px; }
          .schedulerToolbar h3 { margin: 0; flex: 1 1 auto; }
          .schedulerView { width: 200px; }
          .schedulerSide { display: grid; gap: ${spacing[300]}px; }
          .schedulerSide fieldset { border: 0; margin: 0; padding: 0; display: grid; gap: ${spacing[100]}px; }
          .schedulerSide legend { padding: 0; margin-bottom: ${spacing[100]}px; font-weight: 600; }
          @media (width < 64rem) { .schedulerScreen { grid-template-columns: 1fr; } .schedulerSide { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); } }
        `}</style>
        <div className="schedulerToolbar">
          <h3>{heading}</h3>
          <Button variant="outline" onClick={() => setDate(TODAY)}>
            Today
          </Button>
          <Button variant="outline" onClick={() => setDate((d) => addDays(d, -step))}>
            <span aria-hidden="true">‹</span>
            <span className="ap-sr-only">Previous {effective}</span>
          </Button>
          <Button variant="outline" onClick={() => setDate((d) => addDays(d, step))}>
            <span aria-hidden="true">›</span>
            <span className="ap-sr-only">Next {effective}</span>
          </Button>
          <Field label="View" className="schedulerView">
            <Select options={VIEWS} value={view} onChange={setView} />
          </Field>
        </div>
        <div className="schedulerScreen">
          <Scheduler
            label="Appointments"
            view={effective}
            date={date}
            weekStartsOn={1}
            days={7}
            resources={byPerson ? PEOPLE : undefined}
            events={events}
            hours={{ start: 7, end: 20 }}
            workingHours={{ start: 9, end: 18 }}
            now={NOW}
            zoneLabel="WET"
            maxHeight={600}
            selectedId={selected?.id ?? null}
            onSelect={setSelected}
            draft={draft}
            createKind={availability ? 'availability' : 'confirmed'}
            onCreate={onCreate}
            onMove={change('moved')}
            onResize={change('resized')}
            onRemove={onRemove}
          />
          <div className="schedulerSide">
            {draft && (
              <Card>
                <CardBody>
                  <strong>New event</strong>
                  <p className="alias" style={{ margin: `${spacing['050']}px 0 ${spacing[150]}px` }}>
                    {draft.start.slice(0, 10)} · {draft.start.slice(11)} – {draft.end.slice(11)}
                    {draft.resourceId ? ` · ${PEOPLE.find((r) => r.id === draft.resourceId)?.name}` : ''}
                  </p>
                  <Field label="Title">
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="(No title)" />
                  </Field>
                  <div className="specimenRow" style={{ marginTop: spacing[150] }}>
                    <Button
                      size="sm"
                      onClick={() => {
                        add({ ...draft, title: title || '(No title)', icon: draft.from?.icon, kind: draft.from?.kind });
                        setDraft(null);
                      }}
                    >
                      Create
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDraft(null)}>
                      Cancel
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )}
            <Switch checked={availability} onChange={(e) => setAvailability(e.target.checked)} description="A press or a drag makes a slot; the × removes it.">
              Availability
            </Switch>
            {availability && (
              <Card>
                <CardBody>
                  <strong>Time slots selected</strong>
                  <pre className="alias" style={{ margin: `${spacing[100]}px 0`, whiteSpace: 'pre-wrap' }}>
                    {slots.length ? formatSlots(slots) : 'No time slots selected yet. Click and drag on the calendar.'}
                  </pre>
                  <Button size="sm" onClick={copySlots} disabled={slots.length === 0}>
                    Copy to clipboard
                  </Button>
                </CardBody>
              </Card>
            )}
            <Calendar
              label="Go to a day"
              headingLevel={3}
              weekStartsOn={1}
              defaultMonth="2023-04-01"
              value={date}
              onSelect={(next) => next && setDate(next as ISODate)}
            />
            <fieldset>
              <legend>Event type</legend>
              {KINDS.map((kind) => (
                <Checkbox
                  key={kind}
                  checked={shown.includes(kind)}
                  onChange={(e) =>
                    setShown((s) => (e.target.checked ? [...s, kind] : s.filter((k) => k !== kind)))
                  }
                >
                  {KIND_WORDS[kind]}
                </Checkbox>
              ))}
            </fieldset>
            {selected && (
              <Card>
                <CardBody>
                  <strong>{selected.title}</strong>
                  <p className="alias" style={{ margin: `${spacing['050']}px 0 ${spacing[150]}px` }}>
                    {selected.start.slice(11)} – {selected.end.slice(11)}
                    {selected.kind ? ` · ${KIND_WORDS[selected.kind]}` : ''}
                    {selected.resourceId ? ` · ${PEOPLE.find((r) => r.id === selected.resourceId)?.name}` : ''}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setSelected(null)}>
                    Close
                  </Button>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </div>
      <p className="alias">
        The now line is pinned to the drawn 11:16 on the 20th of April 2023 so the page holds still; left out, the
        component reads the clock. Below <code>md</code>, 768, the week gives way to the day, as the phone drawing has it.
      </p>
      <h2>Creating, moving and the keyboard</h2>
      <p>
        Press an empty slot for a thirty-minute draft, or drag for the span you want, snapping to the quarter hour;
        the dashed &ldquo;(No title)&rdquo; pulses while the New event panel is open, as drawn, and the panel
        closes it. Drag a card to move it, along its day or into another; select a card and drag the bar at its foot
        to change its end. With Availability on, the same press or drag makes a slot at once, the drawn teal, with a
        × to remove it, and the panel writes the slots as text for the clipboard: the Vimcal gesture. Every gesture
        has a key, and a key acts on the <em>hot</em> event, the one under the pointer if there is one, else the one
        with focus: Shift with Up and Down move it by a quarter, Shift with Left and Right to the next day; Alt+Shift
        with Up and Down change its end; ⌘C or Ctrl+C copies it, ⌘V pastes it after the hot event or at the cursor,
        ⌘D duplicates it, Delete removes it. With the grid itself focused, Enter places a cursor at the first hour
        in view; the arrows move it, Shift with Up and Down stretch it, Enter proposes it, Escape drops it. A move
        or a resize shows a Toast with Undo, which is the page&rsquo;s one line: the callback hands back the event
        as it was. Nothing drags unless its callback is given, and on touch a tap proposes and nothing drags, so the
        grid keeps its scroll.
      </p>
      <p>
        Drawn as the product&rsquo;s calendar: the weekly view, the daily view with several people, the daily view on a
        phone, and a sheet of the appointment&rsquo;s states. The package takes the grid; the toolbar, the
        mini-calendar, the filters and the panel of the selected event are the screen&rsquo;s, and here they are the{' '}
        <a href="/button">Button</a>, the <a href="/select">Select</a>, the <a href="/date-picker">Calendar</a>, the{' '}
        <a href="/choice">Checkbox</a> and a <a href="/card">Card</a>. Press an event, or Tab to one and use the arrows:
        up and down within a day, left and right to the nearest event in the next day that has one, Home and End,
        Enter to select.
      </p>

      <h2>A day, by person</h2>
      <div className="specimen">
        <Scheduler
          label="Appointments by person"
          view="day"
          date="2023-04-21"
          resources={PEOPLE}
          events={STAFF_DAY}
          hours={{ start: 8, end: 19 }}
          workingHours={{ start: 9, end: 18 }}
          now="2023-04-21T10:28"
          zoneLabel="WET"
          maxHeight={560}
        />
      </div>
      <p>
        <code>resources</code> makes a column per person, headed by the <a href="/avatar">Avatar</a> and the name, and
        a <code>tone</code> on the resource paints every event in the column from the category palette: six hues, each
        the accent&rsquo;s own four stops, measured. An event names its own <code>tone</code> when it needs one. Léa
        Martin starts at noon, so her <code>workingHours</code> band the morning. A week with several people is not
        drawn and is not built; a week is a week of days.
      </p>

      <h2>Kinds, and the past</h2>
      <div className="specimen">
        <Scheduler
          label="One of each"
          view="day"
          date="2023-04-20"
          events={[
            { id: 'k1', title: 'Confirmed, an hour', start: t(20, '09:00'), end: t(20, '10:00'), icon: <Video /> },
            { id: 'k2', title: 'Confirmed, half an hour', start: t(20, '10:00'), end: t(20, '10:30') },
            { id: 'k3', title: 'Confirmed, a quarter', start: t(20, '10:30'), end: t(20, '10:45') },
            { id: 'k4', title: 'Pending approval', start: t(20, '11:00'), end: t(20, '12:00'), kind: 'pending', icon: <Video /> },
            { id: 'k5', title: 'Cancelled', start: t(20, '12:00'), end: t(20, '13:00'), kind: 'cancelled', icon: <Video /> },
            { id: 'k6', title: 'Lunch, a time blocker', start: t(20, '13:00'), end: t(20, '14:00'), kind: 'blocker' },
            { id: 'k7', title: 'Train session, external', start: t(20, '14:00'), end: t(20, '15:00'), kind: 'external' },
            { id: 'k8', title: 'Free for a booking', start: t(20, '15:00'), end: t(20, '16:00'), kind: 'availability' },
            { id: 'k9', title: 'Two at once', start: t(20, '16:00'), end: t(20, '17:00'), tone: 'glacier', icon: <Person /> },
            { id: 'k10', title: 'And a second', start: t(20, '16:30'), end: t(20, '17:30'), tone: 'moss' },
            { id: 'k11', title: 'A third', start: t(20, '17:00'), end: t(20, '18:00'), tone: 'amber' },
          ]}
          hours={{ start: 9, end: 19 }}
          now="2023-04-20T10:40"
          maxHeight={520}
        />
      </div>
      <p>
        Six kinds on one tone: <code>confirmed</code> is the fill with its label on it; <code>pending</code> the tint
        with the fill as an edge; <code>cancelled</code> a card with the words struck; <code>blocker</code> the tint
        under dots of the fill; <code>external</code> a card with a bar of the fill at the start;{' '}
        <code>availability</code> the tint with a dashed edge, for the second phase to create. Past is derived from{' '}
        <code>now</code>: an event that has ended loses the fill for the tint, and nothing loses opacity, so every
        text on a past card still measures. By duration, as drawn: a quarter of an hour is one line, half an hour the
        time under it, an hour the icon in its circle. Overlaps take lanes side by side, the column divided.
      </p>

      <h2>Where it departs from the drawing, and why</h2>
      <p>
        The product&rsquo;s blue is the theme&rsquo;s accent and its people&rsquo;s colours are the category palette,
        with the label and the text measured on each fill and tint, which the drawn pastel greens and yellows with
        white on them would not clear. The past is faded by tone rather than by opacity, for the same reason. The
        drawn hatch outside the working day is <code>surface/sunken</code>, a band rather than a pattern; the coral now
        line is <code>border/danger</code>, the theme&rsquo;s ember; today&rsquo;s 28 circle is the Calendar&rsquo;s
        32. The cascade the week with several people draws for overlapping events is not replicated, since at a third
        card the cascade hides the first one&rsquo;s time; they take lanes. The on-appointment and people-waiting bars
        are product states with no token behind them, and are not built. The drawn twelve-hour and twenty-four-hour
        clocks are the locale&rsquo;s, not an option.
      </p>

      <h2>Best practice, and the alternatives</h2>
      <p>
        A column is a list of buttons under a heading, one per event, which is what Google Calendar and Outlook give a
        screen reader, rather than a <code>grid</code> of ninety-six quarter-hours a day that a reader would walk cell
        by cell. Times are wall-clock strings with no zone, the time a receptionist reads off the wall, and the
        formatting is <code>Intl</code>&rsquo;s for the locale; the Calendar&rsquo;s rule that no <code>Date</code>
        leaves the component holds here, and so does its lesson about a runtime west of UTC. The now line is a prop,
        so a page can pin it and a test can hold it. Dragging to create and to move is the second phase, with the
        keyboard equivalents, once this is on main; a month view and an agenda list for a phone are not drawn, and a
        phone here is the day with one column, as the drawing has it. The alternative to columns per person is a
        filter that shows one person&rsquo;s week: both are the same component with a different <code>view</code>.
      </p>

      <h2>Accessibility</h2>
      <p>
        The region is named by <code>label</code> and focusable, so a keyboard can scroll it. Each column is a{' '}
        <code>section</code> named by its day, &ldquo;Thursday, April 20&rdquo;, or its person; each event a button
        named by its title, its time and its kind, &ldquo;Justin Anderson, 11:00 AM – 1:00 PM, Confirmed&rdquo;, and
        the selected one carries <code>aria-current</code>. One event holds the tab stop; the arrows, Home and End
        move it and the focus with it, so leaving and coming back lands where the reader was. The now line, the hour
        labels and the day numbers are decoration to a reader; the names carry the information.
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
          caption="Scheduler props"
          captionVisible
          density="compact"
          columns={propColumns}
          rows={PROPS}
          getRowId={(r) => r.prop}
        />
      </div>
      <p className="alias">
        <Badge tone="info">not built</Badge> A long press to drag on touch; a week of several people; a month view;
        an agenda list; a second zone&rsquo;s hours, the Vimcal Time Travel.
      </p>
    </DocPage>
  );
}
