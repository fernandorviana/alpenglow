'use client';

import { useState } from 'react';
import { DocPage } from '@ui/DocPage';
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

      <h2>Validation</h2>
      <p>
        Type something without an <code>@</code> and the field turns. The border changes
        colour but never width, so nothing on the page moves — and focusing an invalid field
        keeps the red border while adding the ring, rather than replacing one signal with
        the other.
      </p>
      <div className="specimen">
        <div className="specimenRow">
          <label htmlFor="e">Email</label>
          <Input
            id="e"
            type="email"
            value={email}
            invalid={invalid}
            aria-describedby={invalid ? 'email-error' : undefined}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        {invalid && (
          <p id="email-error" style={{ color: 'var(--ap-color-text-danger)', margin: '8px 0 0' }}>
            Enter an address that includes an @.
          </p>
        )}
      </div>

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
        Neither component renders its own label. Wire one up with <code>htmlFor</code>, or
        pass <code>aria-label</code> — a control that invents a label is a control that gets
        the wrong one. Point <code>aria-describedby</code> at the error message so it is
        announced with the field.
      </p>
      <p>
        The visual <code>size</code> prop shadows the HTML <code>size</code> attribute,
        which sets a width in characters. Passing <code>size=&quot;lg&quot;</code> gives you
        a taller control, not a forty-character-wide one.
      </p>
    </DocPage>
  );
}
