'use client';

import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { TypeText } from '@ui/TypeText';
import { Tabs, tabsVariants, type TabItem } from '@/components/Tabs';
import { Table } from '@/components/Table';
import { Badge } from '@/components/Badge';
import { resolve } from '@/tokens/contrast';
import { radius, spacing } from '@/tokens/scale';
import { textStyle } from '@/tokens/typography';
import type { Mode, ThemeTokenName } from '@/tokens/theme';

const MODES: Mode[] = ['light', 'dark'];

/** The pairs a tab is read in. `over` is the surface a wash lands on. */
const PAIRS: ReadonlyArray<{ name: string; fg: ThemeTokenName; bg: ThemeTokenName; over?: ThemeTokenName }> = [
  { name: 'underline, selected', fg: 'text/primary', bg: 'surface/base' },
  { name: 'underline, hovered', fg: 'text/secondary', bg: 'interactive/wash-hover', over: 'surface/base' },
  { name: 'segment on the thumb', fg: 'text/accent', bg: 'surface/overlay' },
  { name: 'segment, pressed', fg: 'text/secondary', bg: 'interactive/wash-pressed', over: 'surface/sunken' },
  { name: 'pill, selected', fg: 'text/inverse', bg: 'surface/inverse' },
  { name: 'its count', fg: 'text/accent', bg: 'interactive/selected' },
  { name: 'the bar, 3:1', fg: 'border/accent', bg: 'surface/base' },
];

const PANELS: readonly TabItem[] = [
  {
    id: 'details',
    label: 'Details',
    content: <p>Consultation with Dr Marta Reis, Tuesday at 14:30, room 2. Forty minutes.</p>,
  },
  {
    id: 'people',
    label: 'Participants',
    count: 3,
    content: <p>Leonor Viana, Marta Reis and an interpreter. All three have confirmed.</p>,
  },
  { id: 'chat', label: 'Chat', content: <p>No messages yet. The thread opens when the appointment is confirmed.</p> },
  { id: 'files', label: 'Files', disabled: true, content: <p>Nothing here.</p> },
];

const FILTERS: readonly TabItem[] = [
  { id: 'all', label: 'All', count: 72, content: <p>Seventy-two appointments this week.</p> },
  { id: 'pending', label: 'Pending', count: 9, content: <p>Nine are waiting for the client to confirm.</p> },
  { id: 'done', label: 'Done', count: 41, content: <p>Forty-one have taken place.</p> },
];

const MANY: readonly TabItem[] = ['Overview', 'Appointments', 'Invoices', 'Documents', 'Messages', 'History', 'Consent', 'Notes'].map(
  (label) => ({ id: label.toLowerCase(), label, content: <p>{label}.</p> }),
);

type Measure = { part: string; underline: string; segmented: string; pill: string };
const type = (name: keyof typeof textStyle) => `${textStyle[name].size} / ${textStyle[name].lineHeight}`;

/** Read from the scale and the text styles, so the page cannot quote a number the stylesheet does not use. */
const MEASURES: Measure[] = [
  { part: 'Height', underline: '40, ghost 32', segmented: '32, segment 28', pill: '32' },
  { part: 'Inline padding', underline: String(spacing[150]), segmented: 'equal columns', pill: `${spacing[200]}; ${spacing[200]} and ${spacing['050']} with a count` },
  { part: 'Gap between tabs', underline: String(spacing['050']), segmented: String(spacing['025']), pill: String(spacing[100]) },
  { part: 'Radius', underline: `ghost ${radius.lg}`, segmented: `track ${radius.lg}, thumb ${radius.md}`, pill: 'full' },
  { part: 'Label, Semibold', underline: type('button/md'), segmented: type('caption/md'), pill: type('body/md') },
];

type KeyRow = { keys: string; does: string };
const KEYS: KeyRow[] = [
  { keys: '→  ←', does: 'The next and the previous tab, wrapping at the ends and skipping a disabled one. Reversed under dir="rtl".' },
  { keys: 'Home  End', does: 'The first and the last tab that can be selected.' },
  { keys: 'Enter  Space', does: 'Selects the focused tab. Only needed when activation is manual.' },
  { keys: 'Tab', does: 'Leaves the list for the panel. The list is one stop, whichever tab is selected.' },
];

