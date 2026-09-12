'use client';

import { useState } from 'react';
import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { Add, ArrowRight, Checkmark, TrashCan } from '@carbon/icons-react';
import { Button } from '@/components/Button';
import { buttonFillTones } from '@/components/Button/Button';
import { Table } from '@/components/Table';
import { resolve } from '@/tokens/contrast';
import { spacing } from '@/tokens/scale';
import { textStyle } from '@/tokens/typography';
import type { ThemeTokenName } from '@/tokens/theme';

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

/**
 * The drawn geometry of each size. The heights are the three control heights
 * `ControlSize` names, which `vocabulary.test.ts` holds the stylesheet to;
 * the padding and the gap are spacing tokens, and the label is a text style.
 * The icon is the one number the stylesheet declares on its own: 16px at
 * small and medium, 20px at large.
 */
type SizeRow = { size: 'sm' | 'md' | 'lg'; height: number; padding: number; label: string; icon: number };
const SIZES: SizeRow[] = [
  { size: 'sm', height: 32, padding: spacing[200], label: 'button/md', icon: 16 },
  { size: 'md', height: 40, padding: spacing[250], label: 'button/md', icon: 16 },
  { size: 'lg', height: 48, padding: spacing[300], label: 'button/lg', icon: 20 },
];

const GAP = spacing[100];

