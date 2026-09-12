'use client';

import { useState } from 'react';
import { DocPage } from '@ui/DocPage';
import { Ratio } from '@ui/Ratio';
import { Field } from '@/components/Field/index';
import { Select } from '@/components/Select/index';
import { Table } from '@/components/Table/index';
import { resolve } from '@/tokens/contrast';
import { spacing } from '@/tokens/scale';

const SERVICES = [
  ['consult', 'Consultation'],
  ['follow-up', 'Follow-up'],
  ['assessment', 'Assessment'],
] as const;

type PropRow = { prop: string; type: string; default: string };

const PROPS: PropRow[] = [
  { prop: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { prop: 'placeholder', type: 'string', default: '—' },
  { prop: 'invalid', type: 'boolean', default: 'from Field, else false' },
  { prop: 'iconStart', type: 'ReactNode', default: '—' },
];

const propColumns = [
  { key: 'prop', header: 'Prop', primary: true, cell: (r: PropRow) => <code>{r.prop}</code> },
  { key: 'type', header: 'Type', cell: (r: PropRow) => <span className="alias">{r.type}</span> },
  { key: 'default', header: 'Default', cell: (r: PropRow) => <span className="alias">{r.default}</span> },
];

/** The chevron's slot, as drawn: a 20px icon holding a 12.5 by 7.125 shape. */
const CHEVRON = 20;

function Options() {
  return (
    <>
      {SERVICES.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </>
  );
}

export default function Page() {
  const [service, setService] = useState('');
  const [tried, setTried] = useState('follow-up');

  return (
    <DocPage
      evidence={
        <>
          <p>native select</p>
          <p>1 element</p>
          <p>0 key handlers</p>
          <p>against the fill</p>
          <p>value</p>
          <p>
            light{' '}
            <Ratio fg={resolve('text/primary', 'light')} bg={resolve('interactive/neutral', 'light')} />
          </p>
          <p>
            dark <Ratio fg={resolve('text/primary', 'dark')} bg={resolve('interactive/neutral', 'dark')} />
          </p>
          <p>placeholder</p>
          <p>
            light{' '}
            <Ratio fg={resolve('text/placeholder', 'light')} bg={resolve('interactive/neutral', 'light')} />
          </p>
          <p>
            dark{' '}
            <Ratio fg={resolve('text/placeholder', 'dark')} bg={resolve('interactive/neutral', 'dark')} />
          </p>
          <p>chevron</p>
          <p>
            light{' '}
            <Ratio
              fg={resolve('text/tertiary', 'light')}
              bg={resolve('interactive/neutral', 'light')}
              threshold={3}
            />
          </p>
          <p>
            dark{' '}
            <Ratio fg={resolve('text/tertiary', 'dark')} bg={resolve('interactive/neutral', 'dark')} threshold={3} />
          </p>
        </>
      }
    >
      <h1>Select</h1>
      <p className="lead">
        One value from a fixed list, in the same box as Input, at the measurements it is actually
        drawn at.
      </p>

      <h2>Try it</h2>
      <div className="specimen">
        <div style={{ maxWidth: 360 }}>
          <Field label="Service" description="Determines the length of the appointment.">
            <Select value={tried} onChange={(event) => setTried(event.target.value)}>
              <Options />
            </Select>
          </Field>
        </div>
        <p className="alias" style={{ margin: `${spacing[150]}px 0 0` }}>
          Open it with Space or the arrows; the list is the platform&rsquo;s. Type the first
          letter of an option to jump to it.
        </p>
      </div>

      <h2>Choosing a select</h2>
      <p>
        A select is for one value from a list too long to lay out: past six or so options, a
        row of radios is a wall, and a select is one line. Under that, prefer{' '}
        <a href="/choice">radios</a>, which show every answer at once and need no opening. Two
        answers are a switch or a checkbox, never a select.
      </p>
      <p>
        Put the options in the order the reader expects — alphabetical for names and places,
        by size or by time where the list has one, and the common answer first when there is
        one — and choose it for them when the form usually wants it. A placeholder is a prompt
        for the field&rsquo;s answer, <em>Choose a service</em>, offered in the list but never
        chosen: it is not an option, so it cannot be the value a required field submits.
      </p>

      <h3>Select or dropdown menu</h3>
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

      <h2>Anatomy and sizes</h2>
      <p>
        The element underneath is a native <code>&lt;select&gt;</code>. That gives keyboard
        behaviour, the platform picker on a phone, form participation and screen-reader
        support without a line of code — the chevron and the box are the only things added.
        The box is <a href="/input">Input</a>&rsquo;s, at its three heights, with the same fill
        and the same border that arrives on focus; the chevron sits in a {CHEVRON}px slot at
        the end, in the tertiary colour, and an <code>iconStart</code> can take the slot at the
        start.
      </p>
      <p>
        The trade is that the option list cannot be styled: it belongs to the operating
        system. For a system that has to work in a clinic on whatever device is to hand,
        that is the right way round.
      </p>
      <div className="specimen">
        <div style={{ display: 'grid', gap: spacing[200], maxWidth: 360 }}>
          <Select aria-label="Service, small" size="sm" placeholder="Small">
            <Options />
          </Select>
          <Select aria-label="Service, medium" size="md" placeholder="Medium">
            <Options />
          </Select>
          <Select aria-label="Service, large" size="lg" placeholder="Large">
            <Options />
          </Select>
        </div>
      </div>

      <h2>States</h2>
      <div className="specimen">
        <div style={{ display: 'grid', gap: spacing[200], maxWidth: 360 }}>
          <Select aria-label="Disabled" disabled placeholder="Disabled">
            <Options />
          </Select>
          <Select aria-label="Invalid" invalid placeholder="In error">
            <Options />
          </Select>
        </div>
      </div>
      <p>
        No hover, as on Input: the box does not react to the pointer, and the border arrives
        with focus. Disabled drops the paint and the focus; invalid takes the danger border,
        and inside a Field the message that says what to choose.
      </p>

      <h2>In a Field</h2>
      <p>
        Choose nothing and the message stays. The placeholder is offered but cannot be
        chosen — it is a prompt, not an answer — and the message says what to do, beside the
        field it is about.
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
              <Options />
            </Select>
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
      <p>
        The select never renders its own label. Wrap it in a <code>Field</code> or give it an{' '}
        <code>aria-label</code>, as the sizes above do; a select with neither is announced as
        its current value and nothing else.
      </p>

      <h2>Props</h2>
      <div className="specimen">
        <Table caption="Select props" captionVisible density="compact" columns={propColumns} rows={PROPS} getRowId={(r) => r.prop} />
      </div>
      <p className="alias" style={{ marginTop: 8 }}>
        The options are the children. All remaining select attributes are passed through —{' '}
        <code>name</code>, <code>value</code>, <code>disabled</code>, <code>required</code>,{' '}
        <code>onChange</code>; inside a Field, the id, the description and the invalid flag come
        from it unless you pass your own.
      </p>
    </DocPage>
  );
}
