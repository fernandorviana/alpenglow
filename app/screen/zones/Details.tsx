'use client';

import type { Dispatch } from 'react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Drawer } from '@/components/Drawer';
import type { Action, ScreenState } from '../state';
import { changeStatus } from './Appointments';
import { practitionerName, STATUS_LABEL, STATUS_TONE, timeRange, typeOf } from './shared';
import styles from '../screen.module.css';

/** The current appointment's record and what can be done to it. */
export function Details({ state, dispatch }: { state: ScreenState; dispatch: Dispatch<Action> }) {
  const a = state.currentId ? state.byId[state.currentId] : undefined;
  const open = state.drawerOpen && a?.kind === 'appointment';

  return (
    <Drawer
      open={open}
      onClose={() => dispatch({ type: 'drawer', open: false })}
      title={a?.client ?? ''}
      actions={
        a && (
          <>
            <p className={styles.note}>Changes reset on reload.</p>
            {a.status !== 'cancelled' && (
              <Button variant="outline" tone="danger" onClick={() => changeStatus(state, dispatch, [a.id], 'cancelled')}>
                Cancel appointment
              </Button>
            )}
            {a.status === 'pending' && (
              <Button onClick={() => changeStatus(state, dispatch, [a.id], 'confirmed')}>Confirm</Button>
            )}
          </>
        )
      }
    >
      {a && (
        <dl className={styles.facts}>
          <dt>Practitioner</dt>
          <dd>{practitionerName(a.practitionerId)}</dd>
          <dt>Type</dt>
          <dd>{typeOf(a.typeId)?.label ?? a.typeId}</dd>
          <dt>Time</dt>
          <dd>{timeRange(a)}</dd>
          <dt>Status</dt>
          <dd>
            <Badge tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status]}</Badge>
          </dd>
        </dl>
      )}
    </Drawer>
  );
}
