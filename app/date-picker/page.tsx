'use client';

import { useState } from 'react';
import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { Field } from '@/components/Field';
import { Table } from '@/components/Table';
import { Calendar } from '@/components/Calendar';
import type { DateRange, ISODate } from '@/components/Calendar';
import { DatePicker } from '@/components/DatePicker';
import type { DatePickerInvalidReason } from '@/components/DatePicker';
import { resolve } from '@/tokens/contrast';

type PropRow = { prop: string; type: string; default: string };

const CALENDAR_PROPS: PropRow[] = [
  { prop: 'label', type: 'string', default: 'required' },
  { prop: 'mode', type: "'single' | 'range'", default: "'single'" },
  { prop: 'month', type: 'ISODate', default: '— (uncontrolled)' },
  { prop: 'defaultMonth', type: 'ISODate', default: '—' },
  { prop: 'onMonthChange', type: '(next: ISODate) => void', default: '—' },
  { prop: 'weekStartsOn', type: '0 | 1 | 2 | 3 | 4 | 5 | 6', default: '0' },
  { prop: 'locale', type: 'string', default: "'en-US'" },
  { prop: 'value', type: 'ISODate | DateRange | null', default: '—' },
  {
    prop: 'onSelect',
    type: '(next: ISODate | DateRange | null) => void',
    default: '— (range mode: fires only with a complete range)',
  },
  { prop: 'min', type: 'ISODate', default: '—' },
  { prop: 'max', type: 'ISODate', default: '—' },
  { prop: 'isDateUnavailable', type: '(date: ISODate) => boolean', default: '—' },
];

