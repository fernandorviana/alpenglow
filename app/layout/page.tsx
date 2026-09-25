import { DocPage } from '@ui/DocPage';
import { CodeBlock } from '@ui/CodeBlock';
import { Table } from '@/components/Table';
import type { Column } from '@/components/Table';
import { breakpoint, minViewport, spacing } from '@/tokens/scale';
import type { BreakpointName } from '@/tokens/scale';
import { layout, layoutModes, layoutModeStart } from '@/tokens/layout';
import type { LayoutTokenName } from '@/tokens/layout';

/**
 * The Layout page: the breakpoint scale and who reads each step, how to use
 * it where a media query cannot read a variable, the rule for a layout of
 * one's own, the viewport and the container, margin and gap with the pane
 * model, and a paragraph on layering.
 */

const READERS: Record<BreakpointName, string> = {
  xs: 'Below it, a phone: the Toast full width, the CommandPalette’s description under the label, the site’s specimens edge to edge',
  sm: 'No reader yet — Tailwind’s step, kept so sm: means the same everywhere',
  md: 'Below it, the SideNav is a sheet and the site’s bar is narrow; the Tailwind default, 768',
  lg: 'Margin 24 and gap 20 from here; the screen’s navigation leaves its sheet',
  xl: 'Margin 40 from here; two panes side by side; the site’s evidence column',
  '2xl': 'No component reader; the site’s wide page, with the section list beside the prose',
};

type BreakpointRow = { name: BreakpointName; px: number };
const BREAKPOINT_ROWS: BreakpointRow[] = (Object.entries(breakpoint) as [BreakpointName, number][]).map(([name, px]) => ({ name, px }));
/**
 * A header keeps to one line and truncates, so each column's minimum holds
 * its header with the cell's 24 (`DocTables.test.tsx` has the measures):
 * "What turns there" is 126, and at its default 96 it read "WHAT TURNS T…"
 * at 768.
 */
const BREAKPOINT_COLUMNS: Column<BreakpointRow>[] = [
  { key: 'name', header: 'Name', primary: true, cell: (r) => <span className="tokenName">{r.name}</span> },
  { key: 'rem', header: 'rem', align: 'end', cell: (r) => `${r.px / 16}rem` },
  { key: 'px', header: 'px', align: 'end', cell: (r) => `${r.px}px` },
  { key: 'reads', header: 'What turns there', minWidth: spacing[1300], cell: (r) => READERS[r.name] },
];

const MODE_LABEL = { narrow: 'Narrow', medium: 'Medium', wide: 'Wide' } as const;
const since = (m: (typeof layoutModes)[number]) => {
  const start = layoutModeStart[m];
  return start
    ? `from ${start}, ${breakpoint[start]}`
    : `below ${layoutModeStart.medium}, ${breakpoint[layoutModeStart.medium]}`;
};

type LayoutRow = { name: LayoutTokenName };
const LAYOUT_ROWS: LayoutRow[] = (Object.keys(layout) as LayoutTokenName[]).map((name) => ({ name }));
/**
 * Each mode's header on two lines, the mode over where it starts: on one,
 * "Narrow (below lg, 1024)" is 168 and read "NARROW (BEL…" in its 96 column
 * at every width, and a column that held it whole could not sit beside the
 * token at 320. On two the widest line is 109, so each needs 133 with the
 * cell's 24, and the token 121 — `layout/margin` is 97 — which the scale's
 * 128 holds. A mode takes 136, which is on no scale: 128 cuts its header,
 * and 160 puts the token and Narrow at 290 in a phone's 288 and Wide out of
 * the 606 at 768. So the token and Narrow, a phone's own value, sit side by
 * side at 320, and all three modes at 768. Where is a sentence: at its
 * default 96 it took the smallest share and ran to seven lines; at 128 it
 * still sits beside the modes in the 690 the table has on the wide page,
 * and from 1024.
 */
const LAYOUT_COLUMNS: Column<LayoutRow>[] = [
  {
    key: 'token',
    header: 'Token',
    primary: true,
    minWidth: spacing[1200],
    cell: (r) => <span className="tokenName">layout/{r.name}</span>,
  },
  ...layoutModes.map(
    (m): Column<LayoutRow> => ({
      key: m,
      header: (
        <>
          {MODE_LABEL[m]}
          <br />({since(m)})
        </>
      ),
      align: 'end',
      minWidth: 136,
      cell: (r) => `${layout[r.name][m]}px`,
    }),
  ),
  { key: 'use', header: 'Where', minWidth: spacing[1200], cell: (r) => layout[r.name].use },
];

