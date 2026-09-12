'use client';

import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { Button } from '@/components/Button/index';
import { Table } from '@/components/Table/index';
import { DropdownMenu } from '@/components/DropdownMenu/index';
import type { DropdownMenuEntry } from '@/components/DropdownMenu/index';
import { composite, contrast, hexToRgb, resolve, rgbToHex, tokenContrast } from '@/tokens/contrast';
import { alphaPrimitives, primitives } from '@/tokens/primitives';
import { radius, spacing } from '@/tokens/scale';

type PropRow = { prop: string; type: string; default: string };

const PROPS: PropRow[] = [
  { prop: 'trigger', type: '(props: DropdownMenuTriggerProps) => ReactNode', default: 'required' },
  { prop: 'items', type: 'DropdownMenuEntry[]', default: 'required' },
];

const ENTRY_PROPS: PropRow[] = [
  { prop: 'id', type: 'string', default: 'required' },
  { prop: 'label', type: 'ReactNode', default: 'required' },
  { prop: 'onSelect', type: '() => void', default: '—' },
  { prop: 'tone', type: "'neutral' | 'accent' | 'danger'", default: "'neutral'" },
  { prop: 'icon', type: 'ReactNode', default: '—' },
  { prop: 'iconEnd', type: 'ReactNode', default: '—' },
  { prop: 'disabled', type: 'boolean', default: 'false' },
  { prop: 'textValue', type: 'string', default: 'the label, when it is a string' },
];

const propColumns = [
  { key: 'prop', header: 'Prop', primary: true, cell: (r: PropRow) => <code>{r.prop}</code> },
  { key: 'type', header: 'Type', cell: (r: PropRow) => <span className="alias">{r.type}</span> },
  { key: 'default', header: 'Default', cell: (r: PropRow) => <span className="alias">{r.default}</span> },
];

/** The drawn geometry: a 40px row, a 20px icon slot. The paddings and radii come from the scale. */
const ROW = 40;
const ICON = 20;

const ITEMS: DropdownMenuEntry[] = [
  { id: 'edit', label: 'Edit appointment' },
  { id: 'reschedule', label: 'Reschedule' },
  { id: 'export', label: 'Export', disabled: true },
  'separator',
  { label: 'Patient record', items: [{ id: 'notes', label: 'Open notes' }] },
  'separator',
  { id: 'add', label: 'Add new', tone: 'accent' },
  { id: 'cancel', label: 'Cancel appointment', tone: 'danger' },
];

const f = (n: number) => n.toFixed(2);

/** A shadow's darkest point, measured against the ground it falls on. */
function shadowOn(name: 'alpha/black-08' | 'alpha/black-64', ground: string) {
  const { hex, alpha } = alphaPrimitives[name];
  return contrast(rgbToHex(composite(hexToRgb(hex), hexToRgb(ground), alpha)), ground);
}

