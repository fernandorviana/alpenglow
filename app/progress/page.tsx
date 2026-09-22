'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { Document } from '@carbon/icons-react';
import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { CodeBlock } from '@ui/CodeBlock';
import { Button } from '@/components/Button';
import { Card, CardBody } from '@/components/Card';
import { Progress, progressTones } from '@/components/Progress';
import { Table } from '@/components/Table';
import { resolve } from '@/tokens/contrast';
import { spacing } from '@/tokens/scale';
import type { Mode, ThemeTokenName } from '@/tokens/theme';

const MODES: Mode[] = ['light', 'dark'];

const FILLS: ReadonlyArray<{ name: string; fg: ThemeTokenName }> = [
  { name: 'accent', fg: 'interactive/accent' },
  { name: 'neutral', fg: 'text/secondary' },
  { name: 'success', fg: 'text/success' },
  { name: 'danger', fg: 'text/danger' },
];

const USAGE = `import { Progress } from 'alpenglow';

// How far along, with the value in words.
<Progress label="Uploading xray31rt.pdf" value={bytesSent} max={bytes} showValue />

// Steps, said as steps.
<Progress label="Setting up" value={3} max={5} showValue valueText="3 of 5" />

// Not known how far: a band that crosses.
<Progress label="Importing" />

// Done, and failed.
<Progress label="Uploaded" value={100} tone="success" />
<Progress label="Upload failed" value={60} tone="danger" />

// Along the page's top edge: the label hidden, the corners square, the fill
// composed from two tokens. The caller pins it.
const onboarding = {
  '--progress-radius': 0,
  '--progress-fill': 'linear-gradient(90deg, var(--ap-color-text-info), var(--ap-color-interactive-accent))',
} as CSSProperties;

<Progress label="Onboarding" value={step} max={steps} hideLabel style={onboarding} />`;

type Choice = { when: string; use: string };
const CHOICES: Choice[] = [
  {
    when: 'How far along it is can be said: bytes sent, steps taken',
    use: 'Progress',
  },
  {
    when: 'Something is working and how far is not known, but it will end',
    use: 'Progress, with no value',
  },
  {
    when: 'Something is working and it is small: a button, a search',
    use: 'Loader',
  },
  {
    when: 'The layout of what is coming is known: a card, a row, a record',
    use: 'Skeleton',
  },
];

type PropRow = { prop: string; type: string; default: string };
const PROPS: PropRow[] = [
  { prop: 'label', type: 'string', default: 'required' },
  { prop: 'hideLabel', type: 'boolean', default: 'false' },
  { prop: 'value', type: 'number', default: '— (indeterminate)' },
  { prop: 'max', type: 'number', default: '100' },
  { prop: 'showValue', type: 'boolean', default: 'false' },
  { prop: 'valueText', type: 'string — "3 of 5"', default: 'a percentage' },
  { prop: 'size', type: "'sm' | 'md'", default: "'sm'" },
  {
    prop: 'tone',
    type: progressTones.map((t) => `'${t}'`).join(' | '),
    default: "'accent'",
  },
  { prop: 'className, style', type: '', default: '—' },
];

const propColumns = [
  {
    key: 'prop',
    header: 'Prop',
    primary: true,
    cell: (r: PropRow) => <code>{r.prop}</code>,
  },
  {
    key: 'type',
    header: 'Type',
    cell: (r: PropRow) => <span className="alias">{r.type}</span>,
  },
  {
    key: 'default',
    header: 'Default',
    cell: (r: PropRow) => <span className="alias">{r.default}</span>,
  },
];

const ONBOARDING = {
  '--progress-radius': 0,
  '--progress-fill': 'linear-gradient(90deg, var(--ap-color-text-info), var(--ap-color-interactive-accent))',
} as CSSProperties;

const STEPS = ['About you', 'Your business', 'Your calendar', 'Your team', 'Done'];

