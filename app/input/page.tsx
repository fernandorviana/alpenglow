'use client';

import { useState } from 'react';
import { DocPage } from '@ui/DocPage';
import { Field } from '@/components/Field/index';
import { Input } from '@/components/Input/index';
import { Textarea } from '@/components/Textarea/index';

const Glass = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <circle cx="7" cy="7" r="4.5" />
    <path d="M10.5 10.5L14 14" strokeLinecap="round" />
  </svg>
);

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
        The two controls where the border is doing real work rather than decorating.
      </p>

      <p>
        Both use <code>border/strong</code>, the only value in the ramp clearing 3:1 against
        every surface in both themes. Cards and containers use the lighter{' '}
        <code>border/default</code> — a card outline is decorative, and a form control&rsquo;s
        is not.
      </p>
      <p>
        Neither is a capsule. That shape belongs to buttons, and using it here would blur
        the line between what you press and what you type into.
      </p>

      <h2>Sizes</h2>
      <div className="specimen">
        <div className="specimenRow">
          <label htmlFor="s">Small</label>
          <Input id="s" size="sm" placeholder="Search clients" iconStart={<Glass />} />
        </div>
        <div className="specimenRow">
          <label htmlFor="m">Medium</label>
          <Input id="m" size="md" placeholder="Search clients" iconStart={<Glass />} />
        </div>
        <div className="specimenRow">
          <label htmlFor="l">Large</label>
          <Input id="l" size="lg" placeholder="Search clients" iconStart={<Glass />} />
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
      <div className="specimen">
        <label htmlFor="notes" style={{ display: 'block', marginBottom: 8 }}>
          Consultation notes
        </label>
        <Textarea id="notes" placeholder="What was discussed, and what happens next." />
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
        The visual <code>size</code> prop shadows the HTML <code>size</code> attribute,
        which sets a width in characters. Passing <code>size=&quot;lg&quot;</code> gives you
        a taller control, not a forty-character-wide one.
      </p>
    </DocPage>
  );
}
