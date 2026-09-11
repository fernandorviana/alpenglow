'use client';

import { useState } from 'react';
import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { Checkbox } from '@/components/Checkbox/index';
import { Radio } from '@/components/Radio/index';
import { Switch } from '@/components/Switch/index';
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
      <h1>Checkbox, Radio and Switch</h1>
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
      <p>
        The box is inset — filled with <code>surface/sunken</code>, a step below the card in
        light (1.17:1 away) and the canvas colour in dark, where the ladder ends — so its
        border and its selected dot are measured against that fill, not only against the
        card behind it. The border reads 3.04:1 in light and 5.45:1 in dark there, the dot
        7.73:1 in dark. A fill that only looks right against the card is the hardest kind
        of regression to catch by eye, which is why the suite measures the box on its own.
      </p>
      <p>
        A checkbox fills when checked; a radio keeps its fill and gains a ring and a dot.
        Keeping the two treatments apart is what makes them distinguishable at a glance in
        a form that contains both.
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

      <h2>Switch</h2>
      <p>
        A checkbox underneath, with <code>role=&quot;switch&quot;</code>. The role is the
        whole difference: a screen reader says &ldquo;on&rdquo; and &ldquo;off&rdquo; rather
        than &ldquo;checked&rdquo; and &ldquo;not checked&rdquo;, which is what a switch
        means.
      </p>
      <p>
        Use one only when the change takes effect immediately. If it applies after a Save,
        it is a checkbox, whatever it looks like.
      </p>
      <div className="specimen">
        <div style={{ display: 'grid', gap: 12 }}>
          <Switch defaultChecked description="They get an email the day before.">
            Send reminders
          </Switch>
          <Switch>Allow online booking</Switch>
          <Switch disabled>Not available on this plan</Switch>
          <Switch disabled defaultChecked>Required by the clinic</Switch>
        </div>
      </div>

      <div className="rejected">
        <p>
          <strong>The drawn switch had no visible boundary, in either half.</strong>
        </p>
        <p>
          A mint track with a white knob measures 1.48:1 knob-to-track, and 1.48:1
          track-to-card. Neither the control nor its state could be made out — it reads as
          a pale smudge on white. It uses the tokens that exist to clear 3:1 instead:
          <code>border/strong</code> off, <code>border/success</code> on, and the knob on{' '}
          <code>surface/raised</code>, which is what it is — a raised surface sitting on the
          track.
        </p>
        <p>
          The knob&rsquo;s <em>position</em> is the state signal that survives when colour
          does not, which is why reduced motion removes the slide but never the travel.
        </p>
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
