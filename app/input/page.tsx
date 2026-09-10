'use client';

import { useState } from 'react';
import { DocPage } from '@ui/DocPage';
import { Search } from '@carbon/icons-react';
import { Field } from '@/components/Field/index';
import { Input } from '@/components/Input/index';
import { Textarea } from '@/components/Textarea/index';

export default function Page() {
  const [email, setEmail] = useState('not-an-email');
  const invalid = !email.includes('@');

  return (
    <DocPage
      evidence={
        <>
          <p>border/strong</p>
          <p>3.41 light</p>
          <p>3.28 dark</p>
          <p>1.4.11 passes</p>
        </>
      }
    >
      <h1>Input and Textarea</h1>
      <p className="lead">
        The two text controls — a line and a block — where the border is doing real work rather
        than decorating.
      </p>

      <p>
        The field is filled and carries no border at rest. A border arrives on focus, and on
        nothing else — the box does not react to the pointer. A caret already says where
        typing will land, and a field that lights up under the mouse competes for attention
        with the one that is actually focused.
      </p>
      <p>
        Neither is a capsule. That shape belongs to buttons, and using it here would blur
        the line between what you press and what you type into.
      </p>
      <div className="rejected">
        <p>
          <strong>The resting state has a known gap, kept for now.</strong>
        </p>
        <p>
          With no border, the field&rsquo;s boundary is carried entirely by its fill — 1.06:1
          against a card, and against the app canvas, which is the same colour, no boundary
          at all. WCAG 1.4.11 asks for 3:1 where a border is what identifies a control. This
          matches the drawn component and is on the list to tune.
        </p>
      </div>

      <h2>Sizes</h2>
      <p>
        Three, sharing Button&rsquo;s heights: 32, 40 and 48. A button and a field of the
        same size line up, which the drawn numbering did not give — there a medium field was
        48 and a medium button was 40, so the two never sat level. The drawn heights are md
        and lg; sm is the compact addition.
      </p>
      <div className="specimen">
        <div className="specimenRow">
          <Input size="sm" placeholder="Small" iconStart={<Search size={20} />} />
          <Input size="md" placeholder="Medium" iconStart={<Search size={20} />} />
          <Input size="lg" placeholder="Large" iconStart={<Search size={20} />} />
        </div>
      </div>

      <h2>States</h2>
      <div className="specimen">
        <div className="specimenRow">
          <label htmlFor="d">Default</label>
          <Input id="d" defaultValue="Leonor Viana" />
        </div>
        <div className="specimenRow">
          <label htmlFor="r">Read-only</label>
          <Input id="r" readOnly defaultValue="APT-4821" />
        </div>
        <p className="alias" style={{ margin: '4px 0 0' }}>
          Tab into the read-only field: it shows focus without pretending to be editable.
        </p>
        <div className="specimenRow">
          <label htmlFor="x">Disabled</label>
          <Input id="x" disabled defaultValue="Cannot be edited" />
        </div>
      </div>

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
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
      </div>
      <p>
        The help text stays announced alongside the error rather than being replaced by it.
        It usually still applies when the value is wrong, and often explains why.
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
        Input&rsquo;s visual <code>size</code> prop shadows the HTML <code>size</code> attribute,
        which sets a width in characters. Passing <code>size=&quot;lg&quot;</code> gives you
        a taller control, not a forty-character-wide one.
      </p>
    </DocPage>
  );
}
