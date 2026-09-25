'use client';

import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { TypeText } from '@ui/TypeText';
import { Calendar, Copy, Search } from '@carbon/icons-react';
import { Tooltip, TOOLTIP_CLOSE_DELAY, TOOLTIP_OPEN_DELAY } from '@/components/Tooltip';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { Table } from '@/components/Table';
import { UserVerified } from '@/icons';
import { resolve } from '@/tokens/contrast';
import { radius, spacing } from '@/tokens/scale';
import { textStyle } from '@/tokens/typography';
import type { Mode, ThemeTokenName } from '@/tokens/theme';

const MODES: Mode[] = ['light', 'dark'];

const PAIRS: ReadonlyArray<{ name: string; fg: ThemeTokenName; bg: ThemeTokenName }> = [
  { name: 'text', fg: 'text/primary', bg: 'surface/overlay' },
  { name: 'description', fg: 'text/tertiary', bg: 'surface/overlay' },
  { name: 'shortcut', fg: 'text/secondary', bg: 'surface/sunken' },
];

/** The drawn tooltip's two lines: an icon, 8, a sentence; 8 between the lines. */
function Line({ icon, accent = false, children }: { icon: React.ReactNode; accent?: boolean; children: React.ReactNode }) {
  const colour = accent ? 'var(--ap-color-text-accent)' : 'var(--ap-color-text-tertiary)';
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: spacing[100] }}>
      <span aria-hidden="true" style={{ display: 'inline-flex', color: colour }}>
        {icon}
      </span>
      {children}
    </span>
  );
}

const VERIFIED = (
  <span style={{ display: 'grid', gap: spacing[100] }}>
    <Line accent icon={<UserVerified size={24} />}>
      This account is verified.
    </Line>
    <Line icon={<Calendar size={24} />}>Verified since June 17, 2023.</Line>
  </span>
);

const TAGS = (
  <span style={{ display: 'flex', flexWrap: 'wrap', gap: `${spacing[100]}px ${spacing['050']}px` }}>
    <Badge tone="info">Follow-up</Badge>
    <Badge tone="accent">First visit</Badge>
    <Badge tone="success">Insured</Badge>
    <Badge tone="warning">Needs interpreter</Badge>
  </span>
);

type Measure = { part: string; md: string; sm: string };
const type = (name: keyof typeof textStyle) => `${textStyle[name].size} / ${textStyle[name].lineHeight}`;

/** Read from the scale and the text styles, so the page cannot quote a number the stylesheet does not use. */
const MEASURES: Measure[] = [
  { part: 'Padding', md: String(spacing[250]), sm: `${spacing['075']} block, ${spacing[150]} inline` },
  { part: 'Radius', md: String(radius.xl), sm: String(radius.lg) },
  { part: 'Text, Medium', md: type('body/md'), sm: type('caption/md') },
  { part: 'Description', md: `${type('caption/md')}, ${spacing[200]} above`, sm: '—' },
  { part: 'Widest', md: '266', sm: '240' },
  { part: 'From the trigger', md: String(spacing[100]), sm: String(spacing[100]) },
];

type Rule = { asks: string; does: string };
const RULES: Rule[] = [
  { asks: 'Hoverable', does: `The pointer can move from the trigger onto the tooltip. It has ${TOOLTIP_CLOSE_DELAY}ms to cross the ${spacing[100]}px between them.` },
  { asks: 'Dismissible', does: 'Esc closes it, and neither the pointer nor the focus has to move.' },
  { asks: 'Persistent', does: 'It stays until the pointer or the focus leaves, Esc, or a press of the trigger. It never times out.' },
];

