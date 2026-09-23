import type { ISODate } from '@/components/Calendar/date';
import type { ISODateTime } from '@/components/Scheduler';
import type { FilterValue } from '@/components/Filters';
import { appointmentsFor, DAY } from './data';
import type { Appointment, Status } from './data';

/**
 * One state behind both views. Every change is a list of patches, each an
 * appointment's fields before and after, so an Undo is the inverse list —
 * per appointment, never a snapshot of the day, so undoing an older change
 * keeps what came after it.
 */

export type Patch = { id: string; before: Partial<Appointment> | null; after: Partial<Appointment> | null };

type Day = { byId: Record<string, Appointment>; order: string[] };

export type ScreenState = {
  date: ISODate;
  /** The day shown: a view of `days[date]`, written back on `go`. */
  byId: Record<string, Appointment>;
  order: string[];
  /**
   * Every day visited this session, as it was left. A day is seeded from its
   * date the first time and kept after: only a reload starts it over.
   */
  days: Record<ISODate, Day>;
  filters: FilterValue[];
  currentId: string | null;
  selected: Set<string>;
  drawerOpen: boolean;
  dialog: { start: ISODateTime; end: ISODateTime; practitionerId: string } | null;
};

export type Action =
  | { type: 'go'; date: ISODate }
  | { type: 'filter'; filters: FilterValue[] }
  | { type: 'current'; id: string | null }
  | { type: 'select'; ids: Set<string> }
  | { type: 'drawer'; open: boolean }
  | { type: 'dialog'; draft: ScreenState['dialog'] }
  | { type: 'apply'; patches: Patch[] };

function seed(date: ISODate): Day {
  const list = appointmentsFor(date);
  return { byId: Object.fromEntries(list.map((a) => [a.id, a])), order: list.map((a) => a.id) };
}

export function initialState(date: ISODate = DAY): ScreenState {
  const day = seed(date);
  return { date, ...day, days: {}, filters: [], currentId: null, selected: new Set(), drawerOpen: false, dialog: null };
}

const FIELD: Record<string, (a: Appointment) => string> = {
  practitioner: (a) => a.practitionerId,
  type: (a) => a.typeId,
  status: (a) => a.status,
};

function matches(a: Appointment, filters: FilterValue[]) {
  return filters.every((f) => f.values.length === 0 || !FIELD[f.key] || f.values.includes(FIELD[f.key]!(a)));
}

export function visible(state: ScreenState): Appointment[] {
  return state.order
    .map((id) => state.byId[id]!)
    .filter((a) => matches(a, state.filters))
    .sort((a, b) => a.start.localeCompare(b.start) || a.practitionerId.localeCompare(b.practitionerId));
}

/** What is out of view cannot be current or chosen. */
function prune(state: ScreenState): ScreenState {
  const shown = new Set(visible(state).map((a) => a.id));
  const currentId = state.currentId && shown.has(state.currentId) ? state.currentId : null;
  const selected = new Set([...state.selected].filter((id) => shown.has(id)));
  return { ...state, currentId, selected, drawerOpen: state.drawerOpen && currentId !== null };
}

export function reducer(state: ScreenState, action: Action): ScreenState {
  switch (action.type) {
    case 'go': {
      if (action.date === state.date) return state;
      // The day left is kept as it stands, and the day reached is the one
      // kept for it, or its seed the first time: pressing Today, or ‹ then
      // ›, must not wipe what was changed, nor leave an Undo writing into a
      // reseeded record.
      const days = { ...state.days, [state.date]: { byId: state.byId, order: state.order } };
      const day = days[action.date] ?? seed(action.date);
      return { ...state, date: action.date, ...day, days, currentId: null, selected: new Set(), drawerOpen: false, dialog: null };
    }
    case 'filter':
      return prune({ ...state, filters: action.filters });
    case 'current':
      return { ...state, currentId: action.id, drawerOpen: action.id !== null && state.drawerOpen };
    case 'select':
      return { ...state, selected: new Set(action.ids) };
    case 'drawer':
      return { ...state, drawerOpen: action.open && state.currentId !== null };
    case 'dialog':
      return { ...state, dialog: action.draft };
    case 'apply': {
      const byId = { ...state.byId };
      let order = state.order;
      let created = false;
      // An Undo can outlive the day it was raised on: the Toast keeps its
      // patches after `go` swaps in another day's byId/order, and applying
      // them then must be inert rather than write a partial record under a
      // stale id or splice another day's appointment into this one.
      for (const p of action.patches) {
        if (p.after === null) {
          delete byId[p.id];
          order = order.filter((id) => id !== p.id);
        } else if (p.before === null) {
          const after = p.after as Appointment;
          if (after.start.slice(0, 10) !== state.date) continue;
          byId[p.id] = after;
          if (!order.includes(p.id)) order = [...order, p.id];
          created = true;
        } else if (p.id in byId) {
          byId[p.id] = { ...byId[p.id]!, ...p.after };
        }
      }
      return prune({ ...state, byId, order, dialog: created ? null : state.dialog });
    }
  }
}

function pick(a: Appointment, keys: (keyof Appointment)[]): Partial<Appointment> {
  return Object.fromEntries(keys.map((k) => [k, a[k]]));
}

export function move(state: ScreenState, id: string, next: { start: ISODateTime; end: ISODateTime; practitionerId?: string }): Patch[] {
  const a = state.byId[id]!;
  const after: Partial<Appointment> = { start: next.start, end: next.end, practitionerId: next.practitionerId ?? a.practitionerId };
  return [{ id, before: pick(a, ['start', 'end', 'practitionerId']), after }];
}

export function setStatus(state: ScreenState, ids: Iterable<string>, status: Status): Patch[] {
  return [...ids].map((id) => ({ id, before: { status: state.byId[id]!.status }, after: { status } }));
}

let made = 0;
export function create(state: ScreenState, a: Omit<Appointment, 'id'>): Patch[] {
  const id = `${state.date}-new-${++made}`;
  return [{ id, before: null, after: { ...a, id } }];
}

export function invert(patches: Patch[]): Patch[] {
  return patches.map((p) => ({ id: p.id, before: p.after, after: p.before })).reverse();
}
