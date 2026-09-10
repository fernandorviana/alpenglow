'use client';

import { useState } from 'react';
import { DocPage } from '@ui/DocPage';
import { Field } from '@/components/Field/index';
import { Select } from '@/components/Select/index';

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
      <h1>Select</h1>
      <p className="lead">
        One value from a fixed list, in the same box as Input, at the measurements it is actually
        drawn at.
      </p>

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

      <h2>Select or dropdown menu</h2>
      <p>
        Both open a list under a control, and in a drawing they look the same. They answer
        different questions. A select holds a <strong>value</strong>: the choice stays visible in
        the field afterwards, belongs to a form, and is submitted with it. A{' '}
        <a href="/dropdown-menu">dropdown menu</a> runs a <strong>command</strong>: nothing is
        kept, the list closes, and something happens — reschedule, export, cancel.
      </p>
      <p>
        The test is what the control shows once the list has closed. If it shows the choice, it
        is a Select. If choosing was the end of it, it is a dropdown menu.
      </p>

      <h2>In a Field</h2>
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

      <h2>States</h2>
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