type PropRow = { prop: string; type: string; default: string };
const PROPS: PropRow[] = [
  { prop: 'items', type: 'readonly TabItem[]', default: 'required' },
  { prop: 'label', type: 'string', default: 'required' },
  { prop: 'variant', type: "'underline' | 'segmented' | 'pill'", default: "'underline'" },
  { prop: 'value', type: 'string', default: '—' },
  { prop: 'defaultValue', type: 'string', default: 'the first enabled item' },
  { prop: 'onChange', type: '(id: string) => void', default: '—' },
  { prop: 'activation', type: "'automatic' | 'manual'", default: "'automatic'" },
  { prop: 'keepMounted', type: 'boolean', default: 'false' },
  { prop: 'fullWidth', type: 'boolean', default: 'false' },
];
const ITEM_PROPS: PropRow[] = [
  { prop: 'id', type: 'string', default: 'required' },
  { prop: 'label', type: 'string', default: 'required' },
  { prop: 'content', type: 'ReactNode', default: 'required' },
  { prop: 'count', type: 'number', default: '—' },
  { prop: 'disabled', type: 'boolean', default: 'false' },
];

const propColumns = [
  { key: 'prop', header: 'Prop', primary: true, cell: (r: PropRow) => <code>{r.prop}</code> },
  { key: 'type', header: 'Type', cell: (r: PropRow) => <span className="alias"><TypeText>{r.type}</TypeText></span> },
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
      <h1>Tabs</h1>
      <p className="lead">
        One list of tabs, one panel showing. Three looks over the same behaviour: an
        underline for the sections of a page, a segmented track for views of one object, and
        pills for filtered views of a list.
      </p>

      <h2>Try it</h2>
      <div className="specimen">
        {/* The component documenting itself: a segmented Tabs whose panels are
            the same appointment drawn in each variant. It has panels, so it
            is tabs and not the radio group this page warns about below. */}
        <Tabs
          label="Variant"
          variant="segmented"
          items={tabsVariants.map((v) => ({
            id: v,
            label: v[0]!.toUpperCase() + v.slice(1),
            content: <Tabs label={`Appointment, ${v}`} variant={v} items={PANELS} />,
          }))}
        />
      </div>
      <p className="alias">
        Focus a tab and press the arrows. Home and End go to the ends, Files is disabled and
        is skipped, and Tab moves on to the panel.
      </p>

      <h2>Choosing a variant</h2>
      <p>
        <strong>Underline</strong> divides a page or a large panel into sections. It sits on
        the surface with a rule beneath it, takes as many tabs as the width allows, and
        scrolls when it runs out. <strong>Segmented</strong> switches between two to five
        views of one object inside a card or a dialog: the track has a fixed share for each
        label, so more than five crowd it and a long label is cut. <strong>Pill</strong>{' '}
        filters a list, and is the one to use when the count matters as much as the label.
      </p>
      <p>
        Tabs are for views the reader moves between freely, each complete on its own. For
        more than a handful of views that do not fit a row, a <a href="/select">Select</a>{' '}
        over a single panel reads better. For steps in an order, tabs promise a freedom the
        flow does not have. And a control that holds a value and shows no panel is a radio
        group, however much it looks like the segmented track: that is the{' '}
        <a href="/segmented-control">SegmentedControl</a>, which shares this track&rsquo;s stylesheet.
      </p>

      <h2>The three variants</h2>
      <div className="specimen">
        <div className="specimenRow">
          <Tabs label="Appointment, underline" variant="underline" items={PANELS.slice(0, 3)} />
        </div>
        <div className="specimenRow">
          <Tabs label="Appointment, segmented" variant="segmented" items={PANELS.slice(0, 3)} defaultValue="people" />
        </div>
        <div className="specimenRow">
          <Tabs label="Appointments by state" variant="pill" items={FILTERS} />
        </div>
      </div>

      <h2>Anatomy</h2>
      <div className="specimen">
        <Table
          caption="Tabs geometry, in pixels"
          density="compact"
          columns={[
            { key: 'part', header: 'Part', primary: true, cell: (r: Measure) => r.part },
            { key: 'underline', header: 'Underline', cell: (r: Measure) => <span className="alias">{r.underline}</span> },
            { key: 'segmented', header: 'Segmented', cell: (r: Measure) => <span className="alias">{r.segmented}</span> },
            { key: 'pill', header: 'Pill', cell: (r: Measure) => <span className="alias">{r.pill}</span> },
          ]}
          rows={MEASURES}
          getRowId={(r) => r.part}
        />
      </div>
      <p>
        The underline tab&rsquo;s hover is a rounded ghost inside the tab rather than the
        tab&rsquo;s whole box: 32 inside 40 leaves 4 above and below, so the wash touches
        neither the rule under the list nor the bar of the selected tab. The whole 40 still
        takes the click. The focus ring follows the ghost for the same reason.
      </p>
      <p>
        The segmented thumb is one element that slides. The columns are equal, so a step is
        the thumb&rsquo;s own width plus the gap and nothing is measured in script. It moves
        in the travel duration and jumps under reduced motion. The underline&rsquo;s bar
        fades instead: its tabs have different widths, and sliding it would mean measuring
        them.
      </p>

      <h2>Where it leaves the drawing</h2>
      <p>
        Segmented and pill are drawn; the underline is not, and was added because a page
        needs one. Its selected label is the primary text colour, not the accent the
        segmented label takes: the accent is the colour of a link, and an underline tab sits
        beside real ones.
      </p>
      <p>
        The segmented track is drawn in the canvas colour with no edge, on a white artboard.
        On the canvas it disappears, so it takes the sunken surface and a hairline; in dark
        the sunken surface <em>is</em> the canvas and the hairline alone carries it, while
        the thumb takes the overlay surface, a step above a card and two above the track. The thumb&rsquo;s shadow was a loose value
        and became the smallest elevation step, which the elevation file had been keeping a
        place for. The radii are 8 outside and 6 inside, concentric over 2 of padding, where
        the drawn 10 is not on the scale.
      </p>
      <p>
        The selected pill&rsquo;s count was drawn white on the palest accent and did not
        read; the fill is kept and the number takes the accent text colour. In dark an
        unselected pill takes a border, as the <a href="/badge">Badge</a> does, because its
        fill is the canvas there.
      </p>

      <h2>States</h2>
      <div className="specimen">
        <div className="specimenRow">
          <Tabs label="Patient record" variant="underline" items={MANY} defaultValue="documents" />
        </div>
      </div>
      <p>
        A list that does not fit scrolls, and the selected tab is kept in view. The
        scrolling is the list&rsquo;s own: the page never moves to follow a tab. A disabled
        tab stays in the accessibility tree with <code>aria-disabled</code>, so a reader can
        learn that it exists; the arrows pass over it and a click does nothing.
      </p>
      <p>
        Only the panel that is showing is mounted. <code>keepMounted</code> renders every
        panel and hides the rest, for a form half filled in another tab. A{' '}
        <code>value</code> that names no tab, or a disabled one, shows the first tab that can
        be selected rather than an empty panel.
      </p>
      <div className="specimen">
        <div className="specimenRow">
          <Badge tone="info">fullWidth</Badge>
        </div>
        <div className="specimenRow">
          <div style={{ width: '100%' }}>
            <Tabs label="Period" variant="segmented" fullWidth items={['Day', 'Week', 'Month'].map((l) => ({ id: l, label: l, content: <p>The {l.toLowerCase()} view.</p> }))} />
          </div>
        </div>
      </div>

      <h2>Accessibility</h2>
      <p>
        The WAI-ARIA tabs pattern. The list is one tab stop, the selected tab; the arrows
        move within it. By default moving focus selects, because a panel here is already
        rendered and costs nothing to show. <code>activation=&quot;manual&quot;</code> makes
        the arrows move focus only, for a panel that has to fetch. The panel can take focus,
        so a panel of plain text is not skipped by Tab.
      </p>
      <div className="specimen">
        <Table
          caption="Keys"
          density="compact"
          columns={[
            { key: 'keys', header: 'Key', primary: true, cell: (r: KeyRow) => <code>{r.keys}</code> },
            { key: 'does', header: 'Does', cell: (r: KeyRow) => r.does },
          ]}
          rows={KEYS}
          getRowId={(r) => r.keys}
        />
      </div>
      <p>
        The selected tab never differs by colour alone: the underline gains a bar, the
        segment a lifted thumb, the pill an inverted fill. The count is part of the
        tab&rsquo;s name, read as &ldquo;Participants 3&rdquo;. Up and down arrows are left
        to the page, since the list is horizontal.
      </p>

      <h2>Props</h2>
      <div className="specimen">
        <Table caption="Tabs props" captionVisible density="compact" columns={propColumns} rows={PROPS} getRowId={(r) => r.prop} />
      </div>
      <div className="specimen">
        <Table caption="TabItem" captionVisible density="compact" columns={propColumns} rows={ITEM_PROPS} getRowId={(r) => r.prop} />
      </div>
    </DocPage>
  );
}
