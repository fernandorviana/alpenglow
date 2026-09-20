'use client';

import { useState } from 'react';
import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { Alert, alertTones, ALERT_NARROW } from '@/components/Alert';
import type { AlertTone } from '@/components/Alert';
import { toast } from '@/components/Toast';
import { Button } from '@/components/Button';
import { Table } from '@/components/Table';
import { resolve } from '@/tokens/contrast';
import { radius, spacing } from '@/tokens/scale';
import { textStyle } from '@/tokens/typography';
import { theme } from '@/tokens/theme';
import type { Mode } from '@/tokens/theme';

const MODES: Mode[] = ['light', 'dark'];

const MESSAGES: Record<AlertTone, React.ReactNode> = {
  info: (
    <>
      Use the <strong>Markdown syntax</strong> for styling your email messages.
    </>
  ),
  success: (
    <>
      The invite was sent to <strong>leonor@example.com</strong>.
    </>
  ),
  warning: (
    <>
      This room is booked until <strong>15:00</strong>. The appointment will overlap.
    </>
  ),
  danger: (
    <>
      The calendar could not be reached. <strong>Nothing was saved.</strong>
    </>
  ),
};

type Measure = { part: string; value: string };
/** Read from the scale and the text styles, so the page cannot quote a number the stylesheet does not use. */
const MEASURES: Measure[] = [
  { part: 'Least height', value: String(spacing[700]) },
  { part: 'Padding', value: `${spacing[150]} block, ${spacing[200]} before, ${spacing[150]} after` },
  { part: 'Gap', value: String(spacing[100]) },
  { part: 'Radius', value: String(radius.xl) },
  { part: 'Text, Medium', value: `${textStyle['body/md'].size} / ${textStyle['body/md'].lineHeight}` },
  { part: 'Icon', value: String(spacing[250]) },
  { part: 'Action', value: `${spacing[400]} tall, ${spacing[200]} inline, a capsule` },
  { part: 'Close', value: `${spacing[400]} square, icon ${spacing[250]}` },
];

type Edge = { tone: AlertTone; light: string; dark: string };
const EDGES: Edge[] = alertTones.map((tone) => ({
  tone,
  light: theme[`border/${tone}-subtle`].light,
  dark: theme[`border/${tone}-subtle`].dark,
}));

type PropRow = { prop: string; type: string; default: string };
const PROPS: PropRow[] = [
  { prop: 'tone', type: "'info' | 'success' | 'warning' | 'danger'", default: "'info'" },
  { prop: 'children', type: 'ReactNode', default: 'required' },
  { prop: 'title', type: 'string', default: '—' },
  { prop: 'action', type: '{ label: string; onClick: () => void }', default: '—' },
  { prop: 'onClose', type: '() => void', default: '—' },
  { prop: 'closeLabel', type: 'string', default: "'Dismiss'" },
  { prop: 'announce', type: 'boolean', default: 'false' },
  { prop: 'className', type: 'string', default: '—' },
];

