'use client';

import { useState } from 'react';
import type { Dispatch } from 'react';
import { Avatar } from '@/components/Avatar';
import { Field } from '@/components/Field';
import { Scheduler } from '@/components/Scheduler';
import type { SchedulerChange, SchedulerEvent, SchedulerResource } from '@/components/Scheduler';
import { Select } from '@/components/Select';
import { useMediaQuery } from '@/components/useMediaQuery';
import { DAY, NOW, practitioners } from '../data';
import type { Appointment } from '../data';
import { move, visible } from '../state';
import type { Action, ScreenState } from '../state';
import { clock, commit, LOCALE, practitionerName } from './shared';
import { Video } from './glyphs';
import styles from '../screen.module.css';

/** The practice's day, 07:00 to 20:00: the earliest start and the latest end with an hour around them. */
const HOURS = { start: 7, end: 20 };

/**
 * First names over the columns. The Scheduler's head is laid out at its
 * max-content, so a full name wider than the column's 128 floor widens the
 * head's tracks and not the body's, and the heads slide off their columns —
 * at 1440 "Sofia Marques" makes the head 855 over a 720 body. Recorded on
 * the page as moved up the list; the Avatar keeps the full name for a
 * screen reader, and the Table and the Drawer say it in full.
 */
const RESOURCES: SchedulerResource[] = practitioners.map((p) => ({
  id: p.id,
  name: p.name.split(' ')[0]!,
  tone: p.tone,
  avatar: <Avatar name={p.name} size="xxs" />,
  workingHours: p.hours,
}));

function toEvent(a: Appointment): SchedulerEvent {
  return {
    id: a.id,
    title: a.client,
    start: a.start,
    end: a.end,
    resourceId: a.practitionerId,
    kind: a.kind === 'lunch' ? 'blocker' : a.kind === 'external' ? 'external' : a.status,
    icon: a.typeId === 'video' ? <Video /> : undefined,
  };
}

/** The Scheduler in day view, a column per practitioner; at a phone's width, one chosen in a Select. */
export function Day({ state, dispatch }: { state: ScreenState; dispatch: Dispatch<Action> }) {
  const phone = useMediaQuery('(max-width: 480px)');
  const [chosen, setChosen] = useState(practitioners[0]!.id);

  // The practitioner filter narrows the columns too; one that matches nobody leaves them all, empty.
  const wanted = state.filters.find((f) => f.key === 'practitioner')?.values ?? [];
  const filtered = RESOURCES.filter((r) => wanted.length === 0 || wanted.includes(r.id));
  const columns = filtered.length > 0 ? filtered : RESOURCES;
  const one = columns.find((r) => r.id === chosen) ?? columns[0]!;

  const moved = (event: SchedulerEvent, next: SchedulerChange, resized: boolean) => {
    const patches = move(state, event.id, { start: next.start, end: next.end, practitionerId: next.resourceId });
    const to = next.resourceId && next.resourceId !== event.resourceId ? ` with ${practitionerName(next.resourceId)}` : '';
    commit(
      dispatch,
      patches,
      resized ? `${event.title} now ends at ${clock(next.end)}` : `Moved ${event.title} to ${clock(next.start)}${to}`,
    );
  };

  return (
    <div className={styles.zone}>
      {phone && (
        <Field label="Practitioner">
          <Select
            options={columns.map((r) => ({ value: r.id, label: practitionerName(r.id), start: r.avatar }))}
            value={one.id}
            onChange={setChosen}
          />
        </Field>
      )}
      <Scheduler
        className={styles.fill}
        label="Day schedule"
        view="day"
        date={state.date}
        now={state.date === DAY ? NOW : null}
        locale={LOCALE}
        hours={HOURS}
        scrollTo={8}
        resources={phone ? [one] : columns}
        events={visible(state).map(toEvent)}
        selectedId={state.currentId}
        onSelect={(event) => {
          dispatch({ type: 'current', id: event.id });
          if (state.byId[event.id]?.kind === 'appointment') dispatch({ type: 'drawer', open: true });
        }}
        onMove={(event, next) => moved(event, next, false)}
        onResize={(event, next) => moved(event, next, true)}
        onCreate={(draft) =>
          dispatch({
            type: 'dialog',
            draft: { start: draft.start, end: draft.end, practitionerId: draft.resourceId ?? one.id },
          })
        }
        draft={state.dialog && { start: state.dialog.start, end: state.dialog.end, resourceId: state.dialog.practitionerId }}
      />
    </div>
  );
}
