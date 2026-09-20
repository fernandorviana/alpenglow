'use client';

import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { CodeBlock } from '@ui/CodeBlock';
import { ToastSpecimen } from '@ui/ToastSpecimen';
import { CheckmarkOutline, Error as ErrorIcon, Information, Warning } from '@carbon/icons-react';
import { toast, TOAST_DURATION, TOAST_DURATION_WITH_ACTION, TOAST_LIMIT } from '@/components/Toast';
import { Button } from '@/components/Button';
import { Table } from '@/components/Table';
import { resolve } from '@/tokens/contrast';
import { radius, spacing } from '@/tokens/scale';
import { textStyle } from '@/tokens/typography';
import type { Mode, ThemeTokenName } from '@/tokens/theme';

const MODES: Mode[] = ['light', 'dark'];
const seconds = (ms: number) => `${ms / 1000}s`;

const PAIRS: ReadonlyArray<{ name: string; fg: ThemeTokenName; bg: ThemeTokenName }> = [
  { name: 'text', fg: 'text/inverse', bg: 'surface/inverse' },
  { name: 'over a card', fg: 'surface/inverse', bg: 'surface/raised' },
  { name: 'over the canvas', fg: 'surface/inverse', bg: 'surface/base' },
];

const USAGE = `import { Toaster, toast } from 'alpenglow';

// Once, near the root.
<Toaster />

// From anywhere, a component or not.
const id = toast('Appointment deleted', {
  tone: 'success',
  action: { label: 'Undo', onClick: restore },
});

toast.dismiss(id);`;

type Measure = { part: string; value: string };
/** Read from the scale and the text styles, so the page cannot quote a number the stylesheet does not use. */
const MEASURES: Measure[] = [
  { part: 'Least height', value: String(spacing[600]) },
  { part: 'Width', value: '288 to 360; the message wraps' },
  { part: 'Padding', value: `${spacing[200]} before, ${spacing[100]} after, ${spacing[100]} block` },
  { part: 'Radius', value: String(radius.xl) },
  { part: 'Text, Medium', value: `${textStyle['body/md'].size} / ${textStyle['body/md'].lineHeight}` },
  { part: 'Icon', value: String(spacing[250]) },
  { part: 'Close and action', value: `${spacing[400]} tall, radius ${radius.lg}` },
  { part: 'From the viewport', value: String(spacing[300]) },
  { part: 'Between toasts', value: String(spacing[100]) },
];

type Choice = { when: string; use: string };
const CHOICES: Choice[] = [
  { when: 'Something the reader just did has happened, and they can go on', use: 'Toast' },
  { when: 'It concerns a part of the page and stays true while they look at it', use: 'An inline alert, beside that part' },
  { when: 'A field is wrong', use: 'The Field’s own error, under the field' },
  { when: 'They must decide before anything else', use: 'Dialog' },
];

type Clock = { toast: string; stays: string };
const CLOCKS: Clock[] = [
  { toast: 'A message', stays: seconds(TOAST_DURATION) },
  { toast: 'A message with an action', stays: seconds(TOAST_DURATION_WITH_ACTION) },
  { toast: 'An error', stays: 'Until dismissed' },
];

type PropRow = { prop: string; type: string; default: string };
const OPTIONS: PropRow[] = [
  { prop: 'message', type: 'string', default: 'required' },
  { prop: 'tone', type: "'neutral' | 'success' | 'danger' | 'warning' | 'info'", default: "'neutral'" },
  { prop: 'action', type: '{ label: string; onClick: () => void }', default: '—' },
  { prop: 'duration', type: 'number, or Infinity', default: 'by tone and action' },
  { prop: 'id', type: 'string', default: 'generated' },
];
const PROPS: PropRow[] = [
  { prop: 'placement', type: "'top-start' | 'top-center' | 'top-end' | 'bottom-start' | 'bottom-center' | 'bottom-end'", default: "'bottom-end'" },
  { prop: 'label', type: 'string', default: "'Notifications'" },
  { prop: 'className', type: 'string', default: '—' },
];

const propColumns = (first: string) => [
  { key: 'prop', header: first, primary: true, cell: (r: PropRow) => <code>{r.prop}</code> },
  { key: 'type', header: 'Type', cell: (r: PropRow) => <span className="alias">{r.type}</span> },
  { key: 'default', header: 'Default', cell: (r: PropRow) => <span className="alias">{r.default}</span> },
];

