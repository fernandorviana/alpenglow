'use client';

import { useState } from 'react';
import { DocPage } from '@ui/DocPage';
import { Field } from '@/components/Field/index';
import { Select } from '@/components/Select/index';
import { Textarea } from '@/components/Textarea/index';

const SERVICES = [
  ['consult', 'Consultation'],
  ['follow-up', 'Follow-up'],
  ['assessment', 'Assessment'],
] as const;

export default function Page() {
  const [service, setService] = useState('');

  return (
    <DocPage
      evidence={
        <>
          <p>native select</p>
          <p>1 element</p>
          <p>0 key handlers</p>
        </>
      }
    >
      <h1>Select and Textarea</h1>
      <p className="lead">
        Both sit in the same box as Input, with the measurements each is actually drawn at.
      </p>

      <h2>Select</h2>
      <p>
        The element underneath is a native <code>&lt;select&gt;</code>. That gives keyboard
        behaviour, the platform picker on a phone, form participation and screen-reader
        support without a line of code — the chevron and the box are the only things added.
      </p>
      <p>
        The trade is that the option list cannot be styled: it belongs to the operating
        system. For a system that has to work in a clinic on whatever device is to hand,
        that is the right way round.
      </p>

      <div className="specimen">
        <div style={{ display: 'grid', gap: 16, maxWidth: 360 }}>
          <Select aria-label="Service, small" size="sm" placeholder="Small">
            {SERVICES.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
          <Select aria-label="Service, medium" size="md" placeholder="Medium">
            {SERVICES.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
          <Select aria-label="Service, large" size="lg" placeholder="Large">
            {SERVICES.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </div>
      </div>

      <h3>In a Field</h3>
      <p>
        Choose nothing and the message stays. The placeholder is offered but cannot be
        chosen — it is a prompt, not an answer.
      </p>
      <div className="specimen">
        <div style={{ maxWidth: 360 }}>
          <Field
            label="Service"
            description="Determines the length of the appointment."
            error={!service && 'Choose a service before continuing.'}
            required
          >
            <Select
              placeholder="Choose a service"
              value={service}
              onChange={(event) => setService(event.target.value)}
            >
              {SERVICES.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      <h3>States</h3>
      <div className="specimen">
        <div style={{ display: 'grid', gap: 16, maxWidth: 360 }}>
          <Select aria-label="Disabled" disabled placeholder="Disabled">
            {SERVICES.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
          <Select aria-label="Invalid" invalid placeholder="In error">
            {SERVICES.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </div>
      </div>

      <h2>Textarea</h2>
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
        The chevron is hidden from assistive technology. It repeats what the select role
        already announces, and a decoration that says the same thing twice is noise.
      </p>
      <p>
        The placeholder option is disabled, so it can be read but never submitted as an
        answer. Required selects need a real choice.
      </p>
      <p>
        Options are given an explicit colour. Native option lists render in the operating
        system&rsquo;s palette, and a dark-theme field can otherwise open a list of
        invisible text in browsers that do respect the setting.
      </p>
    </DocPage>
  );
}