export default function Page() {
  const [sent, setSent] = useState<number | null>(null);
  const [step, setStep] = useState(1);
  const uploading = sent !== null && sent < 100;

  useEffect(() => {
    if (!uploading) return;
    const timer = setInterval(() => setSent((s) => Math.min(100, (s ?? 0) + 7)), 200);
    return () => clearInterval(timer);
  }, [uploading]);

  return (
    <DocPage
      evidence={
        <>
          {FILLS.map((fill) => (
            <div key={fill.name}>
              <p>{fill.name}, the fill on the page</p>
              {MODES.map((mode) => (
                <p key={mode}>
                  {mode} <Ratio fg={resolve(fill.fg, mode)} bg={resolve('surface/base', mode)} threshold={3} />
                </p>
              ))}
            </div>
          ))}
        </>
      }
    >
      <h1>Progress</h1>
      <p className="lead">How far along something is, or that it is working and will end.</p>

      <h2>Try it</h2>
      <div className="specimen">
        <div style={{ display: 'grid', gap: spacing[200], maxWidth: 420 }}>
          <Progress
            label={sent === 100 ? 'Uploaded xray31rt.pdf' : 'Uploading xray31rt.pdf'}
            value={sent ?? 0}
            showValue
            tone={sent === 100 ? 'success' : 'accent'}
          />
          <div className="specimenRow">
            <Button size="sm" onClick={() => setSent(0)} disabled={uploading}>
              {sent === 100 ? 'Upload again' : 'Upload'}
            </Button>
            <Button size="sm" variant="ghost" tone="neutral" onClick={() => setSent(null)}>
              Reset
            </Button>
          </div>
        </div>
      </div>
      <p>
        A change of value travels over the motion token, so a jump from 20 to 60 slides rather than snaps. The element
        is the native <code>progress</code>: the name, the value and the state are the platform&rsquo;s, and what a
        screen reader is told changes with the bar.
      </p>

      <h2>Label and value</h2>
      <div className="specimen">
        <div style={{ display: 'grid', gap: spacing[300], maxWidth: 420 }}>
          <Progress label="Uploading xray31rt.pdf" value={45} showValue />
          <Progress label="Setting up your calendar" value={3} max={5} showValue valueText="3 of 5" />
          <Progress label="Uploading xray31rt.pdf" value={45} hideLabel showValue />
          <Progress label="Uploading xray31rt.pdf" value={45} hideLabel />
        </div>
      </div>
      <p>
        <code>label</code> is required: it is the element&rsquo;s name, visible unless <code>hideLabel</code>, as under
        a file whose name is already the line above. <code>showValue</code> puts the value at the end of the
        label&rsquo;s line, a percentage unless <code>valueText</code> says otherwise; <code>valueText</code> is also
        what a screen reader is told, so what is seen is what is said.
      </p>

      <h2>Sizes and tones</h2>
      <div className="specimen">
        <div style={{ display: 'grid', gap: spacing[300], maxWidth: 420 }}>
          <Progress label="sm, 4 — as drawn" value={60} showValue />
          <Progress label="md, 8 — a bar that is the page’s subject" value={60} size="md" showValue />
          <Progress label="Uploaded" value={100} tone="success" showValue />
          <Progress label="Upload failed" value={60} tone="danger" showValue valueText="Failed at 60%" />
          <Progress label="Archived" value={60} tone="neutral" showValue />
        </div>
      </div>
      <p>
        The tones are the Loader&rsquo;s: one vocabulary for what is working. <code>success</code> is done and{' '}
        <code>danger</code> is failed; the fill is held to 3:1 against every surface it can stand on, in both modes. The
        track is the pressed wash, as the Skeleton&rsquo;s fill: <code>surface/sunken</code> is the page in dark, where
        the wash lies over any surface.
      </p>

      <h2>Not known how far</h2>
      <div className="specimen">
        <div style={{ maxWidth: 420 }}>
          <Progress label="Importing appointments" />
        </div>
      </div>
      <p>
        Without a <code>value</code> a band crosses the track, in its own loop. Reduced motion holds it at the centre
        and lets it breathe: the travel is the movement the preference is about, and a still bar says nothing is
        happening.
      </p>

      <h2>Where it stands</h2>
      <div className="specimen">
        <div style={{ maxWidth: 240 }}>
          <Card>
            <CardBody>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[150],
                }}
              >
                <Document
                  size={32}
                  aria-hidden="true"
                  style={{
                    flex: 'none',
                    color: 'var(--ap-color-text-secondary)',
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'grid',
                    gap: spacing[100],
                  }}
                >
                  <span
                    style={{
                      fontWeight: 'var(--ap-font-weight-semibold)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Justin - xray31rt.pdf
                  </span>
                  <Progress label="Uploading Justin - xray31rt.pdf" value={22} hideLabel />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
      <p>
        Drawn under a file being uploaded: the name is the line above, so the label is hidden and the bar is the whole
        width of the words. It is a plain 4 with no value; the card says what is happening.
      </p>

      <div className="specimen">
        <div
          style={{
            overflow: 'hidden',
            borderRadius: 'var(--ap-radius-lg)',
            border: 'var(--ap-border-width-hairline) solid var(--ap-color-border-subtle)',
            background: 'var(--ap-color-surface-raised)',
          }}
        >
          <Progress label="Onboarding" value={step} max={STEPS.length} hideLabel style={ONBOARDING} />
          <div
            style={{
              display: 'grid',
              gap: spacing[200],
              padding: spacing[300],
            }}
          >
            <p style={{ margin: 0 }}>
              Step {step} of {STEPS.length}: {STEPS[step - 1]}
            </p>
            <div className="specimenRow">
              <Button
                size="sm"
                variant="outline"
                tone="neutral"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
              >
                Back
              </Button>
              <Button
                size="sm"
                onClick={() => setStep((s) => Math.min(STEPS.length, s + 1))}
                disabled={step === STEPS.length}
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      </div>
      <p>
        Drawn along the top edge of the onboarding, where the fill runs from cyan into the accent. That is not
        decoration (Fernando, 2026-09-22): the colour shifting as the bar grows says how close to the end you are. The
        theme has no gradient token, so the component ships none; the fill is <code>--progress-fill</code>, an image the
        caller composes from two tokens, here <code>text/info</code> into <code>interactive/accent</code>, and{' '}
        <code>--progress-radius</code> is 0 for a bar that is the page&rsquo;s edge. The caller pins it.
      </p>

      <h2>Which one</h2>
      <div className="specimen">
        <Table
          caption="Progress, Loader or Skeleton"
          density="compact"
          columns={[
            {
              key: 'when',
              header: 'When',
              primary: true,
              cell: (r: Choice) => r.when,
            },
            {
              key: 'use',
              header: 'Use',
              cell: (r: Choice) => <span className="alias">{r.use}</span>,
            },
          ]}
          rows={CHOICES}
          getRowId={(r) => r.when}
        />
      </div>

      <h2>Accessibility</h2>
      <p>
        A <code>progressbar</code> named by its label, with <code>aria-valuetext</code> when the value has words. The
        bar is not a live region: a reader who asks is told where it is, and one who does not is not interrupted at
        every percent. When it finishes, the caller says so, in a Toast or by what appears. The fill is a graphical
        object held to 3:1; the track is decoration, as the Loader&rsquo;s.
      </p>

      <h2>Using it</h2>
      <CodeBlock code={USAGE} lang="tsx" />
      <div className="specimen">
        <Table
          caption="Progress props"
          captionVisible
          density="compact"
          columns={propColumns}
          rows={PROPS}
          getRowId={(r) => r.prop}
        />
      </div>
    </DocPage>
  );
}