export default function Page() {
  return (
    <DocPage
      evidence={
        <>
          <p>0 lines of positioning JS</p>
          <p>0 new dependencies</p>
          <p>accent label on its own hover</p>
          <p>
            light{' '}
            <Ratio fg={resolve('text/accent', 'light')} bg={resolve('surface/accent-subtle', 'light')} />
          </p>
          <p>
            dark <Ratio fg={resolve('text/accent', 'dark')} bg={resolve('surface/accent-subtle', 'dark')} />
          </p>
          <p>on the neutral wash, rule kept</p>
          <p>
            {f(tokenContrast('text/accent', 'interactive/wash-hover', 'light', 'surface/overlay'))}:1 light ·{' '}
            {f(tokenContrast('text/accent', 'interactive/wash-hover', 'dark', 'surface/overlay'))}:1 dark
          </p>
          <p>shadow against its ground</p>
          <p>
            {f(shadowOn('alpha/black-08', primitives.white))}:1 light at 8% ·{' '}
            {f(shadowOn('alpha/black-64', resolve('surface/base', 'dark')))}:1 dark at 64%
          </p>
          <p>disabled row, exempt</p>
          <p>
            {f(tokenContrast('text/disabled', 'surface/overlay', 'light'))}:1 light ·{' '}
            {f(tokenContrast('text/disabled', 'surface/overlay', 'dark'))}:1 dark
          </p>
        </>
      }
    >
      <h1>Dropdown menu</h1>
      <p className="lead">
        A list of commands, anchored to the control that opened it. The overlay is the
        browser&rsquo;s, not ours.
      </p>

      <h2>Try it</h2>
      <div className="specimen">
        <div className="specimenRow">
          <DropdownMenu
            trigger={(props) => (
              <Button variant="outline" tone="neutral" {...props}>
                Appointment actions
              </Button>
            )}
            items={ITEMS}
          />
          <span className="alias">
            Open it with a click, or with ↓ to land on the first row and ↑ to land on the last.
          </span>
        </div>
      </div>

      <h2>Choosing a menu</h2>
      <p>
        A menu runs a command. When the reader is choosing a value that stays in a field, it
        is a <a href="/select">Select</a>; when a row leads somewhere, it is navigation and
        wants links, not <code>role=&quot;menu&quot;</code>. A menu belongs on a control that
        holds more actions than a row or a header has room for — the trailing dots of a table
        row, the actions of a record — and not in place of a button the reader would press
        every time.
      </p>
      <p>
        Keep it to a handful of rows, grouped with a label when the groups mean something,
        with a separator only between groups. Labels start with the verb and name the object
        the way the page does: <em>Edit appointment</em>, <em>Reschedule</em>. The one command
        that creates takes the accent; the one that destroys takes danger and goes last, so a
        hand travelling down the list meets it after everything safe. A command that cannot run
        now stays in the list, disabled, so the reader learns it exists.
      </p>

      <h3>Why both words</h3>
      <p>
        The drawing calls this page Dropdown, and &ldquo;dropdown&rdquo; alone covers two
        components with different semantics: a list of commands, which is this one, and a list of
        values. Seven of the fifteen drawn variants belong to the second. Naming this one after
        the umbrella would leave the other one homeless. A single value from a fixed list is
        already a <a href="/select">Select</a>; a richer list of values would be a listbox, and is
        not built.
      </p>
      <p>
        &ldquo;Menu&rdquo; alone is no better. It is also what a site&rsquo;s navigation is
        called, and navigation menus are planned — a different pattern, where a link is followed
        rather than a command run, and for which <code>role=&quot;menu&quot;</code> is the wrong
        role. &ldquo;Dropdown menu&rdquo; names both halves: how it appears, and what it holds.
        It is also the name most libraries give this pattern, so a reader arriving from one of
        them finds it where they expect.
      </p>

      <h2>Anatomy</h2>
      <p>
        A surface of <code>surface/overlay</code> at {spacing[100]}px of padding and a{' '}
        {radius.xl}px corner, holding rows of {ROW}px with an {radius.lg}px corner, a{' '}
        {ICON}px icon slot at either end, group labels in the caption size, and hairline
        separators. The surface is as wide as its widest row and held at that width, so the
        menu is the same size open and closed. In dark it takes a hairline border, because
        the shadow has stopped separating it — see the margin.
      </p>

      <h2>The trade</h2>
      <p>
        The surface is a native <code>popover</code>, placed with CSS anchor positioning. That
        gives the top layer — so it escapes <code>overflow: hidden</code> and every stacking
        context without a portal — plus dismissal on Esc and on an outside click, and focus
        returning to the trigger. There is no positioning JavaScript to keep correct on scroll
        and on resize, and no new dependency. It is the same trade <a href="/select">Select</a>
        {' '}makes with the native <code>&lt;select&gt;</code>.
      </p>
      <p>
        The cost is stated rather than hidden: in a browser older than about 2025, the menu
        opens centred rather than anchored. It still dismisses, and it still takes the keyboard.
      </p>

      <h2>Keyboard</h2>
      <div className="tableScroll">
        <table className="tokens">
          <thead>
            <tr>
              <th>Key</th>
              <th>On the trigger</th>
              <th>In the menu</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="tokenName">Enter / Space</td>
              <td>open, focus the first row</td>
              <td>activate, close</td>
            </tr>
            <tr>
              <td className="tokenName">↓</td>
              <td>open, focus the first row</td>
              <td>next, wrapping</td>
            </tr>
            <tr>
              <td className="tokenName">↑</td>
              <td>open, focus the <strong>last</strong> row</td>
              <td>previous, wrapping</td>
            </tr>
            <tr>
              <td className="tokenName">Home / End</td>
              <td>—</td>
              <td>first / last</td>
            </tr>
            <tr>
              <td className="tokenName">a–z</td>
              <td>—</td>
              <td>typeahead on the first character</td>
            </tr>
            <tr>
              <td className="tokenName">Esc</td>
              <td>—</td>
              <td>close, focus returns to the trigger</td>
            </tr>
            <tr>
              <td className="tokenName">Tab</td>
              <td>—</td>
              <td>close, tabbing continues</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        <code>popover=&quot;auto&quot;</code> already provides Esc, the outside click and focus
        return. Four things remain the component&rsquo;s: landing on the first row when the menu
        opens, opening from the trigger with the arrows, the roving focus, and closing on Tab —
        which <code>popover</code> does not do and the APG menu pattern asks for.
      </p>

      <h2>The pointer moves focus</h2>
      <p>
        Entering a row with the pointer focuses it. Without that there are two highlights at
        once — the row under the pointer and the row the keyboard holds — and neither answers
        &ldquo;what happens if I press Enter now&rdquo;. With it there is exactly one highlighted
        row, and it is always the one that will be activated. The fill is drawn on{' '}
        <code>:focus</code> rather than <code>:hover</code> for the same reason.
      </p>

      <h2>Where it departs from the drawing</h2>
      <ol>
        <li>
          <code>surface/overlay</code> replaces <code>surface/raised</code>. The two are
          indistinguishable in light and one elevation step apart in dark, where raised would put
          the menu on the same step as the card beneath it.
        </li>
        <li>
          <code>radius/xl</code> and <code>radius/lg</code> replace the drawn <code>lg</code> and{' '}
          <code>md</code>. The two files&rsquo; radius names are off by one step; the numbers, 12
          and 8, are unchanged.
        </li>
        <li>
          The hover fill follows the row&rsquo;s tone instead of being <code>surface/base</code>{' '}
          for every row. <code>surface/base</code> is <em>darker</em> than the menu in dark, and
          the accent label on a shared opaque neutral fill was 3.50:1 there when the rule was
          made. The neutral row takes the wash now, on which the accent label would be 7.86:1,
          and the rule stays: each tone hovers to its own surface because that is the design.
        </li>
        <li>
          The danger row&rsquo;s hover border is dropped. It would reflow the row by 1px and be the
          only hover in the system that changes geometry; the fill alone is unambiguous.
        </li>
        <li>
          In dark the surface takes a 1px <code>border/default</code>, which is not drawn. There the
          shadow has stopped carrying elevation — see the gutter — and a border is the system&rsquo;s
          answer to running out of it.
        </li>
      </ol>
      <p>
        Two additions the drawing does not contain. A <strong>disabled row</strong>: it is not
        focusable, takes no hover and is skipped by every key, but keeps its role so a screen
        reader still finds it. And the <strong>dark elevation</strong>, which was never drawn and
        is a decision rather than a reading.
      </p>

      <h2>What the suite does not see</h2>
      <p>
        jsdom, which runs the test suite, implements none of the popover API. The suite stubs the
        calls the component makes and asserts everything the component decides: the roles and
        their wiring, the rows, every key, the disabled rows, and the stylesheet&rsquo;s choices of
        token. Esc, the outside click, focus return and placement belong to the browser, and all
        four were checked in Chrome.
      </p>
      <p>
        That check found one defect the suite could not. The rule removing the default outline
        sat inside the guarded fill, one attribute more specific than the keyboard ring, so the
        ring lost: a keyboard user saw a fill and no ring. jsdom computes no{' '}
        <code>:focus-visible</code>, so the suite passed. The stylesheet test now pins the order
        of the two rules instead.
      </p>
      <p>
        The top layer was worth that gap. A menu opens from inside other components — a row of
        actions in the <a href="/table">Table</a>, whose scroll container clips anything
        positioned inside it — and escaping that clip is the reason for an overlay to exist.
      </p>

      <h2>Accessibility</h2>
      <p>
        The trigger receives <code>aria-haspopup=&quot;menu&quot;</code> and{' '}
        <code>aria-expanded</code>, and its label is the accessible name of the menu — so it is
        named for what the menu holds, <em>Appointment actions</em>, not <em>More</em>. The rows
        are <code>menuitem</code>s inside a <code>menu</code>, one tab stop with roving focus,
        and a disabled row keeps its role with <code>aria-disabled</code> so a screen reader
        finds it rather than a hole.
      </p>
      <p>
        The highlighted row is the focused row, whichever way it got there, so there is one
        answer to what Enter does. The keyboard ring is drawn on top of the fill; a stylesheet
        test pins the order of the two rules, after a browser check found the ring losing on
        specificity.
      </p>

      <h2>Props</h2>
      <div className="specimen">
        <Table caption="DropdownMenu props" captionVisible density="compact" columns={propColumns} rows={PROPS} getRowId={(r) => r.prop} />
      </div>
      <p>
        An entry is an action, a group — <code>{'{ label, items }'}</code> — or the string{' '}
        <code>&apos;separator&apos;</code>. An action:
      </p>
      <div className="specimen">
        <Table caption="Action props" captionVisible density="compact" columns={propColumns} rows={ENTRY_PROPS} getRowId={(r) => r.prop} />
      </div>
      <p className="alias" style={{ marginTop: 8 }}>
        Spread the trigger props onto a button; they carry the id, the popover target, the two
        aria attributes, the key handler and the anchor.
      </p>
    </DocPage>
  );
}
