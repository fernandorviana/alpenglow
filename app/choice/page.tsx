'use client';

import { useState } from 'react';
import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { Checkbox } from '@/components/Checkbox/index';
import { Radio } from '@/components/Radio/index';
import { Switch } from '@/components/Switch/index';
import { Table } from '@/components/Table';
import { contrast, resolve } from '@/tokens/contrast';
import { spacing } from '@/tokens/scale';

const SERVICES = ['Consultation', 'Follow-up', 'Assessment'] as const;

type PropRow = { prop: string; type: string; default: string };

const CHECKBOX_PROPS: PropRow[] = [
  { prop: 'indeterminate', type: 'boolean', default: 'false' },
  { prop: 'description', type: 'ReactNode', default: '—' },
];
const RADIO_PROPS: PropRow[] = [{ prop: 'description', type: 'ReactNode', default: '—' }];
const SWITCH_PROPS: PropRow[] = [{ prop: 'description', type: 'ReactNode', default: '—' }];

const propColumns = [
  { key: 'prop', header: 'Prop', primary: true, cell: (r: PropRow) => <code>{r.prop}</code> },
  { key: 'type', header: 'Type', cell: (r: PropRow) => <span className="alias">{r.type}</span> },
  { key: 'default', header: 'Default', cell: (r: PropRow) => <span className="alias">{r.default}</span> },
];

/**
 * The drawn geometry: a 20px box, a 40 by 20 track with a 16px knob, and a
 * label set in the body size with the box centred on its first line. One size
 * on purpose — a field's size changes its box, never its text, and these
 * controls are their box.
 */
const BOX = 20;
const TRACK = { width: 40, height: 20, knob: 16 };

/** A surface step, as a number: the ratio has no grade for a fill against a fill. */
const step = (a: string, b: string, mode: 'light' | 'dark') =>
  `${contrast(resolve(a as never, mode), resolve(b as never, mode)).toFixed(2)}:1`;

