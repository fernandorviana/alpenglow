import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { Table } from '@/components/Table';
import { resolve } from '@/tokens/contrast';
import { density } from '@/tokens/density';
import { textStyle } from '@/tokens/typography';
import type { Mode, ThemeTokenName } from '@/tokens/theme';
import { componentsUsed } from './composition';
import { Frame } from './FrameView';

const MODES: Mode[] = ['light', 'dark'];

const PAIRS: ReadonlyArray<{ name: string; fg: ThemeTokenName; bg: ThemeTokenName; threshold?: number }> = [
  { name: 'the words, on the canvas', fg: 'text/primary', bg: 'surface/base' },
  { name: 'the secondary words, on a panel', fg: 'text/secondary', bg: 'surface/raised' },
  { name: 'the current row’s ring, on the table, 3:1', fg: 'border/accent', bg: 'surface/raised', threshold: 3 },
  { name: 'a primary button’s label, on the accent', fg: 'interactive/on-accent', bg: 'interactive/accent' },
];

/** WCAG 2.5.8, Target Size (Minimum). */
const TARGET_FLOOR = 24;

const commit = (hash: string) => (
  <a href={`https://github.com/fernandorviana/alpenglow/commit/${hash}`}>
    <code>{hash}</code>
  </a>
);

type Zone = { zone: string; components: string; note: string };

const ZONES: Zone[] = [
  { zone: 'Navigation', components: 'SideNav', note: 'A sheet under the narrow query' },
  { zone: 'Top bar', components: 'TopBar, Button, Avatar', note: 'The day’s title, search, the account' },
  { zone: 'Day bar', components: 'Filters, Badge, Button', note: 'Filters that narrow both views' },
  { zone: 'Schedule', components: 'Scheduler, Field, Select, Avatar', note: 'A column per practitioner' },
  { zone: 'Appointments', components: 'Table, Badge, Button', note: 'The current row, selection, bulk actions' },
  { zone: 'Below 1280', components: 'Tabs', note: 'The schedule and the appointments as two views' },
  { zone: 'Details', components: 'Drawer, Badge, Button', note: 'The appointment that is current' },
  { zone: 'New appointment', components: 'Dialog, Field, Combobox, Select, DatePicker', note: 'The form, or a drag on an empty slot' },
  { zone: 'Commands', components: 'CommandPalette', note: '⌘K, the day’s people and actions' },
  { zone: 'Feedback', components: 'Toast', note: 'What changed, with Undo' },
  { zone: 'Other sections', components: 'EmptyState', note: 'Every section but Today' },
];

const zoneColumns = [
  { key: 'zone', header: 'Zone', cell: (r: Zone) => r.zone, primary: true },
  { key: 'components', header: 'Components', cell: (r: Zone) => r.components },
  { key: 'note', header: 'What it holds', cell: (r: Zone) => r.note },
];

