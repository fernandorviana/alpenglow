'use client';

import { useState } from 'react';
import { DocPage } from '@ui/DocPage';
import { CodeBlock } from '@ui/CodeBlock';
import { TypeText } from '@ui/TypeText';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card, CardBody, CardTitle } from '@/components/Card';
import { Skeleton } from '@/components/Skeleton';
import { Table } from '@/components/Table';
import { spacing } from '@/tokens/scale';

const USAGE = `import { Skeleton } from 'alpenglow';

// The region that is loading says so; the shapes say nothing.
<section aria-label="Patient" aria-busy={loading}>
  {loading ? (
    <>
      <Skeleton variant="circle" size={40} />
      <h3><Skeleton width="50%" /></h3>
      <p><Skeleton lines={3} /></p>
    </>
  ) : (
    <Patient … />
  )}
</section>`;

type Choice = { when: string; use: string };
const CHOICES: Choice[] = [
  { when: 'The layout of what is coming is known: a card, a row, a record', use: 'Skeleton' },
  { when: 'Something is working and its shape is not known, or is small: a button, a search', use: 'Loader' },
  { when: 'How far along it is can be said', use: 'Progress' },
  { when: 'It takes under a third of a second', use: 'nothing: a flash of grey is worse than a wait' },
];

type PropRow = { prop: string; type: string; default: string };
const PROPS: PropRow[] = [
  { prop: 'variant', type: "'text' | 'circle' | 'rect'", default: "'text'" },
  { prop: 'lines', type: 'number — text only', default: '1' },
  { prop: 'width', type: 'number | string', default: 'the whole width; the last of several lines, 60%' },
  { prop: 'height', type: 'number | string', default: 'text: the glyphs’ share of its line; rect: 40' },
  { prop: 'size', type: 'number | string — circle: both', default: '40' },
  { prop: 'className, style', type: '', default: '—' },
];

const row = { display: 'flex', alignItems: 'center', gap: spacing[150] } as const;

export default function Page() {
  const [loading, setLoading] = useState(true);

  return (
    <DocPage>
      <h1>Skeleton</h1>
      <p className="lead">The shape of what is on its way, so the page does not jump when it arrives.</p>

      <h2>Try it</h2>
      <div className="specimen">
        <div style={{ maxWidth: 360 }} aria-busy={loading}>
          <Card>
            <CardBody>
              <div style={row}>
                {loading ? <Skeleton variant="circle" size={40} /> : <Avatar name="Justin Anderson" size="md" />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <CardTitle>{loading ? <Skeleton width="60%" /> : 'Justin Anderson'}</CardTitle>
                  <p style={{ margin: 0 }} className="alias">
                    {loading ? <Skeleton width="35%" /> : '26 July 1989'}
                  </p>
                </div>
              </div>
              <p style={{ marginBlock: spacing[200], marginInline: 0 }}>
                {loading ? (
                  <Skeleton lines={3} />
                ) : (
                  'Follow-up after the asthma review in May. Bring the peak-flow diary; the inhaler technique is to be checked again.'
                )}
              </p>
              {loading ? <Skeleton variant="rect" width={120} height={40} /> : <Button>Open record</Button>}
            </CardBody>
          </Card>
        </div>
        <div style={{ marginTop: spacing[200] }}>
          <Button variant="outline" tone="neutral" size="sm" onClick={() => setLoading(!loading)}>
            {loading ? 'Arrive' : 'Load again'}
          </Button>
        </div>
      </div>
      <p className="alias">The card is the same height before and after: a text shape stands in the line it replaces.</p>

      <h2>Three shapes</h2>
      <div className="specimen">
        <div style={{ display: 'grid', gap: spacing[200], maxWidth: 420 }}>
          <Skeleton lines={2} />
          <div style={row}>
            <Skeleton variant="circle" size={24} />
            <Skeleton variant="circle" />
            <Skeleton variant="circle" size={64} />
          </div>
          <Skeleton variant="rect" height={120} />
        </div>
      </div>
      <p>
        There are no moulds — no skeleton of a card, of a table. A mould is a second drawing of a component that has to
        be kept in step with the first; three shapes put where the content will be are always in step, because they
        are in the content&rsquo;s own layout.
      </p>

      <h2>A row of a table</h2>
      <div className="specimen">
        <div style={{ display: 'grid', gap: spacing[150] }} aria-busy="true">
          {[72, 56, 64].map((w) => (
            <div key={w} style={row}>
              <Skeleton variant="circle" size={24} />
              <Skeleton width={`${w / 2}%`} />
              <Skeleton width="20%" />
              <Skeleton variant="rect" width={64} height={20} />
            </div>
          ))}
        </div>
      </div>

      <h2>Skeleton, loader or progress</h2>
      <div className="specimen">
        <Table
          caption="Which one"
          density="compact"
          columns={[
            { key: 'when', header: 'When', primary: true, cell: (r: Choice) => r.when },
            { key: 'use', header: 'Use', cell: (r: Choice) => r.use },
          ]}
          rows={CHOICES}
          getRowId={(r) => r.when}
        />
      </div>

      <h2>The sweep</h2>
      <p>
        Each shape has its own sweep, 1.8 seconds from edge to edge, decided on 2026-09-21 against a pulse and against
        one band crossing every shape at once. The single band is a gradient as wide as the window held with{' '}
        <code>background-attachment: fixed</code>: it animates a painted property, and it falls apart inside a
        transformed ancestor and on iOS. The loop keeps its own timing and is not a motion token, as the{' '}
        <a href="/avatar">Loader</a>&rsquo;s. Under <code>dir=&quot;rtl&quot;</code> it runs the other way.
      </p>
      <p>
        Reduced motion does not freeze it: a still grey bar is content, not loading. What is dropped is the travel —
        the band stays where it is and breathes, at half the pace.
      </p>

      <h2>The fill</h2>
      <p>
        It is the pressed wash and not a surface. <code>surface/sunken</code> is <code>surface/base</code> in dark:
        nothing on the page and a hole on a card. The wash is a state layer that composites over whatever is under it,
        in both modes, so one shape is right on the page, on a card and in a panel. The band is the same wash again, a
        denser passage, and needs no colour of its own. It is not held to a contrast ratio: a skeleton is not
        information, and what says &ldquo;loading&rdquo; to someone who cannot see it is <code>aria-busy</code>. It
        keeps a transparent border, which forced colours paint.
      </p>

      <h2>Accessibility</h2>
      <p>
        The shapes are <code>aria-hidden</code>: twenty of them would be twenty empty things. The region that is
        loading is the caller&rsquo;s, and says <code>aria-busy</code> while it loads. They are spans, so one can stand
        inside the paragraph or the heading it replaces, and the outline of the page does not change when the content
        arrives.
      </p>

      <h2>Using it</h2>
      <CodeBlock code={USAGE} lang="tsx" />
      <div className="specimen">
        <Table
          caption="Skeleton props"
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
