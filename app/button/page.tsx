'use client';

import { useState } from 'react';
import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { Checkmark } from '@carbon/icons-react';
import { Button } from '@/components/Button';
import { Table } from '@/components/Table';
import { resolve } from '@/tokens/contrast';

type PropRow = { prop: string; type: string; default: string };

const PROPS: PropRow[] = [
  { prop: 'variant', type: "'solid' | 'outline' | 'ghost'", default: "'solid'" },
  { prop: 'tone', type: "'accent' | 'neutral' | 'tertiary' | 'success' | 'danger'", default: "'accent'" },
  { prop: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { prop: 'loading', type: 'boolean', default: 'false' },
  { prop: 'iconStart', type: 'ReactNode', default: '—' },
  { prop: 'iconEnd', type: 'ReactNode', default: '—' },
  { prop: 'fullWidth', type: 'boolean', default: 'false' },
];

export default function Page() {
  const [saving, setSaving] = useState(false);

  return (
    <DocPage
      evidence={
        <>
          <p>on-accent</p>
          <p>
            light{' '}
            <Ratio
              fg={resolve('interactive/on-accent', 'light')}
              bg={resolve('interactive/accent', 'light')}
            />
          </p>
          <p>
            dark{' '}
            <Ratio
              fg={resolve('interactive/on-accent', 'dark')}
              bg={resolve('interactive/accent', 'dark')}
            />
          </p>
        </>
      }
    >
      <h1>Button</h1>
      <p className="lead">
        Three variants, four tones, three sizes. Every value is a token; the component file
        contains no colour.
      </p>

      <h2>Try it</h2>
      <div className="specimen">
        <div className="specimenRow">
          <Button
            loading={saving}
            onClick={() => {
              setSaving(true);
              setTimeout(() => setSaving(false), 1800);
            }}
          >
            Confirm booking
          </Button>
          <span className="alias">
            Click it — the label keeps its place, so the button does not change width.
          </span>
        </div>
      </div>

      <h2>Variants and tones</h2>
      <div className="specimen">
        <div className="specimenRow">
          <Button tone="accent">Confirm booking</Button>
          <Button tone="neutral">Go back</Button>
          <Button tone="tertiary">Start intake</Button>
          <Button tone="success">Mark complete</Button>
          <Button tone="danger">Cancel appointment</Button>
        </div>
        <div className="specimenRow">
          <Button variant="outline" tone="accent">Confirm booking</Button>
          <Button variant="outline" tone="neutral">Go back</Button>
          <Button variant="outline" tone="danger">Cancel appointment</Button>
        </div>
        <div className="specimenRow">
          <Button variant="ghost" tone="accent">Confirm booking</Button>
          <Button variant="ghost" tone="neutral">Go back</Button>
          <Button variant="ghost" tone="danger">Cancel appointment</Button>
        </div>
      </div>

      <div className="rejected">
        <p>
          <strong>Tertiary and success are solid-only, and the type signature enforces it.</strong>
        </p>
        <p>
          Outline and ghost paint the tone as text, and outline as a border too. Tertiary
          cannot be painted that way: brand-2/500 is 1.45:1 on white, and the theme has no
          tertiary text colour — <code>text/tertiary</code> is a level of the text
          hierarchy, not this tone. So{' '}
          <code>variant=&quot;outline&quot; tone=&quot;tertiary&quot;</code> does not compile
          rather than producing a button nobody should ship.
        </p>
        <p>
          Success was left out for the same reason, until field validation added{' '}
          <code>text/success</code>, at{' '}
          <Ratio fg={resolve('text/success', 'light')} bg={resolve('surface/base', 'light')} />{' '}
          on the canvas, and <code>border/success</code>, at{' '}
          <Ratio
            fg={resolve('border/success', 'light')}
            bg={resolve('surface/base', 'light')}
            threshold={3}
          />
          . An outline success button could pass now. It stays out because it was never drawn.
        </p>
      </div>

      <h2>Sizes</h2>
      <div className="specimen">
        <div className="specimenRow">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </div>

      <h2>States</h2>
      <div className="specimen">
        <div className="specimenRow">
          <Button>Default</Button>
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
          <Button iconStart={<Checkmark size={16} />}>With icon</Button>
          <Button iconEnd={<Checkmark size={16} />}>Icon after</Button>
        </div>
        <div className="specimenRow">
          <Button variant="outline" tone="neutral">Default</Button>
          <Button variant="outline" tone="neutral" disabled>Disabled</Button>
          <Button variant="ghost" tone="neutral">Default</Button>
          <Button variant="ghost" tone="neutral" disabled>Disabled</Button>
        </div>
      </div>

      <h3>Loading keeps the tone</h3>
      <p>
        A loading button is disabled — it must not be activated twice — but busy and
        unavailable are different states and do not look alike. It holds its own fill
        and label colour, and the spinner takes that label colour, so every tone stays
        legible while it works.
      </p>
      <div className="specimen">
        <div className="specimenRow">
          <Button loading>Accent</Button>
          <Button tone="neutral" loading>Neutral</Button>
          <Button tone="tertiary" loading>Tertiary</Button>
          <Button tone="success" loading>Success</Button>
          <Button tone="danger" loading>Danger</Button>
        </div>
        <div className="specimenRow">
          <Button variant="outline" loading>Outline</Button>
          <Button variant="outline" tone="neutral" loading>Outline</Button>
          <Button variant="outline" tone="danger" loading>Outline</Button>
          <Button variant="ghost" loading>Ghost</Button>
          <Button variant="ghost" tone="neutral" loading>Ghost</Button>
          <Button variant="ghost" tone="danger" loading>Ghost</Button>
        </div>
        <div className="specimenRow">
          <Button size="sm" loading>Small</Button>
          <Button size="md" loading>Medium</Button>
          <Button size="lg" loading>Large</Button>
        </div>
      </div>

      <h2>Accessibility</h2>
      <p>
        Focus adds a two-pixel ring at a two-pixel offset rather than recolouring the
        border, so colour is never the only channel carrying the state. Tab through the
        examples above to see it.
      </p>
      <p>
        Loading sets <code>aria-busy</code> and disables activation. The label stays in the
        document and loses only its paint, which keeps the accessible name stable and stops
        the button resizing mid-action.
      </p>
      <p>
        Icons are marked <code>aria-hidden</code>, so the accessible name comes from the
        label alone. An icon-only button needs an explicit <code>aria-label</code>.
      </p>
      <p>
        The element defaults to <code>type="button"</code>. A bare button inside a form
        defaults to submit, which turns a decorative button into an accidental form
        submission.
      </p>

      <h2>Props</h2>
      <div className="specimen">
        <Table
          caption="Button props"
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
      <p className="alias" style={{ marginTop: 8 }}>
        All remaining button attributes are passed through.
      </p>
    </DocPage>
  );
}