export default function Page() {
  // Read from the source at build time, the same files the local-values test reads.
  const used = componentsUsed();
  const d = density;

  return (
    <DocPage>
      <h1>A scheduling day</h1>
      <p className="lead">Built only from Alpenglow, nothing drawn beside it.</p>

      <Frame count={used.length} />

      <h2>What it proves</h2>
      <ul>
        <li>
          The Scheduler and the Table on one state. The row current in the list is the card selected in the day,
          whichever side it was chosen on; the filters narrow both; a selection in the Table takes bulk actions; a drag
          in the day moves the appointment in both, and Undo puts it back.
        </li>
        <li>The form in a dialog: New appointment, or a drag on an empty slot, with a Field, a Combobox, a Select and a DatePicker.</li>
        <li>The empty state: every section but Today is an EmptyState with the way back.</li>
        <li>
          Density on every control, row, hour and nav item. Compact takes a control from {d.control.comfortable} to{' '}
          {d.control.compact}, a row from {d.row.comfortable} to {d.row.compact}, an hour from {d.hour.comfortable} to{' '}
          {d.hour.compact} and a nav item from {d['nav-item'].comfortable} to {d['nav-item'].compact}.
        </li>
        <li>
          Both modes, each pair measured in light and dark:
          <ul>
            {PAIRS.map((pair) => (
              <li key={pair.name}>
                {pair.name}, <code>{pair.fg}</code> on <code>{pair.bg}</code> —{' '}
                {MODES.map((mode) => (
                  <span key={mode}>
                    {mode} <Ratio fg={resolve(pair.fg, mode)} bg={resolve(pair.bg, mode)} threshold={pair.threshold} />{' '}
                  </span>
                ))}
              </li>
            ))}
          </ul>
        </li>
        <li>
          The targets in compact: controls {d.control.compact} and nav items {d['nav-item'].compact}, both over WCAG
          2.5.8&rsquo;s {TARGET_FLOOR}. A row&rsquo;s target is the button in its primary cell, the cell&rsquo;s
          width and a line, {textStyle['body/md'].lineHeight}, tall; it passes on the rule&rsquo;s spacing, each
          one {d.row.compact} from the next. Under a touch pointer compact gives the comfortable values back.
        </li>
      </ul>

      <h2>What moved up the list</h2>
      <p>What the screen could not be finished without, each with its commit.</p>
      <ul>
        <li>
          <strong>System density.</strong> Five tokens in two modes, compact on any element and comfortable again under
          touch ({commit('34ab2ad')}); controls with no size take <code>density/control</code> and an explicit size keeps
          its height ({commit('10aec6f')}); the Table&rsquo;s rows, the Scheduler&rsquo;s hour and the side
          navigations&rsquo; items follow it ({commit('455785e')}, the items sized from their icon in {commit('6423e2b')}).
        </li>
        <li>
          <strong>The Table&rsquo;s current row.</strong> The Scheduler selects one appointment and the Table has to show
          which row it is, apart from the multiple selection: <code>currentId</code>, <code>aria-current</code> and a ring
          ({commit('702370d')}), drawn in its final form as an inset outline on the row ({commit('6308409')}).
        </li>
        <li>
          <strong>The Link&rsquo;s new-tab announcement for an internal link.</strong> Open full screen is internal and
          opens a tab; the Link said so only for an external link, and now says it whenever it opens one (
          {commit('b6ac4ee')}).
        </li>
        <li>
          <strong>The Table&rsquo;s columns give way.</strong> It no longer becomes a list under 40rem: a column
          shrinks to its minimum and then leaves, the lowest priority first ({commit('8261f98')}); the row&rsquo;s
          actions gather into &ldquo;&#8943;&rdquo; before any column does ({commit('b31c046')}). The screen says which
          of its columns stay, confirms from the row, and drops the meta line it had added ({commit('3e5ccbb')}).
        </li>
        <li>
          <strong>The Button&rsquo;s icon-only form.</strong> Square, the icon alone, its name required (
          {commit('1fcabc3')}).
        </li>
      </ul>

      <h3>Found, and not fixed in the package</h3>
      <ul>
        <li>The Scheduler&rsquo;s column heads misalign with long names; the screen uses first names.</li>
        <li>The TopBar has no phone layout.</li>
        <li>In compact, a 30-minute card clips its time line.</li>
        <li>The bulk bar wraps in a narrow Table.</li>
        <li>Below 1280 the SideNav animates from 200 to 80 on load.</li>
        <li>At desktop the first paint is the Tabs layout until hydration: <code>useMediaQuery</code>&rsquo;s server snapshot.</li>
        <li>The SideNav&rsquo;s narrow query and the screen&rsquo;s own breakpoints are literals, waiting on breakpoints as tokens.</li>
      </ul>

      <h2>Composition</h2>
      <div className="specimen">
        <Table caption="Zones" captionVisible density="compact" columns={zoneColumns} rows={ZONES} getRowId={(r) => r.zone} />
      </div>
      <p>
        {used.length} package components, read from <code>app/screen/</code> at build time: {used.join(', ')}.
      </p>

      <p>
        Not checked: Safari, Firefox, a screen reader, a real touch device. The browser the screen was checked in
        emulates a mouse, so compact giving way to comfortable under a finger is held by a test on the stylesheet and
        has not been seen; nor was Esc on the New appointment dialog, which that browser&rsquo;s keys do not always
        reach.
      </p>
    </DocPage>
  );
}