type PropRow = { prop: string; type: string; default: string };
const PROPS: PropRow[] = [
  { prop: 'content', type: 'ReactNode', default: 'required' },
  { prop: 'children', type: 'ReactElement', default: 'required' },
  { prop: 'description', type: 'string', default: '—' },
  { prop: 'shortcut', type: 'string', default: '—' },
  { prop: 'size', type: "'sm' | 'md'", default: "'sm' for a string, else 'md'" },
  { prop: 'placement', type: "'top' | 'bottom' | 'start' | 'end'", default: "'top'" },
  { prop: 'purpose', type: "'describe' | 'label'", default: "'describe'" },
  { prop: 'className', type: 'string', default: '—' },
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
      <h1>Tooltip</h1>
      <p className="lead">
        A few words about the thing under the pointer or the focus. It says, and it never
        asks: nothing inside a tooltip can be clicked.
      </p>

      <h2>Try it</h2>
      <div className="specimen">
        <div className="specimenRow">
          <Tooltip content="Copy link" purpose="label">
            <Button variant="ghost" tone="neutral" size="sm" iconStart={<Copy size={16} />} />
          </Tooltip>
          <Tooltip content="Search" shortcut="⌘K" purpose="label">
            <Button variant="ghost" tone="neutral" size="sm" iconStart={<Search size={16} />} />
          </Tooltip>
          <Tooltip
            content={VERIFIED}
            description="Patients with this badge have been authenticated with a verified email."
            placement="bottom"
          >
            <Button variant="outline" tone="neutral" size="sm" iconStart={<UserVerified size={16} />}>
              Leonor Viana
            </Button>
          </Tooltip>
          <Tooltip content={TAGS} placement="bottom">
            <Button variant="ghost" tone="neutral" size="sm">
              4 tags
            </Button>
          </Tooltip>
        </div>
      </div>
      <p className="alias">
        Rest the pointer on a button, or Tab to it. Move onto the tooltip and it stays; press
        Esc and it goes, with the focus left where it was.
      </p>

      <h2>Choosing a tooltip</h2>
      <p>
        A tooltip is for what helps and can be done without: the name of an icon, a
        shortcut, the reason behind a badge. It cannot be reached by touch, so whatever a
        reader needs in order to go on belongs on the page, as the{' '}
        <a href="/input">Field&rsquo;s</a> description or an inline message. It opens on
        hover and on focus, so its trigger has to be something the keyboard can reach.
      </p>
      <p>
        That rules out a disabled button. The pointer would still find the tooltip, and the
        keyboard never could: a disabled control takes no focus. The reason something cannot
        be done yet belongs beside it, in words everyone gets.
      </p>
      <p>
        If anything inside has to be pressed — a link, a button, a field — it is not a
        tooltip. That is a popover, opened by a click, and it is the next thing to be built
        on this same surface. And a tooltip is never the place for an error: errors stay
        where the reader is looking.
      </p>

      <h2>Two sizes, one surface</h2>
      <div className="specimen">
        <Table
          caption="Tooltip geometry, in pixels"
          density="compact"
          columns={[
            { key: 'part', header: 'Part', primary: true, cell: (r: Measure) => r.part },
            { key: 'md', header: 'md — drawn', cell: (r: Measure) => <span className="alias">{r.md}</span> },
            { key: 'sm', header: 'sm', cell: (r: Measure) => <span className="alias">{r.sm}</span> },
          ]}
          rows={MEASURES}
          getRowId={(r) => r.part}
        />
      </div>
      <p>
        <code>md</code> is the card as drawn, for an explanation: lines with an icon, and a
        quieter paragraph beneath. <code>sm</code> was added for the word or two on an icon
        button, where 20 of padding is too much. Both are the overlay surface with the same
        edge and the same shadow. Left to itself, a string is <code>sm</code> and anything
        richer is <code>md</code>.
      </p>

      <h2>Where it leaves the drawing</h2>
      <p>
        Most systems draw the tooltip on an inverse surface, dark on a light page. This one
        is drawn on the overlay surface, the menu&rsquo;s, and stays there: what tells a
        tooltip from a menu is that it holds nothing to press, not its colour.
      </p>
      <p>
        The drawn edge is a grey between two of the theme&rsquo;s border tokens. The
        stronger of the two was tried and is too strong for a panel that already has a
        shadow, so the tooltip takes the subtle one until the border tokens between them
        exist. Dark was not drawn: it is the overlay surface, a step above a card, with the
        same edge rather than the stronger one the <a href="/dropdown-menu">menu</a> takes.
      </p>
      <p>
        There is no arrow. The panel flips to the other side when it does not fit, and the
        stylesheet cannot yet know which way it went, so an arrow would point the wrong way
        exactly when it mattered.
      </p>

      <h2>Accessibility</h2>
      <p>
        The tooltip describes its trigger through <code>aria-describedby</code>, added to
        whatever description the trigger already has. For a button that shows only an icon,{' '}
        <code>purpose=&quot;label&quot;</code> makes the tooltip the button&rsquo;s name
        instead. It opens at once on keyboard focus and after {TOOLTIP_OPEN_DELAY}ms under
        the pointer, so a pointer crossing the page leaves no trail. A focus that came from
        a click does not open it.
      </p>
      <div className="specimen">
        <Table
          caption="WCAG 1.4.13, content on hover or focus"
          density="compact"
          columns={[
            { key: 'asks', header: 'It must be', primary: true, cell: (r: Rule) => r.asks },
            { key: 'does', header: 'So', cell: (r: Rule) => r.does },
          ]}
          rows={RULES}
          getRowId={(r) => r.asks}
        />
      </div>
      <p>
        It is a manual popover in the top layer, placed by CSS anchor positioning: no
        z-index, no portal, and an open menu or date picker stays open beneath it. In a
        browser without anchor positioning it is not shown at all, rather than shown in the
        middle of the screen; its words still reach a screen reader. The trigger is
        wrapped in an inline box that does not stretch, so a full-width trigger needs{' '}
        <code>className</code> on the Tooltip to fill its row.
      </p>

      <h2>Props</h2>
      <div className="specimen">
        <Table
          caption="Tooltip props"
          density="compact"
          columns={[
            { key: 'prop', header: 'Prop', primary: true, cell: (r: PropRow) => <code>{r.prop}</code> },
            { key: 'type', header: 'Type', cell: (r: PropRow) => <span className="alias"><TypeText>{r.type}</TypeText></span> },
            { key: 'default', header: 'Default', cell: (r: PropRow) => <span className="alias">{r.default}</span> },
          ]}
          rows={PROPS}
          getRowId={(r) => r.prop}
        />
      </div>
    </DocPage>
  );
}