export default function LayoutPage() {
  return (
    <DocPage
      evidence={
        <>
          <p>{Object.keys(breakpoint).length} breakpoints, floor {minViewport}</p>
          {(Object.entries(breakpoint) as [BreakpointName, number][]).map(([name, px]) => (
            <p key={name}>
              {name} {px} · {px / 16}rem
            </p>
          ))}
          {(Object.keys(layout) as LayoutTokenName[]).map((name) => (
            <p key={name}>
              layout/{name} {layoutModes.map((m) => layout[name][m]).join(' / ')}
            </p>
          ))}
        </>
      }
    >
      <h1>Breakpoints and layout</h1>
      <p className="lead">
        Six breakpoints — Tailwind&rsquo;s five and one below them — and two layout tokens that step with them. The
        navigation is outside the layout; the content beside it is not.
      </p>

      <h2>The scale</h2>
      <div className="specimen">
        <Table
          caption="Breakpoints"
          captionVisible
          density="compact"
          columns={BREAKPOINT_COLUMNS}
          rows={BREAKPOINT_ROWS}
          getRowId={(r) => r.name}
        />
      </div>
      <p>
        {minViewport}px is the floor, not a breakpoint: the narrowest width the system is built and tested at, WCAG
        1.4.10&rsquo;s reflow. Every step is in rem, so a reader who sets a larger default font size gets the narrower
        layout sooner.
      </p>

      <h2>Using it</h2>
      <p>
        A media query cannot read a custom property, so the tokens reach each place in its own form. In CSS, write the
        query in rem and range syntax; in React, take it from <code>media</code>; in Tailwind, <code>xs:</code> exists and
        the other five are Tailwind&rsquo;s own.
      </p>
      <CodeBlock lang="css" code={`@media (width < 48rem) { … }   /* below md */\n@media (width >= 80rem) { … }  /* xl and up */`} />
      <CodeBlock
        lang="tsx"
        code={`import { media } from 'alpenglow';\nconst narrow = useMediaQuery(media.down.md); // the app's own hook, or any`}
      />
      <p>
        <code>--ap-breakpoint-*</code> in <code>tokens.css</code> are for JavaScript and for reading. A test fails on any
        width in a media query outside the scale.
      </p>

      <h2>A layout of your own</h2>
      <p>
        Measure where the content breaks, then round to the safe step. This site&rsquo;s wide page needs 1108 of page
        between the margins to hold a Table specimen beside the section list — 1500 of viewport, once the rail, the
        drawer and the margins are out — so it starts at <code>2xl</code>, 1536; its evidence column needs the
        prose beside it to keep 704, which it does from <code>xl</code>. The tests hold the inequality, not the number.
      </p>

      <h2>The viewport and the container</h2>
      <p>
        The viewport decides the chrome and the page&rsquo;s composition: where the SideNav becomes a sheet, when two
        panes sit side by side. A component that answers its own space answers its container — the Alert stacks its
        actions under 400px of its own width in any screen — and a container query is not a breakpoint.
      </p>

      <h2>Margin and gap</h2>
      <div className="specimen">
        <Table
          caption="Layout tokens"
          captionVisible
          density="compact"
          columns={LAYOUT_COLUMNS}
          rows={LAYOUT_ROWS}
          getRowId={(r) => r.name}
        />
      </div>
      <p>
        The margin is the space around the content region, from the navigation&rsquo;s edge, the window&rsquo;s and the
        TopBar alike; the TopBar pads its sides by it, so its start and end line up with the content. The gap is between
        panes and between the columns of a composition. Below <code>xl</code> the content is one pane, two behind Tabs;
        from <code>xl</code> two sit side by side. There is no 12-column grid in code: the Scheduler and the Table size
        themselves. In Figma the <code>Alpenglow Layout</code> collection has the three modes, and a 12-column grid style
        is bound to it as a guide. The package&rsquo;s default keeps the SideNav a rail down to <code>md</code>; beside a
        Scheduler, pass it <code>narrow={'{media.down.lg}'}</code> instead, so a tablet gets the whole 736 rather than
        sharing it with the rail.
      </p>
      <figure className="layoutModes" aria-label="The pane model in the dense screen’s three modes">
        {layoutModes.map((m) => (
          <div key={m} className="layoutMode" data-mode={m}>
            <span className="layoutNav" aria-hidden="true" />
            <span className="layoutContent" aria-hidden="true">
              <span className="layoutPane" />
              {m === 'wide' && <span className="layoutPane" />}
            </span>
            <span className="layoutCaption">
              {MODE_LABEL[m]} — margin {layout.margin[m]}, gap {layout.gap[m]}
            </span>
          </div>
        ))}
      </figure>

      <h2>Layering</h2>
      <p>
        Alpenglow ships <a href="/decisions#no-z-index-tokens">no z-index tokens</a>. What floats goes to the top
        layer; what stacks inside a component stays in its own <code>isolation: isolate</code>, at 3 or under. The
        page&rsquo;s stack is the product&rsquo;s: a sticky bar at <code>z-index: 1</code> sits over everything the
        package draws.
      </p>

      <h2>Not checked</h2>
      <p>Safari, Firefox, a real touch device, and text zoom beyond the browser&rsquo;s default font size.</p>
    </DocPage>
  );
}
