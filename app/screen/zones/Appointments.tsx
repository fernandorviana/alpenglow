'use client';

import { useEffect } from 'react';
import type { Dispatch } from 'react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Table } from '@/components/Table';
import type { Column } from '@/components/Table';
import type { Appointment, Status } from '../data';
import { setStatus, visible } from '../state';
import type { Action, ScreenState } from '../state';
import { commit, dayTitle, practitionerName, STATUS_LABEL, STATUS_TONE, timeRange, typeOf, whom } from './shared';
import styles from '../screen.module.css';

const COLUMNS: Column<Appointment>[] = [
  { key: 'time', header: 'Time', cell: (a) => timeRange(a), width: '8.5rem' },
  {
    key: 'client',
    header: 'Client',
    primary: true,
    // Collapsed to its list — beside the Scheduler at 1440, and on a phone —
    // the Table keeps only this cell, so the cell carries the rest of the row
    // there, and only there: hidden, it is out of the accessible name too.
    cell: (a) => (
      <span className={styles.who}>
        <span>{a.client}</span>
        <span className={styles.meta}>
          {timeRange(a)} · {practitionerName(a.practitionerId)}
          <Badge size="sm" tone={STATUS_TONE[a.status]}>
            {STATUS_LABEL[a.status]}
          </Badge>
        </span>
      </span>
    ),
  },
  { key: 'practitioner', header: 'Practitioner', cell: (a) => practitionerName(a.practitionerId) },
  { key: 'type', header: 'Type', cell: (a) => typeOf(a.typeId)?.label ?? a.typeId },
  { key: 'status', header: 'Status', cell: (a) => <Badge tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status]}</Badge> },
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