const DATE_PICKER_PROPS: PropRow[] = [
  { prop: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { prop: 'invalid', type: 'boolean', default: '— (or the Field it sits in)' },
  { prop: 'disabled', type: 'boolean', default: 'false' },
  { prop: 'readOnly', type: 'boolean', default: 'false' },
  { prop: 'id', type: 'string', default: '— (or the Field it sits in)' },
  { prop: 'required', type: 'boolean', default: '— (or the Field it sits in)' },
  { prop: 'aria-describedby', type: 'string', default: '— (or the Field it sits in)' },
  {
    prop: 'name',
    type: 'string',
    default: '— (submits ISO from a hidden input: a date, or start/end for a range)',
  },
  {
    prop: 'onInvalid',
    type: '(raw: string, reason: DatePickerInvalidReason) => void',
    default: '— (reason: incomplete | not-a-date | before-min | after-max | unavailable)',
  },
];

/** Weekends, for the bounds-and-exclusion specimen. Plain `Date`, deliberately:
    the calendar's own arithmetic in `date.ts` is not exported, so a consumer
    reaches for the platform the same way any other caller would. */
function isWeekend(date: ISODate): boolean {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
}

/** The messages the "Typing a date" specimen writes into its Field. The picker
    reports a reason; the words are the page's, because only the page knows
    what the field is called and why a day is unavailable. */
const TYPED_MESSAGES: Record<DatePickerInvalidReason, string> = {
  incomplete: 'Appointment date must include a day, month and year',
  'not-a-date': 'Appointment date must be a real date',
  'before-min': 'Appointment date must be on or after April 3, 2023',
  'after-max': 'Appointment date must be on or before April 24, 2023',
  unavailable: 'Appointment date must be a weekday',
};

type MessageRow = { reason: DatePickerInvalidReason; message: string };

const MESSAGE_ROWS: MessageRow[] = (Object.keys(TYPED_MESSAGES) as DatePickerInvalidReason[]).map(
  (reason) => ({ reason, message: TYPED_MESSAGES[reason] }),
);

export default function Page() {
  const [appointment, setAppointment] = useState<ISODate | null>('2023-04-26');
  const [followUp, setFollowUp] = useState<DateRange | null>(null);
  // Its own state, not `appointment`: shared, a pick here moved the Field
  // picker's value while its panel was closed.
  const [consultation, setConsultation] = useState<ISODate | null>('2023-04-26');
  const [clinicDay, setClinicDay] = useState<ISODate | null>(null);
  const [small, setSmall] = useState<ISODate | null>(null);
  const [medium, setMedium] = useState<ISODate | null>(null);
  const [large, setLarge] = useState<ISODate | null>(null);
  const [typed, setTyped] = useState<ISODate | null>(null);
  const [typedError, setTypedError] = useState<string | null>(null);
  // One value across three locales, on purpose: typing in any of the fields
  // moves the other two, the quickest way to see the order and separator change.
  const [sample, setSample] = useState<ISODate | null>('2023-04-26');

  return (
    <DocPage
      evidence={
        <>
          <p>day label on the panel</p>
          <p>
            light{' '}
            <Ratio fg={resolve('text/primary', 'light')} bg={resolve('surface/overlay', 'light')} />
          </p>
          <p>
            dark{' '}
            <Ratio fg={resolve('text/primary', 'dark')} bg={resolve('surface/overlay', 'dark')} />
          </p>

          <p>weekend label on the panel</p>
          <p>
            light{' '}
            <Ratio fg={resolve('text/tertiary', 'light')} bg={resolve('surface/overlay', 'light')} />
          </p>
          <p>
            dark{' '}
            <Ratio fg={resolve('text/tertiary', 'dark')} bg={resolve('surface/overlay', 'dark')} />
          </p>

          <p>weekday header</p>
          <p>
            light{' '}
            <Ratio fg={resolve('text/tertiary', 'light')} bg={resolve('surface/overlay', 'light')} />
          </p>
          <p>
            dark{' '}
            <Ratio fg={resolve('text/tertiary', 'dark')} bg={resolve('surface/overlay', 'dark')} />
          </p>

          <p>today&rsquo;s label on today&rsquo;s pill</p>
          <p>
            light{' '}
            <Ratio
              fg={resolve('text/accent', 'light')}
              bg={resolve('interactive/selected', 'light')}
            />
          </p>
          <p>
            dark{' '}
            <Ratio
              fg={resolve('text/accent', 'dark')}
              bg={resolve('interactive/selected', 'dark')}
            />
          </p>

          <p>selected / range label</p>
          <p>
            light{' '}
            <Ratio
              fg={resolve('interactive/on-accent', 'light')}
              bg={resolve('interactive/accent', 'light')}
            />
          </p>
          <p>
            dark{' '}
            <Ratio
              fg={resolve('interactive/on-accent', 'dark')}
              bg={resolve('interactive/accent', 'dark')}
            />
          </p>

          <p>band against the panel</p>
          <p>
            light{' '}
            <Ratio
              fg={resolve('interactive/accent', 'light')}
              bg={resolve('surface/overlay', 'light')}
              threshold={3}
            />
          </p>
          <p>
            dark{' '}
            <Ratio
              fg={resolve('interactive/accent', 'dark')}
              bg={resolve('surface/overlay', 'dark')}
              threshold={3}
            />
          </p>

          <p>focus ring against the panel</p>
          <p>
            light{' '}
            <Ratio
              fg={resolve('border/focus', 'light')}
              bg={resolve('surface/overlay', 'light')}
              threshold={3}
            />
          </p>
          <p>
            dark{' '}
            <Ratio
              fg={resolve('border/focus', 'dark')}
              bg={resolve('surface/overlay', 'dark')}
              threshold={3}
            />
          </p>

          <p>pagination chevron, resting</p>
          <p>
            light{' '}
            <Ratio
              fg={resolve('interactive/on-neutral', 'light')}
              bg={resolve('interactive/neutral', 'light')}
            />
          </p>
          <p>
            dark{' '}
            <Ratio
              fg={resolve('interactive/on-neutral', 'dark')}
              bg={resolve('interactive/neutral', 'dark')}
            />
          </p>

          <p>pagination chevron, hover</p>
          <p>
            light{' '}
            <Ratio
              fg={resolve('interactive/on-neutral', 'light')}
              bg={resolve('interactive/neutral-hover', 'light')}
            />
          </p>
          <p>
            dark{' '}
            <Ratio
              fg={resolve('interactive/on-neutral', 'dark')}
              bg={resolve('interactive/neutral-hover', 'dark')}
            />
          </p>
        </>
      }
    >
      <h1>Date picker</h1>
      <p className="lead">
        A field that opens a month grid in a native popover, and
        the month grid on its own — single dates or a range, by keyboard or by pointer.
      </p>

      <h2>Field</h2>
      <div className="specimen">
        <div style={{ maxWidth: 320 }}>
          <Field label="Appointment date" description="Typed as month, day, year.">
            <DatePicker
              label="Appointment date"
              value={appointment}
              onSelect={(next) => setAppointment(next as ISODate | null)}
            />
          </Field>
        </div>
      </div>
      <p className="alias">
        The field already reads <code>04/26/2023</code> — type over it, or open the panel
        with the trigger.
      </p>

      <h2>The band survives a month boundary</h2>
      <p>
        Days from the adjacent month are drawn, greyed with <code>text/inert</code> and inert: not a tab stop, not
        clickable, their number hidden from a screen reader. That is what makes their low
        contrast defensible — a control has to clear WCAG for text, decoration does not. But a
        spilled day still takes the range band when a selection covers it. Unpainted, the band
        would break exactly at the boundary a range is most likely to cross.
      </p>
      <div className="specimen">
        <div className="specimenRow">
          <Calendar
            label="Booked stay"
            headingLevel={3}
            mode="range"
            defaultMonth="2023-03-01"
            value={{ start: '2023-02-20', end: '2023-03-03' }}
          />
          <div style={{ minWidth: 220 }}>
            <p style={{ marginTop: 0 }}>
              With March open, the cells spilled in at the top are 26–28 February — inside a
              range that started on the 20th, so all three carry the accent band.
            </p>
            <DatePicker
              label="Follow-up window"
              mode="range"
              value={followUp}
              // Range mode only ever reports a complete range.
              onSelect={(next) => setFollowUp(next as DateRange)}
            />
          </div>
        </div>
      </div>

      <h2>The Calendar ships on its own</h2>
      <p>
        The field, the popover and the typing are all <code>DatePicker</code>. Underneath is a
        plain <code>Calendar</code> — a grid with no opinion about how it got on screen, usable
        anywhere a picker&rsquo;s trigger and text field would be wrong, such as inline in a
        page.
      </p>
      <div className="specimen">
        <Calendar
          label="Consultation date"
          headingLevel={3}
          value={consultation}
          onSelect={(next) => setConsultation(next as ISODate | null)}
        />
      </div>

      <h2>Bounds and exclusions</h2>
      <p>
        <code>min</code> and <code>max</code> disable the days outside them;{' '}
        <code>isDateUnavailable</code> disables individual days inside them — closed days,
        booked days. Both leave the day focusable with <code>aria-disabled</code> rather than
        removing it, so the grid&rsquo;s geometry and its tab order never change shape around a
        clinic&rsquo;s calendar.
      </p>
      <div className="specimen">
        <Calendar
          label="Clinic days"
          headingLevel={3}
          defaultMonth="2023-04-01"
          min="2023-04-03"
          max="2023-04-24"
          isDateUnavailable={isWeekend}
          value={clinicDay}
          onSelect={(next) => setClinicDay(next as ISODate | null)}
        />
      </div>

      <h2>Sizes</h2>
      <p>
        The trigger shares Button&rsquo;s height scale. The drawing&rsquo;s <code>md</code>{' '}
        trigger is this code&rsquo;s <code>lg</code> — the same one-step remap the field already
        made once between its own <code>md</code> and Button&rsquo;s.
      </p>
      <div className="specimen">
        <div className="specimenRow">
          <DatePicker
            label="Small"
            size="sm"
            value={small}
            onSelect={(next) => setSmall(next as ISODate | null)}
          />
          <DatePicker
            label="Medium"
            size="md"
            value={medium}
            onSelect={(next) => setMedium(next as ISODate | null)}
          />
          <DatePicker
            label="Large"
            size="lg"
            value={large}
            onSelect={(next) => setLarge(next as ISODate | null)}
          />
        </div>
      </div>

      <h2>The panel</h2>
      <p>
        It is a native <code>popover=&quot;manual&quot;</code>, anchored to the field with CSS
        anchor positioning — the top layer, so it escapes <code>overflow: hidden</code> without a
        portal, and CSS places and flips it without positioning JavaScript. Not{' '}
        <code>auto</code>, the way <a href="/dropdown-menu">DropdownMenu</a> is: in range mode
        the first Escape has to cancel a pending start rather than close anything, and that has
        to run before the platform&rsquo;s own close request would take the panel out from under
        it. Dismissal is the component&rsquo;s own instead — Escape, a pointer press outside, and
        focus leaving the field and panel together all close it, and Tab wraps between the
        header&rsquo;s Previous/Next and the grid rather than escaping to the rest of the page.
      </p>
      <p>
        The panel is <code>surface/overlay</code>, the system&rsquo;s <code>elevation/md</code>{' '}
        shadow, and in dark a <code>border/default</code> hairline the shadow alone no longer
        supplies — see the gutter for what that leaves to read against.
      </p>
      <p>
        jsdom has none of the popover API. <code>src/test/popover.ts</code> — shared with{' '}
        <code>DropdownMenu</code>&rsquo;s suite — stubs <code>showPopover</code>,{' '}
        <code>hidePopover</code>, the synchronous <code>beforetoggle</code> and queued{' '}
        <code>toggle</code> events, and a <code>popovertarget</code> click. Escape (including the
        range layering), the outside press, focus leaving, focus returning to the trigger and the
        Tab wrap are this component&rsquo;s own handlers, and the suite tests them through that
        stub. The top layer, the anchor placement, the flip and focus in a real browser are not
        covered by the suite, and have not yet been checked by hand.
      </p>

      <h2>Typing a date</h2>
      <p>
        The field is one masked input. Type digits only: the separator appears as each part is
        complete. A first digit that cannot start its part gains a leading zero (a month of{' '}
        <code>4</code> becomes <code>04</code>), and so does a single digit followed by a separator
        (<code>1/</code> becomes <code>01/</code>). A digit that would make a part impossible (a
        month of <code>13</code>) is not taken. Pasting, autofill and deleting in the middle all go
        through the same rebuild from the digits, and a deletion is never refused. ISO (
        <code>2023-04-26</code>) is read when it arrives whole — pasted or autofilled — in any
        locale.
      </p>
      <div className="specimen">
        <div className="specimenRow">
          {(['en-US', 'pt-PT', 'de-DE'] as const).map((locale) => (
            <div key={locale} style={{ minWidth: 200 }}>
              <Field label={locale}>
                <DatePicker
                  label={locale}
                  locale={locale}
                  value={sample}
                  onSelect={(next) => setSample(next as ISODate | null)}
                />
              </Field>
            </div>
          ))}
        </div>
      </div>
      <p>
        The field checks a date when its last digit is in, on blur and on Enter — never half way,
        since half a date is unfinished rather than wrong. Each check ends in exactly one call:{' '}
        <code>onSelect</code> with the date (or <code>null</code> for an emptied field), or{' '}
        <code>onInvalid</code> with a reason. Refused text stays as typed and the previous value
        stays intact. The picker never writes the message: the caller does, into the{' '}
        <code>Field</code>&rsquo;s <code>error</code>, because only the caller knows what the
        field is called and why a day is unavailable.
      </p>
      <div className="specimen">
        <div style={{ maxWidth: 320 }}>
          <Field
            label="Appointment date"
            description="A weekday from April 3 to April 24, 2023."
            error={typedError ?? undefined}
          >
            <DatePicker
              label="Appointment date"
              defaultMonth="2023-04-01"
              min="2023-04-03"
              max="2023-04-24"
              isDateUnavailable={isWeekend}
              value={typed}
              onSelect={(next) => {
                setTyped(next as ISODate | null);
                setTypedError(null);
              }}
              onInvalid={(_raw, reason) => setTypedError(TYPED_MESSAGES[reason])}
            />
          </Field>
        </div>
      </div>
      <div className="tableScroll">
        <Table
          caption="Reasons, and the messages this page writes for them"
          density="compact"
          columns={[
            { key: 'reason', header: 'Reason', primary: true, cell: (r: MessageRow) => <code>{r.reason}</code> },
            { key: 'message', header: 'Message', cell: (r: MessageRow) => r.message },
          ]}
          rows={MESSAGE_ROWS}
          getRowId={(r) => r.reason}
        />
      </div>
      <p>
        In range mode the field takes both dates: sixteen digits, joined after the first eight by
        an en dash with a space on each side (<code>04/05/2023 – 04/10/2023</code>), and a pair
        typed in reverse is put in order, as the calendar would.
      </p>

      <h2>Accessibility</h2>
      <p>
        The trigger names itself <code>Choose date</code> until there is a value, then{' '}
        <code>Change date, April 26, 2023</code> — always the long, spoken form, even while the
        field itself is showing an uncommitted draft. Inside a <code>Field</code> the visible
        label already names the text input; the trigger carries its own name regardless, since
        confirming the value is its job even for a screen-reader user who never reads the field.
      </p>
      <p>
        The field describes its mask in words — <em>&ldquo;Type digits only, as month, day, year.
        Separators are added for you.&rdquo;</em>, with the three parts in the locale&rsquo;s order
        (the pt-PT and de-DE fields above say &ldquo;day, month, year&rdquo;) — through{' '}
        <code>aria-describedby</code>, after the{' '}
        <code>Field</code>&rsquo;s own description and error, because a screen reader reads{' '}
        <code>MM/DD/YYYY</code> letter by letter. A digit the mask refuses makes no sound:
        announcing each one would talk over the reader&rsquo;s own echo of the key, so the rule is
        stated before anyone meets it. The format still to type is drawn behind the text in{' '}
        <code>text/placeholder</code>, hidden from the accessibility tree.
      </p>
      <p>
        The grid is a single tab stop, roving with the arrow keys, Home, End and Page Up/Down
        (Shift for a year). A day excluded by <code>isDateUnavailable</code> stays in that
        sequence with <code>aria-disabled</code> rather than <code>disabled</code> — reachable, so
        a screen reader hears why a day is excluded instead of finding a hole in the month. Days
        outside <code>min</code> and <code>max</code> are drawn the same way, but the arrow keys
        clamp to the bounds, so a move never lands past them.
      </p>

      <h2>Calendar props</h2>
      <div className="tableScroll">
        <Table
          caption="Calendar props"
          density="compact"
          columns={[
            { key: 'prop', header: 'Prop', primary: true, cell: (r: PropRow) => <code>{r.prop}</code> },
            { key: 'type', header: 'Type', cell: (r: PropRow) => <span className="alias">{r.type}</span> },
            { key: 'default', header: 'Default', cell: (r: PropRow) => <span className="alias">{r.default}</span> },
          ]}
          rows={CALENDAR_PROPS}
          getRowId={(r) => r.prop}
        />
      </div>
      <p className="alias" style={{ marginTop: 8 }}>
        <code>weekStartsOn</code> defaults to Sunday and is never derived from{' '}
        <code>locale</code> — the platform&rsquo;s own locale week data disagrees with pt-PT, so
        deriving it would be silently wrong for most of Europe.
      </p>
      <p className="alias">
        <code>DateRange</code> is <code>{'{ start: ISODate; end: ISODate }'}</code> — <code>end</code>{' '}
        is never null. In range mode the first click only paints a pending start; <code>onSelect</code>{' '}
        fires once, with both ends, on the second.
      </p>

      <h2>DatePicker props</h2>
      <p>Every prop above, plus:</p>
      <div className="tableScroll">
        <Table
          caption="DatePicker props"
          density="compact"
          columns={[
            { key: 'prop', header: 'Prop', primary: true, cell: (r: PropRow) => <code>{r.prop}</code> },
            { key: 'type', header: 'Type', cell: (r: PropRow) => <span className="alias">{r.type}</span> },
            { key: 'default', header: 'Default', cell: (r: PropRow) => <span className="alias">{r.default}</span> },
          ]}
          rows={DATE_PICKER_PROPS}
          getRowId={(r) => r.prop}
        />
      </div>
    </DocPage>
  );
}