export default function Page() {
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
      <h1>Toast</h1>
      <p className="lead">
        A line in a corner that says something just happened. It asks for nothing, offers
        at most one way back, and leaves.
      </p>

      <h2>Try it</h2>
      <div className="specimen">
        <div className="specimenRow">
          <Button variant="outline" tone="neutral" size="sm" onClick={() => toast('Link copied')}>
            Neutral
          </Button>
          <Button
            variant="outline"
            tone="neutral"
            size="sm"
            onClick={() =>
              toast('Appointment deleted', {
                tone: 'success',
                action: { label: 'Undo', onClick: () => toast('Appointment restored', { tone: 'success' }) },
              })
            }
          >
            With an action
          </Button>
          <Button variant="outline" tone="neutral" size="sm" onClick={() => toast('Couldn’t send the invite', { tone: 'danger' })}>
            Error
          </Button>
          <Button variant="outline" tone="neutral" size="sm" onClick={() => toast('The room is booked until 15:00', { tone: 'warning' })}>
            Warning
          </Button>
          <Button variant="outline" tone="neutral" size="sm" onClick={() => toast('A new version is ready', { tone: 'info' })}>
            Info
          </Button>
          <Button variant="ghost" tone="neutral" size="sm" onClick={() => toast.dismiss()}>
            Dismiss all
          </Button>
        </div>
      </div>
      <p className="alias">
        Rest the pointer on one and its clock stops. Press F6 to move the focus to the
        newest, and Esc to dismiss it and go back to where you were.
      </p>

      <h2>Choosing a toast</h2>
      <p>
        A toast is for what has already happened. It appears away from where the reader is
        looking and it goes on its own, so nothing they cannot do without belongs in it, and
        its action is never the only way to that action: the undo it offers is also in the
        page, or the thing can simply be done again.
      </p>
      <div className="specimen">
        <Table
          caption="A toast, or something that stays"
          density="compact"
          columns={[
            { key: 'when', header: 'When', primary: true, cell: (r: Choice) => r.when },
            { key: 'use', header: 'Use', cell: (r: Choice) => r.use },
          ]}
          rows={CHOICES}
          getRowId={(r) => r.when}
        />
      </div>

      <h2>Anatomy</h2>
      <div className="specimen">
        <div className="specimenRow">
          <ToastSpecimen>Link copied</ToastSpecimen>
          <ToastSpecimen icon={<CheckmarkOutline size={20} />} action="Undo">
            Appointment deleted
          </ToastSpecimen>
        </div>
        <div className="specimenRow">
          <ToastSpecimen icon={<ErrorIcon size={20} />}>Couldn’t send the invite</ToastSpecimen>
          <ToastSpecimen icon={<Warning size={20} />}>The room is booked until 15:00</ToastSpecimen>
          <ToastSpecimen icon={<Information size={20} />}>A new version is ready</ToastSpecimen>
        </div>
      </div>
      <div className="specimen">
        <Table
          caption="Toast geometry, in pixels"
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
        A message, at most one action, and a close that is always there. No title and no
        second line: what needs those is an alert or a dialog. {TOAST_LIMIT} show at once,
        the newest nearest the edge, and the rest wait their turn. Under 480 wide every
        placement becomes the bottom edge, the width of the screen.
      </p>

      <h2>The inverse surface, and no colour</h2>
      <p>
        The <a href="/tooltip">Tooltip</a> sits on the overlay surface, the menu’s, and the
        toast does not. A tooltip opens where the reader is already looking and can be
        quiet. A toast opens in a corner they are not looking at and has to be seen: the
        inverse surface is 15:1 or more against anything it floats over, in both modes.
      </p>
      <p>
        The tone is read from the shape of the icon, and said in words to a screen reader.
        It has no colour yet. The theme has text and a border for the inverse surface and
        nothing else, and the status colours were chosen against light surfaces in light:
        success green on this near-black does not read. When the theme has status tokens
        for this surface the icon takes them, and nothing in the API moves.
      </p>
      <p>
        Hover and pressed are the theme’s own wash, which lightens this surface in light and
        darkens it in dark, a surface step each way. The focus ring is the text’s colour:
        in dark this surface is a near-white block, and the focus colour is 1.64:1 on it.
      </p>

      <h2>Time</h2>
      <div className="specimen">
        <Table
          caption="How long a toast stays (WCAG 2.2.1)"
          density="compact"
          columns={[
            { key: 'toast', header: 'Toast', primary: true, cell: (r: Clock) => r.toast },
            { key: 'stays', header: 'Stays', cell: (r: Clock) => <span className="alias">{r.stays}</span> },
          ]}
          rows={CLOCKS}
          getRowId={(r) => r.toast}
        />
      </div>
      <p>
        The clock stops while the pointer is over the toasts, while the focus is among them,
        and while the tab is in the background, and starts again from the whole duration.
        A toast raised again with the <code>id</code> of one that is showing updates it in
        place: “Uploading” becomes “Uploaded” without a second toast.
      </p>

      <h2>Accessibility</h2>
      <p>
        The Toaster is a named region that is in the page, empty, from the start, holding a
        polite live list: a screen reader is already listening when the first toast is put
        there. An error is also an <code>alert</code>, so it interrupts. F6 moves the focus
        to the newest toast, Tab reaches its buttons, and Esc dismisses it and gives the
        focus back.
      </p>
      <p>
        It lives in the top layer as a manual popover: no z-index and no portal, and it is
        raised again whenever toasts begin, so it sits above a menu or a dialog opened
        since. One limit is the platform’s. A modal dialog makes everything outside it
        inert, the top layer included, so a toast raised while a <a href="/dialog">Dialog</a>{' '}
        is open is drawn above it and can be neither pressed nor heard. Say it inside the
        Dialog, or close the Dialog first.
      </p>

      <h2>Using it</h2>
      <CodeBlock code={USAGE} lang="tsx" />
      <div className="specimen">
        <Table caption="toast(message, options)" density="compact" columns={propColumns('Option')} rows={OPTIONS} getRowId={(r) => r.prop} />
      </div>
      <div className="specimen">
        <Table caption="Toaster props" density="compact" columns={propColumns('Prop')} rows={PROPS} getRowId={(r) => r.prop} />
      </div>
    </DocPage>
  );
}
