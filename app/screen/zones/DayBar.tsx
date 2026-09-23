'use client';

import type { Dispatch } from 'react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Filters } from '@/components/Filters';
import type { FilterField } from '@/components/Filters';
import { appointmentTypes, practitioners } from '../data';
import { visible } from '../state';
import type { Action, ScreenState } from '../state';
import { nextFreeHalfHour, STATUS_LABEL, STATUS_TONE } from './shared';
import { Plus } from './glyphs';
import styles from '../screen.module.css';

const FIELDS: FilterField[] = [
  { key: 'practitioner', label: 'Practitioner', options: practitioners.map((p) => ({ value: p.id, label: p.name })) },
  { key: 'type', label: 'Type', options: appointmentTypes.map((t) => ({ value: t.id, label: t.label })) },
  {
    key: 'status',
    label: 'Status',
    options: (['confirmed', 'pending', 'cancelled'] as const).map((s) => ({ value: s, label: STATUS_LABEL[s] })),
  },
];

const WORDS = { confirmed: 'booked', pending: 'pending', cancelled: 'cancelled' } as const;

/** The row under the TopBar: what narrows the day, what it holds, and a new booking. */
export function DayBar({ state, dispatch }: { state: ScreenState; dispatch: Dispatch<Action> }) {
  const shown = visible(state).filter((a) => a.kind === 'appointment');
  const count = (status: keyof typeof WORDS) => shown.filter((a) => a.status === status).length;

  return (
    <div className={styles.dayBar}>
      <Filters fields={FIELDS} value={state.filters} onChange={(filters) => dispatch({ type: 'filter', filters })} />
      <div className={styles.summary}>
        {(['confirmed', 'pending', 'cancelled'] as const).map((status) => (
          <Badge key={status} tone={STATUS_TONE[status]} dot>
            {count(status)} {WORDS[status]}
          </Badge>
        ))}
      </div>
      <Button
        className={styles.newAppointment}
        iconStart={<Plus />}
        onClick={() => dispatch({ type: 'dialog', draft: nextFreeHalfHour(state) })}
      >
        New appointment
      </Button>
    </div>
  );
}
