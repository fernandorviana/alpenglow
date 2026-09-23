import { describe, it, expect } from 'vitest';
import { initialState, reducer, visible, move, setStatus, create, invert } from './state';
import { DAY } from './data';

const s0 = initialState();
const first = () => visible(s0).find((a) => a.kind === 'appointment')!;

describe('the screen’s state', () => {
  it('opens on the fixed day with nothing current', () => {
    expect(s0.date).toBe(DAY);
    expect(s0.currentId).toBeNull();
    expect(s0.selected.size).toBe(0);
  });

  it('filters by practitioner, type and status, all at once', () => {
    const a = first();
    const s = reducer(s0, { type: 'filter', filters: [{ key: 'practitioner', values: [a.practitionerId] }, { key: 'status', values: [a.status] }] });
    expect(visible(s).every((x) => x.practitionerId === a.practitionerId && x.status === a.status)).toBe(true);
  });

  it('clears current when its appointment is filtered away, and the selection with it', () => {
    const a = first();
    let s = reducer(s0, { type: 'current', id: a.id });
    s = reducer(s, { type: 'select', ids: new Set([a.id]) });
    s = reducer(s, { type: 'filter', filters: [{ key: 'practitioner', values: ['nobody'] }] });
    expect(visible(s)).toEqual([]);
    expect(s.currentId).toBeNull();
    expect(s.selected.size).toBe(0);
  });

  it('moves and undoes', () => {
    const a = first();
    const patches = move(s0, a.id, { start: `${DAY}T16:00`, end: `${DAY}T16:30` });
    const moved = reducer(s0, { type: 'apply', patches });
    expect(moved.byId[a.id]).toMatchObject({ start: `${DAY}T16:00`, end: `${DAY}T16:30` });
    expect(reducer(moved, { type: 'apply', patches: invert(patches) }).byId[a.id]).toEqual(a);
  });

  it('undoes the first change after a second one without losing the second', () => {
    const [a, b] = visible(s0).filter((x) => x.kind === 'appointment');
    const p1 = move(s0, a!.id, { start: `${DAY}T16:00`, end: `${DAY}T16:30` });
    const s1 = reducer(s0, { type: 'apply', patches: p1 });
    const p2 = setStatus(s1, [b!.id], 'cancelled');
    const s2 = reducer(s1, { type: 'apply', patches: p2 });
    const s3 = reducer(s2, { type: 'apply', patches: invert(p1) });
    expect(s3.byId[a!.id]).toEqual(a);
    expect(s3.byId[b!.id]!.status).toBe('cancelled');
  });

  it('confirms in bulk and undoes in one step', () => {
    const pending = visible(s0).filter((x) => x.status === 'pending');
    const patches = setStatus(s0, pending.map((x) => x.id), 'confirmed');
    const s = reducer(s0, { type: 'apply', patches });
    expect(pending.every((x) => s.byId[x.id]!.status === 'confirmed')).toBe(true);
    const back = reducer(s, { type: 'apply', patches: invert(patches) });
    expect(pending.every((x) => back.byId[x.id]!.status === 'pending')).toBe(true);
  });

  it('creates, undoes the creation, and closes the dialog', () => {
    let s = reducer(s0, { type: 'dialog', draft: { start: `${DAY}T17:00`, end: `${DAY}T17:30`, practitionerId: 'ana' } });
    const patches = create(s, { client: 'Maya Costa', practitionerId: 'ana', typeId: 'follow-up', start: `${DAY}T17:00`, end: `${DAY}T17:30`, status: 'pending', kind: 'appointment' });
    s = reducer(s, { type: 'apply', patches });
    expect(s.dialog).toBeNull();
    const id = patches[0]!.id;
    expect(s.byId[id]).toBeDefined();
    const back = reducer(s, { type: 'apply', patches: invert(patches) });
    expect(back.byId[id]).toBeUndefined();
    expect(back.order).not.toContain(id);
  });

  it('goes to another day, keeping filters and dropping current and selection', () => {
    const f = [{ key: 'status', values: ['pending'] }];
    let s = reducer(s0, { type: 'filter', filters: f });
    s = reducer(s, { type: 'current', id: first().id });
    s = reducer(s, { type: 'go', date: '2026-09-18' });
    expect(s.date).toBe('2026-09-18');
    expect(s.filters).toEqual(f);
    expect(s.currentId).toBeNull();
  });

  it('drops a stale move patch when its Undo is applied after going to another day', () => {
    const a = first();
    const patches = move(s0, a.id, { start: `${DAY}T16:00`, end: `${DAY}T16:30` });
    const moved = reducer(s0, { type: 'apply', patches });
    const onOtherDay = reducer(moved, { type: 'go', date: '2026-09-18' });
    const afterStaleUndo = reducer(onOtherDay, { type: 'apply', patches: invert(patches) });
    expect(afterStaleUndo.byId).toEqual(onOtherDay.byId);
    expect(afterStaleUndo.order).toEqual(onOtherDay.order);
  });

  it('drops a stale create patch when its Undo is applied after going to another day', () => {
    let s = reducer(s0, { type: 'dialog', draft: { start: `${DAY}T17:00`, end: `${DAY}T17:30`, practitionerId: 'ana' } });
    const patches = create(s, { client: 'Maya Costa', practitionerId: 'ana', typeId: 'follow-up', start: `${DAY}T17:00`, end: `${DAY}T17:30`, status: 'pending', kind: 'appointment' });
    const created = reducer(s, { type: 'apply', patches });
    const onOtherDay = reducer(created, { type: 'go', date: '2026-09-18' });
    const afterStaleUndo = reducer(onOtherDay, { type: 'apply', patches: invert(patches) });
    expect(afterStaleUndo.byId).toEqual(onOtherDay.byId);
    expect(afterStaleUndo.order).toEqual(onOtherDay.order);
  });

  it('drops a stale setStatus patch when its Undo is applied after going to another day', () => {
    const pending = visible(s0).filter((x) => x.status === 'pending');
    const patches = setStatus(s0, pending.map((x) => x.id), 'confirmed');
    const s = reducer(s0, { type: 'apply', patches });
    const onOtherDay = reducer(s, { type: 'go', date: '2026-09-18' });
    const afterStaleUndo = reducer(onOtherDay, { type: 'apply', patches: invert(patches) });
    expect(afterStaleUndo.byId).toEqual(onOtherDay.byId);
    expect(afterStaleUndo.order).toEqual(onOtherDay.order);
  });

  it('never splices another day’s creation into the current day', () => {
    let s = reducer(s0, { type: 'dialog', draft: { start: `${DAY}T17:00`, end: `${DAY}T17:30`, practitionerId: 'ana' } });
    const patches = create(s, { client: 'Maya Costa', practitionerId: 'ana', typeId: 'follow-up', start: `${DAY}T17:00`, end: `${DAY}T17:30`, status: 'pending', kind: 'appointment' });
    const onOtherDay = reducer(s0, { type: 'go', date: '2026-09-18' });
    const afterStaleCreate = reducer(onOtherDay, { type: 'apply', patches });
    expect(afterStaleCreate.byId).toEqual(onOtherDay.byId);
    expect(afterStaleCreate.order).toEqual(onOtherDay.order);
  });
});