export default function Page() {
  const [closed, setClosed] = useState(false);

  return (
    <DocPage
      evidence={
        <>
          {alertTones.map((tone) => (
            <div key={tone}>
              <p>{tone}</p>
              {MODES.map((mode) => (
                <p key={mode}>
                  {mode} <Ratio fg={resolve(`text/${tone}`, mode)} bg={resolve(`surface/${tone}-subtle`, mode)} />
                </p>
              ))}
            </div>
          ))}
        </>
      }
    >
      <h1>Alert</h1>
      <p className="lead">
        A tinted line that stays in the page, beside the thing it is about, for as long as it
        is true.
      </p>

      <h2>Try it</h2>
      <div className="specimen" style={{ display: 'grid', gap: spacing[100] }}>
        <Alert tone="info" onClose={() => toast('The caller removes the alert; this one stays for the page')}>
          {MESSAGES.info}
        </Alert>
        <Alert tone="danger">{MESSAGES.danger}</Alert>
        <Alert tone="success" action={{ label: 'View invite', onClick: () => toast('Invite opened') }}>
          {MESSAGES.success}
        </Alert>
        <Alert
          tone="warning"
          title="Room conflict"
          action={{ label: 'Pick another', onClick: () => toast('Rooms opened') }}
          onClose={() => toast('Dismissed')}
        >
          {MESSAGES.warning}
        </Alert>
      </div>
      <p className="alias">
        The three drawn shapes — a close, nothing, one action — and a fourth that is not drawn:
        a title over the message, with both buttons.
      </p>

      <h2>Choosing an alert</h2>
      <p>
        An alert is about a place. It sits at the top of the form, the card or the page it
        concerns, and it stays while what it says is true: the trial ends in three days, the
        calendar is disconnected, these settings are managed by someone else. What has just
        happened and needs no place is a <a href="/toast">toast</a>. What is wrong with one
        field is the <a href="/input">Field&rsquo;s</a> own error. What must be decided before
        anything else is a <a href="/dialog">dialog</a>.
      </p>
      <p>
        It does not dismiss itself and it has no clock. <code>onClose</code> shows the close
        and tells the caller, who removes it; without it the alert stays until its cause is
        gone.
      </p>
      <div className="specimen">
        {closed ? (
          <Button variant="outline" tone="neutral" size="sm" onClick={() => setClosed(false)}>
            Bring it back
          </Button>
        ) : (
          <Alert tone="info" announce onClose={() => setClosed(true)}>
            This one is removed by the page when it is closed.
          </Alert>
        )}
      </div>

      <h2>Anatomy</h2>
      <div className="specimen">
        <Table
          caption="Alert geometry, in pixels"
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
        It is as wide as what holds it. A long message wraps and the alert grows downward,
        with the icon and the buttons kept to the first line. It asks its own container how
        wide it is, not the screen: under {ALERT_NARROW}, the action drops below the message and the
        close keeps the corner.
      </p>
      <div className="specimen">
        <div style={{ maxWidth: 320 }}>
          <Alert tone="warning" action={{ label: 'Pick another', onClick: () => {} }} onClose={() => {}}>
            {MESSAGES.warning}
          </Alert>
        </div>
      </div>

      <h2>Where it leaves the drawing</h2>
      <p>
        The drawing edges two of its states in the theme&rsquo;s strong status borders and two
        in a pale stop with no token, so two alerts have an outline and two almost none. Every
        edge is now soft, and four tokens were added for them, named after the surfaces they
        edge. In dark they are a stop stronger, as every border in the theme is.
      </p>
      <div className="specimen">
        <Table
          caption="The four edges, as aliases"
          density="compact"
          columns={[
            { key: 'tone', header: 'Token', primary: true, cell: (r: Edge) => <code>{`border/${r.tone}-subtle`}</code> },
            { key: 'light', header: 'Light', cell: (r: Edge) => <span className="alias">{r.light}</span> },
            { key: 'dark', header: 'Dark', cell: (r: Edge) => <span className="alias">{r.dark}</span> },
          ]}
          rows={EDGES}
          getRowId={(r) => r.tone}
        />
      </div>
      <p>
        The drawn action is filled with the state&rsquo;s colour. The theme has a fill for
        success and for danger and none for the other two, and white on the drawn info fill
        is about 3.4:1. So the action is an outline in the text&rsquo;s own colour, which
        already reads on the tint, with the theme&rsquo;s wash for hover. The fill returns when
        all four tones have one.
      </p>
      <p>
        The close is 32 with a 20 icon, the <a href="/toast">Toast&rsquo;s</a>, where the drawn
        one is 24: one close button across the system. In dark the alert keeps its tint, a
        surface step above a card, where the <a href="/badge">Badge</a> changes to an outline:
        that was chosen for a label 24 tall, and an alert is a panel whose tint is how it is
        found.
      </p>

      <h2>Accessibility</h2>
      <p>
        The tone is a colour and a shape, so it is also said: a screen reader hears
        &ldquo;Warning:&rdquo; before the message. An alert is not a live region unless asked.
        One that is in the page when it loads would otherwise be read out over the page; one
        that is inserted in answer to something takes <code>announce</code>, and then danger
        and warning interrupt as <code>alert</code> and the others wait as{' '}
        <code>status</code>. The action comes before the close in the tab order. The focus
        ring is the system&rsquo;s, and is 3:1 or more on all four tints in both modes.
      </p>

      <h2>Props</h2>
      <div className="specimen">
        <Table
          caption="Alert props"
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
