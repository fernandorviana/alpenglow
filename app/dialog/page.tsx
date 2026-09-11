'use client';

import { useRef, useState, type FormEvent } from 'react';
import { DocPage } from '@ui/DocPage';
import { Button } from '@/components/Button/index';
import { Dialog, type DialogSize } from '@/components/Dialog/index';
import { Field } from '@/components/Field/index';
import { Input } from '@/components/Input/index';
import { Select } from '@/components/Select/index';
import { Table } from '@/components/Table/index';
import { composite, contrast, hexToRgb, resolve, rgbToHex, tokenContrast } from '@/tokens/contrast';
import { primitives } from '@/tokens/primitives';
import type { Mode } from '@/tokens/theme';

type PropRow = { prop: string; type: string; default: string };

const PROPS: PropRow[] = [
  { prop: 'open', type: 'boolean', default: '—' },
  { prop: 'onClose', type: '() => void', default: '—' },
  { prop: 'title', type: 'string', default: '—' },
  { prop: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'md'" },
  { prop: 'onBack', type: '() => void', default: '—' },
  { prop: 'actions', type: 'ReactNode', default: '—' },
  { prop: 'initialFocus', type: 'RefObject<HTMLElement | null>', default: '—' },
];

const SIZES: [DialogSize, string][] = [
  ['xs', '320px'],
  ['sm', '480px'],
  ['md', '640px'],
  ['lg', '960px'],
];

const f = (n: number) => n.toFixed(2);

/** The dialog's surface against its backdrop, laid over the app canvas. */
const separation = (mode: Mode) =>
  contrast(resolve('surface/overlay', mode), resolve('surface/scrim', mode, resolve('surface/base', mode)));

/** The rejected dark scrim: the light wash mirrored onto gray-dark/600 at 95%. */
const mirrored = contrast(
  resolve('surface/overlay', 'dark'),
  rgbToHex(composite(hexToRgb(primitives['gray-dark/600']), hexToRgb(resolve('surface/base', 'dark')), 0.95)),
);

function SizeDemo({ size, width }: { size: DialogSize; width: string }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <Button variant="outline" tone="neutral" onClick={() => setOpen(true)}>
        {size} · {width}
      </Button>
      <Dialog
        open={open}
        onClose={close}
        title="Reschedule appointment"
        size={size}
        actions={
          <>
            <Button variant="outline" tone="neutral" onClick={close}>
              Cancel
            </Button>
            <Button onClick={close}>Reschedule</Button>
          </>
        }
      >
        <p>Move Thursday&apos;s 10:30 appointment to the next free slot with the same clinician.</p>
      </Dialog>
    </>
  );
}

function FormDemo() {
  const [open, setOpen] = useState(false);
  const name = useRef<HTMLInputElement>(null);
  const close = () => setOpen(false);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    close();
  };
  return (
    <>
      <Button onClick={() => setOpen(true)}>Add staff member</Button>
      <Dialog
        open={open}
        onClose={close}
        title="Add staff member"
        size="sm"
        initialFocus={name}
        actions={
          <>
            <Button variant="outline" tone="neutral" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" form="staff-form">
              Save
            </Button>
          </>
        }
      >
        <form id="staff-form" onSubmit={submit} style={{ display: 'grid', gap: 16 }}>
          <Field label="Full name" required>
            <Input ref={name} name="name" autoComplete="name" />
          </Field>
          <Field label="Role">
            <Select name="role" placeholder="Choose a role" defaultValue="">
              <option value="clinician">Clinician</option>
              <option value="reception">Reception</option>
            </Select>
          </Field>
        </form>
      </Dialog>
    </>
  );
}

function StepsDemo() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const close = () => {
    setOpen(false);
    setStep(1);
  };
  return (
    <>
      <Button variant="outline" tone="neutral" onClick={() => setOpen(true)}>
        Invite a colleague
      </Button>
      <Dialog
        open={open}
        onClose={close}
        title={step === 1 ? 'Choose a clinic' : 'Confirm the invitation'}
        size="sm"
        onBack={step === 2 ? () => setStep(1) : undefined}
        actions={
          step === 1 ? (
            <>
              <Button variant="outline" tone="neutral" onClick={close}>
                Cancel
              </Button>
              <Button onClick={() => setStep(2)}>Next</Button>
            </>
          ) : (
            <>
              <Button variant="outline" tone="neutral" onClick={close}>
                Cancel
              </Button>
              <Button onClick={close}>Send invitation</Button>
            </>
          )
        }
      >
        {step === 1 ? (
          <p>The colleague joins the clinic you choose here, with its opening hours and rooms.</p>
        ) : (
          <p>An email goes out today. The link stays valid for seven days.</p>
        )}
      </Dialog>
    </>
  );
}

