'use client';

import { DocPage } from '@ui/DocPage';
import { Button } from '@/components/Button/index';
import { DropdownMenu } from '@/components/DropdownMenu/index';
import type { DropdownMenuEntry } from '@/components/DropdownMenu/index';
import { composite, contrast, hexToRgb, resolve, rgbToHex, tokenContrast } from '@/tokens/contrast';
import { alphaPrimitives, primitives } from '@/tokens/primitives';

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
          <p>text/accent on its own fill</p>
          <p>
            {f(tokenContrast('text/accent', 'surface/accent-subtle', 'light'))}:1 light ·{' '}
            {f(tokenContrast('text/accent', 'surface/accent-subtle', 'dark'))}:1 dark
          </p>
          <p>on the neutral fill</p>
          <p>
            {f(tokenContrast('text/accent', 'interactive/neutral-hover', 'light'))}:1 light ·{' '}
            {f(tokenContrast('text/accent', 'interactive/neutral-hover', 'dark'))}:1 dark — rejected
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

      <h2>Why both words</h2>
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

      <div className="specimen">
        <DropdownMenu
          trigger={(props) => (
            <Button variant="outline" tone="neutral" {...props}>
              Appointment actions
            </Button>
          )}
          items={ITEMS}
        />
      </div>

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
          the accent label on a shared neutral fill is 4.23:1 there, below AA.
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
    </DocPage>
  );
}