export default function Page() {
  const [saving, setSaving] = useState(false);

  return (
    <DocPage
      evidence={
        <>
          {buttonFillTones.map((tone) => (
            <div key={tone}>
              <p>on-{tone}</p>
              <p>
                light{' '}
                <Ratio
                  fg={resolve(`interactive/on-${tone}` as ThemeTokenName, 'light')}
                  bg={resolve(`interactive/${tone}` as ThemeTokenName, 'light')}
                />
              </p>
              <p>
                dark{' '}
                <Ratio
                  fg={resolve(`interactive/on-${tone}` as ThemeTokenName, 'dark')}
                  bg={resolve(`interactive/${tone}` as ThemeTokenName, 'dark')}
                />
              </p>
            </div>
          ))}
        </>
      }
    >
      <h1>Button</h1>
      <p className="lead">
        Three variants, five tones, three sizes. Every value is a token; the component file
        contains no colour, and every label is measured against its fill in the margin.
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

      <h2>Choosing a variant and a tone</h2>
      <p>
        The variant sets how much a button asks for. Solid fills the capsule and is the
        loudest thing on a surface; outline draws the edge and paints the label; ghost
        paints the label alone and takes the wash on hover. The tone says what the action
        means, and only the solid variant carries all five.
      </p>
      <p>
        One solid accent per view. It is the action the view exists for — confirm the
        booking, save the record — and a second one beside it makes the reader choose
        between two things that both claim to be the point. The alternative next to it is
        neutral: the same size, the same capsule, and a fill that sits a step from the
        surface rather than on the accent ramp. Everything further down the hierarchy is
        outline or ghost.
      </p>
      <p>
        Danger is for the action that destroys something, and it is solid only when that
        action is the point of the view, as in a confirmation. In a row of a table it is
        ghost, so a list of records is not a list of red buttons. Success is the confirming
        step of a flow and nothing else; a button is not a status. Tertiary is the highlight
        — the gold the peaks take before they turn pink — for the one action a product wants
        to draw the eye to that is not the primary one, and it is never a state.
      </p>

      <div className="specimen">
        <div className="specimenRow">
          <Button variant="ghost" tone="neutral">
            Keep editing
          </Button>
          <Button tone="neutral">Save draft</Button>
          <Button>Confirm booking</Button>
        </div>
      </div>

      <div className="rejected">
        <p>
          <strong>Two solid accents in one row.</strong>
        </p>
        <p>
          A dialog footer with <em>Save draft</em> and <em>Confirm booking</em> both filled
          reads as two primary actions, and the reader has to work out from the words alone
          which one the dialog is for. The neutral fill beside the accent is what makes the
          accent read as primary across the room.
        </p>
        <div className="specimenRow" style={{ marginTop: spacing[150] }} inert>
          <Button>Save draft</Button>
          <Button>Confirm booking</Button>
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
          cannot be painted that way: its fill, flare/400, is 2.53:1 on white, and the theme
          has no tertiary text colour — <code>text/tertiary</code> is a level of the text
          hierarchy, not this tone, and flare/700 has not been drawn as one. So{' '}
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

      <h2>Sizes and anatomy</h2>
      <p>
        Three heights, shared with Input, Select and the date field, so a button and a field
        in one row sit on one line. The capsule is the whole shape: the radius is the
        largest the scale has, so it follows the height. The gap between an icon and the
        label is {GAP}px at every size — a smaller button does not get a tighter icon.
      </p>
      <div className="specimen">
        <div className="specimenRow">
          <Button size="sm" iconStart={<Add size={16} />}>
            Small
          </Button>
          <Button size="md" iconStart={<Add size={16} />}>
            Medium
          </Button>
          <Button size="lg" iconStart={<Add size={20} />}>
            Large
          </Button>
        </div>
      </div>
      <div className="specimen">
        <Table
          caption="Button sizes"
          density="compact"
          columns={[
            { key: 'size', header: 'Size', primary: true, cell: (r: SizeRow) => <code>{r.size}</code> },
            { key: 'height', header: 'Height', align: 'end', cell: (r: SizeRow) => `${r.height}px` },
            { key: 'padding', header: 'Inline padding', align: 'end', cell: (r: SizeRow) => `${r.padding}px` },
            {
              key: 'label',
              header: 'Label',
              cell: (r: SizeRow) => {
                const style = textStyle[r.label as keyof typeof textStyle];
                return (
                  <span className="alias">
                    {r.label} · {style.size}/{style.lineHeight}
                  </span>
                );
              },
            },
            { key: 'icon', header: 'Icon', align: 'end', cell: (r: SizeRow) => `${r.icon}px` },
          ]}
          rows={SIZES}
          getRowId={(r) => r.size}
        />
      </div>

      <h2>Labels</h2>
      <p>
        A label starts with the verb and names the action: <em>Confirm booking</em>,{' '}
        <em>Save draft</em>, <em>Cancel appointment</em>. Sentence case, no full stop, no
        exclamation. A button that confirms a consequence repeats it, so the dialog is
        answerable without reading its body: under <em>Cancel this appointment?</em> the
        buttons are <em>Cancel appointment</em> and <em>Keep it</em>, never <em>Yes</em> and{' '}
        <em>No</em>, and never a bare <em>Cancel</em> that could mean either.
      </p>
      <p>
        An icon goes at the start when it carries meaning the label alone would not — a
        plus for creating, a bin for deleting — and at the end when it points where the
        action goes. Icons are decoration to a screen reader, so a button with an icon and
        no label needs an <code>aria-label</code>, and it needs one the same way a labelled
        button reads: the verb and the object.
      </p>
      <div className="specimen">
        <div className="specimenRow">
          <Button iconStart={<Add size={16} />}>New appointment</Button>
          <Button variant="outline" tone="neutral" iconEnd={<ArrowRight size={16} />}>
            Next step
          </Button>
          <Button variant="ghost" tone="danger" iconStart={<TrashCan size={16} />}>
            Delete note
          </Button>
          <Button variant="outline" tone="neutral" aria-label="Add attachment" iconStart={<Add size={16} />} />
        </div>
      </div>
      <p>
        <code>fullWidth</code> is for a form on a phone, where the one primary action spans
        the column inside the layout's margins. On a desktop a button is as wide as its
        label, and a row of them is as wide as its labels.
      </p>

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
      <p>
        Hover and pressed are two steps up the tone&rsquo;s own ladder for the filled tones,
        and the wash — mist/500 at a low alpha over whatever is beneath — for neutral,
        outline and ghost. Pressed also gives way by four percent, and colour alone under
        reduced motion. Disabled keeps the shape and drops the paint; it is the one state
        with no hover.
      </p>

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
        Every label clears AA on its fill in both modes; the ten readings are in the margin,
        and the suite fails if one falls. The dark labels are not white: the accent fill
        lightens across hover and pressed there, and a white label would lose at the hover
        step, so the label darkens to keep clear of it.
      </p>
      <p>
        The small button is 32px tall, above the 24px WCAG asks of a target at AA. On a
        screen that is touched, use the large one: 48px is the size a thumb lands on, and a
        row of small buttons on a phone is a row of near misses.
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