export default function Page() {
  return (
    <DocPage
      evidence={
        <>
          <p>0 lines of focus-trap JS</p>
          <p>0 new dependencies</p>
          <p>title, text/primary on the surface</p>
          <p>
            {f(tokenContrast('text/primary', 'surface/overlay', 'light'))}:1 light ·{' '}
            {f(tokenContrast('text/primary', 'surface/overlay', 'dark'))}:1 dark
          </p>
          <p>dialog against the backdrop</p>
          <p>
            {f(separation('light'))}:1 light · {f(separation('dark'))}:1 dark
          </p>
          <p>the dark mirror of the drawn wash</p>
          <p>{f(mirrored)}:1 — rejected</p>
        </>
      }
    >
      <h1>Dialog</h1>
      <p className="lead">
        A modal on the native element, in four widths. The page behind goes inert, Esc asks the
        caller to close, and a click beside the dialog does nothing.
      </p>

      <h2>Sizes</h2>
      <div className="specimen">
        <div className="specimenRow">
          {SIZES.map(([size, width]) => (
            <SizeDemo key={size} size={size} width={width} />
          ))}
        </div>
      </div>
      <p>
        On a screen narrower than the dialog it takes the width less 16px each side, and on{' '}
        <code>xs</code> the actions stack, the first on top.
      </p>

      <h2>A form</h2>
      <div className="specimen">
        <div className="specimenRow">
          <FormDemo />
        </div>
      </div>
      <p>
        The first field takes focus through <code>initialFocus</code>. Not <code>autoFocus</code>:
        React&apos;s client renderer does not write the attribute that <code>showModal()</code> looks
        for, so it would work on a server-rendered page and not on this one. Save submits the form
        by its <code>form</code> attribute, from outside it.
      </p>

      <h2>More than one step</h2>
      <div className="specimen">
        <div className="specimenRow">
          <StepsDemo />
        </div>
      </div>
      <p>
        The back button appears only with <code>onBack</code>. A single question has no previous step
        to go back to.
      </p>

      <h2>Decisions</h2>
      <p>
        <strong>The backdrop is the drawn wash.</strong> The drawing&apos;s overlay is{' '}
        <code>gray-light/200</code> at 95%: the page behind all but disappears. The dialog is
        separated from it by its shadow — on colour alone the two are {f(separation('light'))}:1. Dark
        was never drawn. Mirroring the wash onto <code>gray-dark/600</code> measures {f(mirrored)}:1,
        and the dialog would vanish, so dark uses the system&apos;s darkest ink at the same 95%:{' '}
        {f(separation('dark'))}:1, with a hairline border on the dialog.
      </p>
      <p>
        <strong>The title is primary.</strong> The drawing has it in <code>text/tertiary</code>, the
        level for helper text and timestamps. Tertiary passes AA at{' '}
        {f(tokenContrast('text/tertiary', 'surface/overlay', 'light'))}:1; the title is the most
        important text in the dialog, and primary reads{' '}
        {f(tokenContrast('text/primary', 'surface/overlay', 'light'))}:1.
      </p>
      <p>
        <strong>A click on the backdrop does not close.</strong> Esc, the close button and the
        caller&apos;s actions do. A stray click beside a half-filled form must not throw the form
        away.
      </p>

      <h2>Accessibility</h2>
      <p>
        The dialog is named by its title. <code>showModal()</code> puts it in the top layer and makes
        the rest of the page inert, so neither Tab nor a screen reader reaches what is behind it, and
        closing returns focus to the element that opened it.
      </p>
      <p>
        Esc does not close the dialog by itself: it calls <code>onClose</code>, and the caller sets{' '}
        <code>open</code> to false — or does not, to keep unsaved input. That refusal holds for one Esc.
        Chrome closes a dialog on a second Esc without other interaction, and <code>onClose</code>{' '}
        reports that close too, so the caller&apos;s state never says open while the dialog is shut.
      </p>

      <h2>Props</h2>
      <div className="specimen">
        <Table
          caption="Dialog props"
          density="compact"
          columns={[
            { key: 'prop', header: 'Prop', primary: true, cell: (r: PropRow) => <code>{r.prop}</code> },
            { key: 'type', header: 'Type', cell: (r: PropRow) => <span className="alias">{r.type}</span> },
            { key: 'default', header: 'Default', cell: (r: PropRow) => <span className="alias">{r.default}</span> },
          ]}
          rows={PROPS}
          getRowId={(r) => r.prop}
        />
      </div>
    </DocPage>
  );
}
