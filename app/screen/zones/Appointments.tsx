'use client';

import { useEffect } from 'react';
import type { Dispatch } from 'react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Table } from '@/components/Table';
import type { Column } from '@/components/Table';
import { spacing } from '@/tokens/scale';
import type { Appointment, Status } from '../data';
import { setStatus, visible } from '../state';
import type { Action, ScreenState } from '../state';
import { commit, dayTitle, practitionerName, STATUS_LABEL, STATUS_TONE, timeRange, typeOf, whom } from './shared';
import { Check, Cross, OpenPanel } from './glyphs';
import styles from '../screen.module.css';

/**
 * Which columns stay as the Table narrows — beside the Scheduler, under a
 * side panel, on a phone. The status first: it is what the day is worked
 * by. Then the time, which the Scheduler beside it also shows; the type
 * leaves first. Names and types truncate: one line a row is the density.
 */
const COLUMNS: Column<Appointment>[] = [
  // 8.5rem before, as px: the arithmetic adds it up. "09:00 – 09:45" and padding.
  { key: 'time', header: 'Time', cell: (a) => timeRange(a), width: 136, priority: 2 },
  { key: 'client', header: 'Client', primary: true, truncate: true, cell: (a) => a.client },
  {
    key: 'practitioner',
    header: 'Practitioner',
    priority: 3,
    truncate: true,
    cell: (a) => practitionerName(a.practitionerId),
  },
  { key: 'type', header: 'Type', priority: 4, truncate: true, cell: (a) => typeOf(a.typeId)?.label ?? a.typeId },
  {
    key: 'status',
    header: 'Status',
    priority: 1,
    // A badge does not wrap; the widest, "Cancelled", needs more than 96.
    minWidth: spacing[1200],
    cell: (a) => <Badge tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status]}</Badge>,
  },
];

const DONE: Record<Status, string> = { confirmed: 'Confirmed', pending: 'Marked pending', cancelled: 'Cancelled' };

/** Sets a status on those not already in it, with a Toast and its Undo. */
export function changeStatus(state: ScreenState, dispatch: Dispatch<Action>, ids: Iterable<string>, status: Status) {
  const changing = [...ids].filter((id) => state.byId[id] && state.byId[id].status !== status);
  commit(dispatch, setStatus(state, changing, status), `${DONE[status]} ${whom(state, changing)}`);
}

/** The Table of the day's appointments — not lunch, not the external event. */
export function Appointments({ state, dispatch }: { state: ScreenState; dispatch: Dispatch<Action> }) {
  const rows = visible(state).filter((a) => a.kind === 'appointment');

  // The row chosen from a card comes into view; the Table leaves scrolling to its caller.
  useEffect(() => {
    if (!state.currentId) return;
    document.querySelector('[data-current="true"]')?.scrollIntoView?.({ block: 'nearest' });
  }, [state.currentId]);

  return (
    <div className={styles.zone}>
      <Table
        className={`${styles.fill} ${styles.table}`}
        caption={`Appointments on ${dayTitle(state.date)}`}
        columns={COLUMNS}
        rows={rows}
        getRowId={(a) => a.id}
        empty={state.filters.length > 0 ? 'No appointments match these filters.' : 'No appointments on this day.'}
        stickyHeader
        maxHeight="100%"
        currentId={state.currentId}
        onCurrentChange={(id) => {
          dispatch({ type: 'current', id });
          dispatch({ type: 'drawer', open: true });
        }}
        selected={state.selected}
        onSelectionChange={(ids) => dispatch({ type: 'select', ids })}
        selectionLabel={(a) => `Select ${a.client} at ${timeRange(a)}`}
        rowActions={(a) => [
          {
            id: 'confirm',
            label: 'Confirm',
            icon: <Check />,
            disabled: a.status === 'confirmed',
            onSelect: () => changeStatus(state, dispatch, [a.id], 'confirmed'),
          },
          {
            id: 'cancel',
            label: 'Cancel',
            icon: <Cross />,
            tone: 'danger',
            disabled: a.status === 'cancelled',
            onSelect: () => changeStatus(state, dispatch, [a.id], 'cancelled'),
          },
          {
            id: 'open',
            label: 'Open details',
            icon: <OpenPanel />,
            onSelect: () => {
              dispatch({ type: 'current', id: a.id });
              dispatch({ type: 'drawer', open: true });
            },
          },
        ]}
        rowActionsLabel={(a) => `More actions for ${a.client} at ${timeRange(a)}`}
        bulkActions={({ selected, clear }) => (
          <>
            <Button
              size="sm"
              onClick={() => {
                changeStatus(state, dispatch, selected, 'confirmed');
                clear();
              }}
            >
              Confirm
            </Button>
            <Button
              size="sm"
              variant="outline"
              tone="danger"
              onClick={() => {
                changeStatus(state, dispatch, selected, 'cancelled');
                clear();
              }}
            >
              Cancel
            </Button>
          </>
        )}
      />
    </div>
  );
}
