'use client';

import { useState } from 'react';
import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { Checkbox } from '@/components/Checkbox/index';
import { Radio } from '@/components/Radio/index';
import { resolve } from '@/tokens/contrast';

const SERVICES = ['Consultation', 'Follow-up', 'Assessment'] as const;

export default function Page() {
  const [picked, setPicked] = useState<string[]>(['Consultation']);
  const all = picked.length === SERVICES.length;
  const some = picked.length > 0 && !all;

  function toggle(name: string) {
    setPicked((current) =>
      current.includes(name) ? current.filter((n) => n !== name) : [...current, name],
    );
  }

  return (
    <DocPage
      evidence={
        <>
          <p>border/strong</p>
          <p>
            light{' '}
            <Ratio
              fg={resolve('border/strong', 'light')}
              bg={resolve('surface/raised', 'light')}
              threshold={3}
            />
          </p>
          <p>
            dark{' '}
            <Ratio
              fg={resolve('border/strong', 'dark')}
              bg={resolve('surface/raised', 'dark')}
              threshold={3}
            />
          </p>
          <p>1.4.11 needs 3</p>
        </>
      }
    >
      <h1>Checkbox and Radio</h1>
      <p className="lead">
        The two controls where the border is not describing the control. It is the control.
      </p>

      <p>
        A text input has a label, a placeholder, a height and a padded box — the border is
        one signal among several. An unchecked checkbox has none of that. Remove its border
        and there is nothing left to see, which is why these are the components{' '}
        <code>border/strong</code> exists for, and why it is the same primitive in both
        themes: it is the only ramp value clearing 3:1 against every surface in light and
        dark alike.
      </p>
      <p>
        Checked and disabled states are exempt. A brand fill supplies the contrast, and
        WCAG 2.1 excludes inactive components.
      </p>

      <h2>Checkbox</h2>
      <div className="specimen">
        <div style={{ display: 'grid', gap: 12 }}>
          <Checkbox defaultChecked>Send a reminder</Checkbox>
          <Checkbox description="They will get an email the day before.">
            Send a reminder
          </Checkbox>
          <Checkbox disabled>Unavailable for this service</Checkbox>
          <Checkbox disabled defaultChecked>
            Required by the clinic
          </Checkbox>
        </div>
      </div>

      <h2>Mixed state</h2>
      <p>
        A parent whose children are a mix reads as <code>aria-checked=&quot;mixed&quot;</code>,
        not as checked. Toggle the children and watch the parent.
      </p>
      <div className="specimen">
        <Checkbox
          checked={all}
          indeterminate={some}
          onChange={() => setPicked(all ? [] : [...SERVICES])}
        >
          All services
        </Checkbox>
        <div style={{ display: 'grid', gap: 12, marginTop: 12, marginLeft: 24 }}>
          {SERVICES.map((service) => (
            <Checkbox
              key={service}
              checked={picked.includes(service)}
              onChange={() => toggle(service)}
            >
              {service}
            </Checkbox>
          ))}
        </div>
      </div>

      <h2>Radio</h2>
      <p>
        A radio on its own means nothing — its state exists only relative to the others
        sharing its <code>name</code>. Group them in a fieldset with a legend so the
        question is announced along with the answers.
      </p>
      <div className="specimen">
        <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
          <legend style={{ padding: 0, marginBottom: 12, fontWeight: 600 }}>
            Appointment type
          </legend>
          <div style={{ display: 'grid', gap: 12 }}>
            <Radio name="mode" value="person" defaultChecked description="At the clinic.">
              In person
            </Radio>
            <Radio name="mode" value="video" description="A link is sent an hour before.">
              Video call
            </Radio>
            <Radio name="mode" value="phone" disabled description="Not offered for this service.">
              Phone call
            </Radio>
          </div>
        </fieldset>
      </div>

      <h2>Accessibility</h2>
      <p>
        The input is wrapped in its label, so neither control can ship unlabelled by
        forgetting to wire an id, and the text is part of the click target.
      </p>
      <p>
        The description sits <em>outside</em> the label and is attached with{' '}
        <code>aria-describedby</code>. Inside it, a screen reader reads it as part of the
        control&rsquo;s name — &ldquo;Send a reminder They will get an email the day
        before&rdquo; becomes the name rather than a name and a description. A test caught
        this; it was written the wrong way first.
      </p>
      <p>
        Focus adds a ring outside the box. The border keeps its colour and its width, so a
        checked box stays visibly checked while focused and nothing reflows.
      </p>
      <p>
        Arrow keys move selection within a radio group and space toggles a checkbox,
        because both are real inputs underneath rather than styled divs.
      </p>
    </DocPage>
  );
}
