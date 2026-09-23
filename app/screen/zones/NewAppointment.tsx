'use client';

import { useId, useState } from 'react';
import type { Dispatch, FormEvent } from 'react';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Combobox } from '@/components/Combobox';
import { DatePicker } from '@/components/DatePicker';
import { Dialog } from '@/components/Dialog';
import { Field } from '@/components/Field';
import { Select } from '@/components/Select';
import { formatTime, formatTimeRange, toDateTime } from '@/components/Scheduler';
import type { ISODate } from '@/components/Calendar/date';
import { appointmentTypes, clients, practitioners } from '../data';
import { create } from '../state';
import type { Action, ScreenState } from '../state';
import { clock, commit, LOCALE, minutes, practitionerName } from './shared';
import styles from '../screen.module.css';

type Draft = NonNullable<ScreenState['dialog']>;
type Form = { client: string; practitionerId: string; typeId: string; date: ISODate; start: number | null };

const CLIENTS = clients.map((c) => ({ value: c, label: c }));
const PRACTITIONERS = practitioners.map((p) => ({ value: p.id, label: p.name, start: <Avatar name={p.name} size="xxs" /> }));
const TYPES = appointmentTypes.map((t) => ({ value: t.id, label: t.label, description: `${t.minutes} min` }));

function fromDraft(draft: Draft): Form {
  const length = minutes(draft.end) - minutes(draft.start);
  return {
    client: '',
    practitionerId: draft.practitionerId,
    // A drag's length picks the type that lasts as long, when one does.
    typeId: appointmentTypes.find((t) => t.minutes === length)?.id ?? '',
    date: draft.start.slice(0, 10),
    start: minutes(draft.start),
  };
}

/**
 * The quarter hours in which an appointment of `length` fits inside the
 * practitioner's hours; with a type chosen, each says when it would end.
 */
function quarters(practitionerId: string, length: number | undefined) {
  const hours = practitioners.find((p) => p.id === practitionerId)?.hours ?? { start: 8, end: 18 };
  const out: { value: string; label: string }[] = [];
  for (let m = hours.start * 60; m + (length ?? 15) <= hours.end * 60; m += 15) {
    out.push({ value: String(m), label: length ? formatTimeRange(LOCALE, m, m + length) : formatTime(LOCALE, m) });
  }
  return out;
}

function Booking({ id, draft, state, dispatch }: { id: string; draft: Draft; state: ScreenState; dispatch: Dispatch<Action> }) {
  const [form, setForm] = useState(() => fromDraft(draft));
  const [tried, setTried] = useState(false);
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));

  const type = appointmentTypes.find((t) => t.id === form.typeId);
  const starts = quarters(form.practitionerId, type?.minutes);
  const start = form.start !== null && starts.some((s) => s.value === String(form.start)) ? String(form.start) : '';

  const errors = {
    client: !form.client && 'Choose a client',
    typeId: !type && 'Choose a type',
    date: !form.date && 'Choose a date',
    start: !start && 'Choose a start time',
  };
  const shown = (key: keyof typeof errors) => (tried ? errors[key] || undefined : undefined);

  const book = (event: FormEvent) => {
    event.preventDefault();
    setTried(true);
    if (!type || !form.client || !form.date || !start) return;
    const from = Number(start);
    const appointment = {
      client: form.client,
      practitionerId: form.practitionerId,
      typeId: type.id,
      start: toDateTime(form.date, from),
      end: toDateTime(form.date, from + type.minutes),
      status: 'pending' as const,
      kind: 'appointment' as const,
    };
    // Booked on another day, the screen goes there first: the reducer keeps only the day it shows.
    if (form.date !== state.date) dispatch({ type: 'go', date: form.date });
    const patches = create({ ...state, date: form.date }, appointment);
    commit(
      dispatch,
      patches,
      `Booked ${form.client} with ${practitionerName(form.practitionerId)} at ${clock(appointment.start)}`,
    );
  };

  return (
    <form id={id} className={styles.form} onSubmit={book} noValidate>
      <Field label="Client" required error={shown('client')} className={styles.wide}>
        <Combobox
          options={CLIENTS}
          value={form.client}
          onChange={(client) => set({ client })}
          placeholder="Search clients"
        />
      </Field>
      <Field label="Practitioner" required>
        <Select options={PRACTITIONERS} value={form.practitionerId} onChange={(practitionerId) => set({ practitionerId })} />
      </Field>
      <Field label="Type" required error={shown('typeId')}>
        <Select options={TYPES} value={form.typeId} onChange={(typeId) => set({ typeId })} placeholder="Choose a type" />
      </Field>
      <Field label="Date" required error={shown('date')}>
        <DatePicker
          label="Choose a date"
          locale={LOCALE}
          weekStartsOn={1}
          value={form.date}
          onSelect={(date) => set({ date: typeof date === 'string' ? date : '' })}
        />
      </Field>
      <Field label="Start" required error={shown('start')}>
        <Select
          options={starts}
          value={start}
          onChange={(value) => set({ start: Number(value) })}
          placeholder="Choose a time"
        />
      </Field>
    </form>
  );
}

/**
 * The form in a dialog: New appointment, or a drag on an empty slot. Mounted
 * afresh for each draft, so a second booking does not start from the first.
 */
export function NewAppointment({ state, dispatch }: { state: ScreenState; dispatch: Dispatch<Action> }) {
  const id = useId();
  const draft = state.dialog;
  const close = () => dispatch({ type: 'dialog', draft: null });
  return (
    <Dialog
      open={draft !== null}
      onClose={close}
      title="New appointment"
      actions={
        <>
          <Button variant="outline" tone="neutral" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" form={id}>
            Book
          </Button>
        </>
      }
    >
      {draft && (
        <Booking key={`${draft.start}|${draft.end}|${draft.practitionerId}`} id={id} draft={draft} state={state} dispatch={dispatch} />
      )}
    </Dialog>
  );
}
