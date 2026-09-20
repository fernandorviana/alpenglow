import { afterEach, describe, it, expect, vi } from 'vitest';
import { toast, snapshot, serverSnapshot, subscribe, TOAST_DURATION, TOAST_DURATION_WITH_ACTION } from './store';

afterEach(() => toast.dismiss());

describe('toast store', () => {
  it('adds in order and returns the id', () => {
    const first = toast('Saved');
    const second = toast('Sent');
    expect(snapshot().map((item) => item.id)).toEqual([first, second]);
    expect(snapshot()[0]).toMatchObject({ message: 'Saved', tone: 'neutral', revision: 0 });
  });

  it('replaces the list rather than mutating it', () => {
    const before = snapshot();
    toast('Saved');
    expect(snapshot()).not.toBe(before);
    expect(before).toHaveLength(0);
  });

  it('times a toast by what it asks of the reader', () => {
    toast('Saved', { id: 'plain' });
    toast('Deleted', { id: 'undo', action: { label: 'Undo', onClick: () => {} } });
    toast('Could not save', { id: 'error', tone: 'danger' });
    toast('Could not save', { id: 'brief', tone: 'danger', duration: 2000 });
    const duration = (id: string) => snapshot().find((item) => item.id === id)!.duration;
    expect(duration('plain')).toBe(TOAST_DURATION);
    expect(duration('undo')).toBe(TOAST_DURATION_WITH_ACTION);
    expect(duration('error')).toBe(Infinity);
    expect(duration('brief')).toBe(2000);
  });

  it('updates a toast that is showing, in its place', () => {
    toast('Uploading', { id: 'upload' });
    toast('Other');
    toast('Uploaded', { id: 'upload', tone: 'success' });
    expect(snapshot().map((item) => item.message)).toEqual(['Uploaded', 'Other']);
    expect(snapshot()[0]).toMatchObject({ tone: 'success', revision: 1 });
  });

  it('dismisses one, and all', () => {
    const first = toast('One');
    toast('Two');
    toast.dismiss(first);
    expect(snapshot().map((item) => item.message)).toEqual(['Two']);
    toast.dismiss();
    expect(snapshot()).toHaveLength(0);
  });

  it('tells its subscribers, and not for a dismissal of nothing', () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);
    toast('Saved');
    toast.dismiss('not-there');
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    toast('Again');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('is empty on the server, and the same empty list every time', () => {
    toast('Saved');
    expect(serverSnapshot()).toHaveLength(0);
    expect(serverSnapshot()).toBe(serverSnapshot());
  });
});
