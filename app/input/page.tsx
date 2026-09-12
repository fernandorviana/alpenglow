'use client';

import { useState } from 'react';
import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { Search } from '@carbon/icons-react';
import { Field } from '@/components/Field/index';
import { Input } from '@/components/Input/index';
import { Table } from '@/components/Table';
import { Textarea } from '@/components/Textarea/index';
import { resolve } from '@/tokens/contrast';
import { radius, spacing } from '@/tokens/scale';

type PropRow = { prop: string; type: string; default: string };

const INPUT_PROPS: PropRow[] = [
  { prop: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { prop: 'invalid', type: 'boolean', default: 'from Field, else false' },
  { prop: 'iconStart', type: 'ReactNode', default: '—' },
  { prop: 'iconEnd', type: 'ReactNode', default: '—' },
];

const TEXTAREA_PROPS: PropRow[] = [{ prop: 'invalid', type: 'boolean', default: 'from Field, else false' }];

const FIELD_PROPS: PropRow[] = [
  { prop: 'label', type: 'ReactNode', default: 'required' },
  { prop: 'description', type: 'ReactNode', default: '—' },
  { prop: 'error', type: 'ReactNode', default: '—' },
  { prop: 'required', type: 'boolean', default: 'false' },
];

/**
 * The drawn geometry of each size. The heights are the three control heights
 * shared with Button; the padding is asymmetric on purpose — tighter at the
 * end, where the icon sits — and comes from the spacing scale.
 */
type SizeRow = { size: 'sm' | 'md' | 'lg'; height: number; block: number };
const SIZES: SizeRow[] = [
  { size: 'sm', height: 32, block: spacing['050'] },
  { size: 'md', height: 40, block: spacing[100] },
  { size: 'lg', height: 48, block: spacing[150] },
];
const INLINE_START = spacing[200];
const INLINE_END = spacing[150];

const propColumns = [
  { key: 'prop', header: 'Prop', primary: true, cell: (r: PropRow) => <code>{r.prop}</code> },
  { key: 'type', header: 'Type', cell: (r: PropRow) => <span className="alias">{r.type}</span> },
  { key: 'default', header: 'Default', cell: (r: PropRow) => <span className="alias">{r.default}</span> },
];

export default function Page() {
  const [email, setEmail] = useState('not-an-email');
  const invalid = !email.includes('@');

  return (
    <DocPage
      evidence={
        <>
          <p>against the fill</p>
          <p>focus border</p>
          <p>
            light{' '}
            <Ratio
              fg={resolve('border/inverse', 'light')}
              bg={resolve('interactive/neutral', 'light')}
              threshold={3}
            />
          </p>
          <p>
            dark{' '}
            <Ratio fg={resolve('border/inverse', 'dark')} bg={resolve('interactive/neutral', 'dark')} threshold={3} />
          </p>
          <p>error border</p>
          <p>
            light{' '}
            <Ratio fg={resolve('border/danger', 'light')} bg={resolve('interactive/neutral', 'light')} threshold={3} />
          </p>
          <p>
            dark{' '}
            <Ratio fg={resolve('border/danger', 'dark')} bg={resolve('interactive/neutral', 'dark')} threshold={3} />
          </p>
          <p>placeholder</p>
          <p>
            light{' '}
            <Ratio fg={resolve('text/placeholder', 'light')} bg={resolve('interactive/neutral', 'light')} />
          </p>
          <p>
            dark <Ratio fg={resolve('text/placeholder', 'dark')} bg={resolve('interactive/neutral', 'dark')} />
          </p>
        </>
      }
    >
      <h1>Input and Textarea</h1>
      <p className="lead">
        The two text controls — a line and a block — where the border is doing real work rather
        than decorating.
      </p>

      <h2>Try it</h2>
      <div className="specimen">
        <div className="specimenRow">
          <Input
            type="search"
            aria-label="Search clients"
            placeholder="Name or e-mail"
            iconStart={<Search size={20} />}
          />
          <span className="alias">
            Type, then Tab away: the border arrives with focus and leaves with it.
          </span>
        </div>
      </div>

      <h2>Choosing a control</h2>
      <p>
        Input holds one line: a name, an e-mail address, a reference. Textarea holds a block
        the reader will write more than a sentence into, and it can be resized. When the value
        comes from a short list the reader should not have to spell, it is a{' '}
        <a href="/select">Select</a>; when it is a date, it is the <a href="/date-picker">Date picker</a>,
        whose field is this Input with a mask.
      </p>
      <p>
        A placeholder shows the expected format — <em>name@example.com</em>,{' '}
        <em>DD/MM/YYYY</em> — and vanishes on the first keystroke, so it is never the label.
        Every field keeps a visible label above it; the one in <em>Try it</em> is the exception
        a search box is allowed, and it carries an <code>aria-label</code> instead.
      </p>
      <p>
        Give the browser what it needs to help. <code>type</code> and <code>inputMode</code>{' '}
        summon the right keyboard on a phone — <code>email</code> puts the @ on it,{' '}
        <code>tel</code> and <code>numeric</code> the digits — and <code>autoComplete</code> with
        a real <code>name</code> lets a saved address fill itself in. Nothing here blocks
        paste: people paste passwords and one-time codes, and a field that refuses them is a
        field they retype wrong.
      </p>

      <h2>Anatomy and sizes</h2>
      <p>
        A field is four things, top to bottom: the label, the help text, the control, and the
        error when there is one. <code>Field</code> lays them out and wires them; the control
        alone is the box.
      </p>
      <p>
        Three heights, shared with Button, so a button and a field of the same size sit level
        on one line — the drawn numbering did not give that: a medium field was 48 and a medium
        button 40. The drawn heights are md and lg; sm is the compact addition. The padding is
        tighter at the end, {INLINE_END}px against {INLINE_START}px, so an icon sits closer to
        the edge than the text does. The radius is {radius.xl}px, not the capsule: that shape
        belongs to buttons, and a field that borrowed it would blur what you press and what
        you type into.
      </p>
      <div className="specimen">
        <div className="specimenRow">
          <Input size="sm" aria-label="Small" placeholder="Small" iconStart={<Search size={20} />} />
          <Input size="md" aria-label="Medium" placeholder="Medium" iconStart={<Search size={20} />} />
          <Input size="lg" aria-label="Large" placeholder="Large" iconStart={<Search size={20} />} />
        </div>
      </div>
      <div className="specimen">
        <Table
          caption="Input sizes"
          density="compact"
          columns={[
            { key: 'size', header: 'Size', primary: true, cell: (r: SizeRow) => <code>{r.size}</code> },
            { key: 'height', header: 'Height', align: 'end', cell: (r: SizeRow) => `${r.height}px` },
            { key: 'block', header: 'Block padding', align: 'end', cell: (r: SizeRow) => `${r.block}px` },
            { key: 'inline', header: 'Inline padding', align: 'end', cell: () => `${INLINE_START} / ${INLINE_END}px` },
          ]}
          rows={SIZES}
          getRowId={(r) => r.size}
        />
      </div>

      <h2>Rest, focus, error</h2>
      <p>
        The field is filled and carries no border at rest. A border arrives on focus, and on
        nothing else — the box does not react to the pointer. A caret already says where
        typing will land, and a field that lights up under the mouse competes for attention
        with the one that is actually focused. The focus border is the strongest ink the theme
        has, and the error border is the danger one; both are measured against the fill in the
        margin.
      </p>
      <div className="rejected">
        <p>
          <strong>The resting state has a known gap, kept on purpose.</strong>
        </p>
        <p>
          With no border, the field&rsquo;s boundary is carried by its fill alone:{' '}
          <Ratio
            fg={resolve('interactive/neutral', 'light')}
            bg={resolve('surface/raised', 'light')}
            threshold={3}
          />{' '}
          against a card in light, and against the canvas, which is a step away,{' '}
          <Ratio
            fg={resolve('interactive/neutral', 'light')}
            bg={resolve('surface/base', 'light')}
            threshold={3}
          />
          . WCAG 1.4.11 asks for 3:1 where a border is what identifies a control. The drawn
          component has no resting border, and this matches it; the label above and the
          placeholder inside are what say &ldquo;field&rdquo; until focus does. The
          decision of 2026-09-07 kept a hairline in <code>border/default</code> instead, and
          the two versions are still to be reconciled.
        </p>
      </div>

      <h2>States</h2>
      <div className="specimen">
        <div className="specimenRow">
          <label htmlFor="d">Default</label>
          <Input id="d" defaultValue="Leonor Viana" />
        </div>
        <div className="specimenRow">
          <label htmlFor="i">Invalid</label>
          <Input id="i" invalid defaultValue="not-an-email" aria-describedby="i-error" />
          <span id="i-error" className="alias">
            Enter an address that includes an @.
          </span>
        </div>
        <div className="specimenRow">
          <label htmlFor="r">Read-only</label>
          <Input id="r" readOnly defaultValue="APT-4821" />
        </div>
        <p className="alias" style={{ margin: `4px 0 ${spacing[250]}px` }}>
          Tab into the read-only field: it shows focus without pretending to be editable.
        </p>
        <div className="specimenRow">
          <label htmlFor="x">Disabled</label>
          <Input id="x" disabled defaultValue="Cannot be edited" />
        </div>
      </div>
      <p>
        Read-only keeps a recessed fill and, on focus, a quieter border than an editable
        field: the text can still be selected and copied, so the field still takes focus and
        still shows it. Disabled drops the paint and the focus both; it is the one state a
        keyboard cannot reach.
      </p>

      <h2>Field</h2>
      <p>
        Written by hand, a labelled field with help text and an error is four things to get
        right, and three of them fail silently: a mismatched id leaves the label unattached,
        a missing <code>aria-describedby</code> leaves the error unannounced, and a
        forgotten invalid flag leaves the field red to sighted users and fine to everyone
        else.
      </p>
      <p>
        <code>Field</code> wires all of it. Type something without an <code>@</code> below —
        the border turns, the message appears, and the control is marked invalid and
        described by the message at the same moment.
      </p>
      <div className="specimen">
        <Field
          label="Email address"
          description="We only use it for appointment reminders."
          error={invalid && 'Enter an address that includes an @.'}
          required
        >
          <Input
            type="email"
            name="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
      </div>
      <p>
        The error is an instruction, beside the field that failed: it says what to enter,
        not what was wrong, and it does not apologise. The help text stays announced alongside
        it rather than being replaced by it — it usually still applies when the value is
        wrong, and often explains why.
      </p>
      <p>
        Field is for text controls. Checkbox and Radio carry their own labels, which belong
        beside the control rather than above it.
      </p>

      <h2>Textarea</h2>
      <p>
        The same box, the same fill and the same focus border as Input, from the same
        stylesheet. It differs where a block of text differs from a line.
      </p>
      <p>
        One size, and a fixed starting height of 144px rather than a row count — a row count
        sizes the box from whichever font happens to load, so the field would be a different
        height before and after the webfont arrives.
      </p>
      <p>
        Its horizontal padding is symmetric, where a single-line field is tighter on the
        right to sit closer to its icon. A block of text wants the same margin on both
        sides.
      </p>
      <div className="specimen">
        <div style={{ maxWidth: 420 }}>
          <Field label="Consultation notes" description="Visible to the clinician only.">
            <Textarea placeholder="What was discussed, and what happens next." />
          </Field>
        </div>
      </div>

      <h2>Accessibility</h2>
      <p>
        <code>invalid</code> sets <code>aria-invalid</code>. When the field is valid the
        attribute is left off entirely rather than set to false, which would be noise for a
        screen reader.
      </p>
      <p>
        Neither component renders its own label — a control that invents a label is a
        control that gets the wrong one. Wrap it in a <code>Field</code>, or wire{' '}
        <code>htmlFor</code> yourself. A control still works with neither, so nothing forces
        the wrapper on you.
      </p>
      <p>
        A read-only field still takes focus — that is how its text gets selected and copied
        — so it still shows one. It keeps its recessed fill and takes a quieter border than
        an editable field, rather than lighting up as though you could type in it. Removing
        the indicator would leave a focusable element with nowhere visible for the keyboard
        to be.
      </p>
      <p>
        Validate on submit, not on every keystroke, and keep the submit button enabled until
        the request starts: a button that stays disabled until the form is valid tells the
        reader nothing about which field is holding it up. When a submit fails, mark the
        failing fields, point each at its message, and move focus to the first one.
      </p>
      <p>
        Input&rsquo;s visual <code>size</code> prop shadows the HTML <code>size</code> attribute,
        which sets a width in characters. Passing <code>size=&quot;lg&quot;</code> gives you
        a taller control, not a forty-character-wide one.
      </p>

      <h2>Props</h2>
      <div className="specimen">
        <Table caption="Input props" captionVisible density="compact" columns={propColumns} rows={INPUT_PROPS} getRowId={(r) => r.prop} />
      </div>
      <div className="specimen">
        <Table
          caption="Textarea props"
          captionVisible
          density="compact"
          columns={propColumns}
          rows={TEXTAREA_PROPS}
          getRowId={(r) => r.prop}
        />
      </div>
      <div className="specimen">
        <Table caption="Field props" captionVisible density="compact" columns={propColumns} rows={FIELD_PROPS} getRowId={(r) => r.prop} />
      </div>
      <p className="alias" style={{ marginTop: 8 }}>
        All remaining input and textarea attributes are passed through; inside a Field, the
        id, the description and the invalid flag come from it unless you pass your own.
      </p>
    </DocPage>
  );
}