export default function Page() {
  const [picked, setPicked] = useState<string[]>(['Consultation']);
  const all = picked.length === SERVICES.length;
  const some = picked.length > 0 && !all;
  const [reminders, setReminders] = useState(true);

  function toggle(name: string) {
    setPicked((current) =>
      current.includes(name) ? current.filter((n) => n !== name) : [...current, name],
    );
  }

  return (
    <DocPage
      evidence={
        <>
          <p>box border on its fill</p>
          <p>
            light{' '}
            <Ratio fg={resolve('border/strong', 'light')} bg={resolve('surface/sunken', 'light')} threshold={3} />
          </p>
          <p>
            dark{' '}
            <Ratio fg={resolve('border/strong', 'dark')} bg={resolve('surface/sunken', 'dark')} threshold={3} />
          </p>
          <p>check on its fill</p>
          <p>
            light{' '}
            <Ratio
              fg={resolve('interactive/on-accent', 'light')}
              bg={resolve('interactive/accent', 'light')}
              threshold={3}
            />
          </p>
          <p>
            dark{' '}
            <Ratio
              fg={resolve('interactive/on-accent', 'dark')}
              bg={resolve('interactive/accent', 'dark')}
              threshold={3}
            />
          </p>
          <p>knob on the track, off</p>
          <p>
            light{' '}
            <Ratio fg={resolve('surface/raised', 'light')} bg={resolve('border/strong', 'light')} threshold={3} />
          </p>
          <p>
            dark{' '}
            <Ratio fg={resolve('surface/raised', 'dark')} bg={resolve('border/strong', 'dark')} threshold={3} />
          </p>
          <p>knob on the track, on</p>
          <p>
            light{' '}
            <Ratio fg={resolve('surface/raised', 'light')} bg={resolve('border/success', 'light')} threshold={3} />
          </p>
          <p>
            dark{' '}
            <Ratio fg={resolve('surface/raised', 'dark')} bg={resolve('border/success', 'dark')} threshold={3} />
          </p>
        </>
      }
    >
      <h1>Checkbox, Radio and Switch</h1>
      <p className="lead">
        The three controls where the border is not describing the control. It is the control.
      </p>

      <h2>Try it</h2>
      <div className="specimen">
        <div className="specimenRow">
          <Checkbox defaultChecked>Send a reminder</Checkbox>
          <Switch
            checked={reminders}
            onChange={(event) => setReminders(event.target.checked)}
            description={reminders ? 'An email goes out the day before.' : 'No email goes out.'}
          >
            Send reminders
          </Switch>
        </div>
        <p className="alias" style={{ margin: `${spacing[150]}px 0 0` }}>
          Space toggles either; Tab moves between them. The switch takes effect the moment it
          is flipped, and its description says what changed — the label names the setting
          and never the state.
        </p>
      </div>

      <h2>Choosing a control</h2>
      <p>
        A checkbox is any number of a set — none, some, all — or one yes-or-no that applies
        when the form is saved. A radio is exactly one of a short set, and it starts with
        one chosen: a group with nothing selected cannot be put back to nothing, so it is
        not a choice the reader can undo. Two is the fewest radios that make sense; past six
        or so, the list is a <a href="/select">Select</a>.
      </p>
      <p>
        A switch is one setting that takes effect the moment it is flipped. If the change
        applies after a Save, it is a checkbox, whatever it looks like. Label a switch for
        what happens when it is on — <em>Send reminders</em>, <em>Allow online booking</em> —
        so the off state can be inferred; <em>Don&rsquo;t send reminders</em> turns the
        control into a double negative.
      </p>

      <h2>Anatomy</h2>
      <p>
        A {BOX}px box, square for the checkbox and round for the radio, and a{' '}
        {TRACK.width} by {TRACK.height} track with a {TRACK.knob}px knob for the switch. The
        label is body text, and the control is centred on its first line, so a label that
        wraps keeps the box at the top rather than floating beside the middle of a paragraph.
        The description sits under the label in the secondary colour. One size, on purpose:
        a field&rsquo;s size changes its box and never its text, and these controls are their
        box.
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
        The box is inset — filled with <code>surface/sunken</code>, {step('surface/sunken', 'surface/raised', 'light')}{' '}
        below the card in light and the canvas colour in dark, where the ladder ends — so its
        border and its selected dot are measured against that fill, not only against the
        card behind it. The border reads{' '}
        <Ratio fg={resolve('border/strong', 'light')} bg={resolve('surface/sunken', 'light')} threshold={3} /> in
        light and{' '}
        <Ratio fg={resolve('border/strong', 'dark')} bg={resolve('surface/sunken', 'dark')} threshold={3} /> in
        dark there, the dot{' '}
        <Ratio fg={resolve('interactive/accent', 'dark')} bg={resolve('surface/sunken', 'dark')} threshold={3} /> in
        dark. A fill that only looks right against the card is the hardest kind of
        regression to catch by eye, which is why the suite measures the box on its own.
      </p>
      <p>
        A checkbox fills when checked; a radio keeps its fill and gains a ring and a dot.
        Keeping the two treatments apart is what makes them distinguishable at a glance in
        a form that contains both. Checked and disabled states are exempt from the border
        rule: a brand fill supplies the contrast, and WCAG 2.1 excludes inactive components.
      </p>

      <h2>Checkbox</h2>
      <div className="specimen">
        <div style={{ display: 'grid', gap: spacing[150] }}>
          <Checkbox defaultChecked>Send a reminder</Checkbox>
          <Checkbox description="They will get an email the day before.">
            Send a reminder
          </Checkbox>
          <Checkbox disabled description="Unavailable for this service.">
            Send a follow-up survey
          </Checkbox>
          <Checkbox disabled defaultChecked description="Required by the clinic.">
            Record the visit
          </Checkbox>
        </div>
      </div>
      <p>
        A disabled option keeps its label and says why in the description, so the reader
        learns what they cannot change and what would change it. The label names the option
        in every state; the reason lives underneath.
      </p>

      <h3>Mixed state</h3>
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
        <div
          style={{
            display: 'grid',
            gap: spacing[150],
            marginTop: spacing[150],
            marginInlineStart: spacing[300],
          }}
        >
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
        question is announced along with the answers, and the legend is the question, not a
        heading over it.
      </p>
      <div className="specimen">
        <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
          <legend style={{ padding: 0, marginBottom: spacing[150], fontWeight: 600 }}>
            Appointment type
          </legend>
          <div style={{ display: 'grid', gap: spacing[150] }}>
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
      <div className="specimen">
        <div style={{ display: 'grid', gap: spacing[150] }}>
          <Switch defaultChecked description="They get an email the day before.">
            Send reminders
          </Switch>
          <Switch>Allow online booking</Switch>
          <Switch disabled description="Not available on this plan.">
            Take online payments
          </Switch>
          <Switch disabled defaultChecked description="Required by the clinic.">
            Record the visit
          </Switch>
        </div>
      </div>
      <p>
        The track is <code>border/strong</code> off and <code>border/success</code> on, and
        the knob is <code>surface/raised</code> — a raised surface sitting on the track. All
        four pairs, knob against track in each state and mode, are in the margin; the
        tightest is the off state in light, {step('surface/raised', 'border/strong', 'light')}.
      </p>

      <div className="rejected">
        <p>
          <strong>The drawn switch had no visible boundary, in either half.</strong>
        </p>
        <p>
          A mint track with a white knob measures 1.48:1 knob-to-track, and 1.48:1
          track-to-card. Neither the control nor its state could be made out — it reads as
          a pale smudge on white. It uses the tokens that exist to clear 3:1 instead:
          <code>border/strong</code> off, <code>border/success</code> on, and the knob on{' '}
          <code>surface/raised</code>, which is what it is.
        </p>
        <p>
          The knob&rsquo;s <em>position</em> is the state signal that survives when colour
          does not, which is why reduced motion removes the slide but never the travel.
        </p>
      </div>

      <h2>Accessibility</h2>
      <p>
        The input is wrapped in its label, so neither control can ship unlabelled by
        forgetting to wire an id, and the text is part of the click target. That is also
        what makes the target large enough: the box alone is {BOX}px, under the 24px WCAG
        asks of a target, and the label beside it is what the finger lands on. Never split
        the two, and never leave a gap between them.
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
        checked box stays visibly checked while focused and nothing reflows. Hover turns the
        border to the accent, and only the border: a state change carried by the fill would
        be mistaken for checked.
      </p>
      <p>
        Arrow keys move selection within a radio group and space toggles a checkbox or a
        switch, because all three are real inputs underneath rather than styled divs. Under
        reduced motion the switch&rsquo;s knob still moves; it stops sliding.
      </p>

      <h2>Props</h2>
      <div className="specimen">
        <Table
          caption="Checkbox props"
          captionVisible
          density="compact"
          columns={propColumns}
          rows={CHECKBOX_PROPS}
          getRowId={(r) => r.prop}
        />
      </div>
      <div className="specimen">
        <Table caption="Radio props" captionVisible density="compact" columns={propColumns} rows={RADIO_PROPS} getRowId={(r) => r.prop} />
      </div>
      <div className="specimen">
        <Table caption="Switch props" captionVisible density="compact" columns={propColumns} rows={SWITCH_PROPS} getRowId={(r) => r.prop} />
      </div>
      <p className="alias" style={{ marginTop: 8 }}>
        The label is the children. All remaining input attributes are passed through —{' '}
        <code>name</code>, <code>value</code>, <code>checked</code>, <code>disabled</code>,{' '}
        <code>onChange</code>.
      </p>
    </DocPage>
  );
}
